const db = require("../../config/db");
const { syncResultsForRoll, hasResultsLastFetchedColumn } = require("../results/resultsSyncService");

const YEAR_TO_CURRENT_SEMESTER = {
  1: "1-1",
  2: "2-1",
  3: "3-1",
  4: "4-1"
};

const SYNC_TTL_HOURS = 24;
const BATCH_SIZE = 1;
const MIN_STUDENT_DELAY_MS = 30 * 1000;
const MAX_STUDENT_DELAY_MS = 60 * 1000;
const RETRY_DELAY_MS = 15 * 1000;
const MAX_ATTEMPTS_PER_ROLL = 2;
const FAILED_JOB_COOLDOWN_MS = 30 * 60 * 1000;
const jobs = new Map();
let activeYear = null;

let hasCollegeCodeColumnPromise;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const hasStudentsCollegeCodeColumn = async () => {
  if (!hasCollegeCodeColumnPromise) {
    hasCollegeCodeColumnPromise = db
      .promise()
      .query("SHOW COLUMNS FROM students LIKE 'college_code'")
      .then(([rows]) => rows.length > 0)
      .catch(() => false);
  }

  return hasCollegeCodeColumnPromise;
};

const getYearSemester = (year) => YEAR_TO_CURRENT_SEMESTER[year];

const buildStudentFilterClause = async () => {
  const hasCollegeCode = await hasStudentsCollegeCodeColumn();

  if (hasCollegeCode) {
    return {
      clause: "s.year = ? AND UPPER(s.college_code) = 'Q9'",
      paramsBuilder: (year) => [year]
    };
  }

  return {
    clause: "s.year = ? AND UPPER(s.roll_number) LIKE '__Q9%'",
    paramsBuilder: (year) => [year]
  };
};

const getTargetStudents = async (year, semester) => {
  const filter = await buildStudentFilterClause();
  const hasLastFetchedColumn = await hasResultsLastFetchedColumn();

  const lastFetchedSelect = hasLastFetchedColumn ? "r.last_fetched" : "NULL AS last_fetched";
  const [rows] = await db.promise().query(
    `SELECT
       s.roll_number,
       ${lastFetchedSelect},
       r.id AS result_id
     FROM students s
     LEFT JOIN results r
       ON r.roll_number = s.roll_number
      AND r.semester = ?
     WHERE ${filter.clause}
     ORDER BY s.roll_number`,
    [semester, ...filter.paramsBuilder(year)]
  );

  return rows;
};

const isFreshTimestamp = (timestamp) => {
  if (!timestamp) {
    return false;
  }

  const fetchedAt = new Date(timestamp);
  if (Number.isNaN(fetchedAt.getTime())) {
    return false;
  }

  const ageMs = Date.now() - fetchedAt.getTime();
  return ageMs <= SYNC_TTL_HOURS * 60 * 60 * 1000;
};

const shouldRefreshRow = (row, hasLastFetchedColumn) => {
  if (!row.result_id) {
    return true;
  }

  if (!hasLastFetchedColumn) {
    return false;
  }

  return !isFreshTimestamp(row.last_fetched);
};

const buildStatusResponse = (job) => ({
  required: Boolean(job.required),
  year: job.year,
  semester: job.semester,
  status: job.status,
  totalStudents: job.totalStudents,
  targetedStudents: job.targetedStudents,
  completedStudents: job.completedStudents,
  queuedStudents: job.queuedStudents,
  successfulStudents: job.successfulStudents,
  failedStudents: job.failedStudents,
  progressPercent:
    job.totalStudents > 0 ? Number(((job.completedStudents / job.totalStudents) * 100).toFixed(2)) : 100,
  startedAt: job.startedAt,
  updatedAt: job.updatedAt,
  completedAt: job.completedAt,
  lastError: job.lastError,
  activeSyncYear: activeYear,
  canStart: activeYear === null || activeYear === job.year,
  message: activeYear !== null && activeYear !== job.year ? `Year ${activeYear} sync is already running.` : null
});

const runRollSyncWithRetry = async (roll) => {
  let lastResult = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_ROLL; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const [result] = await Promise.allSettled([syncResultsForRoll(roll)]);

    if (result.status === "fulfilled" && Number(result.value?.persistedSemesterCount || 0) > 0) {
      return result;
    }

    lastResult = result;

    if (attempt < MAX_ATTEMPTS_PER_ROLL) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(RETRY_DELAY_MS);
    }
  }

  return lastResult;
};

const getFreshnessForYear = async (year) => {
  const semester = getYearSemester(year);
  const studentRows = await getTargetStudents(year, semester);
  const hasLastFetchedColumn = await hasResultsLastFetchedColumn();

  const staleRollNumbers = studentRows
    .filter((row) => shouldRefreshRow(row, hasLastFetchedColumn))
    .map((row) => row.roll_number);

  return {
    year,
    semester,
    totalStudents: studentRows.length,
    staleRollNumbers,
    freshStudents: studentRows.length - staleRollNumbers.length,
    required: staleRollNumbers.length > 0
  };
};

const processJob = async (job) => {
  try {
    activeYear = job.year;

    for (let index = 0; index < job.rollNumbers.length; index += BATCH_SIZE) {
      const batch = job.rollNumbers.slice(index, index + BATCH_SIZE);
      const settled = [];

      for (const roll of batch) {
        // Sync one student at a time and retry once before counting it as a fetch error.
        // The long randomized delay between students mirrors the safer manual bulk-fetch pace.
        // eslint-disable-next-line no-await-in-loop
        const result = await runRollSyncWithRetry(roll);
        settled.push(result);
      }

      settled.forEach((result) => {
        job.completedStudents += 1;
        const persistedSemesterCount = Number(result.status === "fulfilled" ? result.value?.persistedSemesterCount || 0 : 0);

        if (result.status === "fulfilled" && persistedSemesterCount > 0) {
          job.successfulStudents += 1;
        } else {
          job.failedStudents += 1;
          job.lastError =
            result.status === "rejected"
              ? result.reason?.message || "A student sync failed."
              : result.value?.message || "No semester results were persisted for one or more students.";
        }
      });

      job.updatedAt = new Date().toISOString();

      if (index + BATCH_SIZE < job.rollNumbers.length) {
        await sleep(randomDelay(MIN_STUDENT_DELAY_MS, MAX_STUDENT_DELAY_MS));
      }
    }

    job.status = "completed";
    job.required = false;
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    job.status = "failed";
    job.lastError = error.message || "Sync queue failed.";
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
  } finally {
    activeYear = null;
  }
};

const ensureYearSync = async (year, options = {}) => {
  const force = Boolean(options.force);
  const existingJob = jobs.get(year);

  if (existingJob && existingJob.status === "running") {
    return buildStatusResponse(existingJob);
  }

  if (activeYear !== null && activeYear !== year) {
    const activeJob = jobs.get(activeYear);
    return {
      required: true,
      year,
      semester: getYearSemester(year),
      status: "idle",
      totalStudents: 0,
      targetedStudents: 0,
      completedStudents: 0,
      queuedStudents: 0,
      successfulStudents: 0,
      failedStudents: 0,
      progressPercent: 0,
      startedAt: null,
      updatedAt: activeJob?.updatedAt || null,
      completedAt: null,
      lastError: null,
      activeSyncYear: activeYear,
      canStart: false,
      message: `Year ${activeYear} sync is already running.`
    };
  }

  if (!force && existingJob && existingJob.status === "failed" && existingJob.completedAt) {
    const failedAt = new Date(existingJob.completedAt).getTime();
    if (!Number.isNaN(failedAt) && Date.now() - failedAt < FAILED_JOB_COOLDOWN_MS) {
      return buildStatusResponse(existingJob);
    }
  }

  const freshness = await getFreshnessForYear(year);
  const rollNumbers = freshness.staleRollNumbers;

  if (rollNumbers.length === 0) {
    const completedJob = {
      required: false,
      year,
      semester: freshness.semester,
      status: "completed",
      totalStudents: freshness.totalStudents,
      targetedStudents: 0,
      completedStudents: freshness.totalStudents,
      queuedStudents: 0,
      successfulStudents: 0,
      failedStudents: 0,
      rollNumbers: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      lastError: null
    };

    jobs.set(year, completedJob);
    return buildStatusResponse(completedJob);
  }

  const job = {
    required: !force,
    year,
    semester: freshness.semester,
    status: "running",
    totalStudents: rollNumbers.length,
    targetedStudents: rollNumbers.length,
    completedStudents: 0,
    queuedStudents: rollNumbers.length,
    successfulStudents: 0,
    failedStudents: 0,
    rollNumbers,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    lastError: null
  };

  jobs.set(year, job);
  void processJob(job);

  return buildStatusResponse(job);
};

const getYearSyncStatus = async (year) => {
  const existingJob = jobs.get(year);
  if (existingJob && (existingJob.status === "running" || activeYear === null || existingJob.year === activeYear)) {
    return buildStatusResponse(existingJob);
  }

  if (activeYear !== null && activeYear !== year) {
    const activeJob = jobs.get(activeYear);
    return {
      required: true,
      year,
      semester: getYearSemester(year),
      status: "idle",
      totalStudents: 0,
      targetedStudents: 0,
      completedStudents: 0,
      queuedStudents: 0,
      successfulStudents: 0,
      failedStudents: 0,
      progressPercent: 0,
      startedAt: null,
      updatedAt: activeJob?.updatedAt || null,
      completedAt: null,
      lastError: null,
      activeSyncYear: activeYear,
      canStart: false,
      message: `Year ${activeYear} sync is already running.`
    };
  }

  const freshness = await getFreshnessForYear(year);
  return {
    required: freshness.required,
    year,
    semester: freshness.semester,
    status: freshness.required ? "idle" : "completed",
    totalStudents: freshness.totalStudents,
    targetedStudents: freshness.staleRollNumbers.length,
    completedStudents: freshness.freshStudents,
    queuedStudents: freshness.staleRollNumbers.length,
    successfulStudents: 0,
    failedStudents: 0,
    progressPercent:
      freshness.totalStudents > 0
        ? Number(((freshness.freshStudents / freshness.totalStudents) * 100).toFixed(2))
        : 100,
    startedAt: null,
    updatedAt: null,
    completedAt: null,
    lastError: null,
    activeSyncYear: activeYear,
    canStart: activeYear === null || activeYear === year,
    message: activeYear !== null && activeYear !== year ? `Year ${activeYear} sync is already running.` : null
  };
};

module.exports = {
  YEAR_TO_CURRENT_SEMESTER,
  getYearSemester,
  getFreshnessForYear,
  ensureYearSync,
  getYearSyncStatus
};

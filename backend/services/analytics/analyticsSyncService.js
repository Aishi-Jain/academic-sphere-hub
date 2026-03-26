const db = require("../../config/db");
const { syncResultsForRoll, hasResultsLastFetchedColumn } = require("../results/resultsSyncService");

const YEAR_TO_CURRENT_SEMESTER = {
  1: "1-1",
  2: "2-1",
  3: "3-1",
  4: "4-1"
};

const SYNC_TTL_HOURS = 24;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2500;
const jobs = new Map();

let hasCollegeCodeColumnPromise;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const buildStatusResponse = (job) => ({
  required: Boolean(job.required),
  year: job.year,
  semester: job.semester,
  status: job.status,
  totalStudents: job.totalStudents,
  completedStudents: job.completedStudents,
  queuedStudents: job.queuedStudents,
  successfulStudents: job.successfulStudents,
  failedStudents: job.failedStudents,
  progressPercent:
    job.totalStudents > 0 ? Number(((job.completedStudents / job.totalStudents) * 100).toFixed(2)) : 100,
  startedAt: job.startedAt,
  updatedAt: job.updatedAt,
  lastError: job.lastError
});

const getFreshnessForYear = async (year) => {
  const semester = getYearSemester(year);
  const studentRows = await getTargetStudents(year, semester);

  const staleRollNumbers = studentRows
    .filter((row) => !row.result_id || !isFreshTimestamp(row.last_fetched))
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
    for (let index = 0; index < job.rollNumbers.length; index += BATCH_SIZE) {
      const batch = job.rollNumbers.slice(index, index + BATCH_SIZE);
      const settled = await Promise.allSettled(batch.map((roll) => syncResultsForRoll(roll)));

      settled.forEach((result) => {
        job.completedStudents += 1;
        if (result.status === "fulfilled") {
          job.successfulStudents += 1;
        } else {
          job.failedStudents += 1;
          job.lastError = result.reason?.message || "A student sync failed.";
        }
      });

      job.updatedAt = new Date().toISOString();

      if (index + BATCH_SIZE < job.rollNumbers.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    job.status = "completed";
    job.required = false;
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    job.status = "failed";
    job.lastError = error.message || "Sync queue failed.";
    job.updatedAt = new Date().toISOString();
  }
};

const ensureYearSync = async (year, options = {}) => {
  const force = Boolean(options.force);
  const existingJob = jobs.get(year);

  if (existingJob && existingJob.status === "running") {
    return buildStatusResponse(existingJob);
  }

  const freshness = await getFreshnessForYear(year);
  const rollNumbers = force ? (await getTargetStudents(year, freshness.semester)).map((row) => row.roll_number) : freshness.staleRollNumbers;

  if (rollNumbers.length === 0) {
    const completedJob = {
      required: false,
      year,
      semester: freshness.semester,
      status: "completed",
      totalStudents: freshness.totalStudents,
      completedStudents: freshness.totalStudents,
      queuedStudents: 0,
      successfulStudents: 0,
      failedStudents: 0,
      rollNumbers: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    totalStudents: freshness.totalStudents,
    completedStudents: force ? 0 : freshness.freshStudents,
    queuedStudents: rollNumbers.length,
    successfulStudents: 0,
    failedStudents: 0,
    rollNumbers,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastError: null
  };

  jobs.set(year, job);
  void processJob(job);

  return buildStatusResponse(job);
};

const getYearSyncStatus = async (year) => {
  const existingJob = jobs.get(year);
  if (existingJob) {
    return buildStatusResponse(existingJob);
  }

  const freshness = await getFreshnessForYear(year);
  return {
    required: freshness.required,
    year,
    semester: freshness.semester,
    status: freshness.required ? "idle" : "completed",
    totalStudents: freshness.totalStudents,
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
    lastError: null
  };
};

module.exports = {
  YEAR_TO_CURRENT_SEMESTER,
  getYearSemester,
  getFreshnessForYear,
  ensureYearSync,
  getYearSyncStatus
};

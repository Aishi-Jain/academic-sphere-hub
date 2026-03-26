const db = require("../../config/db");
const { getExamCodeCatalog, SEMESTERS } = require("./examCodeCatalog");
const { fetchSemesterAttempts } = require("./resultFetcher");
const { mergeSemesterAttempts } = require("./resultMerger");
const { buildSummary } = require("./resultCalculator");

const branchMap = {
  "05": "CSE",
  "66": "CSM",
  "67": "CSD",
  "04": "ECE",
  "12": "IT",
  "72": "AIDS"
};

let hasLastFetchedColumnPromise;

const getBranchFromRoll = (roll) => branchMap[String(roll || "").substring(6, 8)] || "Unknown";

const isLateralEntryRoll = (roll) => String(roll || "").toUpperCase().includes("Q95");

const inferRegulationFromRoll = (roll) => {
  const prefix = Number.parseInt(String(roll || "").slice(0, 2), 10);
  if (Number.isNaN(prefix)) {
    return "R18";
  }

  if (prefix >= 25) {
    return "R25";
  }

  if (prefix >= 22) {
    return "R22";
  }

  return "R18";
};

const hasResultsLastFetchedColumn = async () => {
  if (!hasLastFetchedColumnPromise) {
    hasLastFetchedColumnPromise = db
      .promise()
      .query("SHOW COLUMNS FROM results LIKE 'last_fetched'")
      .then(([rows]) => rows.length > 0)
      .catch(() => false);
  }

  return hasLastFetchedColumnPromise;
};

const getStudentProfile = async (roll) => {
  const [result] = await db.promise().query(
    "SELECT name, regulation FROM students WHERE roll_number = ?",
    [roll]
  );

  const student = result?.[0];

  return {
    name: student?.name || "Unknown",
    branch: getBranchFromRoll(roll),
    college: "Malla Reddy College of Engineering",
    regulation: student?.regulation || inferRegulationFromRoll(roll),
    isLateralEntry: isLateralEntryRoll(roll)
  };
};

const persistSemesters = async (roll, semesters, fetchedAt = new Date()) => {
  const includeLastFetched = await hasResultsLastFetchedColumn();

  for (const semester of semesters) {
    if (semester.skipped) {
      continue;
    }

    const [existing] = await db.promise().query(
      "SELECT id FROM results WHERE roll_number = ? AND semester = ?",
      [roll, semester.semester]
    );

    let resultId;

    if (existing.length > 0) {
      resultId = existing[0].id;

      if (includeLastFetched) {
        await db.promise().query(
          "UPDATE results SET sgpa = ?, last_fetched = ? WHERE id = ?",
          [semester.sgpa, fetchedAt, resultId]
        );
      } else {
        await db.promise().query("UPDATE results SET sgpa = ? WHERE id = ?", [semester.sgpa, resultId]);
      }
    } else if (includeLastFetched) {
      const [inserted] = await db.promise().query(
        "INSERT INTO results (roll_number, semester, sgpa, last_fetched) VALUES (?, ?, ?, ?)",
        [roll, semester.semester, semester.sgpa, fetchedAt]
      );
      resultId = inserted.insertId;
    } else {
      const [inserted] = await db.promise().query(
        "INSERT INTO results (roll_number, semester, sgpa) VALUES (?, ?, ?)",
        [roll, semester.semester, semester.sgpa]
      );
      resultId = inserted.insertId;
    }

    await db.promise().query("DELETE FROM result_subjects WHERE result_id = ?", [resultId]);

    for (const subject of semester.subjects) {
      await db.promise().query(
        `INSERT INTO result_subjects
        (result_id, subject_code, subject_name, internal, external, total, grade, credits)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resultId,
          subject.code,
          subject.name,
          subject.internal,
          subject.external,
          subject.total,
          subject.grade,
          subject.credits
        ]
      );
    }
  }
};

const syncResultsForRoll = async (roll) => {
  const normalizedRoll = String(roll || "").trim().toUpperCase();
  const student = await getStudentProfile(normalizedRoll);
  const catalog = await getExamCodeCatalog();
  const regulation = catalog.btech[student.regulation] ? student.regulation : "R18";
  const warnings = [];

  const semesterPromises = SEMESTERS.map(async (semester) => {
    if (student.isLateralEntry && (semester === "1-1" || semester === "1-2")) {
      return {
        semester,
        regulation,
        examCodesTried: [],
        attemptsFetched: 0,
        sgpa: "N/A",
        hasActiveBacklog: false,
        skipped: true,
        skipReason: "Lateral entry student; first-year results are not applicable.",
        subjects: []
      };
    }

    const examCodes = catalog.btech[regulation]?.[semester] || [];

    if (examCodes.length === 0) {
      warnings.push(`No exam codes available for ${regulation} ${semester}.`);
      return null;
    }

    const { attempts, warnings: semesterWarnings } = await fetchSemesterAttempts({
      roll: normalizedRoll,
      semester,
      examCodes
    });

    warnings.push(...semesterWarnings);

    if (attempts.length === 0) {
      warnings.push(`No result rows were found for ${semester}.`);
      return null;
    }

    return mergeSemesterAttempts({
      regulation,
      semester,
      examCodes,
      attempts
    });
  });

  const settledSemesters = await Promise.allSettled(semesterPromises);

  const semesters = settledSemesters
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value)
    .sort((left, right) => SEMESTERS.indexOf(left.semester) - SEMESTERS.indexOf(right.semester));

  settledSemesters
    .filter((result) => result.status === "rejected")
    .forEach((result) => {
      warnings.push(result.reason?.message || "A semester fetch failed.");
    });

  if (semesters.length > 0) {
    await persistSemesters(normalizedRoll, semesters);
  }

  const summary = buildSummary(semesters);

  return {
    student,
    semesters,
    summary,
    fetchProgress: {
      stages: ["discovering exam codes", ...SEMESTERS.map((semester) => `fetching ${semester}`)],
      completed: semesters
        .filter((semester) => !semester.skipped)
        .map((semester) => semester.semester)
    },
    warnings,
    message: semesters.length === 0 ? "No results found" : undefined
  };
};

module.exports = {
  SEMESTERS,
  getStudentProfile,
  getBranchFromRoll,
  isLateralEntryRoll,
  inferRegulationFromRoll,
  hasResultsLastFetchedColumn,
  persistSemesters,
  syncResultsForRoll
};

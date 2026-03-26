const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { getExamCodeCatalog, SEMESTERS } = require("../services/results/examCodeCatalog");
const { fetchSemesterAttempts } = require("../services/results/resultFetcher");
const { mergeSemesterAttempts } = require("../services/results/resultMerger");
const { buildSummary } = require("../services/results/resultCalculator");

const branchMap = {
  "05": "CSE",
  "66": "CSM",
  "67": "CSD",
  "04": "ECE",
  "12": "IT",
  "72": "AIDS"
};

const getBranchFromRoll = (roll) => branchMap[roll.substring(6, 8)] || "Unknown";

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

const persistSemesters = async (roll, semesters) => {
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
      await db.promise().query(
        "UPDATE results SET sgpa = ? WHERE id = ?",
        [semester.sgpa, resultId]
      );
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

router.get("/:roll", async (req, res) => {
  const roll = String(req.params.roll || "").trim().toUpperCase();

  if (!roll) {
    return res.status(400).json({ error: "Roll number is required" });
  }

  try {
    const student = await getStudentProfile(roll);
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
        roll,
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
      await persistSemesters(roll, semesters);
    }

    const summary = buildSummary(semesters);

    return res.json({
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
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

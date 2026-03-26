const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { YEAR_TO_CURRENT_SEMESTER, ensureYearSync, getYearSyncStatus } = require("../services/analytics/analyticsSyncService");

const parseYear = (value) => {
  const year = Number.parseInt(String(value || ""), 10);
  return [1, 2, 3, 4].includes(year) ? year : null;
};

const requireYear = (req, res) => {
  const year = parseYear(req.query.year);
  if (!year) {
    res.status(400).json({ error: "year query param must be one of 1, 2, 3, or 4" });
    return null;
  }
  return year;
};

const buildOverviewResponse = ({ totalStudents, passed, failed, averageValue, averageLabel, departments, sync }) => ({
  totalStudents,
  passPercentage: totalStudents > 0 ? ((passed / totalStudents) * 100).toFixed(2) : "0.00",
  failPercentage: totalStudents > 0 ? ((failed / totalStudents) * 100).toFixed(2) : "0.00",
  averageValue,
  averageLabel,
  departments,
  sync
});

const getCurrentOverview = async (year, sync) => {
  const semester = YEAR_TO_CURRENT_SEMESTER[year];

  const [totalRows] = await db.promise().query(
    `SELECT COUNT(*) AS total
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ? AND r.semester = ?`,
    [year, semester]
  );

  const [passFailRows] = await db.promise().query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed,
       SUM(CASE WHEN r.sgpa = 0 THEN 1 ELSE 0 END) AS failed
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ? AND r.semester = ?`,
    [year, semester]
  );

  const [avgRows] = await db.promise().query(
    `SELECT AVG(r.sgpa) AS average_value
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ? AND r.semester = ?`,
    [year, semester]
  );

  const [departments] = await db.promise().query(
    `SELECT
       s.department_id,
       COUNT(*) AS total,
       SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed,
       ROUND((SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS pass_percentage
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ? AND r.semester = ?
     GROUP BY s.department_id
     ORDER BY s.department_id`,
    [year, semester]
  );

  return buildOverviewResponse({
    totalStudents: Number(totalRows[0]?.total || 0),
    passed: Number(passFailRows[0]?.passed || 0),
    failed: Number(passFailRows[0]?.failed || 0),
    averageValue: Number(avgRows[0]?.average_value || 0).toFixed(2),
    averageLabel: "Avg SGPA",
    departments,
    sync
  });
};

const getAllSemesterOverview = async (year, sync) => {
  const [cgpaRows] = await db.promise().query(
    `SELECT
       s.roll_number,
       s.name,
       s.department_id,
       s.section,
       CASE
         WHEN SUM(CASE WHEN r.sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
         ELSE AVG(r.sgpa)
       END AS cgpa
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ?
     GROUP BY s.roll_number, s.name, s.department_id, s.section`,
    [year]
  );

  const totalStudents = cgpaRows.length;
  const passed = cgpaRows.filter((row) => Number(row.cgpa) > 0).length;
  const failed = totalStudents - passed;
  const averageValue =
    totalStudents > 0
      ? (
          cgpaRows.reduce((sum, row) => sum + Number(row.cgpa || 0), 0) / totalStudents
        ).toFixed(2)
      : "0.00";

  const [departments] = await db.promise().query(
    `SELECT
       base.department_id,
       COUNT(*) AS total,
       SUM(CASE WHEN base.cgpa > 0 THEN 1 ELSE 0 END) AS passed,
       ROUND((SUM(CASE WHEN base.cgpa > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS pass_percentage
     FROM (
       SELECT
         s.roll_number,
         s.department_id,
         CASE
           WHEN SUM(CASE WHEN r.sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
           ELSE AVG(r.sgpa)
         END AS cgpa
       FROM results r
       JOIN students s ON s.roll_number = r.roll_number
       WHERE s.year = ?
       GROUP BY s.roll_number, s.department_id
     ) base
     GROUP BY base.department_id
     ORDER BY base.department_id`,
    [year]
  );

  return buildOverviewResponse({
    totalStudents,
    passed,
    failed,
    averageValue,
    averageLabel: "Avg CGPA",
    departments,
    sync
  });
};

const getTopStudents = async (year, mode) => {
  if (mode === "current") {
    const semester = YEAR_TO_CURRENT_SEMESTER[year];
    const [rows] = await db.promise().query(
      `SELECT r.roll_number, s.name, s.department_id, r.sgpa AS score
       FROM results r
       JOIN students s ON s.roll_number = r.roll_number
       WHERE s.year = ? AND r.semester = ? AND r.sgpa > 0
       ORDER BY r.sgpa DESC, s.roll_number ASC
       LIMIT 30`,
      [year, semester]
    );
    return rows;
  }

  const [rows] = await db.promise().query(
    `SELECT
       s.roll_number,
       s.name,
       s.department_id,
       CASE
         WHEN SUM(CASE WHEN r.sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
         ELSE AVG(r.sgpa)
       END AS score
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ?
     GROUP BY s.roll_number, s.name, s.department_id
     HAVING score > 0
     ORDER BY score DESC, s.roll_number ASC
     LIMIT 30`,
    [year]
  );

  return rows;
};

const buildClasses = (students) => {
  const classes = {};

  students.forEach((student) => {
    const section = student.section || "A";

    if (!classes[section]) {
      classes[section] = { total: 0, passed: 0, topStudents: [] };
    }

    classes[section].total += 1;
    if (Number(student.score) > 0) {
      classes[section].passed += 1;
    }
    classes[section].topStudents.push(student);
  });

  Object.values(classes).forEach((sectionData) => {
    sectionData.passPercentage =
      sectionData.total > 0
        ? ((sectionData.passed / sectionData.total) * 100).toFixed(2)
        : "0.00";
    sectionData.topStudents = sectionData.topStudents
      .filter((student) => Number(student.score) > 0)
      .sort((left, right) => Number(right.score) - Number(left.score))
      .slice(0, 10);
  });

  return classes;
};

const getDepartmentDetails = async (year, departmentId, mode) => {
  if (mode === "current") {
    const semester = YEAR_TO_CURRENT_SEMESTER[year];

    const [summaryRows] = await db.promise().query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed
       FROM results r
       JOIN students s ON s.roll_number = r.roll_number
       WHERE s.year = ? AND s.department_id = ? AND r.semester = ?`,
      [year, departmentId, semester]
    );

    const [subjectRows] = await db.promise().query(
      `SELECT
         rs.subject_name,
         SUM(CASE WHEN rs.grade NOT IN ('F', 'AB') THEN 1 ELSE 0 END) AS passed,
         ROUND((SUM(CASE WHEN rs.grade NOT IN ('F', 'AB') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS pass_percentage
       FROM result_subjects rs
       JOIN results r ON rs.result_id = r.id
       JOIN students s ON s.roll_number = r.roll_number
       WHERE s.year = ? AND s.department_id = ? AND r.semester = ?
       GROUP BY rs.subject_name
       ORDER BY rs.subject_name`,
      [year, departmentId, semester]
    );

    const [studentRows] = await db.promise().query(
      `SELECT r.roll_number, s.name, s.section, r.sgpa AS score
       FROM results r
       JOIN students s ON s.roll_number = r.roll_number
       WHERE s.year = ? AND s.department_id = ? AND r.semester = ?`,
      [year, departmentId, semester]
    );

    const total = Number(summaryRows[0]?.total || 0);
    const passed = Number(summaryRows[0]?.passed || 0);

    return {
      summary: {
        total,
        passed,
        passPercentage: total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00"
      },
      classes: buildClasses(studentRows),
      topStudents: studentRows
        .filter((student) => Number(student.score) > 0)
        .sort((left, right) => Number(right.score) - Number(left.score))
        .slice(0, 10),
      subjects: subjectRows
    };
  }

  const [studentRows] = await db.promise().query(
    `SELECT
       s.roll_number,
       s.name,
       s.section,
       CASE
         WHEN SUM(CASE WHEN r.sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
         ELSE AVG(r.sgpa)
       END AS score
     FROM results r
     JOIN students s ON s.roll_number = r.roll_number
     WHERE s.year = ? AND s.department_id = ?
     GROUP BY s.roll_number, s.name, s.section`,
    [year, departmentId]
  );

  const total = studentRows.length;
  const passed = studentRows.filter((student) => Number(student.score) > 0).length;

  return {
    summary: {
      total,
      passed,
      passPercentage: total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00"
    },
    classes: buildClasses(studentRows),
    topStudents: studentRows
      .filter((student) => Number(student.score) > 0)
      .sort((left, right) => Number(right.score) - Number(left.score))
      .slice(0, 10),
    subjects: []
  };
};

router.get("/overview", async (req, res) => {
  const year = requireYear(req, res);
  if (!year) return;

  const mode = req.query.mode === "overall" ? "overall" : "current";

  try {
    const sync = await getYearSyncStatus(year);
    const data =
      mode === "current"
        ? await getCurrentOverview(year, sync)
        : await getAllSemesterOverview(year, sync);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/top-students", async (req, res) => {
  const year = requireYear(req, res);
  if (!year) return;

  const mode = req.query.mode === "overall" ? "overall" : "current";

  try {
    const rows = await getTopStudents(year, mode);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/department/:dept", async (req, res) => {
  const year = requireYear(req, res);
  if (!year) return;

  const mode = req.query.mode === "overall" ? "overall" : "current";
  const departmentId = Number.parseInt(req.params.dept, 10);

  if (Number.isNaN(departmentId)) {
    return res.status(400).json({ error: "Invalid department id" });
  }

  try {
    const details = await getDepartmentDetails(year, departmentId, mode);
    res.json(details);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/sync", async (req, res) => {
  const year = requireYear(req, res);
  if (!year) return;

  try {
    const sync = await ensureYearSync(year, { force: true });
    res.json(sync);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/sync-status", async (req, res) => {
  const year = requireYear(req, res);
  if (!year) return;

  try {
    const sync = await getYearSyncStatus(year);
    res.json(sync);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

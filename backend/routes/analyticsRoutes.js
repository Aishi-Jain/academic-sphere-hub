const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 🔥 helper: get latest semester
const getLatestSemester = async () => {
  const [rows] = await db.promise().query(
    "SELECT MAX(semester) as sem FROM results"
  );
  return rows[0].sem;
};

// =======================================
// 🔥 OVERALL (CURRENT SEM)
// =======================================
router.get("/overall", async (req, res) => {
  try {
    const sem = await getLatestSemester();

    // total students
    const [total] = await db.promise().query(
      "SELECT COUNT(DISTINCT roll_number) AS total FROM results WHERE semester = ?",
      [sem]
    );

    // pass / fail (student level)
    const [pf] = await db.promise().query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN sgpa > 0 THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN sgpa = 0 THEN 1 ELSE 0 END) AS failed
      FROM results
      WHERE semester = ?
    `, [sem]);

    // avg sgpa
    const [avg] = await db.promise().query(`
      SELECT AVG(sgpa) AS avg_sgpa
      FROM results
      WHERE semester = ?
    `, [sem]);

    // department ranking
    const [dept] = await db.promise().query(`
      SELECT 
        s.department_id,
        COUNT(*) AS total,
        SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed,
        ROUND(
          (SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) AS pass_percentage
      FROM results r
      JOIN students s ON s.roll_number = r.roll_number
      WHERE r.semester = ?
      GROUP BY s.department_id
      ORDER BY pass_percentage DESC
    `, [sem]);

    res.json({
      semester: sem,
      totalStudents: total[0].total,
      passPercentage: ((pf[0].passed / pf[0].total) * 100).toFixed(2),
      failPercentage: ((pf[0].failed / pf[0].total) * 100).toFixed(2),
      avgSGPA: parseFloat(avg[0].avg_sgpa || 0).toFixed(2),
      departments: dept
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 TOP 30 STUDENTS (CURRENT SEM)
// =======================================
router.get("/top-students", async (req, res) => {
  try {
    const sem = await getLatestSemester();

    const [rows] = await db.promise().query(`
      SELECT 
        r.roll_number,
        s.name,
        s.department_id,
        r.sgpa
      FROM results r
      JOIN students s ON s.roll_number = r.roll_number
      WHERE r.semester = ?
      AND r.sgpa > 0   
      ORDER BY r.sgpa DESC
      LIMIT 30
    `, [sem]);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 DEPARTMENT SUMMARY
// =======================================
router.get("/department/:dept", async (req, res) => {
  const dept = req.params.dept;

  try {
    const sem = await getLatestSemester();

    const [stats] = await db.promise().query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed
      FROM results r
      JOIN students s ON s.roll_number = r.roll_number
      WHERE s.department_id = ? AND r.semester = ?
    `, [dept, sem]);

    const total = stats[0].total;
    const passed = stats[0].passed;

    res.json({
      total,
      passed,
      passPercentage: ((passed / total) * 100).toFixed(2)
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 SUBJECT-WISE (DEPT)
// =======================================
router.get("/subject-wise/:dept", async (req, res) => {
  const dept = req.params.dept;

  try {
    const sem = await getLatestSemester();

    const [rows] = await db.promise().query(`
      SELECT 
        rs.subject_name,
        COUNT(*) AS total,
        SUM(CASE WHEN rs.grade NOT IN ('F','Ab') THEN 1 ELSE 0 END) AS passed,
        ROUND(
          (SUM(CASE WHEN rs.grade NOT IN ('F','Ab') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) AS pass_percentage
      FROM result_subjects rs
      JOIN results r ON rs.result_id = r.id
      JOIN students s ON s.roll_number = r.roll_number
      WHERE s.department_id = ? AND r.semester = ?
      GROUP BY rs.subject_name
    `, [dept, sem]);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 CLASS-WISE + TOP 10 PER CLASS
// =======================================
router.get("/class-wise/:dept", async (req, res) => {
  const dept = req.params.dept;

  try {
    const sem = await getLatestSemester();

    const [rows] = await db.promise().query(`
      SELECT 
        r.roll_number,
        s.name,
        r.sgpa
      FROM results r
      JOIN students s ON s.roll_number = r.roll_number
      WHERE s.department_id = ? AND r.semester = ?
    `, [dept, sem]);

    const sections = {};

    rows.forEach((row) => {
      const section = row.roll_number.slice(-1);

      if (!sections[section]) {
        sections[section] = {
          students: [],
          top10: []
        };
      }

      sections[section].students.push(row);
    });

    // calculate top 10 per section
    for (const sec in sections) {
      sections[sec].top10 = sections[sec].students
        .sort((a, b) => b.sgpa - a.sgpa)
        .slice(0, 10);
    }

    res.json(sections);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
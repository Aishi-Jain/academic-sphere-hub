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

    const [total] = await db.promise().query(
      "SELECT COUNT(DISTINCT roll_number) AS total FROM results WHERE semester = ?",
      [sem]
    );

    const [pf] = await db.promise().query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN sgpa > 0 THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN sgpa = 0 THEN 1 ELSE 0 END) AS failed
      FROM results
      WHERE semester = ?
    `, [sem]);

    const [avg] = await db.promise().query(`
      SELECT AVG(sgpa) AS avg_sgpa
      FROM results
      WHERE semester = ?
    `, [sem]);

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
// 🔥 TOP 30 STUDENTS
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
// 🔥 FULL DEPARTMENT ANALYTICS
// =======================================
router.get("/department-full/:dept", async (req, res) => {
  const dept = req.params.dept;

  try {
    const sem = await getLatestSemester();

    // SUMMARY
    const [summary] = await db.promise().query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed,
        ROUND(
          (SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) AS pass_percentage
      FROM results r
      JOIN students s ON s.roll_number = r.roll_number
      WHERE s.department_id = ? AND r.semester = ?
    `, [dept, sem]);

    // SUBJECT-WISE
    const [subjects] = await db.promise().query(`
      SELECT 
        rs.subject_name,
        COUNT(*) AS total,
        SUM(CASE WHEN rs.grade NOT IN ('F','AB') THEN 1 ELSE 0 END) AS passed,
        ROUND(
          (SUM(CASE WHEN rs.grade NOT IN ('F','AB') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) AS pass_percentage
      FROM result_subjects rs
      JOIN results r ON rs.result_id = r.id
      JOIN students s ON s.roll_number = r.roll_number
      WHERE s.department_id = ? AND r.semester = ?
      GROUP BY rs.subject_name
    `, [dept, sem]);

    // STUDENTS
    const [students] = await db.promise().query(`
        SELECT 
            r.roll_number,
            s.name,
            s.section,
            r.sgpa
        FROM results r
        JOIN students s ON s.roll_number = r.roll_number
        WHERE s.department_id = ? AND r.semester = ?
        `, [dept, sem]);

    const classes = {};

    students.forEach((s) => {
      const sec = s.section || "Unknown";

      if (!classes[sec]) {
        classes[sec] = {
          total: 0,
          passed: 0,
          passPercentage: 0,
          top10: []
        };
      }

      classes[sec].total++;

      if (s.sgpa > 0) classes[sec].passed++;

      classes[sec].top10.push(s);
    });

    for (const sec in classes) {
      const c = classes[sec];

      c.passPercentage = ((c.passed / c.total) * 100).toFixed(2);

      c.top10 = c.top10
        .filter(s => s.sgpa > 0)
        .sort((a, b) => b.sgpa - a.sgpa)
        .slice(0, 10);
    }

    res.json({
      summary: summary[0],
      subjects,
      classes
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
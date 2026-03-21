const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 🔥 helper
const getLatestSemester = async () => {
  const [rows] = await db.promise().query(
    "SELECT MAX(semester) as sem FROM results"
  );
  return rows[0].sem;
};

// =======================================
// 🔥 CURRENT SEMESTER OVERALL
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
    `, [sem]);

    const bestDept = dept.sort((a,b)=>b.pass_percentage - a.pass_percentage)[0];
    const worstDept = dept.sort((a,b)=>a.pass_percentage - b.pass_percentage)[0];

    const insights = [
        `Top performing department: ${bestDept.department_id} (${bestDept.pass_percentage}%)`,
        `Lowest performing department: ${worstDept.department_id} (${worstDept.pass_percentage}%)`,
        `Total students: ${total[0]?.total || total}`,
    ];

    res.json({
      totalStudents: total[0].total,
      passPercentage: ((pf[0].passed / pf[0].total) * 100).toFixed(2),
      failPercentage: ((pf[0].failed / pf[0].total) * 100).toFixed(2),
      avgSGPA: parseFloat(avg[0].avg_sgpa || 0).toFixed(2),
      departments: dept
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 ALL SEMESTERS OVERALL (FIXED CGPA)
// =======================================
router.get("/overall-all", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        roll_number,
        CASE 
          WHEN SUM(CASE WHEN sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
          ELSE AVG(sgpa)
        END AS cgpa
      FROM results
      GROUP BY roll_number
    `);

    const total = rows.length;
    const passed = rows.filter(r => r.cgpa > 0).length;
    const failed = total - passed;

    const avg =
      rows.reduce((sum, r) => sum + Number(r.cgpa || 0), 0) / total;

    const [dept] = await db.promise().query(`
      SELECT 
        s.department_id,
        COUNT(*) AS total,
        SUM(CASE WHEN r.cgpa > 0 THEN 1 ELSE 0 END) AS passed,
        ROUND(
          (SUM(CASE WHEN r.cgpa > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
        ) AS pass_percentage
      FROM (
        SELECT 
          roll_number,
          CASE 
            WHEN SUM(CASE WHEN sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
            ELSE AVG(sgpa)
          END AS cgpa
        FROM results
        GROUP BY roll_number
      ) r
      JOIN students s ON s.roll_number = r.roll_number
      GROUP BY s.department_id
    `);

    const bestDept = dept.sort((a,b)=>b.pass_percentage - a.pass_percentage)[0];
    const worstDept = dept.sort((a,b)=>a.pass_percentage - b.pass_percentage)[0];

    const insights = [
        `Top performing department: ${bestDept.department_id} (${bestDept.pass_percentage}%)`,
        `Lowest performing department: ${worstDept.department_id} (${worstDept.pass_percentage}%)`,
        `Total students: ${total[0]?.total || total}`,
    ];

    res.json({
      totalStudents: total,
      passPercentage: ((passed / total) * 100).toFixed(2),
      failPercentage: ((failed / total) * 100).toFixed(2),
      avgCGPA: avg.toFixed(2),
      departments: dept
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 TOP STUDENTS (CURRENT)
// =======================================
router.get("/top-students", async (req, res) => {
  const sem = await getLatestSemester();

  const [rows] = await db.promise().query(`
    SELECT r.roll_number, s.name, s.department_id, r.sgpa
    FROM results r
    JOIN students s ON s.roll_number = r.roll_number
    WHERE r.semester = ? AND r.sgpa > 0
    ORDER BY r.sgpa DESC
    LIMIT 30
  `, [sem]);

  res.json(rows);
});

// =======================================
// 🔥 TOP STUDENTS (ALL - FIXED CGPA)
// =======================================
router.get("/top-students-all", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        s.roll_number,
        s.name,
        s.department_id,
        r.cgpa
      FROM (
        SELECT 
          roll_number,
          CASE 
            WHEN SUM(CASE WHEN sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
            ELSE AVG(sgpa)
          END AS cgpa
        FROM results
        GROUP BY roll_number
      ) r
      JOIN students s ON s.roll_number = r.roll_number
      WHERE r.cgpa > 0
      ORDER BY r.cgpa DESC
      LIMIT 30
    `);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =======================================
// 🔥 DEPARTMENT FULL (CURRENT)
// =======================================
router.get("/department-full/:dept", async (req, res) => {
  const dept = req.params.dept;
  const sem = await getLatestSemester();

  const [summary] = await db.promise().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) AS passed,
      ROUND((SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS pass_percentage
    FROM results r
    JOIN students s ON s.roll_number = r.roll_number
    WHERE s.department_id = ? AND r.semester = ?
  `, [dept, sem]);

  const [subjects] = await db.promise().query(`
    SELECT 
      rs.subject_name,
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

  const [students] = await db.promise().query(`
    SELECT r.roll_number, s.name, s.section, r.sgpa
    FROM results r
    JOIN students s ON s.roll_number = r.roll_number
    WHERE s.department_id = ? AND r.semester = ?
  `, [dept, sem]);

  const classes = {};
  students.forEach(s => {
    const sec = s.section || "A";

    if (!classes[sec]) {
      classes[sec] = { total: 0, passed: 0, top10: [] };
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

  const top10Dept = students
    .filter(s => s.sgpa > 0)
    .sort((a,b)=>b.sgpa - a.sgpa)
    .slice(0,10);

  res.json({
    summary: summary[0],
    subjects,
    classes,
    top10Dept
  });
});

// =======================================
// 🔥 DEPARTMENT ALL (FIXED CGPA)
// =======================================
router.get("/department-all/:dept", async (req, res) => {
  const dept = req.params.dept;

  const [students] = await db.promise().query(`
    SELECT 
      s.roll_number,
      s.name,
      s.section,
      r.cgpa
    FROM (
      SELECT 
        roll_number,
        CASE 
          WHEN SUM(CASE WHEN sgpa = 0 THEN 1 ELSE 0 END) > 0 THEN 0
          ELSE AVG(sgpa)
        END AS cgpa
      FROM results
      GROUP BY roll_number
    ) r
    JOIN students s ON s.roll_number = r.roll_number
    WHERE s.department_id = ?
  `, [dept]);

  const classes = {};
  let total = 0, passed = 0;

  students.forEach(s => {
    const sec = s.section || "A";

    if (!classes[sec]) {
      classes[sec] = { total: 0, passed: 0, top10: [] };
    }

    classes[sec].total++;
    total++;

    if (s.cgpa > 0) {
      classes[sec].passed++;
      passed++;
    }

    classes[sec].top10.push(s);
  });

  for (const sec in classes) {
    const c = classes[sec];
    c.passPercentage = ((c.passed / c.total) * 100).toFixed(2);
    c.top10 = c.top10
      .filter(s => s.cgpa > 0)
      .sort((a, b) => b.cgpa - a.cgpa)
      .slice(0, 10);
  }

  const top10Dept = students
    .filter(s => s.cgpa > 0)
    .sort((a,b)=>b.cgpa - a.cgpa)
    .slice(0,10);

  res.json({
    total,
    passed,
    passPercentage: ((passed / total) * 100).toFixed(2),
    classes,
    top10Dept
  });
});

module.exports = router;
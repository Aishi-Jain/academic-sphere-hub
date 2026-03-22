const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {

    const CURRENT_SEM = "4-1";
    const facultyId = req.query.id;

    // 👤 Get faculty details FIRST
    const [facultyData] = await db.promise().query(`
      SELECT f.faculty_id, f.name, f.designation, d.department_name, f.profile_pic
      FROM faculty f
      JOIN departments d ON f.department_id = d.department_id
      WHERE f.faculty_id = ?
    `, [facultyId]);

    const faculty = facultyData[0];

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const department = faculty.department_name;

    // 👨‍🎓 Students
    const [students] = await db.promise().query(`
      SELECT COUNT(*) as count
      FROM students s
      JOIN departments d ON s.department_id = d.department_id
      WHERE d.department_name = ?
    `, [department]);

    // 👩‍🏫 Faculty count
    const [facultyCount] = await db.promise().query(`
      SELECT COUNT(*) as count
      FROM faculty f
      JOIN departments d ON f.department_id = d.department_id
      WHERE d.department_name = ?
    `, [department]);

    // 📚 Subjects
    const [subjects] = await db.promise().query(`
      SELECT COUNT(*) as count
      FROM subjects sub
      JOIN departments d ON sub.department_id = d.department_id
      WHERE d.department_name = ?
    `, [department]);

    // 📈 Avg SGPA
    const [avgSGPA] = await db.promise().query(`
      SELECT AVG(r.sgpa) as avg_sgpa
      FROM results r
      JOIN students s ON r.roll_number = s.roll_number
      JOIN departments d ON s.department_id = d.department_id
      WHERE r.semester = ? AND d.department_name = ?
    `, [CURRENT_SEM, department]);

    // 📉 Trend
    const [sgpaTrend] = await db.promise().query(`
      SELECT r.semester, AVG(r.sgpa) as avg_sgpa
      FROM results r
      JOIN students s ON r.roll_number = s.roll_number
      JOIN departments d ON s.department_id = d.department_id
      WHERE d.department_name = ?
      GROUP BY r.semester
      ORDER BY 
        CAST(SUBSTRING_INDEX(r.semester, '-', 1) AS UNSIGNED),
        CAST(SUBSTRING_INDEX(r.semester, '-', -1) AS UNSIGNED)
    `, [department]);

    // ✅ Pass %
    const [passData] = await db.promise().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN r.sgpa > 0 THEN 1 ELSE 0 END) as passed
      FROM results r
      JOIN students s ON r.roll_number = s.roll_number
      JOIN departments d ON s.department_id = d.department_id
      WHERE r.semester = ? AND d.department_name = ?
    `, [CURRENT_SEM, department]);

    res.json({
      totalStudents: students[0].count,
      totalFaculty: facultyCount[0].count,
      subjects: subjects[0].count,
      sgpaTrend: sgpaTrend,
      averageCGPA: Number(avgSGPA[0].avg_sgpa || 0).toFixed(2),
      passPercentage: passData[0].total
        ? ((passData[0].passed / passData[0].total) * 100).toFixed(2)
        : "0.00",

      facultyInfo: faculty
    });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;
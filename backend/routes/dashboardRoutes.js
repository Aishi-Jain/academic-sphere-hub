const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {

    const CURRENT_SEM = "4-1"; // change dynamically later if needed

    // Total Students
    const [students] = await db.promise().query("SELECT COUNT(*) as count FROM students");

    // Total Faculty
    const [faculty] = await db.promise().query("SELECT COUNT(*) as count FROM faculty");

    // Departments
    const [departments] = await db.promise().query("SELECT COUNT(*) as count FROM departments");

    // Classrooms
    const [classrooms] = await db.promise().query("SELECT COUNT(*) as count FROM classrooms");

    // Upcoming Exams
    const [exams] = await db.promise().query(
      `SELECT COUNT(*) as count 
        FROM exams 
        WHERE start_date >= CURDATE();
      `
    );

    // Students by Department
    const [deptData] = await db.promise().query(`
      SELECT d.department_name as name, COUNT(s.student_id) as count
      FROM students s
      JOIN departments d ON s.department_id = d.department_id
      GROUP BY d.department_name
    `);

    const [avgSGPA] = await db.promise().query(`
        SELECT AVG(sgpa) as avg_sgpa
        FROM results
        WHERE semester = ?
    `, [CURRENT_SEM]);

    const [sgpaTrend] = await db.promise().query(`
        SELECT semester, AVG(sgpa) as avg_sgpa
        FROM results
        GROUP BY semester
        ORDER BY 
            CAST(SUBSTRING_INDEX(semester, '-', 1) AS UNSIGNED),
            CAST(SUBSTRING_INDEX(semester, '-', -1) AS UNSIGNED)
    `);

    const [passData] = await db.promise().query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN sgpa > 0 THEN 1 ELSE 0 END) as passed
        FROM results
        WHERE semester = ?
    `, [CURRENT_SEM]);

    res.json({
      totalStudents: students[0].count,
      totalFaculty: faculty[0].count,
      departments: departments[0].count,
      classrooms: classrooms[0].count,
      upcomingExams: exams[0].count,
      departmentDistribution: deptData,
      sgpaTrend: sgpaTrend,
      averageCGPA: Number(avgSGPA[0].avg_sgpa).toFixed(2),
      passPercentage: (
        (passData[0].passed / passData[0].total) * 100
      ).toFixed(2),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;
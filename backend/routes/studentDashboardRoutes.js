const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const rollNumber = req.query.roll;

    // 👤 STUDENT DETAILS
    const [studentData] = await db.promise().query(`
      SELECT s.*, s.profile_pic, d.department_name
      FROM students s
      JOIN departments d ON s.department_id = d.department_id
      WHERE s.roll_number = ?
    `, [rollNumber]);

    const student = studentData[0];

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 📊 RESULTS (ALL SEMS)
    const [results] = await db.promise().query(`
      SELECT semester, sgpa
      FROM results
      WHERE roll_number = ?
      ORDER BY semester
    `, [rollNumber]);

    // 🎯 CURRENT CGPA
    const [cgpaData] = await db.promise().query(`
      SELECT AVG(sgpa) as cgpa
      FROM results
      WHERE roll_number = ?
    `, [rollNumber]);

    // 🎯 LATEST SGPA
    const latestSGPA = results.length
      ? results[results.length - 1].sgpa
      : 0;

    const cgpa = Number(cgpaData[0].cgpa || 0).toFixed(2);

    // 🧠 SECTION RANK
    const [sectionRankData] = await db.promise().query(`
      SELECT r.roll_number,
      AVG(r.sgpa) as cgpa,
      RANK() OVER (ORDER BY AVG(r.sgpa) DESC) as rank_pos
      FROM results r
      JOIN students s ON r.roll_number = s.roll_number
      WHERE s.department_id = ?
      AND s.section = ?
      GROUP BY r.roll_number
    `, [student.department_id, student.section]);

    const sectionRank = sectionRankData.find(s => s.roll_number === rollNumber)?.rank_pos || "-";

    // 🧠 DEPARTMENT RANK
    const [deptRankData] = await db.promise().query(`
      SELECT r.roll_number,
      AVG(r.sgpa) as cgpa,
      RANK() OVER (ORDER BY AVG(r.sgpa) DESC) as rank_pos
      FROM results r
      JOIN students s ON r.roll_number = s.roll_number
      WHERE s.department_id = ?
      GROUP BY r.roll_number
    `, [student.department_id]);

    const deptRank = deptRankData.find(s => s.roll_number === rollNumber)?.rank_pos || "-";

    // 🧠 COLLEGE RANK
    const [collegeRankData] = await db.promise().query(`
      SELECT roll_number,
      AVG(sgpa) as cgpa,
      RANK() OVER (ORDER BY AVG(sgpa) DESC) as rank_pos
      FROM results
      GROUP BY roll_number
    `);

    const collegeRank = collegeRankData.find(s => s.roll_number === rollNumber)?.rank_pos || "-";

    res.json({
      studentInfo: student,
      cgpa,
      latestSGPA,
      sectionRank,
      deptRank,
      collegeRank,
      trend: results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;
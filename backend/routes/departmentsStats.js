const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [data] = await db.promise().query(`
      SELECT 
        d.department_name,
        COUNT(DISTINCT s.student_id) as studentCount,
        COUNT(DISTINCT f.faculty_id) as facultyCount
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.department_id
      LEFT JOIN faculty f ON f.department_id = d.department_id
      GROUP BY d.department_name
    `);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;
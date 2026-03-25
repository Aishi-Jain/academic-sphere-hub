const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { getStudentsByFilter, uploadMarks } = require("../controllers/marksController");

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

// ✅ Get students
router.get("/students", getStudentsByFilter);

// ✅ Upload marks
router.post("/upload", uploadMarks);

// ✅ Get all departments
router.get("/departments", (req, res) => {
  db.query("SELECT * FROM departments", (err, rows) => {
    if (err) {
      console.error("Department error:", err);
      return res.status(500).json({ error: "Error fetching departments" });
    }
    res.json(rows);
  });
});

// ✅ Get sections based on regulation + year + department
router.get("/sections", (req, res) => {
  const { regulation, year, department_id } = req.query;
  const parsedYear = parseOptionalInt(year);
  const parsedDepartmentId = parseOptionalInt(department_id);

  if (!regulation || !parsedYear || !parsedDepartmentId) {
    return res.json([]);
  }

  db.query(
    `SELECT DISTINCT section
     FROM students
     WHERE regulation = ?
       AND year = ?
       AND department_id = ?
     ORDER BY section`,
    [regulation, parsedYear, parsedDepartmentId],
    (err, rows) => {
      if (err) {
        console.error("Section error:", err);
        return res.status(500).json({ error: "Error fetching sections" });
      }
      res.json(rows);
    }
  );
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const {
  getStudentsByFilter,
  uploadMarks,
} = require("../controllers/marksController");

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

// ✅ Get sections based on department
router.get("/sections", (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.json([]);
  }

  db.query(
    "SELECT DISTINCT section FROM students WHERE department_id = ?",
    [department_id],
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
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ GET exams
router.get("/", (req, res) => {
  db.query("SELECT * FROM exams", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ ADD exam
router.post("/", (req, res) => {
  const { exam_name, semester, year, start_date, end_date, subjects } = req.body;

  start_date = new Date(start_date).toISOString().split("T")[0];
  end_date = new Date(end_date).toISOString().split("T")[0];

  db.query(
    "INSERT INTO exams (exam_name, semester, year, start_date, end_date, subjects) VALUES (?, ?, ?, ?, ?, ?)",
    [exam_name, semester, year, start_date, end_date, JSON.stringify(subjects)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Exam added" });
    }
  );
});

// ✅ UPDATE
router.put("/:id", (req, res) => {
  const { id } = req.params;

  let {
    exam_name,
    semester,
    year,
    start_date,
    end_date,
    subjects,
  } = req.body;

  // 🔥 FIX DATE FORMAT
  start_date = new Date(start_date).toISOString().split("T")[0];
  end_date = new Date(end_date).toISOString().split("T")[0];

  db.query(
    `UPDATE exams 
     SET exam_name=?, semester=?, year=?, start_date=?, end_date=?, subjects=? 
     WHERE exam_id=?`,
    [
      exam_name,
      semester,
      year,
      start_date,
      end_date,
      JSON.stringify(subjects),
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Updated successfully" });
    }
  );
});

// ✅ DELETE
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM exams WHERE exam_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted" });
  });
});

module.exports = router;
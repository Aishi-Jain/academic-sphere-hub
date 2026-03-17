const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ GET all subjects
router.get("/", (req, res) => {
  db.query("SELECT * FROM subjects", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ ADD subject
router.post("/", (req, res) => {
  const { subject_code, subject_name, department_id, semester } = req.body;

  console.log("Incoming Data:", req.body); // 👈 DEBUG

  db.query(
    "INSERT INTO subjects (subject_code, subject_name, department_id, semester) VALUES (?, ?, ?, ?)",
    [subject_code, subject_name, department_id, semester],
    (err, result) => {
      if (err) {
        console.error("INSERT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Subject added successfully" });
    }
  );
});

// ✅ UPDATE subject
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { subject_code, subject_name, department_id, semester } = req.body;

  db.query(
    "UPDATE subjects SET subject_code=?, subject_name=?, department_id=?, semester=? WHERE subject_id=?",
    [subject_code, subject_name, department_id, semester, id],
    (err) => {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Updated successfully" });
    }
  );
});

// ✅ DELETE subject
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM subjects WHERE subject_id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Deleted successfully" });
    }
  );
});

module.exports = router;
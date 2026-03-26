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

router.post("/", (req, res) => {
  const { errors, sanitized } = validateSubjectPayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  db.query(
    "INSERT INTO subjects (subject_code, subject_name, department_id, semester, year, regulation) VALUES (?, ?, ?, ?, ?, ?)",
    [
      sanitized.subject_code,
      sanitized.subject_name,
      sanitized.department_id,
      sanitized.semester,
      sanitized.year,
      sanitized.regulation,
    ],
    (err) => {
      if (err) {
        console.error("INSERT ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Subject added successfully" });
    }
  );
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { errors, sanitized } = validateSubjectPayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  db.query(
    "UPDATE subjects SET subject_code=?, subject_name=?, department_id=?, semester=?, year=?, regulation=? WHERE subject_id=?",
    [
      sanitized.subject_code,
      sanitized.subject_name,
      sanitized.department_id,
      sanitized.semester,
      sanitized.year,
      sanitized.regulation,
      id,
    ],
    (err) => {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Updated successfully" });
    }
  );
});

router.delete("/:id", (req, res) => {
  db.query("DELETE FROM subjects WHERE subject_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");

const normalizeDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().split("T")[0];
};

const normalizeSemester = (value) => {
  const numeric = Number(value);
  return numeric === 2 ? 2 : 1;
};

// GET exams
router.get("/", (req, res) => {
  db.query(
    `
      SELECT exam_id, exam_name, semester, year, start_date, end_date
      FROM exams
      ORDER BY year DESC, semester DESC, start_date DESC, exam_name ASC
    `,
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    }
  );
});

// ADD exam
router.post("/", (req, res) => {
  const { exam_name, semester, year, start_date, end_date } = req.body;
  const normalizedStartDate = normalizeDate(start_date);
  const normalizedEndDate = normalizeDate(end_date);

  if (!exam_name || !year || !normalizedStartDate || !normalizedEndDate) {
    return res.status(400).json({ error: "exam_name, year, start_date and end_date are required" });
  }

  db.query(
    "INSERT INTO exams (exam_name, semester, year, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
    [exam_name, normalizeSemester(semester), Number(year), normalizedStartDate, normalizedEndDate],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Exam added" });
    }
  );
});

// UPDATE exam
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { exam_name, semester, year, start_date, end_date } = req.body;
  const normalizedStartDate = normalizeDate(start_date);
  const normalizedEndDate = normalizeDate(end_date);

  if (!exam_name || !year || !normalizedStartDate || !normalizedEndDate) {
    return res.status(400).json({ error: "exam_name, year, start_date and end_date are required" });
  }

  db.query(
    `
      UPDATE exams
      SET exam_name = ?, semester = ?, year = ?, start_date = ?, end_date = ?
      WHERE exam_id = ?
    `,
    [exam_name, normalizeSemester(semester), Number(year), normalizedStartDate, normalizedEndDate, id],
    (err) => {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Updated successfully" });
    }
  );
});

// DELETE exam
router.delete("/:id", (req, res) => {
  const examId = Number(req.params.id);
  const connection = db.promise();

  (async () => {
    try {
      await connection.beginTransaction();

      await connection.query(
        `
          UPDATE invigilation_sessions
          SET source_exam_id = NULL
          WHERE source_exam_id = ?
        `,
        [examId]
      );

      await connection.query(
        `
          DELETE FROM seating_allocation
          WHERE exam_id = ?
        `,
        [examId]
      );

      const [result] = await connection.query(
        `
          DELETE FROM exams
          WHERE exam_id = ?
        `,
        [examId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Exam not found" });
      }

      await connection.commit();
      return res.json({ message: "Deleted" });
    } catch (err) {
      await connection.rollback();
      console.error("DELETE EXAM ERROR:", err);
      return res.status(500).json({ error: err.message || "Failed to delete exam" });
    }
  })();
});

module.exports = router;

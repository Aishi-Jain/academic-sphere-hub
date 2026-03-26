const express = require("express");
const router = express.Router();
const db = require("../config/db");

const normalizePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const normalizeRegulation = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return ["R18", "R22", "R25"].includes(normalized) ? normalized : null;
};

const validateSubjectPayload = (payload) => {
  const errors = [];
  const subject_code = typeof payload.subject_code === "string" ? payload.subject_code.trim() : "";
  const subject_name = typeof payload.subject_name === "string" ? payload.subject_name.trim() : "";
  const department_id = normalizePositiveInt(payload.department_id);
  const semester = normalizePositiveInt(payload.semester);
  const year = normalizePositiveInt(payload.year);
  const regulation = normalizeRegulation(payload.regulation);

  if (!subject_code) {
    errors.push("Subject code is required");
  }

  if (!subject_name) {
    errors.push("Subject name is required");
  }

  if (!department_id) {
    errors.push("Department is required");
  }

  if (!semester || ![1, 2].includes(semester)) {
    errors.push("Semester must be 1 or 2");
  }

  if (!year || ![1, 2, 3, 4].includes(year)) {
    errors.push("Year must be between 1 and 4");
  }

  if (!regulation) {
    errors.push("Regulation must be one of R18, R22 or R25");
  }

  return {
    errors,
    sanitized: {
      subject_code,
      subject_name,
      department_id,
      semester,
      year,
      regulation,
    },
  };
};

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
  const subjectId = Number(req.params.id);
  const connection = db.promise();

  (async () => {
    try {
      await connection.beginTransaction();

      await connection.query(
        `
          UPDATE invigilation_timetable_entries
          SET subject_id = NULL
          WHERE subject_id = ?
        `,
        [subjectId]
      );

      await connection.query(
        `
          DELETE FROM marks
          WHERE subject_id = ?
        `,
        [subjectId]
      );

      const [result] = await connection.query(
        `
          DELETE FROM subjects
          WHERE subject_id = ?
        `,
        [subjectId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Subject not found" });
      }

      await connection.commit();
      return res.json({ message: "Deleted successfully" });
    } catch (err) {
      await connection.rollback();
      console.error("DELETE SUBJECT ERROR:", err);
      return res.status(500).json({ error: err.message || "Failed to delete subject" });
    }
  })();
});

module.exports = router;

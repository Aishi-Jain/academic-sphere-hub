const express = require("express");
const router = express.Router();
const db = require("../config/db");

const validRegulations = new Set(["R22", "R25"]);

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeSemester = (value) => {
  const parsed = parseOptionalInt(value);
  if (parsed === null) return null;
  if ([1, 2].includes(parsed)) return parsed;
  if (parsed >= 1 && parsed <= 8) return parsed % 2 === 0 ? 2 : 1;
  return null;
};

const validateSubjectPayload = ({
  subject_code,
  subject_name,
  department_id,
  semester,
  year,
  regulation,
}) => {
  const errors = [];

  const parsedDepartmentId = parseOptionalInt(department_id);
  const normalizedSemester = normalizeSemester(semester);
  const parsedYear = parseOptionalInt(year);

  if (!subject_code || !String(subject_code).trim()) {
    errors.push("subject_code is required");
  }

  if (!subject_name || !String(subject_name).trim()) {
    errors.push("subject_name is required");
  }

  if (!parsedDepartmentId || parsedDepartmentId <= 0) {
    errors.push("department_id must be a positive integer");
  }

  if (![1, 2].includes(normalizedSemester)) {
    errors.push("semester must be either 1 or 2 (1..8 will be normalized)");
  }

  if (![1, 2, 3, 4].includes(parsedYear)) {
    errors.push("year must be one of 1, 2, 3, 4");
  }

  if (!validRegulations.has(regulation)) {
    errors.push("regulation must be one of R22 or R25");
  }

  return {
    errors,
    sanitized: {
      subject_code: String(subject_code || "").trim(),
      subject_name: String(subject_name || "").trim(),
      department_id: parsedDepartmentId,
      semester: normalizedSemester,
      year: parsedYear,
      regulation,
    },
  };
};

router.get("/", (req, res) => {
  const { regulation, year, department_id, semester } = req.query;

  const where = [];
  const params = [];

  if (regulation) {
    where.push("regulation = ?");
    params.push(regulation);
  }

  const parsedYear = parseOptionalInt(year);
  if (parsedYear !== null) {
    where.push("year = ?");
    params.push(parsedYear);
  }

  const parsedDepartmentId = parseOptionalInt(department_id);
  if (parsedDepartmentId !== null) {
    where.push("department_id = ?");
    params.push(parsedDepartmentId);
  }

  const normalizedSemester = normalizeSemester(semester);
  if (normalizedSemester !== null) {
    where.push("semester = ?");
    params.push(normalizedSemester);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  db.query(
    `SELECT subject_id, subject_code, subject_name, department_id, semester, year, regulation
     FROM subjects
     ${whereClause}
     ORDER BY department_id, year, semester, subject_code`,
    params,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results.map((row) => ({ ...row, semester: normalizeSemester(row.semester) || row.semester })));
    }
  );
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

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

router.get("/", (req, res) => {
  const sql = "SELECT * FROM students";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

router.post("/", (req, res) => {
  const { name, rollNumber, department_id, year, semester, section, regulation } = req.body;

  const parsedYear = parseOptionalInt(year);
  const parsedDepartmentId = parseOptionalInt(department_id);
  const normalizedSemester = normalizeSemester(semester);
  const normalizedRegulation = String(regulation || "").trim().toUpperCase();

  if (!name || !rollNumber || !parsedDepartmentId || !parsedYear || !normalizedSemester || !section) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!validRegulations.has(normalizedRegulation)) {
    return res.status(400).json({ error: "regulation must be one of R22 or R25" });
  }

  const sql = `
    INSERT INTO students
    (roll_number, name, department_id, year, semester, section, regulation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [rollNumber, name, parsedDepartmentId, parsedYear, normalizedSemester, section, normalizedRegulation],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "Student added successfully",
        id: result.insertId,
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  const studentId = req.params.id;

  const sql = "DELETE FROM students WHERE student_id = ?";

  db.query(sql, [studentId], (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({ message: "Student deleted successfully" });
  });
});

router.put("/:id", (req, res) => {
  const id = req.params.id;

  const { name, rollNumber, department_id, year, semester, section, regulation } = req.body;

  const parsedYear = parseOptionalInt(year);
  const parsedDepartmentId = parseOptionalInt(department_id);
  const normalizedSemester = normalizeSemester(semester);
  const normalizedRegulation = String(regulation || "").trim().toUpperCase();

  if (!name || !rollNumber || !parsedDepartmentId || !parsedYear || !normalizedSemester || !section) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!validRegulations.has(normalizedRegulation)) {
    return res.status(400).json({ error: "regulation must be one of R22 or R25" });
  }

  const sql = `
    UPDATE students
    SET roll_number=?, name=?, department_id=?, year=?, semester=?, section=?, regulation=?
    WHERE student_id=?
  `;

  db.query(
    sql,
    [rollNumber, name, parsedDepartmentId, parsedYear, normalizedSemester, section, normalizedRegulation, id],
    (err) => {
      if (err) {
        console.log(err);
        res.status(500).json(err);
      } else {
        res.json({ message: "Student updated successfully" });
      }
    }
  );
});

module.exports = router;

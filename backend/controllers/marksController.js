const db = require("../config/db");

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isBlank = (value) => value === null || value === undefined || value === "";

const validateMark = (value, max) => {
  if (isBlank(value)) return { ok: true, parsed: null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return { ok: false, reason: "must be numeric" };
  if (parsed < 0) return { ok: false, reason: "cannot be negative" };
  if (parsed > max) return { ok: false, reason: `cannot exceed ${max}` };
  return { ok: true, parsed };
};

const computeTotal = (mid1, mid2, ppt) => ((mid1 + mid2) / 2) + ppt;

// ✅ Get students
exports.getStudentsByFilter = (req, res) => {
  const { regulation, year, semester, department_id, section, subject_id } = req.query;

  const parsedYear = parseOptionalInt(year);
  const parsedSemester = parseOptionalInt(semester);
  const parsedDepartmentId = parseOptionalInt(department_id);
  const parsedSubjectId = parseOptionalInt(subject_id);

  if (!regulation || !parsedYear || !parsedSemester || !parsedDepartmentId || !section || !parsedSubjectId) {
    return res.status(400).json({
      error: "Missing required filters",
      required: ["regulation", "year", "semester", "department_id", "section", "subject_id"],
    });
  }

  db.query(
    `SELECT
        s.student_id,
        s.roll_number AS roll_no,
        s.name,
        m.mid1,
        m.mid2,
        m.ppt,
        m.total
     FROM students s
     LEFT JOIN marks m
       ON s.student_id = m.student_id
       AND m.subject_id = ?
     WHERE s.regulation = ?
       AND s.year = ?
       AND s.department_id = ?
       AND s.section = ?
     ORDER BY s.roll_number`,
    [parsedSubjectId, regulation, parsedYear, parsedDepartmentId, section],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching students" });
      }
      res.json(rows);
    }
  );
};

// ✅ Upload marks
exports.uploadMarks = (req, res) => {
  const { subject_id, regulation, year, semester, department_id, section, marksData } = req.body;

  const parsedSubjectId = parseOptionalInt(subject_id);
  const parsedYear = parseOptionalInt(year);
  const parsedSemester = parseOptionalInt(semester);
  const parsedDepartmentId = parseOptionalInt(department_id);

  if (!parsedSubjectId || !regulation || !parsedYear || !parsedSemester || !parsedDepartmentId || !section) {
    return res.status(400).json({
      error: "Missing required request fields",
      required: ["subject_id", "regulation", "year", "semester", "department_id", "section", "marksData"],
    });
  }

  if (!Array.isArray(marksData) || marksData.length === 0) {
    return res.status(400).json({ error: "No marks data provided" });
  }

  const errors = [];
  const upsertRows = [];

  marksData.forEach((row, index) => {
    const parsedStudentId = parseOptionalInt(row.student_id);
    const mid1 = validateMark(row.mid1, 35);
    const mid2 = validateMark(row.mid2, 35);
    const ppt = validateMark(row.ppt, 5);

    if (!parsedStudentId) {
      errors.push({ row: index, student_id: row.student_id, field: "student_id", reason: "invalid student_id" });
      return;
    }

    [
      ["mid1", mid1],
      ["mid2", mid2],
      ["ppt", ppt],
    ].forEach(([field, validation]) => {
      if (!validation.ok) {
        errors.push({ row: index, student_id: parsedStudentId, field, reason: validation.reason });
      }
    });

    if (!mid1.ok || !mid2.ok || !ppt.ok) return;

    const hasAnyValue = mid1.parsed !== null || mid2.parsed !== null || ppt.parsed !== null;
    if (!hasAnyValue) return;

    if (mid1.parsed === null || mid2.parsed === null || ppt.parsed === null) {
      errors.push({
        row: index,
        student_id: parsedStudentId,
        field: "row",
        reason: "mid1, mid2 and ppt must all be provided together when submitting a row",
      });
      return;
    }

    upsertRows.push([
      parsedStudentId,
      parsedSubjectId,
      mid1.parsed,
      mid2.parsed,
      ppt.parsed,
      computeTotal(mid1.parsed, mid2.parsed, ppt.parsed),
    ]);
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  if (upsertRows.length === 0) {
    return res.status(400).json({
      error: "No complete mark rows found to persist",
    });
  }

  db.query(
    `INSERT INTO marks (student_id, subject_id, mid1, mid2, ppt, total)
     VALUES ?
     ON DUPLICATE KEY UPDATE
      mid1 = VALUES(mid1),
      mid2 = VALUES(mid2),
      ppt = VALUES(ppt),
      total = VALUES(total)`,
    [upsertRows],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error uploading marks" });
      }

      res.json({
        message: "Marks uploaded successfully",
        affectedRows: result.affectedRows,
        submittedRows: upsertRows.length,
      });
    }
  );
};

const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/db");

const upload = multer({ dest: "uploads/" });
const validRegulations = new Set(["R22", "R25"]);

const parseIntSafe = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeSemester = (value) => {
  const parsed = parseIntSafe(value);
  if (parsed === null) return null;
  if ([1, 2].includes(parsed)) return parsed;
  if (parsed >= 1 && parsed <= 8) return parsed % 2 === 0 ? 2 : 1;
  return null;
};

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required" });
  }

  const rows = [];
  const malformedRows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => rows.push(data))
    .on("end", () => {
      if (rows.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "CSV has no data rows" });
      }

      const insertValues = [];

      rows.forEach((row, index) => {
        const subject_code = String(row.subject_code || "").trim();
        const subject_name = String(row.subject_name || "").trim();
        const regulation = String(row.regulation || "").trim();
        const year = parseIntSafe(row.year);
        const department_id = parseIntSafe(row.department_id);
        const semester = normalizeSemester(row.semester);

        const isValid =
          subject_code &&
          subject_name &&
          validRegulations.has(regulation) &&
          [1, 2, 3, 4].includes(year) &&
          Number.isInteger(department_id) &&
          department_id > 0 &&
          [1, 2].includes(semester);

        if (!isValid) {
          malformedRows.push({ index: index + 2, row });
          return;
        }

        insertValues.push([
          subject_code,
          subject_name,
          regulation,
          year,
          department_id,
          semester,
        ]);
      });

      if (insertValues.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: "No valid rows found in CSV",
          malformedRows,
        });
      }

      db.query(
        `INSERT INTO subjects
        (subject_code, subject_name, regulation, year, department_id, semester)
        VALUES ?`,
        [insertValues],
        (err) => {
          fs.unlinkSync(req.file.path);

          if (err) {
            console.error("Subject upload failed:", err);
            return res.status(500).json({ error: err.message, malformedRows });
          }

          res.json({
            message: "Subjects uploaded successfully",
            insertedCount: insertValues.length,
            skippedCount: malformedRows.length,
            malformedRows,
          });
        }
      );
    })
    .on("error", (err) => {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;

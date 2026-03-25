const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/db");

const upload = multer({ dest: "uploads/" });
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

router.post("/upload-students", upload.single("file"), (req, res) => {
  const results = [];
  const malformedRows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      for (const row of results) {
        const cleanRow = {};
        Object.keys(row).forEach((key) => {
          cleanRow[key.trim()] = row[key];
        });

        const roll_number = String(cleanRow.roll_number || "").trim();
        const name = String(cleanRow.name || "").trim();
        const department_id = parseOptionalInt(cleanRow.department_id);
        const year = parseOptionalInt(cleanRow.year);
        const semester = normalizeSemester(cleanRow.semester);
        const section = String(cleanRow.section || "").trim();
        const regulation = String(cleanRow.regulation || "").trim().toUpperCase();

        if (!roll_number || !name || !department_id || !year || !semester || !section || !validRegulations.has(regulation)) {
          malformedRows.push(row);
          continue;
        }

        try {
          const existing = await db.promise().query("SELECT * FROM students WHERE roll_number = ?", [roll_number]);

          if (existing[0].length > 0) {
            console.log("Already exists:", roll_number);
            continue;
          }

          const studentResult = await db.promise().query(
            `INSERT INTO students
            (roll_number,name,department_id,year,semester,section,regulation)
            VALUES (?,?,?,?,?,?,?)`,
            [roll_number, name, department_id, year, semester, section, regulation]
          );

          const student_id = studentResult[0].insertId;

          await db.promise().query(
            `INSERT INTO users (username,password,role,reference_id)
             VALUES (?,?,?,?)`,
            [roll_number, roll_number, "student", student_id]
          );
        } catch (err) {
          console.log("Error inserting student:", err);
        }
      }

      fs.unlinkSync(req.file.path);

      res.json({
        message: "Students uploaded successfully",
        malformedRows: malformedRows.length,
      });
    });
});

module.exports = router;

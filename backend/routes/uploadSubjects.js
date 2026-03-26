const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/db");

const upload = multer({ dest: "uploads/" });

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

      results.forEach((row) => {
        db.query(
          "INSERT INTO subjects (code, name, department_id, semester) VALUES (?, ?, ?, ?)",
          [
            row.code,
            row.name,
            row.department_id,
            row.semester
          ]
        );
      });

      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

const studentsData = [];

router.post("/", upload.single("file"), (req, res) => {
  studentsData.length = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {

      // 🔥 Normalize keys (VERY IMPORTANT)
      const normalizedRow = {};

      Object.keys(row).forEach(key => {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      });

      const roll = normalizedRow["roll number"];

      if (!roll) {
        console.log("❌ Missing roll in row:", normalizedRow);
        return;
      }

      studentsData.push({
        roll: String(roll).trim(),
        name: (normalizedRow["name"] || "").trim(),
        department: (normalizedRow["department"] || "").trim(),
        year: (normalizedRow["year"] || "").trim(),
        section: (normalizedRow["section"] || "").trim()
      });

    })
    .on("end", () => {
      fs.unlinkSync(req.file.path);
      res.json({ message: "CSV processed", count: studentsData.length });
    });
});

module.exports = { router, studentsData };
const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

let studentsData = []; // temporary storage

router.post("/", upload.single("file"), (req, res) => {
  studentsData = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      studentsData.push({
        roll: row["roll number"],
        name: row["name"],
        department: row["department"],
        year: row["year"],
        section: row["section"]
      });
    })
    .on("end", () => {
      fs.unlinkSync(req.file.path);
      res.json({ message: "CSV processed", count: studentsData.length });
    });
});

module.exports = { router, studentsData };
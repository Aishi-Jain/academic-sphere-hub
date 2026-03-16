const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/db"); // your mysql connection

const upload = multer({ dest: "uploads/" });

router.post("/upload-students", upload.single("file"), (req, res) => {

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {

      for (const row of results) {

        const {
          roll_number,
          name,
          department_id,
          year,
          semester,
          section,
          cgpa
        } = row;

        try {

          const studentResult = await db.promise().query(
            `INSERT INTO students 
            (roll_number,name,department_id,year,semester,section,cgpa)
            VALUES (?,?,?,?,?,?,?)`,
            [roll_number,name,department_id,year,semester,section,cgpa]
          );

          const student_id = studentResult[0].insertId;

          await db.promise().query(
            `INSERT INTO users (username,password,role,reference_id)
             VALUES (?,?,?,?)`,
            [roll_number,roll_number,"student",student_id]
          );

        } catch (err) {
          console.log("Error inserting student:", err);
        }

      }

      fs.unlinkSync(req.file.path);

      res.json({ message: "Students uploaded successfully" });

    });

});

module.exports = router;
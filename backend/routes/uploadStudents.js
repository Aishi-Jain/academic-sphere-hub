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

        const cleanRow = {};
        Object.keys(row).forEach(key => {
          cleanRow[key.trim()] = row[key];
        });

        const roll_number = cleanRow.roll_number;
        const name = cleanRow.name;
        const department_id = cleanRow.department_id;
        const year = cleanRow.year;
        const semester = cleanRow.semester;
        const section = cleanRow.section;

        console.log(row);

        try {

          // CHECK IF STUDENT EXISTS
          const existing = await db.promise().query(
            "SELECT * FROM students WHERE roll_number = ?",
            [roll_number]
          );

          if (existing[0].length > 0) {
            console.log("Already exists:", roll_number);
            continue;
          }

          //INSERT STUDENT
          const studentResult = await db.promise().query(
            `INSERT INTO students 
            (roll_number,name,department_id,year,semester,section)
            VALUES (?,?,?,?,?,?)`,
            [roll_number,name,department_id,year,semester,section]
          );

          const student_id = studentResult[0].insertId;

          //INSERT USER
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
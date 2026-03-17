const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/db");

const upload = multer({ dest:"uploads/" });

router.post("/upload-faculty",upload.single("file"),(req,res)=>{

  const results=[];

  fs.createReadStream(req.file.path)
  .pipe(csv())
  .on("data",(data)=>results.push(data))
  .on("end",()=>{

    results.forEach((row)=>{

      const { name,email,department_id } = row;

      db.query(
        "INSERT INTO faculty (name,email,department_id) VALUES (?,?,?)",
        [name,email,department_id],
        (err,result)=>{

          if(err) console.log(err);

          const faculty_id=result.insertId;

          db.query(
            "INSERT INTO users (username,password,role,reference_id) VALUES (?,?,?,?)",
            [email,email,"faculty",faculty_id]
          );

        }
      );

    });

    fs.unlinkSync(req.file.path);

    res.json("Faculty uploaded");

  });

});

module.exports = router;
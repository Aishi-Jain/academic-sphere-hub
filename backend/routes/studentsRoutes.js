const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  const sql = "SELECT * FROM students";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

module.exports = router;

router.post("/", (req, res) => {

  const { name, rollNumber, department, year, semester, section, cgpa } = req.body;

  const sql = `
  INSERT INTO students
  (roll_number, name, department_id, year, semester, section, cgpa)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [rollNumber, name, department, year, semester, section, cgpa],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "Student added successfully",
        id: result.insertId
      });
    }
  );
});

router.delete("/:id", (req, res) => {

  const studentId = req.params.id;

  const sql = "DELETE FROM students WHERE student_id = ?";

  db.query(sql, [studentId], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({ message: "Student deleted successfully" });
  });

});

router.put("/:id", (req, res) => {
  const id = req.params.id;

  const { name, rollNumber, department_id, year, semester, section, cgpa } = req.body;

  const sql = `
    UPDATE students 
    SET roll_number=?, name=?, department_id=?, year=?, semester=?, section=?, cgpa=?
    WHERE student_id=?
  `;

  db.query(
    sql,
    [rollNumber, name, department_id, year, semester, section, cgpa, id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json(err);
      } else {
        res.json({ message: "Student updated successfully" });
      }
    }
  );
});
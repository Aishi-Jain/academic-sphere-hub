const express = require("express");
const router = express.Router();
const db = require("../config/db");


// GET faculty
router.get("/", (req, res) => {

  db.query("SELECT * FROM faculty", (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: err });
    }

    res.json(result);

  });

});

module.exports = router;


// ADD faculty
router.post("/", (req, res) => {

  const { faculty_id, name, email, department_id, designation } = req.body;

  console.log("REQ BODY:", req.body);

  const sql = `
    INSERT INTO faculty (faculty_id, name, email, department_id, designation)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [faculty_id, name, email, department_id, designation], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    // 🔥 CREATE USER (IMPORTANT)
    const userSql = `
      INSERT INTO users (username, password, role, reference_id)
      VALUES (?, ?, 'faculty', ?)
    `;

    db.query(userSql, [name, name, faculty_id], (err2, result2) => {
      if (err2) {
        console.log("❌ USER CREATION ERROR:", err2);
      } else {
        console.log("✅ USER CREATED:", result2);
      }
    });

    res.json("Faculty added + user created");

  });

});


// UPDATE faculty
router.put("/:id", (req, res) => {

  const { name, email, department_id, designation } = req.body;

  console.log("UPDATE HIT:", req.params.id, req.body);

  console.log("UPDATE HIT:", req.params.id, req.body);

  const sql = `
    UPDATE faculty 
    SET name=?, email=?, department_id=?, designation=?
    WHERE faculty_id=?
  `;

  db.query(
    sql,
    [name, email, department_id, designation, req.params.id],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      console.log("Rows affected:", result.affectedRows);

      res.json("Faculty updated");

    }
  );

});


// DELETE faculty
router.delete("/:id",(req,res)=>{

  const id=req.params.id;

  db.query(
    "DELETE FROM faculty WHERE faculty_id=?",
    [id],
    (err,result)=>{

      if(err) return res.json(err);

      res.json("Faculty deleted");

    }
  );

});

module.exports = router;
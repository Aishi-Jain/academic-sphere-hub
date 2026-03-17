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

  const { name, email, department_id } = req.body;

  const sql = `
    INSERT INTO faculty (name, email, department_id)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [name, email, department_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }
    res.json("Faculty added");
  });

});


// UPDATE faculty
router.put("/:id", (req, res) => {

  const { name, email, department_id } = req.body;

  console.log("UPDATE HIT:", req.params.id, req.body);

  const sql = `
    UPDATE faculty 
    SET name = ?, email = ?, department_id = ?
    WHERE faculty_id = ?
  `;

  db.query(
    sql,
    [name, email, department_id, req.params.id],  // ✅ FIX HERE
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
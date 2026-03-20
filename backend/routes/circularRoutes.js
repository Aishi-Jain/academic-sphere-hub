const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 🔥 GET ALL CIRCULARS
router.get("/", (req, res) => {
  db.query("SELECT * FROM circulars ORDER BY date DESC", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// 🔥 ADD CIRCULAR
router.post("/", (req, res) => {
  const { title, description, department_id } = req.body;

  const sql = `
    INSERT INTO circulars (title, description, department_id)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [title, description, department_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json("Circular added");
  });
});

// 🔥 DELETE
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM circulars WHERE circular_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.json(err);
      res.json("Circular deleted");
    }
  );
});

module.exports = router;
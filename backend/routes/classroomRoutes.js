const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ GET all classrooms
router.get("/", (req, res) => {
  db.query("SELECT * FROM classrooms", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

// ✅ ADD classroom
router.post("/", (req, res) => {
  const { room_number, capacity, block } = req.body;

  db.query(
    "INSERT INTO classrooms (room_number, capacity, block) VALUES (?, ?, ?)",
    [room_number, capacity, block],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Insert failed" });
      }
      res.json({ message: "Classroom added" });
    }
  );
});

// ✅ DELETE classroom
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM classrooms WHERE id=?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.json({ message: "Deleted successfully" });
  });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { room_number, capacity, block } = req.body;

  db.query(
    "UPDATE classrooms SET room_number=?, capacity=?, block=? WHERE id=?",
    [room_number, capacity, block, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Update failed" });
      }
      res.json({ message: "Updated successfully" });
    }
  );
});

module.exports = router;
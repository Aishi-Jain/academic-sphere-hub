const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

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
router.post("/", upload.single("file"), (req, res) => {
  const { title, description, department_id } = req.body;
  const file = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO circulars (title, description, department_id, file)
    VALUES (?, ?, ?, ?)
  `;

  console.log(req.body);
  console.log(req.file);

  db.query(sql, [title, description, department_id, file], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json("Circular added with file");
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
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// 📦 Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 🚀 Upload route
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const userId = req.body.userId;
    const role = req.body.role;

    const imagePath = `/uploads/${req.file.filename}`;

    // 🔥 SAVE TO DB (faculty example)
    if (role === "faculty") {
      await db.promise().query(
        "UPDATE faculty SET profile_pic = ? WHERE faculty_id = ?",
        [imagePath, userId]
      );
    }

    if (role === "student") {
      await db.promise().query(
        "UPDATE students SET profile_pic = ? WHERE roll_number = ?",
        [imagePath, userId]
      );
    }

    if (role === "admin") {
      await db.promise().query(
        "UPDATE admin SET profile_pic = ? WHERE admin_id = ?",
        [imagePath, userId]
      );
    }

    res.json({ imageUrl: imagePath });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
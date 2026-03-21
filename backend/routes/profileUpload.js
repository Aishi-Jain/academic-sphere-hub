const express = require("express");
const multer = require("multer");
const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST /api/upload-profile
router.post("/upload-profile", upload.single("image"), (req, res) => {
  res.json({
    imageUrl: `http://localhost:5000/uploads/${req.file.filename}`,
  });
});

module.exports = router;
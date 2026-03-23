const express = require("express");
const router = express.Router();
const { getStudentMarks } = require("../controllers/studentMarksController");

router.get("/", getStudentMarks);

module.exports = router;
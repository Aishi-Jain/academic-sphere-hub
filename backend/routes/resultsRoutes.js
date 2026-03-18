const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
const cheerio = require("cheerio");

// 🔥 SEMESTER CONFIG (R17)
const semestersList = [
  { sem: "1-1", code: "1662" },
  { sem: "1-2", code: "1704" },
  { sem: "2-1", code: "1771" },
  { sem: "2-2", code: "1813" },
  { sem: "3-1", code: "1841" },
  { sem: "3-2", code: "1921" },
  { sem: "4-1", code: "1948" }
];

// 🔥 GRADE → POINT MAP
const gradeMap = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "F": 0,
  "Ab": 0
};

// 🔥 SGPA CALCULATOR (CORRECT)
const calculateSGPA = (subjects) => {
  let totalCredits = 0;
  let weightedSum = 0;

  subjects.forEach(sub => {
    const credits = parseFloat(sub.credits) || 0;
    const grade = sub.grade?.trim();

    const gradePoint = gradeMap[grade] ?? 0;

    totalCredits += credits;
    weightedSum += credits * gradePoint;
  });

  if (totalCredits === 0) return 0;

  return (weightedSum / totalCredits).toFixed(2);
};

// 🔥 FETCH SEM
const fetchSemester = async (roll, examCode) => {
  const url = "http://results.jntuh.ac.in/resultAction";

  const data = new URLSearchParams({
    degree: "btech",
    examCode: examCode,
    etype: "r17",
    result: "null",
    grad: "null",
    type: "intgrade",
    htno: roll
  });

  const response = await axios.post(url, data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return response.data;
};

// 🔥 PARSE HTML
const parseResult = (html) => {
  const $ = cheerio.load(html);

  const student = {};

  // PERSONAL INFO
  $("table")
    .first()
    .find("tr")
    .each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length > 1) {
        student[$(cols[0]).text().trim()] = $(cols[1]).text().trim();
      }
    });

  // SUBJECTS
  const subjects = [];

  $("table")
    .eq(1)
    .find("tr")
    .slice(1)
    .each((i, row) => {
      const cols = $(row).find("td");

      if (cols.length > 0) {
        subjects.push({
          code: $(cols[0]).text().trim(),
          name: $(cols[1]).text().trim(),
          internal: $(cols[2]).text().trim(),
          external: $(cols[3]).text().trim(),
          total: $(cols[4]).text().trim(),
          grade: $(cols[5]).text().trim(),
          credits: $(cols[6]).text().trim()
        });
      }
    });

  return { student, subjects };
};

// 🔥 MAIN ROUTE
router.get("/:roll", async (req, res) => {
  const roll = req.params.roll;

  try {
    let allSemesters = [];
    let studentInfo = {};

    for (let semObj of semestersList) {
      try {
        const html = await fetchSemester(roll, semObj.code);
        const parsed = parseResult(html);

        if (parsed.subjects.length > 0) {
          studentInfo = parsed.student;

          // ✅ CORRECT SGPA
          const sgpa = calculateSGPA(parsed.subjects);

          allSemesters.push({
            semester: semObj.sem,
            sgpa,
            subjects: parsed.subjects
          });
        }
      } catch (err) {
        console.log("Error in semester:", semObj.sem);
      }
    }

    if (allSemesters.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    // 🔥 STORE STUDENT
    db.query(
      "INSERT INTO students_results (roll_number, name, branch, college) VALUES (?, ?, ?, ?)",
      [
        roll,
        studentInfo["Name"] || "Unknown",
        studentInfo["Branch"] || "CSE",
        studentInfo["College Name"] || "Unknown"
      ]
    );

    // 🔥 STORE DATA
    allSemesters.forEach((sem) => {
      db.query(
        "INSERT INTO semesters (roll_number, semester, sgpa) VALUES (?, ?, ?)",
        [roll, sem.semester, sem.sgpa]
      );

      sem.subjects.forEach((sub) => {
        db.query(
          `INSERT INTO subjects_marks 
          (roll_number, semester, subject_code, subject_name, internal_marks, external_marks, total_marks, grade, credits)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            roll,
            sem.semester,
            sub.code,
            sub.name,
            sub.internal,
            sub.external,
            sub.total,
            sub.grade,
            sub.credits
          ]
        );
      });
    });

    return res.json({
      message: "Fetched REAL data",
      student: studentInfo,
      semesters: allSemesters
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
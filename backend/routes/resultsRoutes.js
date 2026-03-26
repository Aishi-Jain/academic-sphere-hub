const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
const cheerio = require("cheerio");

// 🔥 SEMESTERS
const semestersList = [
  { sem: "1-1", code: "1662" },
  { sem: "1-2", code: "1704" },
  { sem: "2-1", code: "1771" },
  { sem: "2-2", code: "1813" },
  { sem: "3-1", code: "1841" },
  { sem: "3-2", code: "1921" },
  { sem: "4-1", code: "1948" }
];

// 🔥 GRADE MAP
const gradeMap = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  F: 0,
  Ab: 0
};

// 🔥 SGPA
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

// 🔥 DEPT FROM ROLL
const getBranchFromRoll = (roll) => {
  const code = roll.substring(6, 8);

  const map = {
    "05": "CSE",
    "66": "CSM",
    "67": "CSD",
    "04": "ECE",
    "12": "IT",
    "72": "AIDS"
  };

  return map[code] || "Unknown";
};

// 🔥 FETCH
const fetchSemester = async (roll, examCode) => {
  const url = "http://results.jntuh.ac.in/resultAction";

  const data = new URLSearchParams({
    degree: "btech",
    examCode,
    etype: "r17",
    result: "null",
    grad: "null",
    type: "intgrade",
    htno: roll
  });

  const res = await axios.post(url, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  return res.data;
};

// 🔥 PARSE
const parseResult = (html) => {
  const $ = cheerio.load(html);

  const subjects = [];

  $("table")
    .eq(1)
    .find("tr")
    .slice(1)
    .each((i, row) => {
      const cols = $(row).find("td");

        // 🔥 CLEAN FUNCTIONS (ADD ABOVE subjects.push)
        const cleanNumber = (val) => {
            if (!val) return 0;
            const v = val.trim();
            return v === "-" ? 0 : parseFloat(v) || 0;
        };

        const cleanGrade = (val) => {
            if (!val) return "F";
            const v = val.trim().toUpperCase();
            if (v === "ABSENT") return "AB";
            return v === "-" ? "F" : v;
        };

            // 🔥 PUSH CLEAN DATA
        subjects.push({
            code: $(cols[0]).text().trim(),
            name: $(cols[1]).text().trim(),
            internal: cleanNumber($(cols[2]).text()),
            external: cleanNumber($(cols[3]).text()),
            total: cleanNumber($(cols[4]).text()),
            grade: cleanGrade($(cols[5]).text()),
            credits: $(cols[6]).text().trim()
        });
    });

  return subjects;
};

// 🔥 MAIN ROUTE
router.get("/:roll", async (req, res) => {
  const roll = req.params.roll;

  try {
    // ✅ STEP 1: GET STUDENT FROM DB
    let student = {};

    await new Promise((resolve) => {
      db.query(
        "SELECT * FROM students WHERE roll_number = ?",
        [roll],
        (err, result) => {
          if (result && result.length > 0) {
            student = {
                name: result[0].name,
                branch: getBranchFromRoll(roll), 
                college: "Malla Reddy College of Engineering"
                };
          } else {
            student = {
              name: "Unknown",
              branch: getBranchFromRoll(roll),
              college: "Malla Reddy College of Engineering"
            };
          }
          resolve();
        }
      );
    });

    // ✅ STEP 2: PARALLEL FETCH
    const results = await Promise.allSettled(
      semestersList.map(async (semObj) => {
        const html = await fetchSemester(roll, semObj.code);
        const subjects = parseResult(html);

        if (subjects.length > 0) {
          // 🔥 CHECK FAIL CONDITION
        const hasFail = subjects.some((sub) => {
        const grade = (sub.grade || "").trim().toUpperCase();
        return grade === "F" || grade === "AB";
        });

        let sgpa;

        if (hasFail) {
            sgpa = 0; // 🔥 store as number
        } else {
            sgpa = calculateSGPA(subjects);
        }

          return {
            semester: semObj.sem,
            sgpa,
            subjects
          };
        }

        return null;
      })
    );

    const allSemesters = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    // 🔥 STORE DATA IN DB (NEW)
    for (const sem of allSemesters) {
    // ✅ Check if already exists (avoid duplicate)
    const [existing] = await db.promise().query(
        "SELECT id FROM results WHERE roll_number = ? AND semester = ?",
        [roll, sem.semester]
    );

    let resultId;

    if (existing.length > 0) {
        resultId = existing[0].id;
    } else {
        const [resultInsert] = await db.promise().query(
        "INSERT INTO results (roll_number, semester, sgpa) VALUES (?, ?, ?)",
        [roll, sem.semester, sem.sgpa]
        );

        resultId = resultInsert.insertId;
    }

    // delete old subjects for this result (avoid duplicates)
    await db.promise().query(
    "DELETE FROM result_subjects WHERE result_id = ?",
    [resultId]
    );

    // 🔥 Insert subjects
    for (const sub of sem.subjects) {
        await db.promise().query(
            `INSERT INTO result_subjects 
            (result_id, subject_code, subject_name, internal, external, total, grade, credits)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
            resultId,
            sub.code,
            sub.name,
            sub.internal,
            sub.external,
            sub.total,
            sub.grade,
            sub.credits
            ]
        );
    }
    }

    if (allSemesters.length === 0) {
        return res.json({
            student,
            semesters: [],
            message: "No results found"
        });
    }

    // ✅ FINAL RESPONSE
    res.json({
      student,
      semesters: allSemesters
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
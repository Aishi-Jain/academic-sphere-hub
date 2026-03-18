const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { studentsData } = require("./uploadSeating");

// 🔹 Dept Code Mapping
const deptMap = {
  "05": "CSE",
  "66": "CSM",
  "67": "CSD",
  "04": "ECE",
  "12": "IT",
  "72": "AIDS"
};

// 🔹 Pairing Order
const DEPT_PAIRS = [
  ["CSE", "CSM"],
  ["CSD", "ECE"],
  ["IT", "AIDS"]
];

// 🔹 Extract Dept from Roll
const getDeptFromRoll = (roll) => {
  if (!roll || roll.length < 8) return "UNKNOWN";
  const code = roll.substring(6, 8);
  return deptMap[code] || "UNKNOWN";
};

// 🔥 MAIN GENERATE API
router.post("/generate", (req, res) => {
  try {

    if (!studentsData || studentsData.length === 0) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { exam_id, room_ids } = req.body;

    // 🔹 STEP 1: GROUP STUDENTS BY DEPT
    const deptGroups = {
      CSE: [], CSM: [], CSD: [], ECE: [], IT: [], AIDS: []
    };

    studentsData.forEach((s) => {
      const dept = getDeptFromRoll(s.roll);
      if (deptGroups[dept]) {
        deptGroups[dept].push(s);
      }
    });

    // 🔹 STEP 2: SORT EACH DEPT
    Object.keys(deptGroups).forEach(dept => {
      deptGroups[dept].sort((a, b) => a.roll.localeCompare(b.roll));
    });

    // 🔹 STEP 3: FETCH ROOMS
    let roomQuery = "SELECT * FROM classrooms";

    if (room_ids && room_ids.length > 0) {
      roomQuery = `SELECT * FROM classrooms WHERE id IN (${room_ids.join(",")})`;
    }

    db.query(roomQuery, (err, rooms) => {
      if (err) return res.status(500).json(err);

      let allocations = [];
      let pairIndex = 0;

      // 🔹 STEP 4: POINTERS
      const pointers = {
        CSE: 0, CSM: 0, CSD: 0, ECE: 0, IT: 0, AIDS: 0
      };

      // 🔥 STEP 5: ROOM LOOP
      rooms.forEach((room) => {

        for (let bench = 1; bench <= 30; bench++) {

          let assigned = false;

          // Try all pairs
          for (let i = 0; i < DEPT_PAIRS.length; i++) {

            const [d1, d2] = DEPT_PAIRS[(pairIndex + i) % DEPT_PAIRS.length];

            if (
              pointers[d1] < deptGroups[d1].length &&
              pointers[d2] < deptGroups[d2].length
            ) {

              const s1 = deptGroups[d1][pointers[d1]++];
              const s2 = deptGroups[d2][pointers[d2]++];

              allocations.push([
                exam_id,
                room.id,
                bench,
                s1.roll,
                s2.roll
              ]);

              pairIndex++;
              assigned = true;
              break;
            }
          }

          if (!assigned) break; // no more students
        }

      });

      // 🔥 STEP 6: INSERT INTO DB
      const insertQuery = `
        INSERT INTO seating_allocation 
        (exam_id, classroom_id, bench_number, student1_id, student2_id)
        VALUES ?
      `;

      db.query(insertQuery, [allocations], (err2) => {
        if (err2) return res.status(500).json(err2);

        res.json({
          message: "Seating generated successfully",
          total_allocations: allocations.length
        });
      });

    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔥 GET SEATING DATA
router.get("/:examId", (req, res) => {

  const examId = req.params.examId;

  const query = `
    SELECT 
      sa.bench_number,
      sa.student1_id,
      sa.student2_id,
      c.room_number
    FROM seating_allocation sa
    JOIN classrooms c ON sa.classroom_id = c.id
    WHERE sa.exam_id = ?
    ORDER BY c.room_number, sa.bench_number
  `;

  db.query(query, [examId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });

});

module.exports = router;
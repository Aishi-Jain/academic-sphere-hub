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

// GENERATE API
router.post("/generate", (req, res) => {
  try {

    if (!studentsData || studentsData.length === 0) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { exam_id, room_ids } = req.body;

    // 🔹 GROUP STUDENTS
    // 🔥 STEP 1: SPLIT REGULAR & LATERAL
    const regularStudents = [];
    const lateralStudents = [];

    studentsData.forEach((s) => {
    if (s.roll.includes("Q95A")) {
        lateralStudents.push(s);
    } else {
        regularStudents.push(s);
    }
    });

    // 🔥 STEP 2: GROUP BY DEPARTMENT
    const deptGroups = {
    CSE: [], CSM: [], CSD: [], ECE: [], IT: [], AIDS: []
    };

    regularStudents.forEach((s) => {
    const dept = getDeptFromRoll(s.roll);
    if (deptGroups[dept]) {
        deptGroups[dept].push(s);
    }
    });

    // 🔹 SORT
    Object.keys(deptGroups).forEach(dept => {
      deptGroups[dept].sort((a, b) => a.roll.localeCompare(b.roll));
    });

    // 🔹 FETCH ROOMS
    let roomQuery = "SELECT * FROM classrooms";

    if (room_ids && room_ids.length > 0) {
      roomQuery = `SELECT * FROM classrooms WHERE id IN (${room_ids.join(",")})`;
    }

    db.query(roomQuery, (err, rooms) => {
      if (err) return res.status(500).json(err);

      let allocations = [];

      // 🔥 ORDER (CHAIN)
      const deptOrder = ["CSE", "CSM", "CSD", "ECE", "IT", "AIDS"];

      // 🔥 helper: build dept groups
      const buildDeptGroups = (list) => {
        const groups = { CSE: [], CSM: [], CSD: [], ECE: [], IT: [], AIDS: [] };
        list.forEach(s => {
            const d = getDeptFromRoll(s.roll);
            if (groups[d]) groups[d].push(s);
        });
        // sort for stability
        Object.keys(groups).forEach(d =>
            groups[d].sort((a, b) => a.roll.localeCompare(b.roll))
        );
        return groups;
        };

        // 🔥 helper: progressive chain pairing (NO SKIPS)
        const progressivePairs = (groups) => {
        const pairs = [];

        // 1) Start with first two: CSE ↔ CSM
        let leftDept = deptOrder[0];   // CSE
        let rightDept = deptOrder[1];  // CSM

        // pair as much as possible
        while (groups[leftDept].length && groups[rightDept].length) {
            pairs.push([groups[leftDept].shift(), groups[rightDept].shift()]);
        }

        // 2) carry leftovers forward through the chain
        // leftover from either side continues pairing with next dept in order
        let carryDept = null;

        if (groups[leftDept].length) carryDept = leftDept;
        else if (groups[rightDept].length) carryDept = rightDept;

        // move through remaining departments
        for (let i = 2; i < deptOrder.length; i++) {
            const nextDept = deptOrder[i];

            if (!carryDept) {
            // if no carry, try pairing adjacent in order
            const prevDept = deptOrder[i - 1];
            while (groups[prevDept].length && groups[nextDept].length) {
                pairs.push([groups[prevDept].shift(), groups[nextDept].shift()]);
            }
            // set carry if any leftover
            if (groups[prevDept].length) carryDept = prevDept;
            else if (groups[nextDept].length) carryDept = nextDept;
            continue;
            }

            // carryDept exists → pair it with nextDept
            while (groups[carryDept].length && groups[nextDept].length) {
            pairs.push([groups[carryDept].shift(), groups[nextDept].shift()]);
            }

            // update carry
            if (groups[carryDept].length) {
            // still leftovers in carryDept, continue with next dept
            continue;
            } else if (groups[nextDept].length) {
            carryDept = nextDept; // next becomes new carry
            } else {
            carryDept = null; // no leftovers
            }
        }

        return pairs;
        };

        // 🔥 SPLIT REGULAR vs LATERAL
        const regularStudents = [];
        const lateralStudents = [];

        studentsData.forEach(s => {
        if (s.roll.includes("Q95A")) lateralStudents.push(s);
        else regularStudents.push(s);
        });

        // 🔥 BUILD GROUPS
        const regularGroups = buildDeptGroups(regularStudents);
        const lateralGroups = buildDeptGroups(lateralStudents);

        // 🔥 GENERATE PAIRS (REGULAR FIRST, THEN LATERAL)
        const regularPairs = progressivePairs(regularGroups);
        const lateralPairs = progressivePairs(lateralGroups);

        const allPairs = [...regularPairs, ...lateralPairs];

        // 🔥 FILL ROOMS
        let pairIndex = 0;

        rooms.forEach(room => {
        for (let bench = 1; bench <= 30; bench++) {
            if (pairIndex >= allPairs.length) break;

            const [s1, s2] = allPairs[pairIndex++];

            // safety: never same dept
            if (getDeptFromRoll(s1.roll) === getDeptFromRoll(s2.roll)) {
            continue; // skip bad pair (should rarely happen)
            }

            allocations.push([
            exam_id,
            room.id,
            bench,
            s1.roll,
            s2.roll
            ]);
        }
        });

      // 🔥 DELETE OLD DATA FIRST
      db.query(
        "DELETE FROM seating_allocation WHERE exam_id = ?",
        [exam_id],
        (delErr) => {

          if (delErr) return res.status(500).json(delErr);

          // 🔥 INSERT NEW DATA (ONLY ONCE)
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

        }
      );

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
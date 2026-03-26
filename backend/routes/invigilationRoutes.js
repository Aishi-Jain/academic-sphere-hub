const express = require("express");
const db = require("../config/db");

const router = express.Router();

const DEPARTMENT_SHORT_NAMES = {
  "Computer Science & Engineering": "CSE",
  "CSE (Artificial Intelligence & Machine Learning)": "CSM",
  "CSE (Data Science)": "CSD",
  "Electronics & Communication Engineering": "ECE",
  "Information Technology": "IT",
  "AI & Data Science": "AIDS",
};

const YEAR_DEPARTMENT_CODES = {
  1: ["CSE", "CSM", "CSD", "ECE"],
  2: ["CSE", "CSM", "CSD", "ECE"],
  3: ["CSE", "CSM", "CSD", "ECE"],
  4: ["CSE", "CSM", "CSD", "ECE", "IT", "AIDS"],
};

const FOURTH_YEAR_WEIGHTS = {
  CSE: 5,
  CSM: 5,
  CSD: 5,
  ECE: 5,
  IT: 2,
  AIDS: 2,
};

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const normalizeSessionType = (value) => (value === "AN" ? "AN" : "FN");

const toMySqlDateTime = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 19).replace("T", " ");
};

const mapDepartmentShortName = (departmentName) =>
  DEPARTMENT_SHORT_NAMES[departmentName] || departmentName;

async function getDepartmentsByYear(year) {
  const allowedCodes = YEAR_DEPARTMENT_CODES[Number(year)] || YEAR_DEPARTMENT_CODES[4];
  const [departments] = await db.promise().query(
    `
      SELECT department_id, department_name
      FROM departments
      ORDER BY department_name
    `
  );

  return departments
    .map((department) => ({
      id: Number(department.department_id),
      name: department.department_name,
      shortName: mapDepartmentShortName(department.department_name),
    }))
    .filter((department) => allowedCodes.includes(department.shortName));
}

async function getFacultyIdentity(facultyId) {
  const [rows] = await db.promise().query(
    `
      SELECT f.faculty_id, f.name, f.designation, f.department_id, d.department_name
      FROM faculty f
      JOIN departments d ON d.department_id = f.department_id
      WHERE f.faculty_id = ?
    `,
    [facultyId]
  );

  return rows[0] || null;
}

async function getOccupiedRoomSnapshot(sourceExamId) {
  if (!sourceExamId) {
    return {
      occupiedRoomCount: 0,
      capacitySlots: 0,
      roomIds: [],
    };
  }

  const [rows] = await db.promise().query(
    `
      SELECT DISTINCT classroom_id
      FROM seating_allocation
      WHERE exam_id = ?
      ORDER BY classroom_id
    `,
    [sourceExamId]
  );

  const roomIds = rows.map((row) => Number(row.classroom_id));

  return {
    occupiedRoomCount: roomIds.length,
    capacitySlots: roomIds.length * 2,
    roomIds,
  };
}

function distributeDepartmentSlots(totalSlots, departments, year) {
  if (departments.length === 0) {
    return [];
  }

  if (Number(year) !== 4) {
    const base = Math.floor(totalSlots / departments.length);
    let remainder = totalSlots % departments.length;

    return departments.map((department) => {
      const allocation = base + (remainder > 0 ? 1 : 0);
      remainder = Math.max(remainder - 1, 0);

      return {
        department_id: department.id,
        department_name: department.name,
        department_short_name: department.shortName,
        allocated_slots: allocation,
      };
    });
  }

  const weightedDepartments = departments.map((department) => ({
    ...department,
    weight: FOURTH_YEAR_WEIGHTS[department.shortName] || 1,
  }));
  const totalWeight = weightedDepartments.reduce((sum, department) => sum + department.weight, 0);
  const allocations = weightedDepartments.map((department) => {
    const exact = totalSlots === 0 ? 0 : (totalSlots * department.weight) / totalWeight;
    return {
      department_id: department.id,
      department_name: department.name,
      department_short_name: department.shortName,
      exact,
      allocated_slots: Math.floor(exact),
      fractional: exact - Math.floor(exact),
    };
  });

  let remainder = totalSlots - allocations.reduce((sum, department) => sum + department.allocated_slots, 0);

  allocations
    .sort((left, right) => {
      if (right.fractional !== left.fractional) {
        return right.fractional - left.fractional;
      }

      return right.exact - left.exact;
    })
    .forEach((department) => {
      if (remainder > 0) {
        department.allocated_slots += 1;
        remainder -= 1;
      }
    });

  return allocations
    .sort((left, right) => left.department_short_name.localeCompare(right.department_short_name))
    .map(({ exact, fractional, ...department }) => department);
}

async function recalculateDepartmentSlots(cycleId) {
  const [[cycle]] = await db.promise().query(
    `
      SELECT id, year
      FROM invigilation_cycles
      WHERE id = ?
    `,
    [cycleId]
  );

  if (!cycle) {
    throw new Error("Invigilation cycle not found");
  }

  const departments = await getDepartmentsByYear(cycle.year);
  const [sessions] = await db.promise().query(
    `
      SELECT capacity_slots
      FROM invigilation_sessions
      WHERE cycle_id = ?
    `,
    [cycleId]
  );

  const totalSlots = sessions.reduce((sum, session) => sum + Number(session.capacity_slots || 0), 0);
  const distribution = distributeDepartmentSlots(totalSlots, departments, cycle.year);

  await db.promise().query("DELETE FROM invigilation_department_slots WHERE cycle_id = ?", [cycleId]);

  if (distribution.length > 0) {
    await db.promise().query(
      `
        INSERT INTO invigilation_department_slots (cycle_id, department_id, allocated_slots)
        VALUES ?
      `,
      [distribution.map((department) => [cycleId, department.department_id, department.allocated_slots])]
    );
  }

  return distribution;
}

async function getCycleDetail(cycleId, facultyContextId) {
  const [[cycle]] = await db.promise().query(
    `
      SELECT id, title, year, semester, booking_deadline, status, created_by, created_at, updated_at
      FROM invigilation_cycles
      WHERE id = ?
    `,
    [cycleId]
  );

  if (!cycle) {
    return null;
  }

  const [sessionsResult, timetableEntriesResult, departmentSlotsResult, hodAllocationsResult, facultyChoicesResult, resultsResult, departmentsResult, examsResult] =
    await Promise.all([
      db.promise().query(
        `
          SELECT s.id, s.cycle_id, s.session_order, s.exam_date, s.session_type, s.source_exam_id,
                 s.occupied_room_count, s.capacity_slots, e.exam_name AS source_exam_name
          FROM invigilation_sessions s
          LEFT JOIN exams e ON e.exam_id = s.source_exam_id
          WHERE s.cycle_id = ?
          ORDER BY s.session_order, s.id
        `,
        [cycleId]
      ),
      db.promise().query(
        `
          SELECT ite.session_id, ite.department_id, ite.subject_id, ite.subject_label_snapshot,
                 d.department_name, sub.subject_name, sub.subject_code
          FROM invigilation_timetable_entries ite
          JOIN departments d ON d.department_id = ite.department_id
          LEFT JOIN subjects sub ON sub.subject_id = ite.subject_id
          WHERE ite.cycle_id = ?
        `,
        [cycleId]
      ),
      db.promise().query(
        `
          SELECT ids.department_id, ids.allocated_slots, d.department_name
          FROM invigilation_department_slots ids
          JOIN departments d ON d.department_id = ids.department_id
          WHERE ids.cycle_id = ?
          ORDER BY d.department_name
        `,
        [cycleId]
      ),
      db.promise().query(
        `
          SELECT iha.faculty_id, iha.department_id, iha.required_slot_count, iha.assigned_by_hod,
                 f.name AS faculty_name, f.designation, d.department_name
          FROM invigilation_hod_allocations iha
          JOIN faculty f ON f.faculty_id = iha.faculty_id
          JOIN departments d ON d.department_id = iha.department_id
          WHERE iha.cycle_id = ?
          ORDER BY d.department_name, f.name
        `,
        [cycleId]
      ),
      db.promise().query(
        `
          SELECT ifc.faculty_id, ifc.session_id, ifc.chosen_at, f.name AS faculty_name,
                 f.department_id, d.department_name
          FROM invigilation_faculty_choices ifc
          JOIN faculty f ON f.faculty_id = ifc.faculty_id
          JOIN departments d ON d.department_id = f.department_id
          WHERE ifc.cycle_id = ?
          ORDER BY ifc.chosen_at, f.name
        `,
        [cycleId]
      ),
      db.promise().query(
        `
          SELECT ira.session_id, ira.room_id, ira.assignment_source, c.room_number,
                 f1.faculty_id AS faculty_1_id, f1.name AS faculty_1_name, d1.department_name AS faculty_1_department,
                 f2.faculty_id AS faculty_2_id, f2.name AS faculty_2_name, d2.department_name AS faculty_2_department
          FROM invigilation_room_assignments ira
          JOIN classrooms c ON c.id = ira.room_id
          JOIN faculty f1 ON f1.faculty_id = ira.faculty_1_id
          JOIN departments d1 ON d1.department_id = f1.department_id
          JOIN faculty f2 ON f2.faculty_id = ira.faculty_2_id
          JOIN departments d2 ON d2.department_id = f2.department_id
          WHERE ira.cycle_id = ?
          ORDER BY ira.session_id, c.room_number
        `,
        [cycleId]
      ),
      db.promise().query(
        `
          SELECT department_id, department_name
          FROM departments
        `
      ),
      db.promise().query(
        `
          SELECT exam_id, exam_name, year, semester
          FROM exams
          ORDER BY year, semester, exam_name
        `
      ),
    ]);

  const sessions = sessionsResult[0];
  const timetableEntries = timetableEntriesResult[0];
  const departmentSlots = departmentSlotsResult[0];
  const hodAllocations = hodAllocationsResult[0];
  const facultyChoices = facultyChoicesResult[0];
  const results = resultsResult[0];
  const departments = departmentsResult[0];
  const exams = examsResult[0];

  const departmentMap = new Map(
    departments.map((department) => [
      Number(department.department_id),
      {
        id: Number(department.department_id),
        name: department.department_name,
        shortName: mapDepartmentShortName(department.department_name),
      },
    ])
  );

  const eligibleDepartments = (YEAR_DEPARTMENT_CODES[Number(cycle.year)] || [])
    .map((code) => Array.from(departmentMap.values()).find((department) => department.shortName === code))
    .filter(Boolean);

  const bookingCountsBySession = facultyChoices.reduce((accumulator, choice) => {
    const key = Number(choice.session_id);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const facultyRequirementByFaculty = hodAllocations.reduce((accumulator, allocation) => {
    accumulator[allocation.faculty_id] = Number(allocation.required_slot_count || 0);
    return accumulator;
  }, {});

  const choiceIdsByFaculty = facultyChoices.reduce((accumulator, choice) => {
    if (!accumulator[choice.faculty_id]) {
      accumulator[choice.faculty_id] = [];
    }
    accumulator[choice.faculty_id].push(Number(choice.session_id));
    return accumulator;
  }, {});

  const timetableByDepartment = eligibleDepartments.map((department) => ({
    department_id: department.id,
    department_name: department.name,
    department_short_name: department.shortName,
    sessions: sessions.map((session) => {
      const entry = timetableEntries.find(
        (candidate) =>
          Number(candidate.department_id) === department.id &&
          Number(candidate.session_id) === Number(session.id)
      );

      return {
        session_id: Number(session.id),
        subject_id: entry?.subject_id ? Number(entry.subject_id) : null,
        subject_label:
          entry?.subject_label_snapshot ||
          (entry?.subject_code ? `${entry.subject_name} (${entry.subject_code})` : ""),
      };
    }),
  }));

  const sessionSummaries = sessions.map((session) => ({
    id: Number(session.id),
    session_order: Number(session.session_order),
    exam_date: session.exam_date,
    session_type: session.session_type,
    source_exam_id: session.source_exam_id ? Number(session.source_exam_id) : null,
    source_exam_name: session.source_exam_name || null,
    occupied_room_count: Number(session.occupied_room_count || 0),
    capacity_slots: Number(session.capacity_slots || 0),
    booked_slots: bookingCountsBySession[Number(session.id)] || 0,
    available_slots: Math.max(
      Number(session.capacity_slots || 0) - (bookingCountsBySession[Number(session.id)] || 0),
      0
    ),
  }));

  const detail = {
    cycle: {
      ...cycle,
      year: Number(cycle.year),
      semester: Number(cycle.semester),
    },
    sessions: sessionSummaries,
    timetable: timetableByDepartment,
    department_slots: departmentSlots.map((slot) => ({
      department_id: Number(slot.department_id),
      department_name: slot.department_name,
      department_short_name: mapDepartmentShortName(slot.department_name),
      allocated_slots: Number(slot.allocated_slots || 0),
      assigned_slots: hodAllocations
        .filter((allocation) => Number(allocation.department_id) === Number(slot.department_id))
        .reduce((sum, allocation) => sum + Number(allocation.required_slot_count || 0), 0),
    })),
    hod_allocations: hodAllocations.map((allocation) => ({
      faculty_id: allocation.faculty_id,
      faculty_name: allocation.faculty_name,
      designation: allocation.designation,
      department_id: Number(allocation.department_id),
      department_name: allocation.department_name,
      required_slot_count: Number(allocation.required_slot_count || 0),
      assigned_by_hod: allocation.assigned_by_hod,
      selected_session_ids: choiceIdsByFaculty[allocation.faculty_id] || [],
    })),
    faculty_choices: facultyChoices.map((choice) => ({
      faculty_id: choice.faculty_id,
      faculty_name: choice.faculty_name,
      department_id: Number(choice.department_id),
      department_name: choice.department_name,
      session_id: Number(choice.session_id),
      chosen_at: choice.chosen_at,
      required_slot_count: facultyRequirementByFaculty[choice.faculty_id] || 0,
    })),
    results: results.map((result) => ({
      session_id: Number(result.session_id),
      room_id: Number(result.room_id),
      room_number: result.room_number,
      assignment_source: result.assignment_source,
      faculty_1: {
        faculty_id: result.faculty_1_id,
        name: result.faculty_1_name,
        department_name: result.faculty_1_department,
      },
      faculty_2: {
        faculty_id: result.faculty_2_id,
        name: result.faculty_2_name,
        department_name: result.faculty_2_department,
      },
    })),
    meta: {
      eligible_departments: eligibleDepartments,
      exams: exams.map((exam) => ({
        exam_id: Number(exam.exam_id),
        exam_name: exam.exam_name,
        year: Number(exam.year || 0),
        semester: Number(exam.semester || 0),
      })),
    },
  };

  if (facultyContextId) {
    detail.faculty_context = {
      faculty_id: facultyContextId,
      required_slot_count: facultyRequirementByFaculty[facultyContextId] || 0,
      selected_session_ids: choiceIdsByFaculty[facultyContextId] || [],
    };
  }

  return detail;
}

router.get("/cycles", async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : null;
    const semester = req.query.semester ? Number(req.query.semester) : null;
    const conditions = [];
    const params = [];

    if (year) {
      conditions.push("year = ?");
      params.push(year);
    }

    if (semester) {
      conditions.push("semester = ?");
      params.push(semester);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [cycles] = await db.promise().query(
      `
        SELECT id, title, year, semester, booking_deadline, status, created_by, created_at, updated_at
        FROM invigilation_cycles
        ${whereClause}
        ORDER BY year DESC, semester DESC, updated_at DESC
      `,
      params
    );

    res.json(
      cycles.map((cycle) => ({
        ...cycle,
        year: Number(cycle.year),
        semester: Number(cycle.semester),
      }))
    );
  } catch (error) {
    console.error("INVIGILATION CYCLES ERROR:", error);
    res.status(500).json({ error: "Failed to fetch invigilation cycles" });
  }
});

router.post("/cycles", async (req, res) => {
  try {
    const { title, year, semester, booking_deadline, created_by } = req.body;

    if (!title || !year || !semester || !booking_deadline) {
      return res.status(400).json({ error: "title, year, semester and booking_deadline are required" });
    }

    const [result] = await db.promise().query(
      `
        INSERT INTO invigilation_cycles (title, year, semester, booking_deadline, created_by)
        VALUES (?, ?, ?, ?, ?)
      `,
      [title, Number(year), Number(semester), toMySqlDateTime(booking_deadline), created_by || null]
    );

    const detail = await getCycleDetail(result.insertId);
    res.status(201).json(detail);
  } catch (error) {
    console.error("CREATE INVIGILATION CYCLE ERROR:", error);
    res.status(500).json({ error: "Failed to create invigilation cycle" });
  }
});

router.get("/cycles/active", async (req, res) => {
  try {
    const year = Number(req.query.year);

    if (!year) {
      return res.status(400).json({ error: "year is required" });
    }

    const [rows] = await db.promise().query(
      `
        SELECT id
        FROM invigilation_cycles
        WHERE year = ? AND status IN ('published', 'closed', 'generated')
        ORDER BY FIELD(status, 'published', 'closed', 'generated'), updated_at DESC
        LIMIT 1
      `,
      [year]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No active invigilation cycle found" });
    }

    const detail = await getCycleDetail(rows[0].id);
    res.json(detail);
  } catch (error) {
    console.error("ACTIVE INVIGILATION CYCLE ERROR:", error);
    res.status(500).json({ error: "Failed to fetch active invigilation cycle" });
  }
});

router.get("/cycles/:id", async (req, res) => {
  try {
    const detail = await getCycleDetail(Number(req.params.id), req.query.facultyId || null);

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    res.json(detail);
  } catch (error) {
    console.error("INVIGILATION DETAIL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch invigilation cycle" });
  }
});

router.put("/cycles/:id", async (req, res) => {
  const connection = db.promise();

  try {
    const cycleId = Number(req.params.id);
    const { title, year, semester, booking_deadline, sessions = [], timetable = [], created_by } = req.body;

    if (!title || !year || !semester || !booking_deadline) {
      return res.status(400).json({ error: "title, year, semester and booking_deadline are required" });
    }

    await connection.beginTransaction();

    const [[existingCycle]] = await connection.query(
      `
        SELECT id, status
        FROM invigilation_cycles
        WHERE id = ?
        FOR UPDATE
      `,
      [cycleId]
    );

    if (!existingCycle) {
      await connection.rollback();
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    if (existingCycle.status !== "draft") {
      await connection.rollback();
      return res.status(400).json({ error: "Only draft invigilation cycles can be edited" });
    }

    await connection.query(
      `
        UPDATE invigilation_cycles
        SET title = ?, year = ?, semester = ?, booking_deadline = ?, created_by = ?
        WHERE id = ?
      `,
      [title, Number(year), Number(semester), toMySqlDateTime(booking_deadline), created_by || null, cycleId]
    );

    await connection.query("DELETE FROM invigilation_timetable_entries WHERE cycle_id = ?", [cycleId]);
    await connection.query("DELETE FROM invigilation_department_slots WHERE cycle_id = ?", [cycleId]);
    await connection.query("DELETE FROM invigilation_sessions WHERE cycle_id = ?", [cycleId]);

    const sessionIdMap = new Map();

    for (const [index, session] of sessions.entries()) {
      const snapshot = await getOccupiedRoomSnapshot(session.source_exam_id ? Number(session.source_exam_id) : null);
      const [sessionResult] = await connection.query(
        `
          INSERT INTO invigilation_sessions
          (cycle_id, session_order, exam_date, session_type, source_exam_id, occupied_room_count, capacity_slots)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          cycleId,
          Number(session.session_order || index + 1),
          session.exam_date,
          normalizeSessionType(session.session_type),
          session.source_exam_id ? Number(session.source_exam_id) : null,
          snapshot.occupiedRoomCount,
          snapshot.capacitySlots,
        ]
      );

      const clientKey = session.client_key || session.id || index;
      sessionIdMap.set(String(clientKey), sessionResult.insertId);
    }

    const timetableRows = [];

    for (const departmentRow of timetable) {
      for (const entry of departmentRow.sessions || []) {
        const sessionId =
          sessionIdMap.get(String(entry.client_session_key || entry.session_id)) ||
          Number(entry.session_id);

        if (!sessionId) {
          continue;
        }

        const subjectId = entry.subject_id ? Number(entry.subject_id) : null;
        let subjectLabelSnapshot = entry.subject_label || "";

        if (subjectId) {
          const [[subject]] = await connection.query(
            `
              SELECT subject_name, subject_code
              FROM subjects
              WHERE subject_id = ?
            `,
            [subjectId]
          );

          if (subject) {
            subjectLabelSnapshot = `${subject.subject_name} (${subject.subject_code})`;
          }
        }

        timetableRows.push([
          cycleId,
          Number(sessionId),
          Number(departmentRow.department_id),
          subjectId,
          subjectLabelSnapshot,
        ]);
      }
    }

    if (timetableRows.length > 0) {
      await connection.query(
        `
          INSERT INTO invigilation_timetable_entries
          (cycle_id, session_id, department_id, subject_id, subject_label_snapshot)
          VALUES ?
        `,
        [timetableRows]
      );
    }

    await connection.commit();

    await recalculateDepartmentSlots(cycleId);

    const detail = await getCycleDetail(cycleId);
    res.json(detail);
  } catch (error) {
    await connection.rollback();
    console.error("UPDATE INVIGILATION CYCLE ERROR:", error);
    res.status(500).json({ error: "Failed to update invigilation cycle" });
  }
});

router.post("/cycles/:id/department-slots/recalculate", async (req, res) => {
  try {
    const distribution = await recalculateDepartmentSlots(Number(req.params.id));
    res.json({ department_slots: distribution });
  } catch (error) {
    console.error("RECALCULATE INVIGILATION SLOTS ERROR:", error);
    res.status(500).json({ error: error.message || "Failed to recalculate department slots" });
  }
});

router.post("/cycles/:id/publish", async (req, res) => {
  try {
    const cycleId = Number(req.params.id);
    const detail = await getCycleDetail(cycleId);

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    if (detail.sessions.length === 0) {
      return res.status(400).json({ error: "Add at least one session before publishing" });
    }

    const hasMissingSnapshot = detail.sessions.some(
      (session) => !session.source_exam_id || session.occupied_room_count <= 0
    );

    if (hasMissingSnapshot) {
      return res.status(400).json({
        error: "Every session must point to a seating-backed exam with occupied rooms before publishing",
      });
    }

    await recalculateDepartmentSlots(cycleId);

    await db.promise().query(
      `
        UPDATE invigilation_cycles
        SET status = 'published'
        WHERE id = ?
      `,
      [cycleId]
    );

    const refreshed = await getCycleDetail(cycleId);
    res.json(refreshed);
  } catch (error) {
    console.error("PUBLISH INVIGILATION CYCLE ERROR:", error);
    res.status(500).json({ error: "Failed to publish invigilation cycle" });
  }
});

router.get("/cycles/:id/results", async (req, res) => {
  try {
    const detail = await getCycleDetail(Number(req.params.id));

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    res.json({ cycle: detail.cycle, sessions: detail.sessions, results: detail.results });
  } catch (error) {
    console.error("INVIGILATION RESULTS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch invigilation results" });
  }
});

router.get("/hod/cycles/:id", async (req, res) => {
  try {
    const facultyId = req.query.facultyId;

    if (!facultyId) {
      return res.status(400).json({ error: "facultyId is required" });
    }

    const identity = await getFacultyIdentity(facultyId);

    if (!identity || identity.designation !== "HOD") {
      return res.status(403).json({ error: "Only HODs can access this view" });
    }

    const detail = await getCycleDetail(Number(req.params.id), facultyId);

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    const departmentId = Number(identity.department_id);
    const [departmentFaculty] = await db.promise().query(
      `
        SELECT faculty_id, name, designation
        FROM faculty
        WHERE department_id = ?
        ORDER BY name
      `,
      [departmentId]
    );
    const allocationMap = new Map(
      detail.hod_allocations.map((allocation) => [allocation.faculty_id, allocation])
    );

    res.json({
      ...detail,
      department_slot: detail.department_slots.find((slot) => slot.department_id === departmentId) || null,
      faculty_list: departmentFaculty.map((faculty) => ({
        faculty_id: faculty.faculty_id,
        faculty_name: faculty.name,
        designation: faculty.designation,
        required_slot_count: allocationMap.get(faculty.faculty_id)?.required_slot_count || 0,
        selected_session_ids: allocationMap.get(faculty.faculty_id)?.selected_session_ids || [],
      })),
      department_faculty_choices: detail.faculty_choices.filter(
        (choice) => Number(choice.department_id) === departmentId
      ),
      hod_identity: identity,
    });
  } catch (error) {
    console.error("HOD INVIGILATION VIEW ERROR:", error);
    res.status(500).json({ error: "Failed to fetch HOD invigilation view" });
  }
});

router.put("/hod/cycles/:id/faculty-slot-allocations", async (req, res) => {
  const connection = db.promise();

  try {
    const cycleId = Number(req.params.id);
    const { facultyId, allocations = [] } = req.body;

    if (!facultyId) {
      return res.status(400).json({ error: "facultyId is required" });
    }

    const identity = await getFacultyIdentity(facultyId);

    if (!identity || identity.designation !== "HOD") {
      return res.status(403).json({ error: "Only HODs can assign department slot counts" });
    }

    const detail = await getCycleDetail(cycleId);

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    const departmentId = Number(identity.department_id);
    const departmentSlot = detail.department_slots.find((slot) => slot.department_id === departmentId);

    if (!departmentSlot) {
      return res.status(400).json({ error: "No department slot quota found for this HOD" });
    }

    const [facultyRows] = await db.promise().query(
      `
        SELECT faculty_id
        FROM faculty
        WHERE department_id = ?
        ORDER BY name
      `,
      [departmentId]
    );

    const validFacultyIds = new Set(facultyRows.map((faculty) => faculty.faculty_id));
    const maxSlotsPerFaculty = detail.sessions.length;
    const normalizedAllocations = allocations.map((allocation) => ({
      faculty_id: allocation.faculty_id,
      required_slot_count: Number(allocation.required_slot_count || 0),
    }));

    const invalidAllocation = normalizedAllocations.find(
      (allocation) =>
        !validFacultyIds.has(allocation.faculty_id) ||
        allocation.required_slot_count < 0 ||
        allocation.required_slot_count > maxSlotsPerFaculty ||
        !Number.isInteger(allocation.required_slot_count)
    );

    if (invalidAllocation) {
      return res.status(400).json({
        error: `Every allocation must target a faculty member in your department and be between 0 and ${maxSlotsPerFaculty}`,
      });
    }

    const totalAssigned = normalizedAllocations.reduce(
      (sum, allocation) => sum + allocation.required_slot_count,
      0
    );

    if (totalAssigned !== Number(departmentSlot.allocated_slots)) {
      return res.status(400).json({
        error: `Department total must equal ${departmentSlot.allocated_slots} slots`,
      });
    }

    await connection.beginTransaction();
    await connection.query(
      `
        DELETE FROM invigilation_hod_allocations
        WHERE cycle_id = ? AND department_id = ?
      `,
      [cycleId, departmentId]
    );

    if (normalizedAllocations.length > 0) {
      await connection.query(
        `
          INSERT INTO invigilation_hod_allocations
          (cycle_id, faculty_id, department_id, required_slot_count, assigned_by_hod)
          VALUES ?
        `,
        [
          normalizedAllocations.map((allocation) => [
            cycleId,
            allocation.faculty_id,
            departmentId,
            allocation.required_slot_count,
            facultyId,
          ]),
        ]
      );
    }

    await connection.commit();

    const refreshed = await getCycleDetail(cycleId);
    res.json(refreshed);
  } catch (error) {
    await connection.rollback();
    console.error("HOD ALLOCATION UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to save HOD allocations" });
  }
});

router.get("/faculty/cycles/:id", async (req, res) => {
  try {
    const facultyId = req.query.facultyId;

    if (!facultyId) {
      return res.status(400).json({ error: "facultyId is required" });
    }

    const identity = await getFacultyIdentity(facultyId);

    if (!identity) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    const detail = await getCycleDetail(Number(req.params.id), facultyId);

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    res.json({
      ...detail,
      identity: {
        faculty_id: identity.faculty_id,
        name: identity.name,
        designation: identity.designation,
        department_id: Number(identity.department_id),
        department_name: identity.department_name,
      },
      faculty_context: detail.faculty_context,
      department_faculty_choices:
        identity.designation === "HOD"
          ? detail.faculty_choices.filter(
              (choice) => Number(choice.department_id) === Number(identity.department_id)
            )
          : [],
    });
  } catch (error) {
    console.error("FACULTY INVIGILATION VIEW ERROR:", error);
    res.status(500).json({ error: "Failed to fetch faculty invigilation view" });
  }
});

router.put("/faculty/cycles/:id/choices", async (req, res) => {
  const connection = db.promise();

  try {
    const cycleId = Number(req.params.id);
    const { facultyId, sessionIds = [] } = req.body;

    if (!facultyId) {
      return res.status(400).json({ error: "facultyId is required" });
    }

    await connection.beginTransaction();

    const [[cycle]] = await connection.query(
      `
        SELECT id, booking_deadline, status
        FROM invigilation_cycles
        WHERE id = ?
        FOR UPDATE
      `,
      [cycleId]
    );

    if (!cycle) {
      await connection.rollback();
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    if (!["published", "closed", "generated"].includes(cycle.status)) {
      await connection.rollback();
      return res.status(400).json({ error: "Faculty booking is not open for this cycle" });
    }

    if (new Date(cycle.booking_deadline).getTime() < Date.now()) {
      await connection.rollback();
      return res.status(400).json({ error: "Faculty booking deadline has already passed" });
    }

    const identity = await getFacultyIdentity(facultyId);

    if (!identity) {
      await connection.rollback();
      return res.status(404).json({ error: "Faculty not found" });
    }

    const [[allocation]] = await connection.query(
      `
        SELECT required_slot_count
        FROM invigilation_hod_allocations
        WHERE cycle_id = ? AND faculty_id = ?
        FOR UPDATE
      `,
      [cycleId, facultyId]
    );

    if (!allocation) {
      await connection.rollback();
      return res.status(400).json({ error: "HOD has not assigned a slot count for this faculty member yet" });
    }

    const normalizedSessionIds = [...new Set(sessionIds.map((sessionId) => Number(sessionId)).filter(Boolean))];
    const requiredSlotCount = Number(allocation.required_slot_count || 0);

    if (normalizedSessionIds.length !== requiredSlotCount) {
      await connection.rollback();
      return res.status(400).json({
        error:
          normalizedSessionIds.length > requiredSlotCount
            ? "You selected more slots than allotted"
            : "You selected fewer slots than allotted",
      });
    }

    const [lockedSessions] = await connection.query(
      `
        SELECT id, capacity_slots
        FROM invigilation_sessions
        WHERE cycle_id = ? AND id IN (?)
        FOR UPDATE
      `,
      [cycleId, normalizedSessionIds.length > 0 ? normalizedSessionIds : [0]]
    );

    if (lockedSessions.length !== normalizedSessionIds.length) {
      await connection.rollback();
      return res.status(400).json({ error: "One or more selected sessions are invalid" });
    }

    const [counts] = await connection.query(
      `
        SELECT session_id, COUNT(*) AS booked_count
        FROM invigilation_faculty_choices
        WHERE cycle_id = ? AND session_id IN (?)
        GROUP BY session_id
      `,
      [cycleId, normalizedSessionIds.length > 0 ? normalizedSessionIds : [0]]
    );

    const countMap = counts.reduce((accumulator, row) => {
      accumulator[Number(row.session_id)] = Number(row.booked_count || 0);
      return accumulator;
    }, {});

    const [existingChoices] = await connection.query(
      `
        SELECT session_id
        FROM invigilation_faculty_choices
        WHERE cycle_id = ? AND faculty_id = ?
      `,
      [cycleId, facultyId]
    );

    const existingChoiceSet = new Set(existingChoices.map((choice) => Number(choice.session_id)));

    const fullSession = lockedSessions.find((session) => {
      const currentCount = countMap[Number(session.id)] || 0;
      const effectiveCount = existingChoiceSet.has(Number(session.id)) ? currentCount : currentCount + 1;
      return effectiveCount > Number(session.capacity_slots || 0);
    });

    if (fullSession) {
      await connection.rollback();
      return res.status(409).json({
        error: "One of the selected sessions just became full. Please refresh and try again.",
        session_id: Number(fullSession.id),
        remaining_slots: Math.max(
          Number(fullSession.capacity_slots || 0) - (countMap[Number(fullSession.id)] || 0),
          0
        ),
      });
    }

    await connection.query(
      `
        DELETE FROM invigilation_faculty_choices
        WHERE cycle_id = ? AND faculty_id = ?
      `,
      [cycleId, facultyId]
    );

    if (normalizedSessionIds.length > 0) {
      await connection.query(
        `
          INSERT INTO invigilation_faculty_choices (cycle_id, faculty_id, session_id)
          VALUES ?
        `,
        [normalizedSessionIds.map((sessionId) => [cycleId, facultyId, sessionId])]
      );
    }

    await connection.commit();

    const refreshed = await getCycleDetail(cycleId, facultyId);
    res.json(refreshed);
  } catch (error) {
    await connection.rollback();
    console.error("FACULTY CHOICES UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to save faculty slot choices" });
  }
});

router.post("/cycles/:id/generate", async (req, res) => {
  const connection = db.promise();

  try {
    const cycleId = Number(req.params.id);
    await connection.beginTransaction();
    const detail = await getCycleDetail(cycleId);

    if (!detail) {
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    const [[cycle]] = await connection.query(
      `
        SELECT id, status
        FROM invigilation_cycles
        WHERE id = ?
        FOR UPDATE
      `,
      [cycleId]
    );

    if (!cycle) {
      await connection.rollback();
      return res.status(404).json({ error: "Invigilation cycle not found" });
    }

    if (!["published", "closed", "generated"].includes(cycle.status)) {
      await connection.rollback();
      return res.status(400).json({ error: "Cycle must be published before generation" });
    }

    if (cycle.status === "published" && new Date(cycle.booking_deadline).getTime() > Date.now()) {
      await connection.rollback();
      return res.status(400).json({ error: "Booking deadline has not passed yet" });
    }

    const mismatchedDepartment = detail.department_slots.find(
      (department) => department.allocated_slots !== department.assigned_slots
    );

    if (mismatchedDepartment) {
      await connection.rollback();
      return res.status(400).json({
        error: `${mismatchedDepartment.department_short_name} HOD allocations do not match the department quota`,
      });
    }

    const facultyRequirements = detail.hod_allocations.reduce((accumulator, allocation) => {
      accumulator[allocation.faculty_id] = {
        faculty_id: allocation.faculty_id,
        faculty_name: allocation.faculty_name,
        department_name: allocation.department_name,
        required: Number(allocation.required_slot_count || 0),
        assigned: 0,
      };
      return accumulator;
    }, {});

    const totalRequired = Object.values(facultyRequirements).reduce(
      (sum, faculty) => sum + faculty.required,
      0
    );
    const totalCapacity = detail.sessions.reduce((sum, session) => sum + Number(session.capacity_slots || 0), 0);

    if (totalRequired !== totalCapacity) {
      await connection.rollback();
      return res.status(400).json({
        error: `Assigned faculty quota (${totalRequired}) does not match required invigilation slots (${totalCapacity})`,
      });
    }

    const choicesBySession = detail.faculty_choices.reduce((accumulator, choice) => {
      const key = Number(choice.session_id);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(choice.faculty_id);
      return accumulator;
    }, {});

    const choicesByFaculty = detail.faculty_choices.reduce((accumulator, choice) => {
      if (!accumulator[choice.faculty_id]) {
        accumulator[choice.faculty_id] = 0;
      }
      accumulator[choice.faculty_id] += 1;
      return accumulator;
    }, {});

    const assignments = [];

    for (const session of detail.sessions) {
      if (!session.source_exam_id) {
        await connection.rollback();
        return res.status(400).json({
          error: `Session ${session.session_order} does not have a seating-backed exam selected`,
        });
      }

      const snapshot = await getOccupiedRoomSnapshot(session.source_exam_id);

      if (snapshot.roomIds.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `No seating snapshot found for session ${session.session_order}`,
        });
      }

      const selectedFacultyIds = (choicesBySession[session.id] || []).filter((facultyId) => {
        const requirement = facultyRequirements[facultyId];
        return requirement && requirement.assigned < requirement.required;
      });

      const sessionFacultyIds = [];
      const alreadyIncluded = new Set();

      for (const facultyId of selectedFacultyIds) {
        if (!alreadyIncluded.has(facultyId)) {
          alreadyIncluded.add(facultyId);
          sessionFacultyIds.push({ faculty_id: facultyId, source: "selected" });
          facultyRequirements[facultyId].assigned += 1;
        }
      }

      if (sessionFacultyIds.length > session.capacity_slots) {
        await connection.rollback();
        return res.status(400).json({
          error: `Session ${session.session_order} has more selected faculty than available capacity`,
        });
      }

      const autoFillCandidates = shuffle(
        Object.values(facultyRequirements).filter(
          (faculty) => faculty.assigned < faculty.required && !alreadyIncluded.has(faculty.faculty_id)
        )
      ).sort((left, right) => {
        const leftHasNoChoices = choicesByFaculty[left.faculty_id] ? 0 : 1;
        const rightHasNoChoices = choicesByFaculty[right.faculty_id] ? 0 : 1;

        if (rightHasNoChoices !== leftHasNoChoices) {
          return rightHasNoChoices - leftHasNoChoices;
        }

        return right.required - right.assigned - (left.required - left.assigned);
      });

      for (const faculty of autoFillCandidates) {
        if (sessionFacultyIds.length >= session.capacity_slots) {
          break;
        }

        alreadyIncluded.add(faculty.faculty_id);
        faculty.assigned += 1;
        sessionFacultyIds.push({ faculty_id: faculty.faculty_id, source: "auto_fill" });
      }

      if (sessionFacultyIds.length !== session.capacity_slots) {
        await connection.rollback();
        return res.status(400).json({
          error: `Unable to fill all invigilation slots for session ${session.session_order}`,
        });
      }

      for (let index = 0; index < snapshot.roomIds.length; index += 1) {
        const first = sessionFacultyIds[index * 2];
        const second = sessionFacultyIds[index * 2 + 1];

        assignments.push([
          cycleId,
          session.id,
          snapshot.roomIds[index],
          first.faculty_id,
          second.faculty_id,
          first.source === "selected" && second.source === "selected" ? "selected" : "auto_fill",
        ]);
      }
    }

    const pendingFaculty = Object.values(facultyRequirements).filter(
      (faculty) => faculty.assigned !== faculty.required
    );

    if (pendingFaculty.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: `Final faculty totals do not match required counts for ${pendingFaculty[0].faculty_name}`,
      });
    }

    await connection.query("DELETE FROM invigilation_room_assignments WHERE cycle_id = ?", [cycleId]);

    if (assignments.length > 0) {
      await connection.query(
        `
          INSERT INTO invigilation_room_assignments
          (cycle_id, session_id, room_id, faculty_1_id, faculty_2_id, assignment_source)
          VALUES ?
        `,
        [assignments]
      );
    }

    await connection.query(
      `
        UPDATE invigilation_cycles
        SET status = 'generated'
        WHERE id = ?
      `,
      [cycleId]
    );

    await connection.commit();

    const refreshed = await getCycleDetail(cycleId);
    res.json(refreshed);
  } catch (error) {
    await connection.rollback();
    console.error("GENERATE INVIGILATION ASSIGNMENTS ERROR:", error);
    res.status(500).json({ error: "Failed to generate invigilation assignments" });
  }
});

module.exports = router;

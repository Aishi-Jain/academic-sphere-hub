const db = require("../config/db");

// ✅ Get students
exports.getStudentsByFilter = (req, res) => {
  const { department_id, section, subject_id } = req.query;

  db.query(
    `SELECT 
        s.student_id,
        s.roll_number AS roll_no,
        s.name,
        m.marks
     FROM students s
     LEFT JOIN marks m 
       ON s.student_id = m.student_id 
       AND m.subject_id = ?
     WHERE s.department_id = ? AND s.section = ?`,
    [subject_id, department_id, section],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching students" });
      }
      res.json(rows);
    }
  );
};

// ✅ Upload marks
exports.uploadMarks = (req, res) => {
  const { subject_id, marksData } = req.body;

  if (!marksData || marksData.length === 0) {
    return res.status(400).json({ error: "No marks data provided" });
  }

  const values = marksData.map((m) => [
    m.student_id,
    subject_id,
    m.marks,
  ]);

  db.query(
    `INSERT INTO marks (student_id, subject_id, marks)
     VALUES ?
     ON DUPLICATE KEY UPDATE marks = VALUES(marks)`,
    [values],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error uploading marks" });
      }
      res.json({ message: "Marks uploaded successfully" });
    }
  );
};
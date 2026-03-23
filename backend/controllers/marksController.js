const db = require("../config/db");

// ✅ Get students
exports.getStudentsByFilter = (req, res) => {
  const { department_id, section } = req.query;

  db.query(
    `SELECT student_id, roll_number AS roll_no, name 
     FROM students 
     WHERE department_id = ? AND section = ?`,
    [department_id, section],
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
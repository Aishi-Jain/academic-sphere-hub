const db = require("../config/db");

exports.getStudentMarks = (req, res) => {
  const { student_id } = req.query;

  db.query(
  `
    SELECT 
        sub.subject_code,
        sub.subject_name,
        sub.semester,
        m.marks
    FROM marks m
    JOIN subjects sub ON m.subject_id = sub.subject_id
    WHERE m.student_id = ?
    `,
    [student_id],
    (err, rows) => {
        if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching marks" });
        }
        res.json(rows);
    }
    );
};
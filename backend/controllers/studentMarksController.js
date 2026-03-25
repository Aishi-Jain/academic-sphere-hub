const db = require("../config/db");

exports.getStudentMarks = (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ error: "student_id is required" });
  }

  db.query(
    `
    SELECT
        sub.subject_id,
        sub.subject_code,
        sub.subject_name,
        sub.semester,
        sub.year,
        sub.regulation,
        m.mid1,
        m.mid2,
        m.ppt,
        m.total
    FROM marks m
    JOIN subjects sub ON m.subject_id = sub.subject_id
    WHERE m.student_id = ?
    ORDER BY sub.year, sub.semester, sub.subject_code
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

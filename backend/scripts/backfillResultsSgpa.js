const db = require("../config/db");
const { calculateSGPA, toStoredSgpaValue } = require("../services/results/resultCalculator");

const main = async () => {
  const [rows] = await db.promise().query(
    `SELECT
       r.id AS result_id,
       r.roll_number,
       r.semester,
       rs.subject_code,
       rs.grade,
       rs.credits
     FROM results r
     LEFT JOIN result_subjects rs ON rs.result_id = r.id
     ORDER BY r.id ASC, rs.subject_code ASC`
  );

  const grouped = new Map();

  rows.forEach((row) => {
    if (!grouped.has(row.result_id)) {
      grouped.set(row.result_id, {
        resultId: row.result_id,
        rollNumber: row.roll_number,
        semester: row.semester,
        subjects: []
      });
    }

    if (row.subject_code) {
      grouped.get(row.result_id).subjects.push({
        code: row.subject_code,
        grade: row.grade,
        credits: row.credits,
        status: String(row.grade || "").toUpperCase() === "F" || String(row.grade || "").toUpperCase() === "AB"
          ? "active_backlog"
          : "pass"
      });
    }
  });

  let updated = 0;

  for (const result of grouped.values()) {
    const sgpa = calculateSGPA(result.subjects);
    const storedSgpa = toStoredSgpaValue(sgpa);

    // eslint-disable-next-line no-await-in-loop
    await db.promise().query("UPDATE results SET sgpa = ? WHERE id = ?", [storedSgpa, result.resultId]);
    updated += 1;
  }

  console.log(`Backfill complete. Updated ${updated} result rows.`);
  db.end();
};

main().catch((error) => {
  console.error(error);
  db.end();
  process.exit(1);
});

const gradeMap = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  F: 0,
  AB: 0
};

const isFailGrade = (grade) => {
  const normalized = String(grade || "").trim().toUpperCase();
  return normalized === "F" || normalized === "AB";
};

const calculateSGPA = (subjects) => {
  let totalCredits = 0;
  let weightedSum = 0;

  subjects.forEach((subject) => {
    const credits = Number.parseFloat(subject.credits) || 0;
    const gradePoint = gradeMap[String(subject.grade || "").trim().toUpperCase()] ?? 0;

    totalCredits += credits;
    weightedSum += credits * gradePoint;
  });

  if (totalCredits === 0) {
    return "0.00";
  }

  return (weightedSum / totalCredits).toFixed(2);
};

const buildSummary = (semesters) => {
  const activeBacklogCount = semesters.reduce(
    (sum, semester) =>
      sum +
      semester.subjects.filter((subject) => subject.status === "active_backlog").length,
    0
  );

  const clearedBacklogCount = semesters.reduce(
    (sum, semester) =>
      sum +
      semester.subjects.filter((subject) => subject.status === "cleared_backlog").length,
    0
  );

  const totalSgpa = semesters.reduce(
    (sum, semester) => sum + (Number.parseFloat(semester.sgpa) || 0),
    0
  );

  const cgpa =
    activeBacklogCount > 0
      ? "Fail"
      : semesters.length > 0
        ? (totalSgpa / semesters.length).toFixed(2)
        : "0.00";

  return {
    cgpa,
    activeBacklogCount,
    clearedBacklogCount,
    semesterCount: semesters.length
  };
};

module.exports = {
  gradeMap,
  isFailGrade,
  calculateSGPA,
  buildSummary
};

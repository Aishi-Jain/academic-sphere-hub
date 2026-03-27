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

const hasActiveFailSubject = (subjects) =>
  Array.isArray(subjects) &&
  subjects.some((subject) => {
    const normalizedStatus = String(subject?.status || "").trim().toLowerCase();
    if (normalizedStatus === "active_backlog") {
      return true;
    }

    return isFailGrade(subject?.grade);
  });

const calculateSGPA = (subjects) => {
  if (hasActiveFailSubject(subjects)) {
    return "Fail";
  }

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

const toStoredSgpaValue = (sgpa) => {
  if (String(sgpa || "").trim().toUpperCase() === "FAIL") {
    return 0;
  }

  return Number.parseFloat(sgpa) || 0;
};

const buildSummary = (semesters) => {
  const countedSemesters = semesters.filter((semester) => !semester.skipped);

  const activeBacklogCount = countedSemesters.reduce(
    (sum, semester) =>
      sum +
      semester.subjects.filter((subject) => subject.status === "active_backlog").length,
    0
  );

  const clearedBacklogCount = countedSemesters.reduce(
    (sum, semester) =>
      sum +
      semester.subjects.filter((subject) => subject.status === "cleared_backlog").length,
    0
  );

  const totalSgpa = countedSemesters.reduce(
    (sum, semester) => sum + (Number.parseFloat(semester.sgpa) || 0),
    0
  );

  const cgpa =
    activeBacklogCount > 0
      ? "Fail"
      : countedSemesters.length > 0
        ? (totalSgpa / countedSemesters.length).toFixed(2)
        : "0.00";

  return {
    cgpa,
    activeBacklogCount,
    clearedBacklogCount,
    semesterCount: countedSemesters.length
  };
};

module.exports = {
  gradeMap,
  isFailGrade,
  hasActiveFailSubject,
  calculateSGPA,
  toStoredSgpaValue,
  buildSummary
};

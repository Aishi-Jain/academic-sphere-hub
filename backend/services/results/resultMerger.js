const { calculateSGPA, isFailGrade, gradeMap } = require("./resultCalculator");

const compareAttempts = (current, incoming) => {
  const currentFail = isFailGrade(current.grade);
  const incomingFail = isFailGrade(incoming.grade);

  if (currentFail !== incomingFail) {
    return incomingFail ? current : incoming;
  }

  const currentPoints = gradeMap[current.grade] ?? 0;
  const incomingPoints = gradeMap[incoming.grade] ?? 0;

  if (!currentFail && !incomingFail && incomingPoints !== currentPoints) {
    return incomingPoints > currentPoints ? incoming : current;
  }

  if (incoming.sortRank !== current.sortRank) {
    return incoming.sortRank > current.sortRank ? incoming : current;
  }

  return incoming.attemptTypeRank >= current.attemptTypeRank ? incoming : current;
};

const mergeSemesterAttempts = ({ regulation, semester, examCodes, attempts }) => {
  const mergedByCode = new Map();

  attempts.forEach((attempt) => {
    attempt.subjects.forEach((subject) => {
      const existing = mergedByCode.get(subject.code);

      if (!existing) {
        mergedByCode.set(subject.code, {
          ...subject,
          attempts: [subject]
        });
        return;
      }

      const winner = compareAttempts(existing, subject);
      const attemptsHistory = [...existing.attempts, subject].sort((left, right) => {
        if (left.sortRank !== right.sortRank) {
          return left.sortRank - right.sortRank;
        }
        return left.attemptTypeRank - right.attemptTypeRank;
      });

      mergedByCode.set(subject.code, {
        ...winner,
        attempts: attemptsHistory
      });
    });
  });

  const subjects = Array.from(mergedByCode.values())
    .map((subject) => {
      const hadHistoricalFail = subject.attempts.some((attempt) => isFailGrade(attempt.grade));
      const activeBacklog = isFailGrade(subject.grade);
      const status = activeBacklog
        ? "active_backlog"
        : hadHistoricalFail
          ? "cleared_backlog"
          : "pass";

      const clearedFromAttempt = subject.attempts.find(
        (attempt) => isFailGrade(attempt.grade) && !activeBacklog
      );

      return {
        code: subject.code,
        name: subject.name,
        internal: subject.internal,
        external: subject.external,
        total: subject.total,
        grade: subject.grade,
        credits: subject.credits,
        status,
        clearedFromGrade: status === "cleared_backlog" ? clearedFromAttempt?.grade || null : null,
        latestExamCode: subject.examCode,
        latestAttemptLabel: subject.attemptLabel
      };
    })
    .sort((left, right) => left.code.localeCompare(right.code));

  const sgpa = calculateSGPA(subjects);

  return {
    semester,
    regulation,
    examCodesTried: examCodes,
    attemptsFetched: attempts.length,
    sgpa,
    hasActiveBacklog: subjects.some((subject) => subject.status === "active_backlog"),
    subjects
  };
};

module.exports = {
  mergeSemesterAttempts
};

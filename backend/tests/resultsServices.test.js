const test = require("node:test");
const assert = require("node:assert/strict");
const { extractExamCode, resolveSemester, getExamCodeCatalog } = require("../services/results/examCodeCatalog");
const { mergeSemesterAttempts } = require("../services/results/resultMerger");
const { calculateSGPA, buildSummary } = require("../services/results/resultCalculator");
const { normalizeGrade, cleanNumber } = require("../services/results/resultFetcher");

test("extractExamCode reads numeric exam code from href", () => {
  assert.equal(
    extractExamCode("./result?examCode=1662&etype=r17"),
    "1662"
  );
});

test("resolveSemester matches all supported year-semester labels", () => {
  assert.equal(resolveSemester(" B.TECH I YEAR I REGULAR RESULTS "), "1-1");
  assert.equal(resolveSemester(" B.TECH II YEAR II SUPPLEMENTARY RESULTS "), "2-2");
  assert.equal(resolveSemester(" B.TECH IV YEAR II RESULTS "), "4-2");
});

test("exam code catalog exposes R25 buckets", async () => {
  const catalog = await getExamCodeCatalog({ forceRefresh: false });
  assert.ok(catalog.btech.R25);
  assert.deepEqual(Object.keys(catalog.btech.R25), [
    "1-1",
    "1-2",
    "2-1",
    "2-2",
    "3-1",
    "3-2",
    "4-1",
    "4-2"
  ]);
});

test("normalizeGrade and cleanNumber normalize raw scraped values", () => {
  assert.equal(normalizeGrade("absent"), "AB");
  assert.equal(normalizeGrade("-"), "F");
  assert.equal(cleanNumber("-"), 0);
  assert.equal(cleanNumber("32"), 32);
});

test("mergeSemesterAttempts prefers passing attempt and marks cleared backlog", () => {
  const semester = mergeSemesterAttempts({
    regulation: "R18",
    semester: "2-1",
    examCodes: ["1667", "1671"],
    attempts: [
      {
        examCode: "1667",
        attemptType: "regular",
        attemptTypeRank: 0,
        attemptLabel: "Regular",
        sortRank: 0,
        subjects: [
          {
            code: "CS401",
            name: "Compiler Design",
            internal: 20,
            external: 10,
            total: 30,
            grade: "F",
            credits: "3",
            examCode: "1667",
            attemptLabel: "Regular",
            sortRank: 0,
            attemptTypeRank: 0
          }
        ]
      },
      {
        examCode: "1671",
        attemptType: "supplementary",
        attemptTypeRank: 1,
        attemptLabel: "Supplementary",
        sortRank: 1,
        subjects: [
          {
            code: "CS401",
            name: "Compiler Design",
            internal: 20,
            external: 38,
            total: 58,
            grade: "B",
            credits: "3",
            examCode: "1671",
            attemptLabel: "Supplementary",
            sortRank: 1,
            attemptTypeRank: 1
          }
        ]
      }
    ]
  });

  assert.equal(semester.subjects.length, 1);
  assert.equal(semester.subjects[0].grade, "B");
  assert.equal(semester.subjects[0].status, "cleared_backlog");
  assert.equal(semester.hasActiveBacklog, false);
});

test("mergeSemesterAttempts prefers later passing attempt when both attempts pass", () => {
  const semester = mergeSemesterAttempts({
    regulation: "R18",
    semester: "3-1",
    examCodes: ["1686", "1690"],
    attempts: [
      {
        examCode: "1686",
        attemptType: "regular",
        attemptTypeRank: 0,
        attemptLabel: "Regular",
        sortRank: 0,
        subjects: [
          {
            code: "CS501",
            name: "ML",
            internal: 20,
            external: 50,
            total: 70,
            grade: "B",
            credits: "4",
            examCode: "1686",
            attemptLabel: "Regular",
            sortRank: 0,
            attemptTypeRank: 0
          }
        ]
      },
      {
        examCode: "1690",
        attemptType: "regular",
        attemptTypeRank: 0,
        attemptLabel: "Regular",
        sortRank: 1,
        subjects: [
          {
            code: "CS501",
            name: "ML",
            internal: 20,
            external: 55,
            total: 75,
            grade: "A",
            credits: "4",
            examCode: "1690",
            attemptLabel: "Regular",
            sortRank: 1,
            attemptTypeRank: 0
          }
        ]
      }
    ]
  });

  assert.equal(semester.subjects[0].grade, "A");
  assert.equal(semester.subjects[0].latestExamCode, "1690");
});

test("calculateSGPA and buildSummary keep CGPA valid until active backlogs remain", () => {
  const sgpa = calculateSGPA([
    { credits: "3", grade: "A" },
    { credits: "4", grade: "B+" }
  ]);

  assert.equal(sgpa, "7.43");

  const summary = buildSummary([
    {
      sgpa: "8.10",
      subjects: [{ status: "pass" }, { status: "cleared_backlog" }]
    },
    {
      sgpa: "7.90",
      subjects: [{ status: "pass" }]
    }
  ]);

  assert.equal(summary.cgpa, "8.00");
  assert.equal(summary.activeBacklogCount, 0);
  assert.equal(summary.clearedBacklogCount, 1);

  const failSummary = buildSummary([
    {
      sgpa: "7.90",
      subjects: [{ status: "active_backlog" }]
    }
  ]);

  assert.equal(failSummary.cgpa, "Fail");
});

test("buildSummary ignores lateral-entry skipped semesters", () => {
  const summary = buildSummary([
    {
      skipped: true,
      sgpa: "N/A",
      subjects: []
    },
    {
      skipped: false,
      sgpa: "8.20",
      subjects: [{ status: "pass" }]
    }
  ]);

  assert.equal(summary.cgpa, "8.20");
  assert.equal(summary.semesterCount, 1);
});

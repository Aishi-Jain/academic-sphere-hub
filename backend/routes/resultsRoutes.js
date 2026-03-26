const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
const cheerio = require("cheerio");

const JNTUH_HOME_URL = "http://results.jntuh.ac.in/jsp/home.jsp";
const JNTUH_RESULT_URL = "http://results.jntuh.ac.in/resultAction";
const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];
const CACHE_TTL_MS = 1000 * 60 * 30;

const fallbackCatalog = {
  R18: {
    "1-1": ["1662"],
    "1-2": ["1704"],
    "2-1": ["1771"],
    "2-2": ["1813"],
    "3-1": ["1841"],
    "3-2": ["1921"],
    "4-1": ["1948"],
    "4-2": []
  },
  R22: {
    "1-1": [],
    "1-2": [],
    "2-1": [],
    "2-2": [],
    "3-1": [],
    "3-2": [],
    "4-1": [],
    "4-2": []
  }
};

let examCatalogCache = { ts: 0, data: null };

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

const isPassGrade = (grade) => {
  const normalized = String(grade || "").trim().toUpperCase();
  return normalized !== "F" && normalized !== "AB";
};

const normalizeGrade = (rawGrade) => {
  const grade = String(rawGrade || "").trim().toUpperCase();
  if (!grade || grade === "-") return "F";
  if (grade === "ABSENT") return "AB";
  return grade;
};

const cleanNumber = (val) => {
  const parsed = String(val || "").trim();
  if (!parsed || parsed === "-") return 0;
  return Number(parsed) || 0;
};

const calculateSGPA = (subjects = []) => {
  let totalCredits = 0;
  let weightedSum = 0;

  subjects.forEach((sub) => {
    const credits = Number(sub.credits) || 0;
    totalCredits += credits;
    weightedSum += credits * (gradeMap[normalizeGrade(sub.grade)] ?? 0);
  });

  if (!totalCredits) return 0;
  return Number((weightedSum / totalCredits).toFixed(2));
};

const getBranchFromRoll = (roll) => {
  const code = String(roll || "").substring(6, 8);
  const map = {
    "05": "CSE",
    "66": "CSM",
    "67": "CSD",
    "04": "ECE",
    "12": "IT",
    "72": "AIDS"
  };

  return map[code] || "Unknown";
};

const inferRegulationFromRoll = (roll) => {
  const year = Number(String(roll || "").substring(0, 2));
  if (!Number.isFinite(year)) return "R18";
  return year >= 22 ? "R22" : "R18";
};

const parseSemesterFromLabel = (label) => {
  const normalized = String(label || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/IV YEAR II/.test(normalized)) return "4-2";
  if (/IV YEAR I/.test(normalized)) return "4-1";
  if (/III YEAR II/.test(normalized)) return "3-2";
  if (/III YEAR I/.test(normalized)) return "3-1";
  if (/II YEAR II/.test(normalized)) return "2-2";
  if (/II YEAR I/.test(normalized)) return "2-1";
  if (/I YEAR II/.test(normalized)) return "1-2";
  if (/I YEAR I/.test(normalized)) return "1-1";
  return null;
};

const parseRegulationFromLabel = (label) => {
  const normalized = String(label || "").toUpperCase();
  if (normalized.includes("R22")) return "R22";
  if (normalized.includes("R18")) return "R18";
  return null;
};

const discoverExamCodeCatalog = async () => {
  if (examCatalogCache.data && Date.now() - examCatalogCache.ts < CACHE_TTL_MS) {
    return examCatalogCache.data;
  }

  const catalog = {
    R18: Object.fromEntries(SEMESTERS.map((sem) => [sem, []])),
    R22: Object.fromEntries(SEMESTERS.map((sem) => [sem, []]))
  };

  try {
    const home = await axios.get(JNTUH_HOME_URL);
    const $ = cheerio.load(home.data);

    $("a").each((_, el) => {
      const href = ($(el).attr("href") || "").trim();
      const label = $(el).text().trim();
      if (!label || !/B\.?\s*TECH/i.test(label)) return;

      const regulation = parseRegulationFromLabel(label);
      const semester = parseSemesterFromLabel(label);
      const match = href.match(/examCode=(\d+)/i);
      const examCode = match?.[1];

      if (!regulation || !semester || !examCode) return;
      if (!catalog[regulation][semester].includes(examCode)) {
        catalog[regulation][semester].push(examCode);
      }
    });

    const hasAny = Object.values(catalog)
      .flatMap((regMap) => Object.values(regMap))
      .some((list) => list.length > 0);

    if (hasAny) {
      examCatalogCache = { ts: Date.now(), data: catalog };
      return catalog;
    }
  } catch (error) {
    console.error("Exam code discovery failed, using fallback catalog", error.message);
  }

  examCatalogCache = { ts: Date.now(), data: fallbackCatalog };
  return fallbackCatalog;
};

const fetchExamAttempt = async (roll, examCode) => {
  const data = new URLSearchParams({
    degree: "btech",
    examCode,
    etype: "r17",
    result: "null",
    grad: "null",
    type: "intgrade",
    htno: roll
  });

  const res = await axios.post(JNTUH_RESULT_URL, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  const $ = cheerio.load(res.data);
  const subjects = [];

  $("table")
    .eq(1)
    .find("tr")
    .slice(1)
    .each((_, row) => {
      const cols = $(row).find("td");
      const subjectCode = $(cols[0]).text().trim();
      if (!subjectCode) return;

      subjects.push({
        subjectCode,
        subjectName: $(cols[1]).text().trim(),
        internal: cleanNumber($(cols[2]).text()),
        external: cleanNumber($(cols[3]).text()),
        total: cleanNumber($(cols[4]).text()),
        grade: normalizeGrade($(cols[5]).text()),
        credits: cleanNumber($(cols[6]).text())
      });
    });

  return subjects;
};

const chooseBestAttempt = (current, candidate) => {
  const currentPass = isPassGrade(current.grade);
  const candidatePass = isPassGrade(candidate.grade);

  if (currentPass && !candidatePass) return current;
  if (!currentPass && candidatePass) return candidate;

  if (candidate.sortRank >= current.sortRank) {
    return candidate;
  }
  return current;
};

const mergeSemesterAttempts = (attempts = []) => {
  const grouped = new Map();

  attempts.forEach((attempt) => {
    attempt.subjects.forEach((subject) => {
      const key = String(subject.subjectCode || "").toUpperCase();
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ ...subject, examCode: attempt.examCode, sortRank: attempt.sortRank });
    });
  });

  const merged = [];

  grouped.forEach((history) => {
    const sorted = [...history].sort((a, b) => a.sortRank - b.sortRank);
    const selected = sorted.reduce((best, current) => (best ? chooseBestAttempt(best, current) : current), null);

    const hasAnyFail = sorted.some((item) => !isPassGrade(item.grade));
    const selectedPass = isPassGrade(selected.grade);

    let status = "pass";
    let clearedFromGrade = null;

    if (!selectedPass) {
      status = "active_backlog";
    } else if (hasAnyFail) {
      status = "cleared_backlog";
      const failedAttempt = [...sorted].reverse().find((item) => !isPassGrade(item.grade));
      clearedFromGrade = failedAttempt?.grade || "F";
    }

    merged.push({
      code: selected.subjectCode,
      name: selected.subjectName,
      internal: selected.internal,
      external: selected.external,
      total: selected.total,
      grade: selected.grade,
      credits: selected.credits,
      status,
      clearedFromGrade,
      latestExamCode: selected.examCode
    });
  });

  return merged.sort((a, b) => a.code.localeCompare(b.code));
};

router.get("/:roll", async (req, res) => {
  const roll = String(req.params.roll || "").toUpperCase();

  try {
    const [studentRows] = await db.promise().query(
      "SELECT name, regulation FROM students WHERE roll_number = ? LIMIT 1",
      [roll]
    );

    const dbStudent = studentRows[0];
    const regulation = (dbStudent?.regulation || "").toUpperCase() || inferRegulationFromRoll(roll);
    const student = {
      name: dbStudent?.name || "Unknown",
      branch: getBranchFromRoll(roll),
      college: "Malla Reddy College of Engineering",
      regulation
    };

    const catalog = await discoverExamCodeCatalog();
    const regulationCatalog = catalog[regulation] || fallbackCatalog[regulation] || fallbackCatalog.R18;

    const warnings = [];

    const semesterResults = await Promise.allSettled(
      SEMESTERS.map(async (semester) => {
        const examCodes = regulationCatalog[semester] || [];
        if (!examCodes.length) {
          warnings.push(`No exam codes discovered for ${regulation} ${semester}`);
          return null;
        }

        const attemptResults = await Promise.allSettled(
          examCodes.map(async (examCode, index) => {
            const subjects = await fetchExamAttempt(roll, examCode);
            return {
              examCode,
              sortRank: index,
              subjects
            };
          })
        );

        const fulfilledAttempts = attemptResults
          .filter((item) => item.status === "fulfilled" && item.value.subjects.length > 0)
          .map((item) => item.value);

        attemptResults
          .filter((item) => item.status === "rejected")
          .forEach((item) => warnings.push(`${semester} fetch error: ${item.reason?.message || "unknown error"}`));

        if (!fulfilledAttempts.length) {
          return null;
        }

        const mergedSubjects = mergeSemesterAttempts(fulfilledAttempts);
        const sgpa = calculateSGPA(mergedSubjects);
        const hasActiveBacklog = mergedSubjects.some((sub) => sub.status === "active_backlog");

        return {
          semester,
          regulation,
          examCodesTried: examCodes,
          attemptsFetched: fulfilledAttempts.length,
          sgpa,
          hasActiveBacklog,
          subjects: mergedSubjects
        };
      })
    );

    const semesters = semesterResults
      .filter((item) => item.status === "fulfilled" && item.value)
      .map((item) => item.value);

    semesterResults
      .filter((item) => item.status === "rejected")
      .forEach((item) => warnings.push(item.reason?.message || "Semester fetch failed"));

    for (const sem of semesters) {
      const [existing] = await db
        .promise()
        .query("SELECT id FROM results WHERE roll_number = ? AND semester = ?", [roll, sem.semester]);

      let resultId;

      if (existing.length > 0) {
        resultId = existing[0].id;
        await db
          .promise()
          .query("UPDATE results SET sgpa = ? WHERE id = ?", [sem.sgpa, resultId]);
      } else {
        const [insertRes] = await db
          .promise()
          .query("INSERT INTO results (roll_number, semester, sgpa) VALUES (?, ?, ?)", [
            roll,
            sem.semester,
            sem.sgpa
          ]);
        resultId = insertRes.insertId;
      }

      await db.promise().query("DELETE FROM result_subjects WHERE result_id = ?", [resultId]);

      for (const sub of sem.subjects) {
        await db.promise().query(
          `INSERT INTO result_subjects
            (result_id, subject_code, subject_name, internal, external, total, grade, credits)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            resultId,
            sub.code,
            sub.name,
            sub.internal,
            sub.external,
            sub.total,
            sub.grade,
            sub.credits
          ]
        );
      }
    }

    const allSubjects = semesters.flatMap((sem) => sem.subjects);
    const activeBacklogCount = allSubjects.filter((s) => s.status === "active_backlog").length;
    const clearedBacklogCount = allSubjects.filter((s) => s.status === "cleared_backlog").length;
    const cgpaNumber =
      semesters.length > 0
        ? semesters.reduce((sum, sem) => sum + (Number(sem.sgpa) || 0), 0) / semesters.length
        : 0;

    const summary = {
      cgpa: activeBacklogCount > 0 ? "Fail" : Number(cgpaNumber.toFixed(2)),
      activeBacklogCount,
      clearedBacklogCount,
      semesterCount: semesters.length
    };

    if (!semesters.length) {
      return res.json({
        student,
        semesters: [],
        summary,
        warnings,
        message: "No results found"
      });
    }

    return res.json({
      student,
      semesters,
      summary,
      warnings
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

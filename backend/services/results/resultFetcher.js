const axios = require("axios");
const cheerio = require("cheerio");

const RESULTS_URL = "http://results.jntuh.ac.in/resultAction";

const attemptTemplates = [
  {
    attemptType: "regular",
    attemptTypeRank: 0,
    payload: {
      degree: "btech",
      etype: "r17",
      result: "null",
      grad: "null",
      type: "intgrade"
    }
  },
  {
    attemptType: "supplementary",
    attemptTypeRank: 1,
    payload: {
      degree: "btech",
      etype: "r17",
      result: "gradercrv",
      grad: "null",
      type: "rcrvintgrade"
    }
  }
];

const cleanNumber = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "-") {
    return 0;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeGrade = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized || normalized === "-") {
    return "F";
  }
  if (normalized === "ABSENT") {
    return "AB";
  }
  return normalized;
};

const parseAttemptLabel = ($) => {
  const heading = $("h6").first().text().trim();
  if (heading) {
    return heading;
  }

  return $("title").first().text().trim() || "JNTUH Result";
};

const parseSubjects = (html, metadata) => {
  const $ = cheerio.load(html);
  const tables = $("table");

  if (tables.length < 2 || html.includes("Enter HallTicket Number")) {
    return null;
  }

  const rows = tables.eq(1).find("tr");
  if (rows.length <= 1) {
    return null;
  }

  const subjects = [];

  rows.slice(1).each((index, row) => {
    const cols = $(row).find("td");
    if (cols.length < 7) {
      return;
    }

    const code = $(cols[0]).text().trim();
    if (!code) {
      return;
    }

    subjects.push({
      code,
      name: $(cols[1]).text().trim(),
      internal: cleanNumber($(cols[2]).text()),
      external: cleanNumber($(cols[3]).text()),
      total: cleanNumber($(cols[4]).text()),
      grade: normalizeGrade($(cols[5]).text()),
      credits: $(cols[6]).text().trim(),
      examCode: metadata.examCode,
      attemptLabel: metadata.attemptLabel,
      sortRank: metadata.sortRank,
      attemptType: metadata.attemptType,
      attemptTypeRank: metadata.attemptTypeRank
    });
  });

  if (subjects.length === 0) {
    return null;
  }

  return subjects;
};

const fetchAttempt = async ({ roll, examCode, sortRank, attemptType, attemptTypeRank, payload }) => {
  const body = new URLSearchParams({
    ...payload,
    examCode,
    htno: roll
  });

  const response = await axios.post(RESULTS_URL, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 12000
  });

  const attemptLabel = parseAttemptLabel(cheerio.load(response.data));
  const subjects = parseSubjects(response.data, {
    examCode,
    attemptLabel,
    sortRank,
    attemptType,
    attemptTypeRank
  });

  if (!subjects) {
    return null;
  }

  return {
    examCode,
    attemptType,
    attemptTypeRank,
    attemptLabel,
    sortRank,
    subjects
  };
};

const fetchSemesterAttempts = async ({ roll, semester, examCodes }) => {
  const tasks = [];

  examCodes.forEach((examCode, examCodeIndex) => {
    attemptTemplates.forEach((template) => {
      tasks.push(
        fetchAttempt({
          roll,
          examCode,
          sortRank: examCodeIndex,
          attemptType: template.attemptType,
          attemptTypeRank: template.attemptTypeRank,
          payload: template.payload
        })
      );
    });
  });

  const settled = await Promise.allSettled(tasks);

  const attempts = settled
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);

  const warnings = settled
    .filter((result) => result.status === "rejected")
    .map((result) => `${semester}: ${result.reason?.message || "Upstream fetch failed"}`);

  return {
    attempts,
    warnings
  };
};

module.exports = {
  fetchSemesterAttempts,
  normalizeGrade,
  cleanNumber
};

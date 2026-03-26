const axios = require("axios");
const cheerio = require("cheerio");
const { FALLBACK_EXAM_CODES } = require("./fallbackExamCodes");

const HOME_URL = "http://results.jntuh.ac.in/jsp/home.jsp";
const CACHE_TTL_MS = 15 * 60 * 1000;
const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

let cachedCatalog = null;
let cachedAt = 0;

const cloneCatalog = (catalog) => JSON.parse(JSON.stringify(catalog));

const buildEmptyCatalog = () => ({
  btech: {
    R18: Object.fromEntries(SEMESTERS.map((semester) => [semester, []])),
    R22: Object.fromEntries(SEMESTERS.map((semester) => [semester, []])),
    R25: Object.fromEntries(SEMESTERS.map((semester) => [semester, []]))
  }
});

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim().toUpperCase();

const extractExamCode = (href) => {
  const match = String(href || "").match(/examCode=([0-9]+)/i);
  return match?.[1] || null;
};

const resolveSemester = (text) => {
  if (text.includes(" I YEAR I ")) return "1-1";
  if (text.includes(" I YEAR II ")) return "1-2";
  if (text.includes(" II YEAR I ")) return "2-1";
  if (text.includes(" II YEAR II ")) return "2-2";
  if (text.includes(" III YEAR I ")) return "3-1";
  if (text.includes(" III YEAR II ")) return "3-2";
  if (text.includes(" IV YEAR I ")) return "4-1";
  if (text.includes(" IV YEAR II ")) return "4-2";
  return null;
};

const isBtechRow = (text) => {
  if (text.includes("B.PHARM")) return false;
  if (text.includes("M.TECH")) return false;
  if (text.includes("MCA")) return false;
  if (text.includes("MBA")) return false;
  return text.includes("B.TECH") || text.includes("B TECH") || text.includes("BTECH");
};

const parseCatalog = (html) => {
  const $ = cheerio.load(html);
  const catalog = buildEmptyCatalog();

  $("a[href*='examCode']").each((index, element) => {
    const href = $(element).attr("href");
    const rowText = normalizeText($(element).closest("tr").text());
    const examCode = extractExamCode(href);
    const semester = resolveSemester(` ${rowText} `);

    if (!examCode || !semester || !isBtechRow(rowText)) {
      return;
    }

    ["R18", "R22", "R25"].forEach((regulation) => {
      if (!rowText.includes(regulation)) {
        return;
      }

      if (!catalog.btech[regulation][semester].includes(examCode)) {
        catalog.btech[regulation][semester].push(examCode);
      }
    });
  });

  return catalog;
};

const mergeFallbackCodes = (catalog) => {
  const merged = cloneCatalog(catalog);

  Object.entries(FALLBACK_EXAM_CODES.btech).forEach(([regulation, semesters]) => {
    Object.entries(semesters).forEach(([semester, codes]) => {
      const target = merged.btech[regulation]?.[semester] || [];
      codes.forEach((code) => {
        if (!target.includes(code)) {
          target.push(code);
        }
      });
      merged.btech[regulation][semester] = target;
    });
  });

  return merged;
};

const getExamCodeCatalog = async ({ forceRefresh = false } = {}) => {
  const now = Date.now();
  if (!forceRefresh && cachedCatalog && now - cachedAt < CACHE_TTL_MS) {
    return cloneCatalog(cachedCatalog);
  }

  try {
    const response = await axios.get(HOME_URL, { timeout: 12000 });
    const parsed = parseCatalog(response.data);
    cachedCatalog = mergeFallbackCodes(parsed);
    cachedAt = now;
    return cloneCatalog(cachedCatalog);
  } catch (error) {
    if (!cachedCatalog) {
      cachedCatalog = mergeFallbackCodes(buildEmptyCatalog());
      cachedAt = now;
    }

    return cloneCatalog(cachedCatalog);
  }
};

module.exports = {
  CACHE_TTL_MS,
  HOME_URL,
  SEMESTERS,
  extractExamCode,
  resolveSemester,
  getExamCodeCatalog
};

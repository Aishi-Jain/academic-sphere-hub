import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import type { MergedSubjectResult, ResultResponse, SemesterResult } from "@/lib/types";

const loadingPhases = [
  "Discovering exam codes",
  "Fetching 1-1",
  "Fetching 1-2",
  "Fetching 2-1",
  "Fetching 2-2",
  "Fetching 3-1",
  "Fetching 3-2",
  "Fetching 4-1",
  "Fetching 4-2",
];

const isActiveBacklogGrade = (grade: string | undefined) => {
  const normalized = String(grade || "").trim().toUpperCase();
  return normalized === "F" || normalized === "AB" || normalized === "ABSENT";
};

const normalizeResponse = (payload: any): ResultResponse => {
  const semesters = Array.isArray(payload?.semesters) ? payload.semesters : [];
  const normalizedSemesters: SemesterResult[] = semesters.map((semester: any) => {
    const subjects = Array.isArray(semester?.subjects) ? semester.subjects : [];
    const normalizedSubjects: MergedSubjectResult[] = subjects.map((subject: any) => {
      const status =
        subject?.status ||
        (isActiveBacklogGrade(subject?.grade)
          ? "active_backlog"
          : "pass");

      return {
        code: subject?.code || "",
        name: subject?.name || "",
        internal: Number(subject?.internal ?? 0),
        external: Number(subject?.external ?? 0),
        total: Number(subject?.total ?? 0),
        grade: String(subject?.grade || ""),
        credits: String(subject?.credits ?? ""),
        status,
        clearedFromGrade: subject?.clearedFromGrade ?? null,
        latestExamCode: String(subject?.latestExamCode || ""),
        latestAttemptLabel: subject?.latestAttemptLabel,
      };
    });

    const hasActiveBacklog =
      typeof semester?.hasActiveBacklog === "boolean"
        ? semester.hasActiveBacklog
        : normalizedSubjects.some((subject) => subject.status === "active_backlog");

    return {
      semester: String(semester?.semester || ""),
      regulation: String(semester?.regulation || payload?.student?.regulation || ""),
      examCodesTried: Array.isArray(semester?.examCodesTried) ? semester.examCodesTried : [],
      attemptsFetched: Number(semester?.attemptsFetched ?? 0),
      sgpa: String(semester?.sgpa ?? "0.00"),
      hasActiveBacklog,
      subjects: normalizedSubjects,
    };
  });

  const fallbackActiveBacklogCount = normalizedSemesters.reduce(
    (sum, semester) =>
      sum + semester.subjects.filter((subject) => subject.status === "active_backlog").length,
    0
  );

  const fallbackClearedBacklogCount = normalizedSemesters.reduce(
    (sum, semester) =>
      sum + semester.subjects.filter((subject) => subject.status === "cleared_backlog").length,
    0
  );

  const fallbackCgpa =
    payload?.summary?.cgpa ??
    (fallbackActiveBacklogCount > 0
      ? "Fail"
      : normalizedSemesters.length > 0
        ? (
            normalizedSemesters.reduce(
              (sum, semester) => sum + (Number.parseFloat(semester.sgpa) || 0),
              0
            ) / normalizedSemesters.length
          ).toFixed(2)
        : "0.00");

  return {
    student: {
      name: payload?.student?.name || "Unknown",
      branch: payload?.student?.branch || "Unknown",
      college: payload?.student?.college || "Malla Reddy College of Engineering",
      regulation: payload?.student?.regulation || "Unknown",
    },
    semesters: normalizedSemesters,
    summary: {
      cgpa: String(fallbackCgpa),
      activeBacklogCount:
        Number(payload?.summary?.activeBacklogCount ?? fallbackActiveBacklogCount),
      clearedBacklogCount:
        Number(payload?.summary?.clearedBacklogCount ?? fallbackClearedBacklogCount),
      semesterCount:
        Number(payload?.summary?.semesterCount ?? normalizedSemesters.length),
    },
    fetchProgress: payload?.fetchProgress,
    warnings: Array.isArray(payload?.warnings) ? payload.warnings : [],
    message: payload?.message,
  };
};

const ResultsPage = () => {
  const [roll, setRoll] = useState("");
  const [data, setData] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingPhaseIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingPhaseIndex((current) =>
        current < loadingPhases.length - 1 ? current + 1 : current
      );
    }, 800);

    return () => window.clearInterval(interval);
  }, [loading]);

  const fetchResults = async () => {
    if (!roll) {
      alert("Please enter roll number");
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const response = await axios.get<ResultResponse>(
        `http://localhost:5000/api/results/${roll.trim().toUpperCase()}`
      );
      setData(normalizeResponse(response.data));
    } catch (error) {
      alert("Error fetching results");
    } finally {
      setLoading(false);
    }
  };

  const warningList = data?.warnings ?? [];

  const summaryCards = useMemo(() => {
    if (!data?.summary) {
      return null;
    }

    return [
      {
        label: "CGPA",
        value: data.summary.cgpa,
        tone:
          data.summary.cgpa === "Fail"
            ? "bg-red-900/30 border-red-500/20 text-red-400"
            : "bg-blue-900/30 border-blue-500/20 text-blue-400",
      },
      {
        label: "Active Backlogs",
        value: String(data.summary.activeBacklogCount),
        tone: "bg-red-900/30 border-red-500/20 text-red-400",
      },
      {
        label: "Cleared Backlogs",
        value: String(data.summary.clearedBacklogCount),
        tone: "bg-emerald-900/30 border-emerald-500/20 text-emerald-400",
      },
      {
        label: "Semesters Fetched",
        value: String(data.summary.semesterCount),
        tone: "bg-green-900/30 border-green-500/20 text-green-400",
      },
    ];
  }, [data]);

  const gradeColor = (subject: MergedSubjectResult) => {
    if (subject.status === "cleared_backlog") {
      return "bg-emerald-500/20 text-emerald-300";
    }

    switch (subject.grade) {
      case "O":
        return "bg-green-500/20 text-green-400";
      case "A+":
        return "bg-blue-500/20 text-blue-400";
      case "A":
        return "bg-cyan-500/20 text-cyan-400";
      case "B+":
        return "bg-purple-500/20 text-purple-400";
      case "B":
        return "bg-yellow-500/20 text-yellow-400";
      case "F":
      case "AB":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const statusBadge = (subject: MergedSubjectResult) => {
    if (subject.status === "cleared_backlog") {
      return (
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          Cleared
        </span>
      );
    }

    if (subject.status === "active_backlog") {
      return (
        <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">
          Active Backlog
        </span>
      );
    }

    return (
      <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-300">
        Passed
      </span>
    );
  };

  const renderSemester = (semester: SemesterResult) => (
    <div
      key={semester.semester}
      className="mb-8 rounded-xl border border-gray-700 bg-gray-900/50 p-6 shadow-lg backdrop-blur"
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-blue-400">
            Semester {semester.semester}
          </h3>
          <p className="text-sm text-gray-400">
            {semester.regulation} • {semester.attemptsFetched} attempt
            {semester.attemptsFetched === 1 ? "" : "s"} merged
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
          <span>
            SGPA:{" "}
            {semester.hasActiveBacklog ? (
              <span className="font-semibold text-red-400">Fail</span>
            ) : (
              <span className="font-semibold text-blue-300">{semester.sgpa}</span>
            )}
          </span>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
            Codes: {semester.examCodesTried.join(", ")}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="py-2 text-left">Code</th>
              <th className="text-left">Subject</th>
              <th>Status</th>
              <th>Int</th>
              <th>Ext</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Credits</th>
            </tr>
          </thead>
          <tbody>
            {semester.subjects.map((subject) => (
              <tr
                key={`${semester.semester}-${subject.code}`}
                className="border-b border-gray-800 transition hover:bg-gray-800/40"
              >
                <td className="py-2">{subject.code}</td>
                <td>
                  <div className="font-medium text-white">{subject.name}</div>
                  {subject.status === "cleared_backlog" && subject.clearedFromGrade ? (
                    <div className="text-xs text-emerald-300">
                      Cleared from {subject.clearedFromGrade} via exam code {subject.latestExamCode}
                    </div>
                  ) : null}
                </td>
                <td className="text-center">{statusBadge(subject)}</td>
                <td className="text-center">{subject.internal}</td>
                <td className="text-center">{subject.external}</td>
                <td className="text-center font-semibold">{subject.total}</td>
                <td className="text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${gradeColor(subject)}`}
                  >
                    {subject.grade}
                  </span>
                </td>
                <td className="text-center">{subject.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-black px-4 pt-24 text-white">
      {!data && (
        <div className="w-full max-w-3xl text-center">
          <h1 className="mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 text-5xl font-extrabold text-blue-400">
            RESULTS
          </h1>

          <p className="mb-10 text-lg text-gray-400">
            Discover your academic performance across semesters.
            Enter your roll number to view merged results, cleared backlogs, SGPA, and CGPA.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <input
                value={roll}
                onChange={(event) => setRoll(event.target.value)}
                placeholder="Enter Roll Number (e.g., 22Q91A6665)"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-96"
              />

              <button
                onClick={fetchResults}
                className="transform rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 shadow-lg transition hover:scale-105"
              >
                {loading ? "Fetching..." : "Get Results"}
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Fast, real-time, backlog-aware results powered by Academic Sphere
            </p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-5 text-left">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Pulling Results
                  </p>
                  <p className="text-xs text-slate-400">
                    Step {loadingPhaseIndex + 1} / {loadingPhases.length}
                  </p>
                </div>

                <p className="text-lg font-semibold text-white">
                  {loadingPhases[loadingPhaseIndex]}
                </p>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {loadingPhases.map((phase, index) => {
                    const state =
                      index < loadingPhaseIndex
                        ? "done"
                        : index === loadingPhaseIndex
                          ? "active"
                          : "pending";

                    return (
                      <div
                        key={phase}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          state === "done"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : state === "active"
                              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                              : "border-slate-700 bg-slate-900/70 text-slate-400"
                        }`}
                      >
                        {phase}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {data ? (
        <div className="mt-10 w-full max-w-6xl">
          <div className="mb-8 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-6 shadow-lg">
            <h1 className="mb-2 text-3xl font-bold text-blue-400">ACADEMIC RESULTS</h1>
            <p className="mb-4 text-gray-400">Semester-wise merged performance overview</p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div>
                <p className="text-sm text-gray-400">Student Name</p>
                <p className="font-semibold">{data.student.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Roll Number</p>
                <p className="font-semibold">{roll.trim().toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Branch</p>
                <p className="font-semibold">{data.student.branch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">College</p>
                <p className="font-semibold">{data.student.college}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Regulation</p>
                <p className="font-semibold">{data.student.regulation}</p>
              </div>
            </div>
          </div>

          {summaryCards ? (
            <div className="mb-10 grid gap-6 md:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-xl border p-6 shadow-lg ${card.tone}`}
                >
                  <p className="text-gray-300">{card.label}</p>
                  <h2 className="text-3xl font-bold">{card.value}</h2>
                </div>
              ))}
            </div>
          ) : null}

          {warningList.length > 0 ? (
            <div className="mb-8 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-amber-300">
                Fetch Warnings
              </h2>
              <ul className="space-y-1 text-sm text-amber-100">
                {warningList.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.semesters.length === 0 ? (
            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-6 text-gray-300">
              {data.message || "No results found."}
            </div>
          ) : (
            data.semesters.map(renderSemester)
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ResultsPage;

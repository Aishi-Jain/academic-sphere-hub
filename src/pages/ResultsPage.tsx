import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        (isActiveBacklogGrade(subject?.grade) ? "active_backlog" : "pass");

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
      activeBacklogCount: Number(payload?.summary?.activeBacklogCount ?? fallbackActiveBacklogCount),
      clearedBacklogCount: Number(
        payload?.summary?.clearedBacklogCount ?? fallbackClearedBacklogCount
      ),
      semesterCount: Number(payload?.summary?.semesterCount ?? normalizedSemesters.length),
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
    if (!data?.summary) return null;

    return [
      {
        label: "CGPA",
        value: data.summary.cgpa,
        tone:
          data.summary.cgpa === "Fail"
            ? "text-rose-300 ring-rose-400/20"
            : "text-[hsl(var(--accent-cyan))] ring-[hsl(var(--accent-cyan))/0.15]",
      },
      {
        label: "Active Backlogs",
        value: String(data.summary.activeBacklogCount),
        tone: "text-rose-300 ring-rose-400/20",
      },
      {
        label: "Cleared Backlogs",
        value: String(data.summary.clearedBacklogCount),
        tone: "text-emerald-300 ring-emerald-400/20",
      },
      {
        label: "Semesters Fetched",
        value: String(data.summary.semesterCount),
        tone: "text-violet-300 ring-violet-400/20",
      },
    ];
  }, [data]);

  const gradeColor = (subject: MergedSubjectResult) => {
    if (subject.status === "cleared_backlog") return "bg-emerald-500/15 text-emerald-200";

    switch (subject.grade) {
      case "O":
        return "bg-emerald-500/15 text-emerald-200";
      case "A+":
        return "bg-cyan-500/15 text-cyan-200";
      case "A":
        return "bg-sky-500/15 text-sky-200";
      case "B+":
        return "bg-violet-500/15 text-violet-200";
      case "B":
        return "bg-amber-500/15 text-amber-200";
      case "F":
      case "AB":
        return "bg-rose-500/15 text-rose-200";
      default:
        return "bg-white/10 text-foreground";
    }
  };

  const statusBadge = (subject: MergedSubjectResult) => {
    if (subject.status === "cleared_backlog") {
      return (
        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Cleared
        </span>
      );
    }

    if (subject.status === "active_backlog") {
      return (
        <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
          Active Backlog
        </span>
      );
    }

    return (
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
        Passed
      </span>
    );
  };

  const renderSemester = (semester: SemesterResult) => (
    <section key={semester.semester} className="data-card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-kicker">Semester Overview</p>
          <h3 className="section-header mt-1">Semester {semester.semester}</h3>
          <p className="text-sm text-muted-foreground">
            {semester.regulation} • {semester.attemptsFetched} attempt
            {semester.attemptsFetched === 1 ? "" : "s"} merged
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-muted-foreground">
            SGPA{" "}
            <span className={semester.hasActiveBacklog ? "text-rose-300" : "text-cyan-200"}>
              {semester.hasActiveBacklog ? "Fail" : semester.sgpa}
            </span>
          </div>
          <div className="rounded-full border border-[hsl(var(--accent-cyan))/0.16] bg-[hsl(var(--accent-cyan))/0.08] px-4 py-2 text-cyan-100">
            Codes: {semester.examCodesTried.join(", ")}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Int</th>
              <th className="px-4 py-3 text-center">Ext</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">Grade</th>
              <th className="px-4 py-3 text-center">Credits</th>
            </tr>
          </thead>
          <tbody>
            {semester.subjects.map((subject) => (
              <tr
                key={`${semester.semester}-${subject.code}`}
                className="border-t border-border/60 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 font-mono text-xs">{subject.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{subject.name}</div>
                  {subject.status === "cleared_backlog" && subject.clearedFromGrade ? (
                    <div className="text-xs text-emerald-200/90">
                      Cleared from {subject.clearedFromGrade} via exam code {subject.latestExamCode}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-center">{statusBadge(subject)}</td>
                <td className="px-4 py-3 text-center">{subject.internal}</td>
                <td className="px-4 py-3 text-center">{subject.external}</td>
                <td className="px-4 py-3 text-center font-semibold">{subject.total}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${gradeColor(subject)}`}>
                    {subject.grade}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{subject.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      <section className="hero-surface overflow-hidden">
        <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[hsl(var(--accent-cyan))/0.16] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[hsl(var(--accent-violet))/0.16] blur-3xl" />
        <div className="relative space-y-4">
          <div className="space-y-4">
            <p className="section-kicker">Result Intelligence</p>
            <h1 className="page-header max-w-4xl">
              Track semester performance, merged backlog history, and live result retrieval in one place.
            </h1>
            <p className="page-description max-w-3xl">
              Enter a roll number to generate a polished semester-by-semester academic report with SGPA, CGPA, cleared backlog tracking, and exam-code-aware merging.
            </p>
          </div>
        </div>
      </section>

      <section className="data-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Search Panel</p>
            <h2 className="section-header mt-1">Find Results By Roll Number</h2>
            <p className="text-sm text-muted-foreground">
              Fast, backlog-aware, and student friendly.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-[560px]">
            <Input
              value={roll}
              onChange={(event) => setRoll(event.target.value)}
              placeholder="Enter Roll Number (e.g., 22Q91A6665)"
              onKeyDown={(event) => {
                if (event.key === "Enter") void fetchResults();
              }}
            />
            <Button onClick={fetchResults} disabled={loading} className="gap-2 lg:self-end lg:px-8">
              <Search className="h-4 w-4" />
              {loading ? "Fetching..." : "Get Results"}
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Real-time result retrieval with merged backlog context and semester summaries.
        </p>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-[hsl(var(--accent-cyan))/0.16] bg-[hsl(var(--bg-surface))]/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Pulling Results
              </p>
              <p className="text-xs text-muted-foreground">
                Step {loadingPhaseIndex + 1} / {loadingPhases.length}
              </p>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {loadingPhases[loadingPhaseIndex]}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : state === "active"
                          ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground"
                    }`}
                  >
                    {phase}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {data ? (
        <div className="space-y-6">
          <section className="data-card">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Student Snapshot</p>
                <h2 className="section-header mt-1">Academic Results</h2>
                <p className="text-sm text-muted-foreground">
                  Semester-wise merged performance overview
                </p>
              </div>
              <Button variant="outline" onClick={() => window.print()}>
                Print Report
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Student Name", data.student.name],
                ["Roll Number", roll.trim().toUpperCase()],
                ["Branch", data.student.branch],
                ["College", data.student.college],
                ["Regulation", data.student.regulation],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <p className="mt-2 font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {summaryCards ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className={`metric-tile ring-1 ${card.tone}`}
                >
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <h2 className="mt-3 text-3xl font-semibold">{card.value}</h2>
                </div>
              ))}
            </div>
          ) : null}

          {warningList.length > 0 ? (
            <div className="data-card border-amber-400/20 bg-amber-500/10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-200">
                Fetch Warnings
              </h2>
              <ul className="mt-3 space-y-1 text-sm text-amber-50/90">
                {warningList.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.semesters.length === 0 ? (
            <div className="data-card text-muted-foreground">
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

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import type { AnalyticsSyncStatus } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

type Mode = "current" | "overall";
type View = "overall" | "department";

interface DepartmentAggregate {
  department_id: number;
  total: number;
  passed: number;
  pass_percentage: string;
}

interface OverviewResponse {
  totalStudents: number;
  passPercentage: string;
  failPercentage: string;
  averageValue: string;
  averageLabel: string;
  departments: DepartmentAggregate[];
  sync?: AnalyticsSyncStatus;
}

interface TopStudent {
  roll_number: string;
  name: string;
  department_id: number;
  score: number | string;
}

interface SubjectBreakdown {
  subject_name: string;
  passed: number;
  pass_percentage: string;
}

interface SectionSummary {
  total: number;
  passed: number;
  passPercentage: string;
  topStudents: TopStudent[];
}

interface DepartmentResponse {
  summary: {
    total: number;
    passed: number;
    passPercentage: string;
  };
  classes: Record<string, SectionSummary>;
  topStudents: TopStudent[];
  subjects: SubjectBreakdown[];
}

const BASE_URL = "http://localhost:5000";

const DEPARTMENT_MAP: Record<number, string> = {
  7: "CSE",
  8: "CSM",
  9: "CSD",
  10: "ECE",
  11: "IT",
  12: "AIDS",
};

const DEPARTMENTS = Object.entries(DEPARTMENT_MAP).map(([id, name]) => ({
  id: Number(id),
  name,
}));

const YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
];

const chartColors = ["#6366F1", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444", "#A855F7"];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#d1d5db",
      },
    },
    tooltip: {
      backgroundColor: "#111827",
      titleColor: "#f9fafb",
      bodyColor: "#d1d5db",
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#9ca3af" },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(255,255,255,0.06)" },
      ticks: { color: "#9ca3af" },
      title: {
        display: true,
        text: "Pass Percentage",
        color: "#d1d5db",
      },
    },
  },
};

const LoadingCard = () => (
  <div className="stat-card animate-pulse">
    <div className="h-4 w-24 rounded bg-white/10" />
    <div className="mt-4 h-8 w-20 rounded bg-white/10" />
  </div>
);

const LoadingChart = () => <div className="h-[340px] animate-pulse rounded-2xl bg-white/[0.04]" />;

const formatScore = (score: number | string) => Number(score || 0).toFixed(2);

const buildUrl = (path: string, year: number, mode: Mode) =>
  `${BASE_URL}${path}?year=${year}&mode=${mode}`;

const buildSyncUrl = (path: string, year: number) => `${BASE_URL}${path}?year=${year}`;

const formatSyncTimestamp = (value: string | null) => {
  if (!value) return "Not synced yet";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not synced yet";
  }

  return parsed.toLocaleString();
};

const AnalyticsPage = () => {
  const [selectedYear, setSelectedYear] = useState(4);
  const [mode, setMode] = useState<Mode>("current");
  const [view, setView] = useState<View>("overall");
  const [selectedDept, setSelectedDept] = useState(7);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [departmentDetails, setDepartmentDetails] = useState<DepartmentResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingDepartment, setLoadingDepartment] = useState(false);
  const [syncStatus, setSyncStatus] = useState<AnalyticsSyncStatus | null>(null);
  const [syncRefreshing, setSyncRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const [overviewRes, topStudentsRes] = await Promise.all([
          axios.get<OverviewResponse>(buildUrl("/api/analytics/overview", selectedYear, mode)),
          axios.get<TopStudent[]>(buildUrl("/api/analytics/top-students", selectedYear, mode)),
        ]);

        if (!active) return;

        setOverview(overviewRes.data);
        setTopStudents(topStudentsRes.data);
        setSyncStatus(overviewRes.data.sync ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoadingOverview(false);
        }
      }
    };

    fetchOverview();

    return () => {
      active = false;
    };
  }, [selectedYear, mode]);

  useEffect(() => {
    if (view !== "department") return;

    let active = true;

    const fetchDepartment = async () => {
      setLoadingDepartment(true);
      try {
        const response = await axios.get<DepartmentResponse>(
          buildUrl(`/api/analytics/department/${selectedDept}`, selectedYear, mode)
        );

        if (!active) return;
        setDepartmentDetails(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoadingDepartment(false);
        }
      }
    };

    fetchDepartment();

    return () => {
      active = false;
    };
  }, [view, selectedDept, selectedYear, mode]);

  useEffect(() => {
    if (!syncStatus || syncStatus.status !== "running") {
      return undefined;
    }

    let cancelled = false;

    const pollSyncStatus = async () => {
      try {
        const response = await axios.get<AnalyticsSyncStatus>(
          buildSyncUrl("/api/analytics/sync-status", selectedYear)
        );

        if (cancelled) return;

        setSyncStatus(response.data);

        if (response.data.status !== "running") {
          setSyncRefreshing(true);

          const [overviewRes, topStudentsRes] = await Promise.all([
            axios.get<OverviewResponse>(buildUrl("/api/analytics/overview", selectedYear, mode)),
            axios.get<TopStudent[]>(buildUrl("/api/analytics/top-students", selectedYear, mode)),
          ]);

          if (cancelled) return;

          setOverview(overviewRes.data);
          setTopStudents(topStudentsRes.data);
          setSyncStatus(overviewRes.data.sync ?? response.data);

          if (view === "department") {
            const departmentRes = await axios.get<DepartmentResponse>(
              buildUrl(`/api/analytics/department/${selectedDept}`, selectedYear, mode)
            );

            if (!cancelled) {
              setDepartmentDetails(departmentRes.data);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setSyncRefreshing(false);
        }
      }
    };

    const intervalId = window.setInterval(pollSyncStatus, 3000);
    void pollSyncStatus();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [mode, selectedDept, selectedYear, syncStatus, view]);

  const triggerSync = async () => {
    try {
      const response = await axios.post<AnalyticsSyncStatus>(
        buildSyncUrl("/api/analytics/sync", selectedYear)
      );
      setSyncStatus(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const departmentChart = useMemo(() => {
    return {
      labels: overview?.departments.map((department) => DEPARTMENT_MAP[department.department_id]) ?? [],
      datasets: [
        {
          label: "Pass %",
          data: overview?.departments.map((department) => Number(department.pass_percentage)) ?? [],
          backgroundColor: chartColors,
          borderRadius: 10,
          maxBarThickness: 56,
        },
      ],
    };
  }, [overview]);

  const passFailChart = useMemo(() => {
    return {
      labels: ["Pass", "Fail"],
      datasets: [
        {
          data: [Number(overview?.passPercentage || 0), Number(overview?.failPercentage || 0)],
          backgroundColor: ["#22C55E", "#EF4444"],
          borderColor: "#111827",
          borderWidth: 4,
        },
      ],
    };
  }, [overview]);

  const isEmptyOverview = !loadingOverview && overview && overview.totalStudents === 0;
  const isEmptyDepartment =
    !loadingDepartment && departmentDetails && departmentDetails.summary.total === 0;
  const isSyncRunning = syncStatus?.status === "running";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="mt-1 text-sm text-slate-400">
              Year-wise academic performance insights across current semester and cumulative results.
            </p>
          </div>
          <button
            onClick={triggerSync}
            disabled={isSyncRunning}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isSyncRunning
                ? "cursor-not-allowed bg-slate-700 text-slate-400"
                : "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400"
            }`}
          >
            {isSyncRunning ? "Syncing..." : "Sync Data"}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {YEARS.map((year) => (
            <button
              key={year.value}
              onClick={() => setSelectedYear(year.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                selectedYear === year.value
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {year.label}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {isSyncRunning
                  ? `Syncing Q9 Results: ${syncStatus?.completedStudents ?? 0}/${syncStatus?.totalStudents ?? 0} complete`
                  : syncStatus?.status === "failed"
                    ? "Background sync failed"
                    : "Background sync idle"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {isSyncRunning
                  ? "Rendering currently available analytics while the selected year refreshes in the background."
                  : syncStatus?.failedStudents
                    ? `${syncStatus.failedStudents} student fetches failed in the last run.`
                    : `Last updated: ${formatSyncTimestamp(syncStatus?.updatedAt ?? null)}`}
              </p>
            </div>
            <div className="text-sm text-slate-300">
              <span className="mr-4">Queued: {syncStatus?.queuedStudents ?? 0}</span>
              <span className="mr-4 text-emerald-400">Success: {syncStatus?.successfulStudents ?? 0}</span>
              <span className="text-rose-400">Failed: {syncStatus?.failedStudents ?? 0}</span>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${
                syncStatus?.status === "failed" ? "bg-rose-500" : "bg-amber-400"
              }`}
              style={{ width: `${Math.max(syncStatus?.progressPercent ?? 0, 3)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setMode("current")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "current"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Current Semester
        </button>
        <button
          onClick={() => setMode("overall")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "overall"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All Semesters
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setView("overall")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            view === "overall"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Overall
        </button>
        <button
          onClick={() => setView("department")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            view === "department"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Department
        </button>
      </div>

      {view === "overall" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {loadingOverview || !overview || syncRefreshing ? (
              <>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </>
            ) : (
              <>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Total Students</p>
                  <h2 className="mt-3 text-3xl font-bold text-white">{overview.totalStudents}</h2>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Pass %</p>
                  <h2 className="mt-3 text-3xl font-bold text-emerald-400">
                    {overview.passPercentage}%
                  </h2>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">{overview.averageLabel}</p>
                  <h2 className="mt-3 text-3xl font-bold text-blue-400">
                    {overview.averageValue}
                  </h2>
                </div>
              </>
            )}
          </div>

          {isEmptyOverview ? (
            <div className="stat-card">
              <h3 className="text-lg font-semibold text-white">No Analytics Available</h3>
              <p className="mt-2 text-slate-400">
                No analytics are available for the selected year yet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <div className="stat-card">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-white">Department Pass Rate</h3>
                    <p className="text-sm text-slate-400">
                      Pass percentage by department for the selected year and mode.
                    </p>
                  </div>
                  {loadingOverview || !overview || syncRefreshing ? (
                    <LoadingChart />
                  ) : (
                    <div className="h-[340px]">
                      <Bar data={departmentChart} options={chartOptions} />
                    </div>
                  )}
                </div>

                <div className="stat-card">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-white">Pass / Fail Split</h3>
                    <p className="text-sm text-slate-400">
                      Distribution of students in the selected year.
                    </p>
                  </div>
                  {loadingOverview || !overview || syncRefreshing ? (
                    <LoadingChart />
                  ) : (
                    <div className="flex h-[340px] items-center justify-center">
                      <div className="w-full max-w-[300px]">
                        <Doughnut
                          data={passFailChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: "58%",
                            plugins: {
                              legend: {
                                position: "top",
                                labels: {
                                  color: "#d1d5db",
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {((loadingOverview || syncRefreshing) ? Array.from({ length: 3 }) : (topStudents || []).slice(0, 3)).map(
                  (student, index) => {
                    const typedStudent = student as TopStudent;
                    return (
                      <div
                        key={(loadingOverview || syncRefreshing) ? index : typedStudent.roll_number}
                        className="stat-card text-center"
                      >
                        {loadingOverview || syncRefreshing ? (
                          <div className="space-y-3">
                            <div className="mx-auto h-8 w-8 rounded-full bg-white/10" />
                            <div className="mx-auto h-5 w-40 rounded bg-white/10" />
                            <div className="mx-auto h-4 w-28 rounded bg-white/10" />
                            <div className="mx-auto h-6 w-16 rounded bg-white/10" />
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                            <h3 className="mt-2 font-semibold text-white">{typedStudent.name}</h3>
                            <p className="text-sm text-slate-400">{typedStudent.roll_number}</p>
                            <p className="mt-2 text-lg font-semibold text-emerald-400">
                              {formatScore(typedStudent.score)}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="stat-card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Top Students</h3>
                    <p className="text-sm text-slate-400">
                      Ranked by {mode === "current" ? "SGPA" : "CGPA"} for Year {selectedYear}.
                    </p>
                  </div>
                </div>

                {loadingOverview || syncRefreshing ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-10 rounded bg-white/5" />
                    ))}
                  </div>
                ) : topStudents.length === 0 ? (
                  <p className="text-slate-400">No student rankings are available for this selection.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-700 text-gray-400">
                        <tr>
                          <th className="py-2 text-left">Roll</th>
                          <th className="text-left">Name</th>
                          <th className="text-center">Department</th>
                          <th className="text-center">{mode === "current" ? "SGPA" : "CGPA"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topStudents.map((student) => (
                          <tr key={student.roll_number} className="border-b border-gray-800">
                            <td className="py-2">{student.roll_number}</td>
                            <td>{student.name}</td>
                            <td className="text-center">{DEPARTMENT_MAP[student.department_id]}</td>
                            <td className="text-center font-semibold text-emerald-400">
                              {formatScore(student.score)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {view === "department" && (
        <>
          <div className="flex flex-wrap gap-3">
            {DEPARTMENTS.map((department) => (
              <button
                key={department.id}
                onClick={() => setSelectedDept(department.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  selectedDept === department.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {department.name}
              </button>
            ))}
          </div>

          {loadingDepartment || !departmentDetails || syncRefreshing ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
              <div className="stat-card">
                <LoadingChart />
              </div>
            </>
          ) : isEmptyDepartment ? (
            <div className="stat-card">
              <h3 className="text-lg font-semibold text-white">No Department Analytics Available</h3>
              <p className="mt-2 text-slate-400">
                No department data exists for the selected year and department yet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Total Students</p>
                  <h2 className="mt-3 text-3xl font-bold text-white">
                    {departmentDetails.summary.total}
                  </h2>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Passed</p>
                  <h2 className="mt-3 text-3xl font-bold text-emerald-400">
                    {departmentDetails.summary.passed}
                  </h2>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-400">Pass %</p>
                  <h2 className="mt-3 text-3xl font-bold text-blue-400">
                    {departmentDetails.summary.passPercentage}%
                  </h2>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
                <div className="stat-card">
                  <h3 className="mb-4 text-lg font-semibold text-white">Top in Department</h3>
                  {departmentDetails.topStudents.length === 0 ? (
                    <p className="text-slate-400">No department toppers available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {departmentDetails.topStudents.map((student) => (
                            <tr key={student.roll_number} className="border-b border-gray-800">
                              <td className="py-2">{student.roll_number}</td>
                              <td>{student.name}</td>
                              <td className="text-right font-semibold text-emerald-400">
                                {formatScore(student.score)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {mode === "current" ? (
                  <div className="stat-card">
                    <h3 className="mb-4 text-lg font-semibold text-white">Subject Analysis</h3>
                    {departmentDetails.subjects.length === 0 ? (
                      <p className="text-slate-400">No subject analysis available.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-gray-700 text-gray-400">
                            <tr>
                              <th className="py-2 text-left">Subject</th>
                              <th className="text-center">Passed</th>
                              <th className="text-center">Pass %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departmentDetails.subjects.map((subject) => (
                              <tr key={subject.subject_name} className="border-b border-gray-800">
                                <td className="py-2">{subject.subject_name}</td>
                                <td className="text-center">{subject.passed}</td>
                                <td className="text-center font-semibold text-emerald-400">
                                  {subject.pass_percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="stat-card">
                    <h3 className="mb-4 text-lg font-semibold text-white">Mode Insight</h3>
                    <p className="text-slate-400">
                      Subject-level analysis is only shown for current-semester SGPA mode.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {(Object.entries(departmentDetails.classes) as [string, SectionSummary][]).map(([section, sectionData]) => (
                  <div key={section} className="stat-card p-5">
                    <h3 className="mb-3 text-lg font-semibold text-white">Section {section}</h3>
                    <div className="mb-4 flex justify-between text-sm text-gray-400">
                      <span>Total: {sectionData.total}</span>
                      <span className="text-emerald-400">Pass %: {sectionData.passPercentage}%</span>
                    </div>

                    {sectionData.topStudents.length === 0 ? (
                      <p className="text-slate-400">No ranked students in this section yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <tbody>
                          {sectionData.topStudents.map((student) => {
                            const typedStudent = student as TopStudent;
                            return (
                                <tr key={typedStudent.roll_number} className="border-b border-gray-800">
                                  <td className="py-1">{typedStudent.roll_number}</td>
                                  <td>{typedStudent.name}</td>
                                  <td className="text-right font-semibold text-emerald-400">
                                    {formatScore(typedStudent.score)}
                                  </td>
                                </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;

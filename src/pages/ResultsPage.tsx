import { useState } from "react";
import axios from "axios";

type SubjectResult = {
  code: string;
  name: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
  credits: number;
  status?: "pass" | "active_backlog" | "cleared_backlog";
  latestExamCode?: string;
};

type SemesterResult = {
  semester: string;
  sgpa: number;
  examCodesTried?: string[];
  attemptsFetched?: number;
  subjects: SubjectResult[];
};

type ResultsResponse = {
  student: {
    name: string;
    branch: string;
    college: string;
    regulation?: string;
  };
  semesters: SemesterResult[];
  summary?: {
    cgpa: number | "Fail";
    activeBacklogCount: number;
    clearedBacklogCount: number;
    semesterCount: number;
  };
  warnings?: string[];
  message?: string;
};

const ResultsPage = () => {
  const [roll, setRoll] = useState("");
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    if (!roll) return alert("Please enter roll number");

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/results/${roll}`);
      setData(res.data);
    } catch (_err) {
      alert("Error fetching results");
    }
    setLoading(false);
  };

  const gradeColor = (grade: string) => {
    switch (grade) {
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

  const statusBadge = (status?: SubjectResult["status"]) => {
    if (status === "active_backlog") {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">Active Backlog</span>;
    }

    if (status === "cleared_backlog") {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">Cleared</span>;
    }

    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300">Passed</span>;
  };

  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start pt-24 px-4">
      {!data && (
        <div className="text-center max-w-2xl w-full">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 text-blue-400">RESULTS</h1>
          <p className="text-gray-400 mb-10 text-lg">
            Discover your academic performance across semesters 📊 Enter your roll number to view detailed results, SGPA, CGPA, and backlogs.
          </p>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <input
                value={roll}
                onChange={(e) => setRoll(e.target.value.toUpperCase())}
                placeholder="Enter Roll Number (e.g., 22Q91A6665)"
                className="w-full md:w-96 px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />

              <button onClick={fetchResults} className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition transform shadow-lg">
                {loading ? "Fetching..." : "Get Results"}
              </button>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="w-full max-w-6xl mt-10">
          <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-6 rounded-xl mb-8 border border-blue-500/20 shadow-lg">
            <h1 className="text-3xl font-bold text-blue-400 mb-2">ACADEMIC RESULTS</h1>
            <p className="text-gray-400 mb-4">Semester-wise merged performance overview</p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Student Name</p>
                <p className="font-semibold">{data.student.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Roll Number</p>
                <p className="font-semibold">{roll}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Branch</p>
                <p className="font-semibold">{data.student.branch}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">College</p>
                <p>{data.student.college || "Malla Reddy College of Engineering"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Regulation</p>
                <p>{data.student.regulation || "Unknown"}</p>
              </div>
            </div>
          </div>

          {!!data.warnings?.length && (
            <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200">
              {data.warnings.map((warning, idx) => (
                <p key={idx}>• {warning}</p>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-500/20 shadow-lg">
              <p className="text-gray-400">CGPA</p>
              <h2 className="text-3xl font-bold text-blue-400">{summary?.cgpa === "Fail" ? <span className="text-red-400">Fail</span> : Number(summary?.cgpa ?? 0).toFixed(2)}</h2>
            </div>
            <div className="bg-red-900/30 p-6 rounded-xl border border-red-500/20 shadow-lg">
              <p className="text-gray-400">Active Backlogs</p>
              <h2 className="text-3xl font-bold text-red-400">{summary?.activeBacklogCount ?? 0}</h2>
            </div>
            <div className="bg-green-900/30 p-6 rounded-xl border border-green-500/20 shadow-lg">
              <p className="text-gray-400">Cleared Backlogs</p>
              <h2 className="text-3xl font-bold text-green-400">{summary?.clearedBacklogCount ?? 0}</h2>
            </div>
            <div className="bg-emerald-900/30 p-6 rounded-xl border border-emerald-500/20 shadow-lg">
              <p className="text-gray-400">Semesters Fetched</p>
              <h2 className="text-3xl font-bold text-emerald-400">{summary?.semesterCount ?? data.semesters.length}</h2>
            </div>
          </div>

          {!data.semesters.length && <div className="bg-gray-900/50 backdrop-blur p-6 rounded-xl mb-8 border border-gray-700 shadow-lg">No results found</div>}

          {data.semesters.map((sem, i) => (
            <div key={i} className="bg-gray-900/50 backdrop-blur p-6 rounded-xl mb-8 border border-gray-700 shadow-lg">
              <div className="flex justify-between mb-4 items-center gap-3 flex-wrap">
                <div>
                  <h3 className="text-xl font-semibold text-blue-400">Semester {sem.semester}</h3>
                  <p className="text-gray-400 text-sm">• {sem.attemptsFetched ?? 0} attempts merged</p>
                </div>

                <div className="text-right">
                  <span className="text-gray-300">SGPA: {sem.sgpa === 0 ? <span className="text-red-400 font-semibold">Fail</span> : Number(sem.sgpa).toFixed(2)}</span>
                  {!!sem.examCodesTried?.length && <p className="text-xs text-blue-300 mt-1">Codes: {sem.examCodesTried.join(", ")}</p>}
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="py-2 text-left">Code</th>
                    <th className="text-left">Subject</th>
                    <th className="text-left">Status</th>
                    <th>Int</th>
                    <th>Ext</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((sub, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/40 transition">
                      <td className="py-2">{sub.code}</td>
                      <td>{sub.name}</td>
                      <td>{statusBadge(sub.status)}</td>
                      <td className="text-center">{sub.internal}</td>
                      <td className="text-center">{sub.external}</td>
                      <td className="text-center font-semibold">{sub.total}</td>
                      <td className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${gradeColor(sub.grade)}`}>{sub.grade}</span>
                      </td>
                      <td className="text-center">{sub.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;

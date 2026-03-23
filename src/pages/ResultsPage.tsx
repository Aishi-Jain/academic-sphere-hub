import { useState } from "react";
import axios from "axios";

const ResultsPage = () => {
  const [roll, setRoll] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    if (!roll) return alert("Please enter roll number");

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/results/${roll}`);
      setData(res.data);
    } catch (err) {
      alert("Error fetching results");
    }
    setLoading(false);
  };

  const calculateCGPA = () => {
    if (!data) return 0;

    const hasFail = data.semesters.some(
      (sem: any) => parseFloat(sem.sgpa) === 0
    );

    if (hasFail) return "Fail";

    const total = data.semesters.reduce(
      (sum: number, sem: any) => sum + parseFloat(sem.sgpa),
      0
    );

    return (total / data.semesters.length).toFixed(2);
  };

  const getBacklogs = () => {
    if (!data) return [];
    let backlogs: any[] = [];

    data.semesters.forEach((sem: any) => {
      sem.subjects.forEach((sub: any) => {
        if (sub.grade === "F" || sub.grade === "Ab") {
          backlogs.push({
            semester: sem.semester,
            subject: sub.name,
          });
        }
      });
    });

    return backlogs;
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
      case "Ab":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start pt-24 px-4">

      {/* 🌟 HERO SECTION (only when no data) */}
      {!data && (
        <div className="text-center max-w-2xl w-full">

          {/* Title */}
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 text-blue-400">
            RESULTS
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 mb-10 text-lg">
            Discover your academic performance across semesters 📊  
            Enter your roll number to view detailed results, SGPA, CGPA, and backlogs.
          </p>

          {/* 🔥 Glass Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">

              <input
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="Enter Roll Number (e.g., 22Q91A6665)"
                className="w-full md:w-96 px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />

              <button
                onClick={fetchResults}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition transform shadow-lg"
              >
                {loading ? "Fetching..." : "Get Results"}
              </button>

            </div>

            <p className="text-gray-500 text-sm mt-4">
              ⚡ Fast • Real-time • Accurate results powered by Academic Sphere
            </p>

          </div>
        </div>
      )}

      {/* 🔥 RESULTS SECTION */}
      {data && (
        <div className="w-full max-w-6xl mt-10">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-6 rounded-xl mb-8 border border-blue-500/20 shadow-lg">

            <h1 className="text-3xl font-bold text-blue-400 mb-2">
              ACADEMIC RESULTS
            </h1>

            <p className="text-gray-400 mb-4">
              Semester-wise performance overview
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p>Malla Reddy College of Engineering</p>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">

            <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-500/20 shadow-lg">
              <p className="text-gray-400">CGPA</p>
              <h2 className="text-3xl font-bold text-blue-400">
                {calculateCGPA() === "Fail" ? (
                  <span className="text-red-400">Fail</span>
                ) : (
                  calculateCGPA()
                )}
              </h2>
            </div>

            <div className="bg-red-900/30 p-6 rounded-xl border border-red-500/20 shadow-lg">
              <p className="text-gray-400">Backlogs</p>
              <h2 className="text-3xl font-bold text-red-400">
                {getBacklogs().length}
              </h2>
            </div>

            <div className="bg-green-900/30 p-6 rounded-xl border border-green-500/20 shadow-lg">
              <p className="text-gray-400">Semesters</p>
              <h2 className="text-3xl font-bold text-green-400">
                {data.semesters.length}
              </h2>
            </div>

          </div>

          {/* SEMESTERS */}
          {data.semesters.map((sem: any, i: number) => (
            <div
              key={i}
              className="bg-gray-900/50 backdrop-blur p-6 rounded-xl mb-8 border border-gray-700 shadow-lg"
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-semibold text-blue-400">
                  Semester {sem.semester}
                </h3>

                <span className="text-gray-300">
                  SGPA: {parseFloat(sem.sgpa) === 0 ? (
                    <span className="text-red-400 font-semibold">Fail</span>
                  ) : (
                    sem.sgpa
                  )}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="py-2 text-left">Code</th>
                    <th className="text-left">Subject</th>
                    <th>Int</th>
                    <th>Ext</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Credits</th>
                  </tr>
                </thead>

                <tbody>
                  {sem.subjects.map((sub: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                    >
                      <td className="py-2">{sub.code}</td>
                      <td>{sub.name}</td>
                      <td className="text-center">{sub.internal}</td>
                      <td className="text-center">{sub.external}</td>
                      <td className="text-center font-semibold">
                        {sub.total}
                      </td>
                      <td className="text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${gradeColor(
                            sub.grade
                          )}`}
                        >
                          {sub.grade}
                        </span>
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
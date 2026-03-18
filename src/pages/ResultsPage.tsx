import { useState } from "react";
import axios from "axios";

const ResultsPage = () => {
  const [roll, setRoll] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
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
    <div className="p-8 bg-black text-white min-h-screen">

      {/* 🔍 SEARCH */}
      <div className="flex gap-4 mb-8">
        <input
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          placeholder="Enter Roll Number"
          className="p-3 rounded-lg bg-gray-900 border border-gray-700 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchResults}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
        >
          {loading ? "Loading..." : "Get Results"}
        </button>
      </div>

      {data && (
        <>
          {/* 🔥 HEADER */}
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
                <p className="font-semibold">{data.student.Name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Roll Number</p>
                <p className="font-semibold">{roll}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Branch</p>
                <p className="font-semibold">{data.student.Branch}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">College</p>
                <p className="font-semibold">{data.student["College Name"]}</p>
              </div>
            </div>
          </div>

          {/* 🔥 SUMMARY CARDS */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">

            <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-500/20 shadow-lg">
              <p className="text-gray-400">CGPA</p>
              <h2 className="text-3xl font-bold text-blue-400">
                {calculateCGPA()}
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

          {/* 🔥 SEMESTERS */}
          {data.semesters.map((sem: any, i: number) => (
            <div
              key={i}
              className="bg-gray-900/50 backdrop-blur p-6 rounded-xl mb-8 border border-gray-700 shadow-lg"
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-semibold text-blue-400">
                  Semester {sem.semester}
                </h3>
                <span className="text-gray-300">SGPA: {sem.sgpa}</span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* 🔥 BACKLOG LIST */}
          {getBacklogs().length > 0 && (
            <div className="bg-red-900/30 p-6 rounded-xl border border-red-500/20">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Backlogs
              </h2>
              {getBacklogs().map((b: any, i: number) => (
                <p key={i}>
                  {b.semester} - {b.subject}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsPage;
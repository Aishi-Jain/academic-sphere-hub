import { useState } from "react";
import axios from "axios";

const ResultsPage = () => {
  const [roll, setRoll] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/results/${roll}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching results");
    }
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

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      {/* 🔍 SEARCH */}
      <div className="flex gap-4 mb-6">
        <input
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          placeholder="Enter Roll Number"
          className="p-3 rounded bg-gray-800 w-80"
        />
        <button
          onClick={fetchResults}
          className="bg-blue-600 px-6 py-2 rounded"
        >
          Get Results
        </button>
      </div>

      {data && (
        <>
          {/* 🔥 STUDENT INFO */}
          <div className="bg-gray-900 p-6 rounded mb-6">
            <h2 className="text-2xl font-bold">{data.student.Name}</h2>
            <p>{data.student.Branch}</p>
            <p>{data.student["College Name"]}</p>
          </div>

          {/* 🔥 SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-900 p-4 rounded">
              <p>CGPA</p>
              <h2 className="text-2xl font-bold">{calculateCGPA()}</h2>
            </div>

            <div className="bg-red-900 p-4 rounded">
              <p>Backlogs</p>
              <h2 className="text-2xl font-bold">{getBacklogs().length}</h2>
            </div>

            <div className="bg-green-900 p-4 rounded">
              <p>Total Semesters</p>
              <h2 className="text-2xl font-bold">
                {data.semesters.length}
              </h2>
            </div>
          </div>

          {/* 🔥 SEMESTERS */}
          {data.semesters.map((sem: any, i: number) => (
            <div key={i} className="bg-gray-900 p-6 rounded mb-6">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">
                  Semester {sem.semester}
                </h3>
                <span>SGPA: {sem.sgpa}</span>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th>Code</th>
                    <th>Subject</th>
                    <th>Internal</th>
                    <th>External</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((sub: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-800 ${
                        sub.grade === "F" || sub.grade === "Ab"
                          ? "text-red-400"
                          : ""
                      }`}
                    >
                      <td>{sub.code}</td>
                      <td>{sub.name}</td>
                      <td>{sub.internal}</td>
                      <td>{sub.external}</td>
                      <td>{sub.total}</td>
                      <td>{sub.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* 🔥 BACKLOG LIST */}
          {getBacklogs().length > 0 && (
            <div className="bg-red-800 p-6 rounded">
              <h2 className="text-xl font-bold mb-2">Backlogs</h2>
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
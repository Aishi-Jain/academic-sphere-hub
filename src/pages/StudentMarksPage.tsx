import { useEffect, useState } from "react";
import axios from "axios";

const StudentMarksPage = () => {
  const [marks, setMarks] = useState<any[]>([]);

  // ✅ Get logged-in user
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const studentId = user?.reference_id;
  const studentName = user?.username;

  useEffect(() => {
    if (!studentId) return;

    axios
      .get("http://localhost:5000/api/student/marks", {
        params: { student_id: studentId },
      })
      .then((res) => setMarks(res.data))
      .catch((err) => console.error(err));
  }, [studentId]);

  // ❗ If not logged in
  if (!studentId) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-xl font-semibold">
          Please login to view your marks
        </h1>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-2">
        Semester {marks[0]?.semester || "-"}
      </h1>

      <p className="text-gray-400 mb-6">
        {studentName}
      </p>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full">

          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Subject</th>
              <th className="p-3 text-left">Int</th>
            </tr>
          </thead>

          <tbody>
            {marks.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-400">
                  No marks available yet
                </td>
              </tr>
            ) : (
              marks.map((m: any, index: number) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-3">{m.subject_code}</td>
                  <td className="p-3">{m.subject_name}</td>
                  <td
                    className={`p-3 font-semibold ${
                      m.marks !== null
                        ? m.marks < 40
                          ? "text-red-400"
                          : "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {m.marks !== null ? m.marks : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default StudentMarksPage;
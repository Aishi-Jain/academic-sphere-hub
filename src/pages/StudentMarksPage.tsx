import { useEffect, useState } from "react";
import axios from "axios";

type StudentMark = {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  semester: number | string;
  year: number | string;
  regulation: string;
  mid1: number | null;
  mid2: number | null;
  ppt: number | null;
  total: number | null;
};

const formatMark = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const StudentMarksPage = () => {
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const studentId = user?.reference_id;
  const studentName = user?.username;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get("http://localhost:5000/api/student/marks", {
        params: { student_id: studentId },
      })
      .then((res) => setMarks(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-xl font-semibold">Please login to view your marks</h1>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h1 className="mb-2 text-3xl font-bold">My Marks</h1>
      <p className="mb-1 text-gray-300">{studentName}</p>
      <p className="mb-6 text-gray-400">
        Semester {marks[0]?.semester || "-"}
      </p>

      <div className="overflow-hidden rounded-lg bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Subject Code</th>
                <th className="p-3 text-left">Subject Name</th>
                <th className="p-3 text-left">Mid 1</th>
                <th className="p-3 text-left">Mid 2</th>
                <th className="p-3 text-left">PPT</th>
                <th className="p-3 text-left">Total</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">
                    Loading marks...
                  </td>
                </tr>
              ) : marks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">
                    No marks available yet
                  </td>
                </tr>
              ) : (
                marks.map((mark) => (
                  <tr key={`${mark.subject_id}-${mark.subject_code}`} className="border-b border-gray-700">
                    <td className="p-3 font-mono">{mark.subject_code}</td>
                    <td className="p-3">{mark.subject_name}</td>
                    <td className="p-3">{formatMark(mark.mid1)}</td>
                    <td className="p-3">{formatMark(mark.mid2)}</td>
                    <td className="p-3">{formatMark(mark.ppt)}</td>
                    <td className="p-3 font-semibold text-green-400">{formatMark(mark.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentMarksPage;

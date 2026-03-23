import { useEffect, useState } from "react";
import axios from "axios";

const MarksPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState<any>({});

  // ✅ Load subjects
  useEffect(() => {
    axios.get("http://localhost:5000/api/subjects")
      .then((res) => setSubjects(res.data));
  }, []);

  // ✅ Load departments
  useEffect(() => {
    axios.get("http://localhost:5000/api/marks/departments")
      .then((res) => setDepartments(res.data));
  }, []);

  // ✅ Load sections when department changes
  useEffect(() => {
    if (!departmentId) return;

    axios.get("http://localhost:5000/api/marks/sections", {
      params: { department_id: departmentId }
    }).then((res) => setSections(res.data));

  }, [departmentId]);

  // ✅ Load students
  const handleLoadStudents = async () => {
    if (!subjectId || !departmentId || !section) {
      alert("Please select all fields");
      return;
    }

    const res = await axios.get("http://localhost:5000/api/marks/students", {
      params: {
        department_id: departmentId,
        section
      },
    });

    setStudents(res.data);

    const initialMarks: any = {};
    res.data.forEach((s: any) => {
      initialMarks[s.student_id] = "";
    });

    setMarks(initialMarks);
  };

  // ✅ Handle marks
  const handleChange = (id: number, value: string) => {
    setMarks({ ...marks, [id]: value });
  };

  // ✅ Upload
  const handleUpload = async () => {
    const marksData = students.map((s: any) => ({
      student_id: s.student_id,
      marks: marks[s.student_id],
    }));

    await axios.post("http://localhost:5000/api/marks/upload", {
      subject_id: subjectId,
      marksData,
    });

    alert("Marks uploaded successfully!");
  };

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-2">Marks Entry</h1>
      <p className="text-gray-400 mb-6">
        Select subject, department, and section to enter internal marks.
      </p>

      <div className="flex gap-4 flex-wrap mb-6">

        {/* Subject */}
        <select
          className="bg-gray-800 p-3 rounded"
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map((s: any) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.subject_code} - {s.subject_name}
            </option>
          ))}
        </select>

        {/* Department */}
        <select
          className="bg-gray-800 p-3 rounded"
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Department</option>
          {departments.map((d: any) => (
            <option key={d.department_id} value={d.department_id}>
              {d.department_name}
            </option>
          ))}
        </select>

        {/* Section */}
        <select
          className="bg-gray-800 p-3 rounded"
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="">Section</option>
          {sections.length === 0 ? (
            <option disabled>No sections available</option>
          ) : (
            sections.map((s: any) => (
              <option key={s.section} value={s.section}>
                {s.section}
              </option>
            ))
          )}
        </select>

        <button
          onClick={handleLoadStudents}
          className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-700"
        >
          Load Students
        </button>
      </div>

      {/* Table */}
      {students.length > 0 && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">

          <table className="w-full">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Roll No</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Marks</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s: any) => (
                <tr key={s.student_id} className="border-b border-gray-700">
                  <td className="p-3">{s.roll_no}</td>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="bg-gray-800 p-2 rounded w-24"
                      value={marks[s.student_id] || ""}
                      onChange={(e) =>
                        handleChange(s.student_id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 flex justify-end">
            <button
              onClick={handleUpload}
              className="bg-green-600 px-6 py-2 rounded hover:bg-green-700"
            >
              Upload Marks
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default MarksPage;
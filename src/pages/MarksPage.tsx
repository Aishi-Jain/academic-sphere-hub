import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { departments as staticDepartments, deptShortNames } from "@/lib/mock-data";

type Department = { department_id: number; department_name: string };
type Subject = {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department_id: number;
  semester: number;
  year: number;
  regulation: string;
};
type Student = {
  student_id: number;
  roll_no: string;
  name: string;
  mid1: number | null;
  mid2: number | null;
  ppt: number | null;
  total: number | null;
};

type RowMark = { mid1: string; mid2: string; ppt: string };

const yearOptions = [
  { label: "I", value: "1" },
  { label: "II", value: "2" },
  { label: "III", value: "3" },
  { label: "IV", value: "4" },
];

const semesterOptions = [
  { label: "Semester 1", value: "1" },
  { label: "Semester 2", value: "2" },
];

const regulations = ["R22", "R25"];

const isBlank = (value: string) => value.trim() === "";

const isValidNumber = (value: string, max: number) => {
  if (isBlank(value)) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max;
};

const computeTotal = (mid1: string, mid2: string, ppt: string) => {
  if ([mid1, mid2, ppt].some(isBlank)) return "-";
  if (!isValidNumber(mid1, 35) || !isValidNumber(mid2, 35) || !isValidNumber(ppt, 5)) return "-";
  return String((Number(mid1) + Number(mid2)) / 2 + Number(ppt));
};

const MarksPage = () => {
  const [regulation, setRegulation] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [section, setSection] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<{ section: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<number, RowMark>>({});
  const [statusMessage, setStatusMessage] = useState("");

  const departmentLabel = useMemo(() => {
    const fromApi = departments.find((d) => String(d.department_id) === departmentId);
    if (!fromApi) return "-";
    const staticMatch = staticDepartments.find((d) => d.id === String(fromApi.department_id));
    if (!staticMatch) return fromApi.department_name;
    return deptShortNames[staticMatch.name] || fromApi.department_name;
  }, [departments, departmentId]);

  const selectedSubject = subjects.find((s) => String(s.subject_id) === subjectId);
  const yearLabel = yearOptions.find((y) => y.value === year)?.label || "-";

  const resetStudentsAndMarks = () => {
    setStudents([]);
    setMarks({});
    setStatusMessage("");
  };

  useEffect(() => {
    axios.get("http://localhost:5000/api/marks/departments").then((res) => setDepartments(res.data));
  }, []);

  useEffect(() => {
    setSection("");
    setSubjectId("");
    setSections([]);
    setSubjects([]);
    resetStudentsAndMarks();
  }, [regulation, year, departmentId]);

  useEffect(() => {
    setSubjectId("");
    setSubjects([]);
    resetStudentsAndMarks();
  }, [semester]);

  useEffect(() => {
    resetStudentsAndMarks();
  }, [section]);

  useEffect(() => {
    resetStudentsAndMarks();
  }, [subjectId]);

  useEffect(() => {
    if (!regulation || !year || !departmentId) return;

    axios
      .get("http://localhost:5000/api/marks/sections", {
        params: { regulation, year, department_id: departmentId },
      })
      .then((res) => setSections(res.data));
  }, [regulation, year, departmentId]);

  useEffect(() => {
    if (!regulation || !year || !departmentId || !semester) return;

    axios
      .get("http://localhost:5000/api/subjects", {
        params: {
          regulation,
          year,
          department_id: departmentId,
          semester,
        },
      })
      .then((res) => setSubjects(res.data));
  }, [regulation, year, departmentId, semester]);

  const handleLoadStudents = async () => {
    const res = await axios.get("http://localhost:5000/api/marks/students", {
      params: {
        regulation,
        year,
        semester,
        department_id: departmentId,
        section,
        subject_id: subjectId,
      },
    });

    setStudents(res.data);

    const initialMarks: Record<number, RowMark> = {};
    res.data.forEach((s: Student) => {
      initialMarks[s.student_id] = {
        mid1: s.mid1 === null || s.mid1 === undefined ? "" : String(s.mid1),
        mid2: s.mid2 === null || s.mid2 === undefined ? "" : String(s.mid2),
        ppt: s.ppt === null || s.ppt === undefined ? "" : String(s.ppt),
      };
    });

    setMarks(initialMarks);
  };

  const handleChange = (studentId: number, field: keyof RowMark, value: string) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { mid1: "", mid2: "", ppt: "" }),
        [field]: value,
      },
    }));
  };

  const hasInvalid = students.some((student) => {
    const row = marks[student.student_id] || { mid1: "", mid2: "", ppt: "" };
    return !isValidNumber(row.mid1, 35) || !isValidNumber(row.mid2, 35) || !isValidNumber(row.ppt, 5);
  });

  const handleSubmit = async () => {
    const marksData = students.map((s) => ({
      student_id: s.student_id,
      mid1: marks[s.student_id]?.mid1 ?? "",
      mid2: marks[s.student_id]?.mid2 ?? "",
      ppt: marks[s.student_id]?.ppt ?? "",
    }));

    const res = await axios.post("http://localhost:5000/api/marks/upload", {
      subject_id: subjectId,
      regulation,
      year,
      semester,
      department_id: departmentId,
      section,
      marksData,
    });

    setStatusMessage(res.data.message || "Marks submitted successfully");
  };

  const handleSavePdf = () => {
    const rowsHtml = students
      .map((s) => {
        const row = marks[s.student_id] || { mid1: "", mid2: "", ppt: "" };
        return `<tr><td>${s.roll_no}</td><td>${s.name}</td><td>${row.mid1 || "-"}</td><td>${row.mid2 || "-"}</td><td>${row.ppt || "-"}</td><td>${computeTotal(row.mid1, row.mid2, row.ppt)}</td></tr>`;
      })
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head><title>Marks Sheet</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        th, td { border: 1px solid #aaa; padding: 8px; text-align: left; }
      </style>
      </head>
      <body>
        <h2>Marks Sheet</h2>
        <p>Regulation: ${regulation} | Year: ${yearLabel} | Department: ${departmentLabel} | Section: ${section}</p>
        <p>Subject: ${selectedSubject?.subject_name || "-"} (${selectedSubject?.subject_code || "-"})</p>
        <table>
          <thead><tr><th>Roll No</th><th>Student Name</th><th>Mid 1</th><th>Mid 2</th><th>PPT</th><th>Total</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const readyToLoad = regulation && year && semester && departmentId && section && subjectId;

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marks Entry</h1>
        <p className="text-gray-400">Regulation, year, semester, department, section and subject based marks workflow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <select className="bg-gray-800 p-3 rounded" value={regulation} onChange={(e) => setRegulation(e.target.value)}>
          <option value="">Regulation</option>
          {regulations.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select className="bg-gray-800 p-3 rounded" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {yearOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select className="bg-gray-800 p-3 rounded" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">Semester</option>
          {semesterOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select className="bg-gray-800 p-3 rounded" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">Department</option>
          {departments.map((d) => {
            const staticMatch = staticDepartments.find((s) => s.id === String(d.department_id));
            const label = staticMatch ? deptShortNames[staticMatch.name] : d.department_name;
            return <option key={d.department_id} value={d.department_id}>{label}</option>;
          })}
        </select>

        <select className="bg-gray-800 p-3 rounded" value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">Section</option>
          {sections.map((s) => (
            <option key={s.section} value={s.section}>{s.section}</option>
          ))}
        </select>

        <select className="bg-gray-800 p-3 rounded" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Subject</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
          ))}
        </select>

        <input className="bg-gray-900 p-3 rounded text-gray-300" value={selectedSubject?.subject_code || ""} placeholder="Subject Code" readOnly />

        <button
          onClick={handleLoadStudents}
          disabled={!readyToLoad}
          className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Load Student List
        </button>
      </div>

      {students.length > 0 && (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-200">
              Student List: {regulation} • {yearLabel} • {departmentLabel} • {section}
            </p>
            <div className="flex gap-2">
              <button onClick={handleSavePdf} className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600">Save Marks</button>
              <button
                onClick={handleSubmit}
                disabled={hasInvalid}
                className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Roll No</th>
                <th className="p-3 text-left">Student Name</th>
                <th className="p-3 text-left">Mid 1</th>
                <th className="p-3 text-left">Mid 2</th>
                <th className="p-3 text-left">PPT</th>
                <th className="p-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const row = marks[student.student_id] || { mid1: "", mid2: "", ppt: "" };
                const mid1Invalid = !isValidNumber(row.mid1, 35);
                const mid2Invalid = !isValidNumber(row.mid2, 35);
                const pptInvalid = !isValidNumber(row.ppt, 5);
                return (
                  <tr key={student.student_id} className="border-b border-gray-800 align-top">
                    <td className="p-3">{student.roll_no}</td>
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        className={`p-2 rounded w-24 ${mid1Invalid ? "bg-red-950 border border-red-500" : "bg-gray-800"}`}
                        value={row.mid1}
                        onChange={(e) => handleChange(student.student_id, "mid1", e.target.value)}
                      />
                      {mid1Invalid && <p className="text-xs text-red-400 mt-1">Mid 1 must be 0..35</p>}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        className={`p-2 rounded w-24 ${mid2Invalid ? "bg-red-950 border border-red-500" : "bg-gray-800"}`}
                        value={row.mid2}
                        onChange={(e) => handleChange(student.student_id, "mid2", e.target.value)}
                      />
                      {mid2Invalid && <p className="text-xs text-red-400 mt-1">Mid 2 must be 0..35</p>}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        className={`p-2 rounded w-24 ${pptInvalid ? "bg-red-950 border border-red-500" : "bg-gray-800"}`}
                        value={row.ppt}
                        onChange={(e) => handleChange(student.student_id, "ppt", e.target.value)}
                      />
                      {pptInvalid && <p className="text-xs text-red-400 mt-1">PPT must be 0..5</p>}
                    </td>
                    <td className="p-3">{computeTotal(row.mid1, row.mid2, row.ppt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {statusMessage && <p className="p-4 text-green-400 text-sm">{statusMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default MarksPage;

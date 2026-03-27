import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departments as staticDepartments, deptShortNames } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    const fromApi = departments.find((item) => String(item.department_id) === departmentId);
    if (!fromApi) return "-";
    const staticMatch = staticDepartments.find((item) => item.id === String(fromApi.department_id));
    if (!staticMatch) return fromApi.department_name;
    return deptShortNames[staticMatch.name] || fromApi.department_name;
  }, [departments, departmentId]);

  const selectedSubject = subjects.find((subject) => String(subject.subject_id) === subjectId);
  const yearLabel = yearOptions.find((item) => item.value === year)?.label || "-";

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
  }, [section, subjectId]);

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
    res.data.forEach((student: Student) => {
      initialMarks[student.student_id] = {
        mid1: student.mid1 === null || student.mid1 === undefined ? "" : String(student.mid1),
        mid2: student.mid2 === null || student.mid2 === undefined ? "" : String(student.mid2),
        ppt: student.ppt === null || student.ppt === undefined ? "" : String(student.ppt),
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
    const marksData = students.map((student) => ({
      student_id: student.student_id,
      mid1: marks[student.student_id]?.mid1 ?? "",
      mid2: marks[student.student_id]?.mid2 ?? "",
      ppt: marks[student.student_id]?.ppt ?? "",
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
      .map((student) => {
        const row = marks[student.student_id] || { mid1: "", mid2: "", ppt: "" };
        return `<tr><td>${student.roll_no}</td><td>${student.name}</td><td>${row.mid1 || "-"}</td><td>${row.mid2 || "-"}</td><td>${row.ppt || "-"}</td><td>${computeTotal(row.mid1, row.mid2, row.ppt)}</td></tr>`;
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
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Assessment Workspace</p>
            <h1 className="page-header">Marks Entry</h1>
            <p className="page-description max-w-2xl">
              Select regulation, year, section, and subject to build a cleaner marks-entry workflow for faculty and department coordinators.
            </p>
          </div>
          <div className="glass-panel space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Selection Summary</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{departmentLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{selectedSubject?.subject_code || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="data-card">
        <div className="mb-5">
          <p className="section-kicker">Filters</p>
          <h2 className="section-header mt-1">Marks Setup</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <Select value={regulation} onValueChange={setRegulation}>
            <SelectTrigger>
              <SelectValue placeholder="Regulation" />
            </SelectTrigger>
            <SelectContent>
              {regulations.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => {
                const staticMatch = staticDepartments.find((item) => item.id === String(department.department_id));
                const label = staticMatch ? deptShortNames[staticMatch.name] : department.department_name;
                return (
                  <SelectItem key={department.department_id} value={String(department.department_id)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={section} onValueChange={setSection}>
            <SelectTrigger>
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((item) => (
                <SelectItem key={item.section} value={item.section}>
                  {item.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                  {subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input value={selectedSubject?.subject_code || ""} placeholder="Subject Code" readOnly />

          <Button onClick={handleLoadStudents} disabled={!readyToLoad}>
            Load Student List
          </Button>
        </div>
      </section>

      {students.length > 0 && (
        <section className="data-card overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
            <div>
              <p className="section-kicker">Entry Sheet</p>
              <p className="text-sm text-muted-foreground">
                {regulation} • {yearLabel} • {departmentLabel} • Section {section}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSavePdf}>
                Save Marks
              </Button>
              <Button onClick={handleSubmit} disabled={hasInvalid}>
                Submit
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-white/[0.04] text-muted-foreground">
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
                    <tr key={student.student_id} className="border-t border-border/60 align-top">
                      <td className="p-3 font-mono text-xs">{student.roll_no}</td>
                      <td className="p-3">{student.name}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className={mid1Invalid ? "border-rose-400/40 bg-rose-500/10" : ""}
                          value={row.mid1}
                          onChange={(e) => handleChange(student.student_id, "mid1", e.target.value)}
                        />
                        {mid1Invalid && <p className="mt-1 text-xs text-rose-300">Mid 1 must be 0..35</p>}
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className={mid2Invalid ? "border-rose-400/40 bg-rose-500/10" : ""}
                          value={row.mid2}
                          onChange={(e) => handleChange(student.student_id, "mid2", e.target.value)}
                        />
                        {mid2Invalid && <p className="mt-1 text-xs text-rose-300">Mid 2 must be 0..35</p>}
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          className={pptInvalid ? "border-rose-400/40 bg-rose-500/10" : ""}
                          value={row.ppt}
                          onChange={(e) => handleChange(student.student_id, "ppt", e.target.value)}
                        />
                        {pptInvalid && <p className="mt-1 text-xs text-rose-300">PPT must be 0..5</p>}
                      </td>
                      <td className="p-3 font-semibold text-cyan-200">
                        {computeTotal(row.mid1, row.mid2, row.ppt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {statusMessage && <p className="pt-4 text-sm text-emerald-300">{statusMessage}</p>}
        </section>
      )}
    </div>
  );
};

export default MarksPage;

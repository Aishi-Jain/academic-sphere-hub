import { useEffect, useMemo, useState } from "react";
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

  const totalSubjects = marks.length;
  const averageTotal = useMemo(() => {
    if (!marks.length) return "-";
    const values = marks
      .map((mark) => Number(mark.total))
      .filter((value) => Number.isFinite(value));

    if (!values.length) return "-";
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);
  }, [marks]);

  if (!studentId) {
    return (
      <div className="space-y-6">
        <section className="hero-surface">
          <h1 className="page-header">Please login to view your marks</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Student Assessment View</p>
            <h1 className="page-header">My Marks</h1>
            <p className="page-description max-w-2xl">
              Review your internal assessment marks, PPT scores, and subject-wise totals in a clearer student-friendly layout.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{studentName}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Semester</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{marks[0]?.semester || "-"}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Subjects</p>
              <p className="mt-2 text-xl font-semibold text-cyan-200">{totalSubjects}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Average Total</p>
              <p className="mt-2 text-xl font-semibold text-violet-200">{averageTotal}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="data-card overflow-hidden">
        <div className="mb-4">
          <p className="section-kicker">Marks Sheet</p>
          <h2 className="section-header mt-1">Subject-wise Performance</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/70">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-white/[0.04] text-muted-foreground">
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
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Loading marks...
                  </td>
                </tr>
              ) : marks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No marks available yet
                  </td>
                </tr>
              ) : (
                marks.map((mark) => (
                  <tr key={`${mark.subject_id}-${mark.subject_code}`} className="border-t border-border/60">
                    <td className="p-3 font-mono text-xs">{mark.subject_code}</td>
                    <td className="p-3">{mark.subject_name}</td>
                    <td className="p-3">{formatMark(mark.mid1)}</td>
                    <td className="p-3">{formatMark(mark.mid2)}</td>
                    <td className="p-3">{formatMark(mark.ppt)}</td>
                    <td className="p-3 font-semibold text-emerald-300">{formatMark(mark.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default StudentMarksPage;

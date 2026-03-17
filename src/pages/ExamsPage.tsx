import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subjects, setSubjects] = useState("");

  // 🔥 FETCH
  useEffect(() => {
    fetch("http://localhost:5000/api/exams")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((e: any) => ({
          id: e.exam_id,
          name: e.exam_name,
          semester: e.semester,
          year: e.year,
          startDate: e.start_date,
          endDate: e.end_date,
          subjects: JSON.parse(e.subjects || "[]"),
        }));

        setExams(formatted);
      });
  }, []);

  // 🔥 ADD
  const addExam = async () => {
    await fetch("http://localhost:5000/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_name: name,
        semester,
        year,
        start_date: startDate,
        end_date: endDate,
        subjects: subjects.split(","),
      }),
    });

    setOpen(false);
    window.location.reload();
  };

  // 🔥 UPDATE
  const updateExam = async (id: number) => {
    console.log("Updating ID:", id);

    await fetch(`http://localhost:5000/api/exams/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exam_name: name,
        semester,
        year,
        start_date: startDate,
        end_date: endDate,
        subjects: subjects.split(","),
      }),
    });

    setEditingId(null);
    setOpen(false);
    window.location.reload();
  };

  // 🔥 DELETE
  const deleteExam = async (id: number) => {
    await fetch(`http://localhost:5000/api/exams/${id}`, {
      method: "DELETE",
    });

    window.location.reload();
  };

  const columns = [
    {
      key: "name",
      header: "Exam",
      render: (e: any) => <span className="font-medium">{e.name}</span>,
    },
    { key: "semester", header: "Semester" },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    {
      key: "subjects",
      header: "Subjects",
      render: (e: any) => (
        <div className="flex gap-1 flex-wrap">
          {e.subjects.map((s: string) => (
            <Badge key={s} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingId(e.id);
              setName(e.name);
              setSemester(e.semester);
              setYear(e.year);
              setStartDate(e.startDate);
              setEndDate(e.endDate);
              setSubjects(e.subjects.join(","));
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => deleteExam(e.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Exams</h1>
        <p className="page-description">
          Manage examination schedules
        </p>
      </div>

      <DataTable
        data={exams}
        columns={columns}
        searchKey="name"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Create Exam
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Exam" : "Create Exam"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <Input placeholder="Exam Name" value={name} onChange={(e)=>setName(e.target.value)} />
                <Input placeholder="Semester" value={semester} onChange={(e)=>setSemester(e.target.value)} />
                <Input placeholder="Year (1-4)" value={year} onChange={(e)=>setYear(e.target.value)} />
                <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
                <Input placeholder="Subjects (comma separated)" value={subjects} onChange={(e)=>setSubjects(e.target.value)} />

                <Button onClick={() => editingId ? updateExam(editingId) : addExam()}>
                  {editingId ? "Update Exam" : "Create Exam"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
    </div>
  );
};

export default ExamsPage;
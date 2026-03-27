import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExamRow = {
  id: number;
  name: string;
  semester: number;
  year: number;
  startDate: string;
  endDate: string;
};

const defaultForm = {
  name: "",
  semester: "1",
  year: "",
  startDate: "",
  endDate: "",
};

const ExamsPage = () => {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchExams = () => {
    fetch("http://localhost:5000/api/exams")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((exam: any) => ({
          id: Number(exam.exam_id),
          name: exam.exam_name,
          semester: Number(exam.semester),
          year: Number(exam.year),
          startDate: exam.start_date ? String(exam.start_date).slice(0, 10) : "",
          endDate: exam.end_date ? String(exam.end_date).slice(0, 10) : "",
        }));

        setExams(formatted);
      });
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const resetDialog = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const saveExam = async () => {
    const endpoint = editingId
      ? `http://localhost:5000/api/exams/${editingId}`
      : "http://localhost:5000/api/exams";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_name: form.name,
        semester: Number(form.semester),
        year: Number(form.year),
        start_date: form.startDate,
        end_date: form.endDate,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to save exam");
      return;
    }

    setOpen(false);
    resetDialog();
    fetchExams();
  };

  const deleteExam = async (id: number) => {
    await fetch(`http://localhost:5000/api/exams/${id}`, {
      method: "DELETE",
    });

    fetchExams();
  };

  const columns = [
    {
      key: "name",
      header: "Exam",
      render: (exam: ExamRow) => <span className="font-medium">{exam.name}</span>,
    },
    {
      key: "semester",
      header: "Semester",
      render: (exam: ExamRow) => `Semester ${exam.semester}`,
    },
    {
      key: "year",
      header: "Year",
      render: (exam: ExamRow) => `Year ${exam.year}`,
    },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    {
      key: "actions",
      header: "Actions",
      render: (exam: ExamRow) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingId(exam.id);
              setForm({
                name: exam.name,
                semester: String(exam.semester),
                year: String(exam.year),
                startDate: exam.startDate,
                endDate: exam.endDate,
              });
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => deleteExam(exam.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-surface">
        <p className="section-kicker">Exam Calendar</p>
        <h1 className="page-header">Exams</h1>
        <p className="page-description max-w-2xl">
          Manage examination schedules, academic year grouping, and semester timelines through a more polished planning surface.
        </p>
      </section>

      <DataTable
        data={exams}
        columns={columns}
        searchKey="name"
        actions={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                resetDialog();
              }
            }}
          >
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
                <div className="grid gap-2">
                  <Label>Exam Name</Label>
                  <Input
                    placeholder="Exam Name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Semester</Label>
                    <Select
                      value={form.semester}
                      onValueChange={(value) => setForm((current) => ({ ...current, semester: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Year</Label>
                    <Select
                      value={form.year}
                      onValueChange={(value) => setForm((current) => ({ ...current, year: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    />
                  </div>
                </div>

                <Button onClick={saveExam}>
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

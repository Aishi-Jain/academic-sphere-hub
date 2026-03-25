import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { departments, deptShortNames } from "@/lib/mock-data";
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

const yearLabelMap: Record<string, string> = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
};

const regulationOptions = ["R22", "R25"];
const semesterOptions = ["1", "2"];
const yearOptions = ["1", "2", "3", "4"];

const normalizeSemester = (value: string | number) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  if (parsed === 1 || parsed === 2) return String(parsed);
  if (parsed >= 1 && parsed <= 8) return parsed % 2 === 0 ? "2" : "1";
  return "";
};

type SubjectRow = {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  year: string;
  regulation: string;
};

const defaultForm = {
  code: "",
  name: "",
  department: "",
  semester: "1",
  year: "1",
  regulation: "R22",
};

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const departmentMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    departments.forEach((d) => {
      map[d.id] = deptShortNames[d.name] || d.name;
    });
    return map;
  }, []);

  const fetchSubjects = () => {
    fetch("http://localhost:5000/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((s: any) => ({
          id: s.subject_id,
          code: s.subject_code,
          name: s.subject_name,
          department: String(s.department_id),
          semester: normalizeSemester(s.semester),
          year: String(s.year),
          regulation: s.regulation,
        }));

        setSubjects(formatted);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const resetDialog = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const saveSubject = async () => {
    const payload = {
      subject_code: form.code,
      subject_name: form.name,
      department_id: Number(form.department),
      semester: Number(form.semester),
      year: Number(form.year),
      regulation: form.regulation,
    };

    const endpoint = editingId
      ? `http://localhost:5000/api/subjects/${editingId}`
      : "http://localhost:5000/api/subjects";

    const method = editingId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || "Failed to save subject");
      return;
    }

    setOpen(false);
    resetDialog();
    fetchSubjects();
  };

  const deleteSubject = async (id: number) => {
    await fetch(`http://localhost:5000/api/subjects/${id}`, {
      method: "DELETE",
    });

    fetchSubjects();
  };

  const uploadCSV = async () => {
    if (!csvFile) {
      alert("Select CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    const res = await fetch("http://localhost:5000/api/upload-subjects", {
      method: "POST",
      body: formData,
    });

    const payload = await res.json();

    if (!res.ok) {
      alert(payload.error || "CSV upload failed");
      return;
    }

    alert(`Inserted ${payload.insertedCount} rows. Skipped ${payload.skippedCount || 0} malformed rows.`);
    fetchSubjects();
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      render: (s: SubjectRow) => <span className="font-mono text-xs">{s.code}</span>,
    },
    {
      key: "name",
      header: "Subject Name",
      render: (s: SubjectRow) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "regulation",
      header: "Regulation",
      render: (s: SubjectRow) => <Badge variant="outline">{s.regulation}</Badge>,
    },
    {
      key: "year",
      header: "Year",
      render: (s: SubjectRow) => yearLabelMap[s.year] || s.year,
    },
    {
      key: "department",
      header: "Department",
      render: (s: SubjectRow) => (
        <Badge variant="secondary" className="text-xs">
          {departmentMap[s.department] || s.department}
        </Badge>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (s: SubjectRow) => `Semester ${s.semester}`,
    },
    {
      key: "actions",
      header: "Actions",
      render: (s: SubjectRow) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingId(s.id);
              setForm({
                code: s.code,
                name: s.name,
                department: String(s.department),
                semester: normalizeSemester(s.semester),
                year: String(s.year),
                regulation: s.regulation,
              });
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteSubject(s.id)}
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
        <h1 className="page-header">Subjects</h1>
        <p className="page-description">Manage academic subjects</p>
      </div>

      <DataTable
        data={subjects}
        columns={columns}
        searchKey="name"
        filterKey="department"
        filterOptions={departments.map((d) => ({
          label: deptShortNames[d.name],
          value: d.id,
        }))}
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".csv"
              className="max-w-[230px]"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setCsvFile(e.target.files[0]);
                }
              }}
            />

            <Button variant="outline" size="sm" onClick={uploadCSV}>
              Upload CSV
            </Button>

            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) resetDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Subject
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Subject" : "Add Subject"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Code</Label>
                    <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                      className="rounded-md border border-input bg-background h-10 px-3"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {deptShortNames[d.name]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Regulation</Label>
                      <select
                        value={form.regulation}
                        onChange={(e) => setForm((p) => ({ ...p, regulation: e.target.value }))}
                        className="rounded-md border border-input bg-background h-10 px-3"
                      >
                        {regulationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <select
                        value={form.year}
                        onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                        className="rounded-md border border-input bg-background h-10 px-3"
                      >
                        {yearOptions.map((option) => (
                          <option key={option} value={option}>
                            {yearLabelMap[option]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Semester</Label>
                      <select
                        value={form.semester}
                        onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                        className="rounded-md border border-input bg-background h-10 px-3"
                      >
                        {semesterOptions.map((option) => (
                          <option key={option} value={option}>
                            Semester {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button onClick={saveSubject}>{editingId ? "Update Subject" : "Add Subject"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
    </div>
  );
};

export default SubjectsPage;

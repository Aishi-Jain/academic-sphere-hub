import { useEffect, useState } from "react";
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

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  const [csvFile, setCsvFile] = useState<File | null>(null);

  // 🔥 FETCH SUBJECTS
  useEffect(() => {
    fetch("http://localhost:5000/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((s: any) => ({
          id: s.subject_id,
          code: s.subject_code,
          name: s.subject_name,
          department: String(s.department_id),
          semester: s.semester,
        }));

        setSubjects(formatted);
      })
      .catch((err) => console.error(err));
  }, []);

  // 🔥 ADD
  const addSubject = async () => {
    await fetch("http://localhost:5000/api/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject_code: code,
        subject_name: name,
        department_id: department,
        semester,
      }),
    });

    setOpen(false);
    window.location.reload();
  };

  // 🔥 UPDATE
  const updateSubject = async (id: number) => {
    await fetch(`http://localhost:5000/api/subjects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject_code: code,
        subject_name: name,
        department_id: department,
        semester,
      }),
    });

    setEditingId(null);
    setOpen(false);
    window.location.reload();
  };

  // 🔥 DELETE
  const deleteSubject = async (id: number) => {
    await fetch(`http://localhost:5000/api/subjects/${id}`, {
      method: "DELETE",
    });

    window.location.reload();
  };

  // 🔥 CSV UPLOAD
  const uploadCSV = async () => {
    if (!csvFile) {
      alert("Select CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    await fetch("http://localhost:5000/api/upload-subjects", {
      method: "POST",
      body: formData,
    });

    alert("Subjects uploaded successfully");
    window.location.reload();
  };

  const departmentMap: any = {};
  departments.forEach((d) => {
    departmentMap[d.id] = deptShortNames[d.name];
  });

  const columns = [
    {
      key: "code",
      header: "Code",
      render: (s: any) => (
        <span className="font-mono text-xs">{s.code}</span>
      ),
    },
    {
      key: "name",
      header: "Subject Name",
      render: (s: any) => (
        <span className="font-medium">{s.name}</span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (s: any) => (
        <Badge variant="secondary" className="text-xs">
          {departmentMap[s.department] || s.department}
        </Badge>
      ),
    },
    {
      key: "semester",
      header: "Semester",
    },
    {
      key: "actions",
      header: "Actions",
      render: (s: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingId(s.id);
              setCode(s.code);
              setName(s.name);
              setDepartment(String(s.department));
              setSemester(String(s.semester));
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
        <p className="page-description">
          Manage academic subjects
        </p>
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
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files) {
                  setCsvFile(e.target.files[0]);
                }
              }}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={uploadCSV}
            >
              Upload CSV
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Subject
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId
                      ? "Edit Subject"
                      : "Add Subject"}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Code</Label>
                    <Input
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Department ID</Label>
                    <Input
                      value={department}
                      onChange={(e) =>
                        setDepartment(e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Semester</Label>
                    <Input
                      value={semester}
                      onChange={(e) =>
                        setSemester(e.target.value)
                      }
                    />
                  </div>

                  <Button
                    onClick={() => {
                      editingId
                        ? updateSubject(editingId)
                        : addSubject();
                    }}
                  >
                    {editingId
                      ? "Update Subject"
                      : "Add Subject"}
                  </Button>
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
import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const normalizeSemester = (value: string | number) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  if (parsed === 1 || parsed === 2) return String(parsed);
  if (parsed >= 1 && parsed <= 8) return parsed % 2 === 0 ? "2" : "1";
  return "";
};

const StudentsPage = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [regulation, setRegulation] = useState("R22");
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setName("");
    setRollNumber("");
    setDepartment("");
    setSection("");
    setYear("");
    setSemester("");
    setRegulation("R22");
    setEditingId(null);
  };

  const fetchStudents = () => {
    fetch("http://localhost:5000/students")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((s: any) => ({
          student_id: s.student_id,
          rollNumber: s.roll_number,
          name: s.name,
          department: String(s.department_id),
          year: String(s.year),
          semester: normalizeSemester(s.semester),
          section: s.section,
          regulation: s.regulation || "R22",
          cgpa: s.cgpa,
        }));

        setStudents(formatted);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        rollNumber,
        department_id: department,
        year,
        semester,
        section,
        regulation,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to add student");
      return;
    }

    setOpen(false);
    resetForm();
    fetchStudents();
  };

  const updateStudent = async (id: number) => {
    const res = await fetch(`http://localhost:5000/students/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        rollNumber,
        department_id: department,
        year,
        semester,
        section,
        regulation,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update student");
      return;
    }

    setOpen(false);
    resetForm();
    fetchStudents();
  };

  const deleteStudent = async (id: number) => {
    await fetch(`http://localhost:5000/students/${id}`, {
      method: "DELETE",
    });

    fetchStudents();
  };

  const uploadCSV = async () => {
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch("http://localhost:5000/api/upload-students", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      alert(`Students uploaded successfully. Malformed rows: ${data.malformedRows || 0}`);
      fetchStudents();
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  const departmentMap: any = {};
  departments.forEach((d) => {
    departmentMap[d.id] = deptShortNames[d.name];
  });

  const columns = [
    {
      key: "roll_number",
      header: "Roll Number",
      render: (s: any) => <span className="font-mono text-xs">{s.rollNumber}</span>,
    },
    { key: "name", header: "Name" },
    {
      key: "department",
      header: "Department",
      render: (s: any) => (
        <Badge variant="secondary" className="text-xs">
          {departmentMap[s.department]}
        </Badge>
      ),
    },
    {
      key: "regulation",
      header: "Regulation",
      render: (s: any) => <Badge variant="outline">{s.regulation}</Badge>,
    },
    { key: "year", header: "Year" },
    { key: "semester", header: "Semester", render: (s: any) => `Semester ${s.semester}` },
    { key: "section", header: "Section" },
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
              setEditingId(s.student_id);
              setName(s.name);
              setRollNumber(s.rollNumber);
              setDepartment(s.department);
              setYear(String(s.year));
              setSemester(normalizeSemester(s.semester));
              setSection(s.section);
              setRegulation(s.regulation || "R22");
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteStudent(s.student_id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const filterOptions = departments.map((d) => ({
    label: deptShortNames[d.name],
    value: String(d.id),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Students</h1>
        <p className="page-description">Manage student records across all departments</p>
      </div>

      <DataTable
        data={students}
        columns={columns}
        searchKey="rollNumber"
        filterKey="department"
        filterOptions={filterOptions}
        filterPlaceholder="Department"
        actions={
          <div className="flex items-center gap-2">
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

              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={uploadCSV}>
                <Upload className="h-3.5 w-3.5" /> Upload CSV
              </Button>
            </div>
            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Student" : "Add New Student"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Roll Number</Label>
                    <Input placeholder="e.g., 22Q91A0501" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Department</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {deptShortNames[d.name]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Section</Label>
                      <Select value={section} onValueChange={setSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Regulation</Label>
                      <Select value={regulation} onValueChange={setRegulation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="R22">R22</SelectItem>
                          <SelectItem value="R25">R25</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">I</SelectItem>
                          <SelectItem value="2">II</SelectItem>
                          <SelectItem value="3">III</SelectItem>
                          <SelectItem value="4">IV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Semester 1</SelectItem>
                          <SelectItem value="2">Semester 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      if (editingId) {
                        updateStudent(editingId);
                      } else {
                        addStudent(e);
                      }
                    }}
                  >
                    {editingId ? "Update Student" : "Add Student"}
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

export default StudentsPage;

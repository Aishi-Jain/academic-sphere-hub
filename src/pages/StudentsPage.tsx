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

const StudentsPage = () => {

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState([]);
  console.log(students);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/students")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((s:any) => ({
          student_id: s.student_id,
          rollNumber: s.roll_number,
          name: s.name,
          department: s.department_id,
          year: s.year,
          semester: s.semester,
          section: s.section,
          cgpa: s.cgpa
        }));

        setStudents(formatted);
      })
      .catch(err => console.error(err));
  }, []);

  const addStudent = async (e: any) => {
    e.preventDefault();   // stops page reload

    console.log("Sending student...");

    const res = await fetch("http://localhost:5000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        rollNumber,
        department_id: department,
        year,
        semester,
        section,
        cgpa: 0
      })
    });

    const data = await res.json();
    console.log(data);

    setOpen(false);

    window.location.reload();
  };

  const columns = [
  {
    key: 'rollNumber',
    header: 'Roll Number',
    render: (s:any) => (
      <span className="font-mono text-xs">{s.rollNumber}</span>
    )
  },
    { key: 'name', header: 'Name' },
    {
      key: 'department',
      header: 'Department',
      render: (s:any) => (
        <Badge variant="secondary" className="text-xs">
          {departmentMap[s.department]}
        </Badge>
      )
    },
    { key: 'year', header: 'Year' },
    { key: 'semester', header: 'Semester' },
    { key: 'section', header: 'Section' },
    { key: 'cgpa', header: 'CGPA', render: (s: any) => <span className="font-medium">{s.cgpa}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (s:any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingId(s.student_id);

              setName(s.name);
              setRollNumber(s.rollNumber);
              setDepartment(s.department_id);
              setYear(s.year);
              setSemester(s.semester);
              setSection(s.section);
              setCgpa(s.cgpa);

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

  const filterOptions = departments.map(d => ({
    label: deptShortNames[d.name],
    value: d.name,
  }));

  const deleteStudent = async (id:any) => {

    await fetch(`http://localhost:5000/students/${id}`, {
      method: "DELETE"
    });

    window.location.reload();
  };

  const updateStudent = async (id:any) => {

    await fetch(`http://localhost:5000/students/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        rollNumber,
        department_id: department,
        year,
        semester,
        section,
        cgpa
      })
    });

    setEditingId(null);
    setOpen(false);
    window.location.reload();
  };

  const departmentMap:any = {};
  departments.forEach(d => {
    departmentMap[d.id] = deptShortNames[d.name];
  });

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
        body: formData
      });

      const data = await res.json();
      console.log(data);

      alert("Students uploaded successfully");

      window.location.reload();

    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }

  };

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

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={uploadCSV}
              >
                <Upload className="h-3.5 w-3.5" /> Upload CSV
              </Button>

            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Student name"
                      value={name}
                      onChange={(e)=>setName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Roll Number</Label>
                    <Input
                      placeholder="e.g., 22Q91A0501"
                      value={rollNumber}
                      onChange={(e)=>setRollNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Department</Label>
                      <Select onValueChange={setDepartment}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{deptShortNames[d.name]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Section</Label>
                      <Select onValueChange={setSection}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        placeholder="1-4"
                        value={year}
                        onChange={(e)=>setYear(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Semester</Label>
                      <Input
                        type="number"
                        placeholder="1-8"
                        value={semester}
                        onChange={(e)=>setSemester(e.target.value)}
                      />
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

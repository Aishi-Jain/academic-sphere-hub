import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { departments, deptShortNames } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FacultyRow = {
  id: string;
  faculty_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
};

const designationOptions = [
  "HOD",
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lab Incharge",
];

const FacultyPage = () => {
  const [open, setOpen] = useState(false);
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [facultyId, setFacultyId] = useState("");
  const [designation, setDesignation] = useState("");

  const fetchFaculty = () => {
    fetch("http://localhost:5000/api/faculty")
      .then((res) => res.json())
      .then((data) => {
        setFaculty(
          data.map((member: any) => ({
            id: member.faculty_id,
            faculty_id: member.faculty_id,
            name: member.name,
            email: member.email,
            department: String(member.department_id),
            designation: member.designation,
          }))
        );
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const departmentMap = useMemo(() => {
    const map: Record<string, string> = {};
    departments.forEach((item) => {
      map[item.id] = deptShortNames[item.name];
    });
    return map;
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFacultyId("");
    setName("");
    setEmail("");
    setDepartment("");
    setDesignation("");
  };

  const addFaculty = async () => {
    await fetch("http://localhost:5000/api/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        faculty_id: facultyId,
        name,
        email,
        department_id: department,
        designation,
      }),
    });

    setOpen(false);
    resetForm();
    fetchFaculty();
  };

  const deleteFaculty = async (id: string) => {
    await fetch(`http://localhost:5000/api/faculty/${id}`, {
      method: "DELETE",
    });

    fetchFaculty();
  };

  const updateFaculty = async (id: string) => {
    await fetch(`http://localhost:5000/api/faculty/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        department_id: department,
        designation,
      }),
    });

    setOpen(false);
    resetForm();
    fetchFaculty();
  };

  const uploadFacultyCSV = async () => {
    if (!csvFile) {
      alert("Select CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    const res = await fetch("http://localhost:5000/api/upload-faculty", {
      method: "POST",
      body: formData,
    });

    await res.json();
    alert("Faculty uploaded successfully");
    fetchFaculty();
  };

  const columns = [
    {
      key: "id",
      header: "Faculty ID",
      render: (member: FacultyRow) => <span className="font-mono text-xs">{member.id}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (member: FacultyRow) => <span className="font-medium">{member.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (member: FacultyRow) => <span className="text-sm text-muted-foreground">{member.email}</span>,
    },
    {
      key: "department",
      header: "Department",
      render: (member: FacultyRow) => (
        <Badge variant="secondary" className="text-xs">
          {departmentMap[member.department] || member.department}
        </Badge>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      render: (member: FacultyRow) => <Badge variant="outline">{member.designation}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (member: FacultyRow) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingId(member.id);
              setFacultyId(member.id);
              setName(member.name || "");
              setEmail(member.email || "");
              setDepartment(String(member.department || ""));
              setDesignation(member.designation || "");
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteFaculty(member.id)}
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
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Faculty Registry</p>
            <h1 className="page-header">Faculty</h1>
            <p className="page-description max-w-2xl">
              Manage teaching staff, HOD roles, department mapping, and faculty onboarding with a cleaner registry workspace.
            </p>
          </div>
          <div className="glass-panel self-start">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Quick Snapshot</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex min-h-[116px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-muted-foreground">Faculty Count</p>
                <p className="text-4xl font-semibold leading-none text-foreground">{faculty.length}</p>
              </div>
              <div className="flex min-h-[116px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-4xl font-semibold leading-none text-foreground">{departments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DataTable
        data={faculty}
        columns={columns}
        searchKey="name"
        filterKey="department"
        filterOptions={departments.map((departmentItem) => ({
          label: deptShortNames[departmentItem.name],
          value: departmentItem.id,
        }))}
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".csv"
              className="max-w-[220px]"
              onChange={(e) => {
                if (e.target.files) setCsvFile(e.target.files[0]);
              }}
            />

            <Button variant="outline" size="sm" onClick={uploadFacultyCSV}>
              Upload CSV
            </Button>

            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Faculty
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input placeholder="Faculty name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="e.g., faculty@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((departmentItem) => (
                          <SelectItem key={departmentItem.id} value={departmentItem.id}>
                            {deptShortNames[departmentItem.name]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Faculty ID</Label>
                    <Input
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      disabled={editingId !== null}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Designation</Label>
                    <Select value={designation} onValueChange={setDesignation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      if (editingId !== null) {
                        updateFaculty(editingId);
                      } else {
                        addFaculty();
                      }
                    }}
                  >
                    {editingId !== null ? "Update Faculty" : "Add Faculty"}
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

export default FacultyPage;

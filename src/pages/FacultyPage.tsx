import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FacultyPage = () => {

  const [open, setOpen] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {

    fetch("http://localhost:5000/api/faculty")
      .then(res => res.json())
      .then(data => {

        const formatted = data.map((f:any) => ({
          id: f.faculty_id,   // ✅ IMPORTANT CHANGE
          name: f.name,
          email: f.email,
          department: String(f.department_id)
        }));

        console.log("Faculty Data:", formatted);

        setFaculty(formatted);

      })
      .catch(err => console.error(err));

  }, []);

  const departmentMap: any = {};

  departments.forEach(d => {
    departmentMap[d.id] = deptShortNames[d.name];
  });

  const columns = [
    {
      key: 'id',
      header: 'Faculty ID',
      render: (f:any) => <span>{f.faculty_id}</span>
    },

    {
      key: 'name',
      header: 'Name',
      render: (f:any) => <span>{f.name}</span>
    },


    {
      key: 'department',
      header: 'Department',
      render: (f: any) => (
        <Badge variant="secondary" className="text-xs">
          {departmentMap[f.department] || f.department}
        </Badge>
      )
    },

    {
      key: 'actions',
      header: 'Actions',
      render: (f:any) => (
        <div className="flex items-center gap-1">

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {

              console.log("Editing faculty:", f);

              setEditingId(f.id);

              setName(f.name || "");
              setEmail(f.email || "");
              setDepartment(String(f.department || ""));

              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteFaculty(f.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

        </div>
      )
    }
  ];

  const addFaculty = async () => {

    await fetch("http://localhost:5000/api/faculty", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        department_id: department
      })
    });

    setOpen(false);
    window.location.reload();
  };

  const deleteFaculty = async (id:any) => {

    await fetch(`http://localhost:5000/api/faculty/${id}`, {
      method: "DELETE"
    });

    window.location.reload();
  };

  const updateFaculty = async (id:any) => {

    console.log("Sending update for:", id);

    await fetch(`http://localhost:5000/api/faculty/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        department_id: department
      })
    });

    setEditingId(null);
    setOpen(false);
    window.location.reload();
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
      body: formData
    });

    await res.json();

    alert("Faculty uploaded successfully");

    window.location.reload();
  };

  return (

    <div className="space-y-6">

      <div>
        <h1 className="page-header">Faculty</h1>
        <p className="page-description">
          Manage faculty members and assignments
        </p>
      </div>

      

      <DataTable
        data={faculty}
        columns={columns}
        searchKey="name"
        //filterKey="department"
        //filterOptions={departments.map(d => ({
          //label: deptShortNames[d.name],
          //value: d.id   // ✅ IMPORTANT
        //}))}

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
              onClick={uploadFacultyCSV}
            >
              Upload CSV
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>

              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Faculty
                </Button>
              </DialogTrigger>

              <DialogContent>

                <DialogHeader>
                  <DialogTitle>Add Faculty</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Faculty name"
                      value={name}
                      onChange={(e)=>setName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="e.g., faculty@college.edu"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">

                    <Label>Department</Label>

                    <Select onValueChange={setDepartment}>

                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>

                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {deptShortNames[d.name]}
                          </SelectItem>
                        ))}
                      </SelectContent>

                    </Select>

                  </div>

                  <Button
                    onClick={() => {

                      console.log("editingId:", editingId);

                      if (editingId !== null) {
                        console.log("UPDATE CALLED");
                        updateFaculty(editingId);
                      } else {
                        console.log("ADD CALLED");
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
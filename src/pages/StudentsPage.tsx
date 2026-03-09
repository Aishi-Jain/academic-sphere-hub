import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { students, departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentsPage = () => {
  const [open, setOpen] = useState(false);

  const columns = [
    { key: 'rollNumber', header: 'Roll Number', render: (s: any) => <span className="font-mono text-xs">{s.rollNumber}</span> },
    { key: 'name', header: 'Name' },
    {
      key: 'department', header: 'Department',
      render: (s: any) => <Badge variant="secondary" className="text-xs">{deptShortNames[s.department] || s.department}</Badge>
    },
    { key: 'year', header: 'Year' },
    { key: 'semester', header: 'Semester' },
    { key: 'section', header: 'Section' },
    { key: 'cgpa', header: 'CGPA', render: (s: any) => <span className="font-medium">{s.cgpa}</span> },
    {
      key: 'actions', header: 'Actions',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const filterOptions = departments.map(d => ({
    label: deptShortNames[d.name],
    value: d.name,
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
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" /> Upload CSV
            </Button>
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
                    <Input placeholder="Student name" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Roll Number</Label>
                    <Input placeholder="e.g., 22Q91A0501" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Department</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.name}>{deptShortNames[d.name]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Section</Label>
                      <Select>
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
                      <Input type="number" placeholder="1-4" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Semester</Label>
                      <Input type="number" placeholder="1-8" />
                    </div>
                  </div>
                  <Button onClick={() => setOpen(false)}>Add Student</Button>
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

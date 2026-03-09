import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { faculty, departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FacultyPage = () => {
  const [open, setOpen] = useState(false);

  const columns = [
    { key: 'facultyId', header: 'Faculty ID', render: (f: any) => <span className="font-mono text-xs">{f.facultyId}</span> },
    { key: 'name', header: 'Name', render: (f: any) => <span className="font-medium">{f.name}</span> },
    { key: 'department', header: 'Department', render: (f: any) => <Badge variant="secondary" className="text-xs">{deptShortNames[f.department] || f.department}</Badge> },
    { key: 'subjectsAssigned', header: 'Subjects', render: (f: any) => <div className="flex gap-1 flex-wrap">{f.subjectsAssigned.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div> },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Faculty</h1>
        <p className="page-description">Manage faculty members and assignments</p>
      </div>
      <DataTable
        data={faculty}
        columns={columns}
        searchKey="name"
        filterKey="department"
        filterOptions={departments.map(d => ({ label: deptShortNames[d.name], value: d.name }))}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Faculty</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Faculty</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Name</Label><Input placeholder="Faculty name" /></div>
                <div className="grid gap-2"><Label>Faculty ID</Label><Input placeholder="e.g., FAC009" /></div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{deptShortNames[d.name]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setOpen(false)}>Add Faculty</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
    </div>
  );
};

export default FacultyPage;

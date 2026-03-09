import { DataTable } from "@/components/DataTable";
import { subjects, departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SubjectsPage = () => {
  const columns = [
    { key: 'code', header: 'Code', render: (s: any) => <span className="font-mono text-xs">{s.code}</span> },
    { key: 'name', header: 'Subject Name', render: (s: any) => <span className="font-medium">{s.name}</span> },
    { key: 'department', header: 'Department', render: (s: any) => <Badge variant="secondary" className="text-xs">{deptShortNames[s.department]}</Badge> },
    { key: 'semester', header: 'Semester' },
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
      <div><h1 className="page-header">Subjects</h1><p className="page-description">Manage academic subjects</p></div>
      <DataTable
        data={subjects}
        columns={columns}
        searchKey="name"
        filterKey="department"
        filterOptions={departments.map(d => ({ label: deptShortNames[d.name], value: d.name }))}
        actions={<Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Subject</Button>}
      />
    </div>
  );
};

export default SubjectsPage;

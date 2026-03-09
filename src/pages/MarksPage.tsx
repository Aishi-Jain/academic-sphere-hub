import { useRole } from "@/lib/role-context";
import { DataTable } from "@/components/DataTable";
import { marks, subjects, departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MarksPage = () => {
  const { role } = useRole();

  const columns = [
    { key: 'studentRollNumber', header: 'Roll Number', render: (m: any) => <span className="font-mono text-xs">{m.studentRollNumber}</span> },
    { key: 'subject', header: 'Subject' },
    { key: 'internal', header: 'Internal' },
    { key: 'external', header: 'External' },
    { key: 'total', header: 'Total', render: (m: any) => <span className="font-semibold">{m.total}</span> },
    {
      key: 'grade', header: 'Grade',
      render: (m: any) => {
        const color = m.grade === 'O' || m.grade === 'A+' ? 'bg-success/10 text-success' : m.grade === 'F' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary';
        return <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>{m.grade}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Marks</h1>
        <p className="page-description">{role === 'faculty' ? 'Upload and manage student marks' : 'View marks records'}</p>
      </div>
      <DataTable
        data={marks}
        columns={columns}
        searchKey="studentRollNumber"
        actions={role === 'faculty' ? <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Upload Marks</Button> : undefined}
      />
    </div>
  );
};

export default MarksPage;

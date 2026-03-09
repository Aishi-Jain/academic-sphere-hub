import { DataTable } from "@/components/DataTable";
import { exams } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ExamsPage = () => {
  const columns = [
    { key: 'name', header: 'Exam', render: (e: any) => <span className="font-medium">{e.name}</span> },
    { key: 'semester', header: 'Semester' },
    { key: 'startDate', header: 'Start Date' },
    { key: 'endDate', header: 'End Date' },
    { key: 'subjects', header: 'Subjects', render: (e: any) => <div className="flex gap-1 flex-wrap">{e.subjects.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div> },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="page-header">Exams</h1><p className="page-description">Manage examination schedules</p></div>
      <DataTable
        data={exams}
        columns={columns}
        searchKey="name"
        actions={<Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Create Exam</Button>}
      />
    </div>
  );
};

export default ExamsPage;

import { DataTable } from "@/components/DataTable";
import { classrooms } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ClassroomsPage = () => {
  const columns = [
    { key: 'roomNumber', header: 'Room', render: (c: any) => <span className="font-medium">{c.roomNumber}</span> },
    { key: 'capacity', header: 'Capacity' },
    { key: 'department', header: 'Block' },
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
      <div><h1 className="page-header">Classrooms</h1><p className="page-description">Manage classroom resources</p></div>
      <DataTable
        data={classrooms}
        columns={columns}
        searchKey="roomNumber"
        actions={<Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Classroom</Button>}
      />
    </div>
  );
};

export default ClassroomsPage;

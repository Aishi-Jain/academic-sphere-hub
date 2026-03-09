import { useState } from "react";
import { students, classrooms, departments, deptShortNames } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Grid3X3, Download, Upload } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Users, DoorOpen, Building2 } from "lucide-react";

const deptPairs: [string, string][] = [
  ['Computer Science & Engineering', 'Computer Science & Machine Learning'],
  ['Computer Science & Data Science', 'Electronics & Communication Engineering'],
  ['Information Technology', 'AI & Data Science'],
];

interface BenchAllocation {
  bench: number;
  student1: { name: string; roll: string; dept: string };
  student2: { name: string; roll: string; dept: string };
}

const SeatingPage = () => {
  const [generated, setGenerated] = useState(false);
  const [allocations, setAllocations] = useState<{ room: string; benches: BenchAllocation[] }[]>([]);

  const generateSeating = () => {
    const result: { room: string; benches: BenchAllocation[] }[] = [];

    for (const room of classrooms.slice(0, 3)) {
      const benches: BenchAllocation[] = [];
      const pairIndex = result.length % deptPairs.length;
      const [dept1, dept2] = deptPairs[pairIndex];
      const s1 = students.filter(s => s.department === dept1);
      const s2 = students.filter(s => s.department === dept2);

      for (let i = 0; i < 30; i++) {
        const st1 = s1[i % s1.length];
        const st2 = s2[i % s2.length];
        benches.push({
          bench: i + 1,
          student1: { name: st1.name, roll: st1.rollNumber, dept: deptShortNames[st1.department] },
          student2: { name: st2.name, roll: st2.rollNumber, dept: deptShortNames[st2.department] },
        });
      }
      result.push({ room: room.roomNumber, benches });
    }
    setAllocations(result);
    setGenerated(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Seating Allocation Engine</h1>
        <p className="page-description">Generate exam seating with department-pair rules</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} />
        <StatCard title="Available Rooms" value={classrooms.length} icon={DoorOpen} />
        <StatCard title="Departments" value={departments.length} icon={Building2} />
      </div>

      <div className="stat-card space-y-4">
        <h3 className="text-sm font-medium text-foreground">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Exam</label>
            <Select defaultValue="mid1">
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mid1">Mid 1</SelectItem>
                <SelectItem value="mid2">Mid 2</SelectItem>
                <SelectItem value="semester">Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Rooms</label>
            <Select defaultValue="all">
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {classrooms.map(c => <SelectItem key={c.id} value={c.id}>{c.roomNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Upload className="h-3.5 w-3.5" /> Upload CSV</Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={generateSeating}>
              <Grid3X3 className="h-3.5 w-3.5" /> Generate Seating
            </Button>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground"><strong>Rule:</strong> Each bench has 2 students from different departments. Pairs: CSE↔CSM, CSD↔ECE, IT↔AIDS</p>
        </div>
      </div>

      {generated && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Seating Report</h3>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export PDF</Button>
          </div>

          {allocations.map((alloc, ri) => (
            <motion.div key={alloc.room} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.1 }} className="stat-card space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">{alloc.room}</h4>
                <Badge variant="secondary" className="text-xs">{alloc.benches.length * 2} Students</Badge>
              </div>

              {/* Visual Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
                {alloc.benches.map((b) => (
                  <div key={b.bench} className="flex flex-col gap-0.5">
                    <div className="text-[9px] text-center text-muted-foreground">B{b.bench}</div>
                    <div className="h-6 rounded-sm bg-primary/15 flex items-center justify-center text-[8px] font-mono text-primary">{b.student1.dept}</div>
                    <div className="h-6 rounded-sm bg-info/15 flex items-center justify-center text-[8px] font-mono text-info">{b.student2.dept}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Bench</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student 1</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Dept</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student 2</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Dept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alloc.benches.slice(0, 10).map(b => (
                      <tr key={b.bench} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{b.bench}</td>
                        <td className="px-3 py-2 font-mono">{b.student1.roll}</td>
                        <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{b.student1.dept}</Badge></td>
                        <td className="px-3 py-2 font-mono">{b.student2.roll}</td>
                        <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{b.student2.dept}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeatingPage;

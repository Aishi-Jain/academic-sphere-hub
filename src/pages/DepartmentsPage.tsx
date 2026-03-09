import { departments, deptShortNames, students, faculty } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Building2, Users, GraduationCap } from "lucide-react";

const DepartmentsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Departments</h1>
        <p className="page-description">All academic departments</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => {
          const studentCount = students.filter(s => s.department === dept.name).length;
          const facultyCount = faculty.filter(f => f.department === dept.name).length;
          return (
            <motion.div key={dept.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{deptShortNames[dept.name]}</h3>
                    <p className="text-xs text-muted-foreground">{dept.name}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono">{dept.code}</Badge>
              </div>
              <div className="flex gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />{studentCount} Students
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" />{facultyCount} Faculty
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentsPage;

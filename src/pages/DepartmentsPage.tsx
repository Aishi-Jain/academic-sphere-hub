import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { departments, deptShortNames } from "@/lib/mock-data";
import { Building2, GraduationCap, Users } from "lucide-react";

const DepartmentsPage = () => {
  const [deptStats, setDeptStats] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/departments-stats")
      .then((res) => res.json())
      .then((data) => setDeptStats(data))
      .catch((err) => console.error(err));
  }, []);

  const totalStudents = deptStats.reduce((sum, item) => sum + Number(item.studentCount || 0), 0);
  const totalFaculty = deptStats.reduce((sum, item) => sum + Number(item.facultyCount || 0), 0);

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Academic Structure</p>
            <h1 className="page-header">Departments</h1>
            <p className="page-description max-w-2xl">
              Review department distribution, short codes, and academic staffing at a glance through a more polished overview surface.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Departments</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{departments.length}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{totalStudents}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Faculty</p>
              <p className="mt-2 text-2xl font-semibold text-violet-200">{totalFaculty}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((department, index) => {
          const stats = deptStats.find((item) => item.department_name === department.name);
          const studentCount = stats?.studentCount || 0;
          const facultyCount = stats?.facultyCount || 0;

          return (
            <motion.div
              key={department.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="data-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--accent-cyan))/0.16] bg-[hsl(var(--accent-cyan))/0.12]">
                    <Building2 className="h-5 w-5 text-[hsl(var(--accent-cyan))]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{deptShortNames[department.name]}</h3>
                    <p className="text-sm text-muted-foreground">{department.name}</p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono">
                  {department.code}
                </Badge>
              </div>

              <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Students
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{studentCount}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    Faculty
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{facultyCount}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
};

export default DepartmentsPage;

import { circulars, deptShortNames } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const CircularsPage = () => {
  const { role } = useRole();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-header">Circulars</h1><p className="page-description">Announcements and notices</p></div>
        {role === 'admin' && <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Circular</Button>}
      </div>
      <div className="space-y-4">
        {circulars.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{c.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{c.author} · {c.date}</p>
                </div>
              </div>
              <Badge variant={c.department === 'global' ? 'default' : 'secondary'} className="text-xs shrink-0">
                {c.department === 'global' ? 'Global' : deptShortNames[c.department] || c.department}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CircularsPage;

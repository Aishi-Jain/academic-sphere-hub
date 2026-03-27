import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && <p className="text-xs font-medium text-success">{trend}</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-primary shadow-[0_0_28px_var(--glow-cyan)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

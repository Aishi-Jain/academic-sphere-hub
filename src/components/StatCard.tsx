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
      <div className="relative z-10 flex min-h-[132px] items-start justify-between gap-4">
        <div className="flex min-h-full flex-1 flex-col justify-between gap-4">
          <p className="max-w-[12ch] text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          <p className="text-4xl font-bold leading-none text-foreground">{value}</p>
          {trend && <p className="text-xs font-medium text-success">{trend}</p>}
        </div>
        <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.07] text-primary shadow-[0_0_24px_var(--glow-cyan)]">
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/lib/mock-data";
import { Bell, ClipboardList, FileText, Grid3X3, Megaphone } from "lucide-react";

const iconMap = {
  exam: FileText,
  marks: ClipboardList,
  circular: Megaphone,
  seating: Grid3X3,
};

const NotificationsPage = () => {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Alert Center</p>
            <h1 className="page-header">Notifications</h1>
            <p className="page-description max-w-2xl">
              Stay updated on exams, marks, circulars, and seating alerts from a calmer, easier-to-scan notification center.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{notifications.length}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{unreadCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {notifications.map((notification, index) => {
          const Icon = iconMap[notification.type] || Bell;
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`data-card flex items-start gap-4 ${!notification.read ? "ring-1 ring-[hsl(var(--accent-cyan))/0.18]" : ""}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                  !notification.read
                    ? "border-[hsl(var(--accent-cyan))/0.16] bg-[hsl(var(--accent-cyan))/0.12]"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    !notification.read ? "text-[hsl(var(--accent-cyan))]" : "text-muted-foreground"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{notification.title}</h3>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-[hsl(var(--accent-cyan))]" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {notification.date}
                </p>
              </div>

              <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                {notification.type}
              </Badge>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
};

export default NotificationsPage;

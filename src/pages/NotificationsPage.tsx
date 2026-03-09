import { notifications } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Bell, FileText, ClipboardList, Megaphone, Grid3X3 } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  exam: FileText,
  marks: ClipboardList,
  circular: Megaphone,
  seating: Grid3X3,
};

const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div><h1 className="page-header">Notifications</h1><p className="page-description">Stay updated with latest alerts</p></div>
      <div className="space-y-3">
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`stat-card flex items-start gap-3 ${!n.read ? 'border-primary/30' : ''}`}
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`h-4 w-4 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground text-sm">{n.title}</h3>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize shrink-0">{n.type}</Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPage;

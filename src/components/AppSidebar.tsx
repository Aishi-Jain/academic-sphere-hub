import {
  Home, LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
  DoorOpen, FileText, Grid3X3, ClipboardList, BarChart3, Megaphone, ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "../assets/AS logo.png";

const allItems = [
  { title: "Home", url: "/home", icon: Home, roles: ["admin", "faculty", "student"] },
  { title: "Dashboard", url: "/AdminDashboard", icon: LayoutDashboard, roles: ["admin"] },
  { title: "Dashboard", url: "/FacultyDashboard", icon: LayoutDashboard, roles: ["faculty"] },
  { title: "Dashboard", url: "/StudentDashboard", icon: LayoutDashboard, roles: ["student"] },
  { title: "Students", url: "/students", icon: Users, roles: ["admin", "faculty"] },
  { title: "Faculty", url: "/faculty", icon: GraduationCap, roles: ["admin", "faculty"] },
  { title: "Departments", url: "/departments", icon: Building2, roles: ["admin"] },
  { title: "Subjects", url: "/subjects", icon: BookOpen, roles: ["admin", "faculty"] },
  { title: "Marks", url: "/marks", icon: BookOpen, roles: ["faculty"] },
  { title: "My Marks", url: "/student/marks", icon: BookOpen, roles: ["student"] },
  { title: "Classrooms", url: "/classrooms", icon: DoorOpen, roles: ["admin"] },
  { title: "Exams", url: "/exams", icon: FileText, roles: ["admin"] },
  { title: "Seating", url: "/seating", icon: Grid3X3, roles: ["admin", "faculty", "student"] },
  { title: "Invigilation", url: "/invigilation", icon: ShieldCheck, roles: ["admin", "faculty", "student"] },
  { title: "Results", url: "/results", icon: ClipboardList, roles: ["admin", "faculty", "student"] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["admin", "faculty", "student"] },
  { title: "Circulars", url: "/circulars", icon: Megaphone, roles: ["admin", "faculty", "student"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const items = allItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-r-0 p-3"
    >
      <SidebarContent className="rounded-[28px] border border-white/10 bg-sidebar/90 px-3 py-4 shadow-2xl backdrop-blur-2xl">
        <div className="mb-4 flex items-center gap-3 px-2 py-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-lg">
            <img
              src={logo}
              alt="Academic Sphere Logo"
              className={`${collapsed ? "h-8 w-8" : "h-10 w-10"} object-contain`}
            />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold text-sidebar-foreground">Academic Sphere</div>
              <div className="text-xs text-sidebar-foreground/60">Hub Control Center</div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/45">
            {!collapsed && "Platform"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => (
                <SidebarMenuItem key={`${item.title}-${item.url}`}>
                  <SidebarMenuButton asChild tooltip={item.title} className="h-11 rounded-2xl px-3">
                    <NavLink
                      to={item.url}
                      end={item.url === "/home"}
                      className="flex items-center gap-3 text-sidebar-foreground/75"
                      activeClassName="bg-gradient-to-r from-primary/25 to-accent/15 text-sidebar-foreground shadow-[0_0_0_1px_var(--border-soft),0_0_28px_var(--glow-violet)]"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

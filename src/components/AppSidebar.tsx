import {
  Home, LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
  DoorOpen, FileText, Grid3X3, ClipboardList, BarChart3, Megaphone,
  Bell, Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useRole } from "@/lib/role-context";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const allItems = [
  { title: "Home", url: "/", icon: Home, roles: ['admin', 'faculty', 'student'] },
  { title: "Dashboard", url: "/AdminDashboard", icon: LayoutDashboard, roles: ['admin'] },
  { title: "Dashboard", url: "/FacultyDashboard", icon: LayoutDashboard, roles: ['faculty'] },
  { title: "Dashboard", url: "/StudentDashboard", icon: LayoutDashboard, roles: ['student'] },
  //{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'faculty', 'student'] },
  { title: "Students", url: "/students", icon: Users, roles: ['admin', 'faculty'] },
  { title: "Faculty", url: "/faculty", icon: GraduationCap, roles: ['admin'] },
  { title: "Departments", url: "/departments", icon: Building2, roles: ['admin'] },
  { title: "Subjects", url: "/subjects", icon: BookOpen, roles: ['admin', 'faculty'] },
  { title: "Classrooms", url: "/classrooms", icon: DoorOpen, roles: ['admin'] },
  { title: "Exams", url: "/exams", icon: FileText, roles: ['admin'] },
  { title: "Seating Allocation", url: "/seating", icon: Grid3X3, roles: ['admin', 'student'] },
  { title: "Results", url: "/results", icon: ClipboardList, roles: ['admin', 'faculty', 'student'] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ['admin', 'faculty'] },
  { title: "Circulars", url: "/circulars", icon: Megaphone, roles: ['admin', 'faculty', 'student'] },
  //{ title: "Notifications", url: "/notifications", icon: Bell, roles: ['admin', 'student'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const location = useLocation();

  const items = allItems.filter(item => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className={`px-4 py-5 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight">Academic Sphere</h1>
                <p className="text-[10px] text-muted-foreground">Enterprise ERP</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground/70 px-4">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
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

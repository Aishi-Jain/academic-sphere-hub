import {
  Home, LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
  DoorOpen, FileText, Grid3X3, ClipboardList, BarChart3, Megaphone, ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "../assets/AS logo.png"; // ✅ IMPORT LOGO

const allItems = [
  { title: "Home", url: "/", icon: Home, roles: ['admin', 'faculty', 'student'] },
  { title: "Dashboard", url: "/AdminDashboard", icon: LayoutDashboard, roles: ['admin'] },
  { title: "Dashboard", url: "/FacultyDashboard", icon: LayoutDashboard, roles: ['faculty'] },
  { title: "Dashboard", url: "/StudentDashboard", icon: LayoutDashboard, roles: ['student'] },
  { title: "Students", url: "/students", icon: Users, roles: ['admin', 'faculty'] },
  { title: "Faculty", url: "/faculty", icon: GraduationCap, roles: ['admin'] },
  { title: "Departments", url: "/departments", icon: Building2, roles: ['admin'] },
  { title: "Subjects", url: "/subjects", icon: BookOpen, roles: ['faculty'] },
  { title: "Marks", url: "/marks", icon: BookOpen, roles: ['faculty'] },
  { title: "My Marks", url: "/student/marks", icon: BookOpen, roles: ['student'] },
  { title: "Classrooms", url: "/classrooms", icon: DoorOpen, roles: ['admin'] },
  { title: "Exams", url: "/exams", icon: FileText, roles: ['admin'] },
  { title: "Seating Allocation", url: "/seating", icon: Grid3X3, roles: ['admin', 'faculty', 'student'] },
  { title: "Invigilation", url: "/invigilation", icon: ShieldCheck, roles: ['admin', 'faculty', 'student'] },
  { title: "Results", url: "/results", icon: ClipboardList, roles: ['admin', 'faculty', 'student'] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ['admin', 'faculty', 'student'] },
  { title: "Circulars", url: "/circulars", icon: Megaphone, roles: ['admin', 'faculty', 'student'] },
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

        {/* 🔥 LOGO SECTION */}
        <div className="px-4 py-5 flex items-center">
          <img
            src={logo}
            alt="Academic Sphere Logo"
            className={`
              object-contain transition-all duration-300
              ${collapsed 
                ? "w-10 h-10 mx-auto"   // keep centered ONLY when collapsed
                : "w-full max-w-[160px] h-auto"  // left aligned when expanded
              }
              drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]
            `}
          />
        </div>

        {/* 🔥 NAVIGATION */}
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

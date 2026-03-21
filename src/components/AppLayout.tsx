import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useRole } from "@/lib/role-context";
import { UserRole } from "@/lib/types";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Outlet } from "react-router-dom";

import { Navigate } from "react-router-dom";

  const ProtectedRoute = ({ children, allowedRoles }: any) => {

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const { role } = useRole();

    // Not logged in
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Role not allowed
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };


const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, setRole } = useRole();

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          
          {/* HEADER */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>

            <div className="flex items-center gap-3">

              {/* ❌ REMOVE THIS LATER (role switching) */}
              {/* <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select> */}

              

              {/*<Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                    3
                  </Badge>
                </Button>
              </Link>*/}

              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {role === "admin" ? "AD" : role === "faculty" ? "FC" : "ST"}
              </div>

              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>

            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 p-6 overflow-auto">
            {children} 
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
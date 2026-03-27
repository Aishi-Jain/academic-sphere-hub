import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <SidebarProvider>
      <div className="app-shell flex min-h-screen w-full">
        <AppSidebar />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/5 bg-background/70 px-4 py-4 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10" />
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Academic Sphere Hub</p>
                  <h1 className="text-lg font-semibold text-foreground">Smart Academic Operations</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground md:flex">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {user?.role?.toUpperCase() || "USER"}
                </div>
                <Button variant="outline" size="sm" className="rounded-full px-5" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="relative z-10 flex-1 px-4 py-6">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;

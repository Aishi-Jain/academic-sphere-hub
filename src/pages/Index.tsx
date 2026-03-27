import { ArrowRight, ShieldCheck, GraduationCap, UserRound, Sparkles, ChartNoAxesCombined } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const roleCards = [
  { label: "Admin Login", role: "admin", icon: ShieldCheck, description: "Manage exams, departments, seating, invigilation, and full institutional workflows." },
  { label: "Faculty Login", role: "faculty", icon: GraduationCap, description: "Handle subjects, marks, department insights, circulars, and invigilation participation." },
  { label: "Student Login", role: "student", icon: UserRound, description: "Access results, analytics, marks, seating, and academic updates in one place." },
];

const features = [
  { title: "Examination Intelligence", copy: "Coordinate exams, seating, invigilation, and announcements through a unified academic control center." },
  { title: "Data-Driven Dashboards", copy: "Track departments, performance trends, and outcomes with cleaner charts and focused operational visibility." },
  { title: "Role-Aware Workflows", copy: "Every user sees a tailored experience while all existing functionality remains intact underneath the redesign." },
];

const Index = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (user?.role === "admin") return <Navigate to="/AdminDashboard" replace />;
  if (user?.role === "faculty") return <Navigate to="/FacultyDashboard" replace />;
  if (user?.role === "student") return <Navigate to="/StudentDashboard" replace />;

  return (
    <div className="app-shell min-h-screen px-4 py-6 md:px-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1450px] flex-col gap-10">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-black/20 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-lg font-bold text-foreground">Academic Sphere Hub</p>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Institutional Intelligence Layer</p>
          </div>
          <Link to="/login">
            <Button className="rounded-full px-6">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </header>

        <section className="hero-surface hero-layout-wide flex-1">
          <div className="space-y-8">
            <span className="section-kicker">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Academic Sphere Reimagined
            </span>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
                Precision academic management with a richer, futuristic command experience.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Academic Sphere Hub centralizes student administration, examinations, seating allocation,
                invigilation workflows, analytics, and results into a premium role-based platform.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {roleCards.map((item) => (
                <Link key={item.role} to={`/login?role=${item.role}`} className="data-card group flex flex-col gap-4 transition duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-white/10 p-3 text-primary shadow-[0_0_24px_var(--glow-cyan)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">{item.label}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="data-card min-h-[220px]">
              <p className="section-kicker mb-4">Core Modules</p>
              <div className="space-y-3">
                {["Students & Faculty", "Departments & Subjects", "Exams & Seating", "Invigilation & Results", "Analytics & Circulars"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-foreground">{item}</span>
                    <span className="text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="data-card min-h-[220px]">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                  <ChartNoAxesCombined className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Operational Visibility</p>
                  <p className="text-sm text-muted-foreground">Dashboards, reports, and role-based workflows.</p>
                </div>
              </div>
              <div className="grid gap-3">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="font-medium text-foreground">{feature.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;

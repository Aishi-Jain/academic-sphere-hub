import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Megaphone, Orbit, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { deptShortNames, departments } from "@/lib/mock-data";
import logo from "../assets/AS logo.png";

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const [circulars, setCirculars] = useState<any[]>([]);

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/circulars");
        setCirculars(res.data.slice(0, 4));
      } catch (err) {
        console.error("Error fetching circulars");
      }
    };
    fetchCirculars();
  }, []);

  const getDeptShortName = (deptId: any) => {
    if (deptId === "global") return "Global";
    const dept = departments.find((d) => String(d.id) === String(deptId));
    return dept ? deptShortNames[dept.name] : deptId;
  };

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="section-kicker mb-5">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Welcome back
        </div>
        <div className="hero-layout-wide">
          <div className="space-y-5">
            <img src={logo} alt="Academic Sphere Logo" className="w-24 object-contain md:w-28" />
            <div className="space-y-3">
              <h1 className="page-header max-w-3xl text-4xl md:text-5xl">
                Academic operations, examination workflows, and performance visibility in one intelligent hub.
              </h1>
              <p className="page-description max-w-2xl leading-7">
                Academic Sphere centralizes students, faculty, departments, subjects, examinations,
                invigilation, results, and analytics into one elevated role-based workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/results">
                <Button className="rounded-full px-6">
                  Explore Results
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/circulars">
                <Button variant="outline" className="rounded-full px-6">View Circulars</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Logged in as {role}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: GraduationCap,
                title: "Academic Management",
                copy: "Coordinate students, faculty, departments, and subject data with a cleaner control surface.",
              },
              {
                icon: Orbit,
                title: "Examination Flow",
                copy: "Handle exams, seating allocation, invigilation, and results from connected modules.",
              },
              {
                icon: ShieldCheck,
                title: "Role-Based Access",
                copy: "Admin, faculty, and students get tailored experiences without changing business logic.",
              },
              {
                icon: Megaphone,
                title: "Institution Updates",
                copy: "Keep academic notices and attachments visible through polished communication panels.",
              },
            ].map((feature) => (
              <div key={feature.title} className="data-card space-y-4">
                <div className="w-fit rounded-2xl bg-primary/15 p-3 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">{feature.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker mb-3">Latest Updates</span>
            <h2 className="page-header text-2xl">Recent Circulars</h2>
            <p className="page-description">Important announcements and attachments published across departments.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {circulars.map((c) => (
            <motion.div key={c.circular_id} className="data-card space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.description}</p>
                </div>
                <Badge className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs">
                  {getDeptShortName(c.department_id)}
                </Badge>
              </div>

              {c.file && (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {/\.(jpg|jpeg|png|gif)$/i.test(c.file) && (
                    <img src={`http://localhost:5000/uploads/${c.file}`} className="max-h-60 w-full object-cover" />
                  )}
                  {/\.pdf$/i.test(c.file) && (
                    <iframe src={`http://localhost:5000/uploads/${c.file}`} className="h-64 w-full" />
                  )}
                  {!/\.(jpg|jpeg|png|gif|pdf)$/i.test(c.file) && (
                    <a
                      href={`http://localhost:5000/uploads/${c.file}`}
                      target="_blank"
                      className="block px-4 py-5 text-sm text-primary underline"
                    >
                      View attachment
                    </a>
                  )}
                </div>
              )}

              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {new Date(c.date).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>

        <Link to="/circulars">
          <Button variant="outline" className="rounded-full px-6">View All Circulars</Button>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;

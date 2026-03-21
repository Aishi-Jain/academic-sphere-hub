import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { deptShortNames } from "@/lib/mock-data";

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;

  const [circulars, setCirculars] = useState<any[]>([]);

  // 🔥 FETCH CIRCULARS
  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/circulars");
        setCirculars(res.data.slice(0, 5)); // show only latest 5
      } catch (err) {
        console.error("Error fetching circulars");
      }
    };

    fetchCirculars();
  }, []);

  return (
    <div className="p-6 space-y-10">

      {/* 🔥 HERO SECTION */}
      <div className="flex flex-col items-center text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Academic Sphere
          </h1>

          <p className="text-muted-foreground max-w-md mx-auto">
            Enterprise Academic ERP System — Manage students, faculty, exams, and more.
          </p>

          <p className="text-sm text-muted-foreground">
            Logged in as{" "}
            <span className="font-medium text-primary capitalize">
              {role}
            </span>
          </p>

          <Link to="/dashboard">
            <Button className="mt-4 gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* 🔥 CIRCULARS SECTION */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Latest Circulars</h2>
        </div>

        <div className="space-y-4">
          {circulars.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No circulars available
            </p>
          ) : (
            circulars.map((c, i) => (
              <motion.div
                key={c.circular_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stat-card"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* LEFT */}
                  <div>
                    <h3 className="font-medium text-sm">{c.title}</h3>

                    <p className="text-xs text-muted-foreground mt-1">
                      {c.description}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(c.date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* RIGHT */}
                  <Badge
                    variant={
                      c.department_id === "global" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {c.department_id === "global"
                      ? "Global"
                      : deptShortNames[c.department_id] || c.department_id}
                  </Badge>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 🔥 VIEW ALL BUTTON */}
        <div className="mt-4">
          <Link to="/circulars">
            <Button variant="outline" size="sm">
              View All Circulars
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
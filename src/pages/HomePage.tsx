import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { deptShortNames, departments } from "@/lib/mock-data";

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;

  const [circulars, setCirculars] = useState<any[]>([]);

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/circulars");
        setCirculars(res.data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching circulars");
      }
    };
    fetchCirculars();
  }, []);

  const getDeptShortName = (deptId: any) => {
    if (deptId === "global") return "Global";
    const dept = departments.find(
      (d) => String(d.id) === String(deptId)
    );
    return dept ? deptShortNames[dept.name] : deptId;
  };

  return (
    <div className="p-6 space-y-10">

      <div className="flex flex-col items-center text-center space-y-6">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h1 className="text-5xl font-bold tracking-tight">Academic Sphere</h1>
          <p className="text-muted-foreground">
            Logged in as {role}
          </p>
        </motion.div>
        
        {/* 🔥 NEW PROJECT DESCRIPTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-center space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            Academic Sphere is a centralized academic management platform designed to streamline
            student data, faculty operations, examinations, analytics, and seating allocation.
            It enables administrators, faculty, and students to efficiently manage and access
            academic information in one place.
          </p>
        </motion.div>

        {/* 🔥 KEY FEATURES HEADING */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4"
        >
          <h2 className="text-lg font-semibold">Key Features</h2>
        </motion.div>

        {/* 🔥 FEATURE CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl"
        >

          {/* Academic */}
          <div className="stat-card text-center space-y-2">
            <GraduationCap className="mx-auto h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Academic Management</p>
            <p className="text-xs text-muted-foreground">
              Manage students, faculty, departments, and subjects seamlessly
            </p>
          </div>

          {/* Seating Allocation (NEW 🔥) */}
          <div className="stat-card text-center space-y-2">
            <ArrowRight className="mx-auto h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Seating Allocation</p>
            <p className="text-xs text-muted-foreground">
              Automatically generate exam seating arrangements efficiently
            </p>
          </div>

          {/* Analytics */}
          <div className="stat-card text-center space-y-2">
            <ArrowRight className="mx-auto h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Analytics & Insights</p>
            <p className="text-xs text-muted-foreground">
              Track performance, trends, and academic insights across semesters
            </p>
          </div>

        </motion.div>

      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Latest Circulars</h2>
        </div>

        <div className="space-y-4">
          {circulars.map((c) => (
            <div key={c.circular_id} className="stat-card">

              <h3 className="font-medium text-sm">{c.title}</h3>

              <p className="text-xs mt-1">{c.description}</p>

              <p className="text-xs mt-2">
                {new Date(c.date).toLocaleDateString()}
              </p>

              {/* 🔥 FILE DISPLAY */}
              {c.file && (
                <div className="mt-3">

                  {/\.(jpg|jpeg|png|gif)$/i.test(c.file) && (
                    <img
                      src={`http://localhost:5000/uploads/${c.file}`}
                      className="rounded-lg max-h-56 w-full border"
                    />
                  )}

                  {/\.pdf$/i.test(c.file) && (
                    <iframe
                      src={`http://localhost:5000/uploads/${c.file}`}
                      className="w-full h-56 border rounded-lg"
                    />
                  )}

                  {!/\.(jpg|jpeg|png|gif|pdf)$/i.test(c.file) && (
                    <a
                      href={`http://localhost:5000/uploads/${c.file}`}
                      target="_blank"
                      className="text-primary underline text-xs"
                    >
                      📎 View Attachment
                    </a>
                  )}

                </div>
              )}

              <Badge className="mt-2 text-xs">
                {getDeptShortName(c.department_id)}
              </Badge>

            </div>
          ))}
        </div>

        <div className="mt-4">
          <Link to="/circulars">
            <Button size="sm">View All Circulars</Button>
          </Link>
        </div>

      </div>

    </div>
  );
};

export default HomePage;
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
          <h1 className="text-4xl font-bold">Academic Sphere</h1>
          <p className="text-muted-foreground">
            Logged in as {role}
          </p>
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
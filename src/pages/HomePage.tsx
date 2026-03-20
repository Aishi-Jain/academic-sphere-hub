import { useRole } from "@/lib/role-context";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
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
          Enterprise Academic ERP System — Manage students, faculty, exams, and more from a unified platform.
        </p>
        <p className="text-sm text-muted-foreground">
          Logged in as <span className="font-medium text-primary capitalize">{role}</span>
        </p>
        <Link to="/dashboard">
          <Button className="mt-4 gap-2">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default HomePage;

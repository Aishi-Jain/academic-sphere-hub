import { StatCard } from "@/components/StatCard";
import {
  Users, GraduationCap, Building2, DoorOpen,
  FileText, TrendingUp, CheckCircle, Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement, Filler,
} from "chart.js";
import { useEffect, useState } from "react";
import { deptShortNames } from "@/lib/mock-data";
import { useChartTheme } from "@/lib/useChartTheme";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement, Filler
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const chartTheme = useChartTheme();

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard")
      .then((res) => res.json())
      .then((data) => setDashboardData(data))
      .catch((err) => console.error(err));

    if (user?.id) {
      const savedPic = localStorage.getItem(`admin_profile_${user.id}`);
      if (savedPic) setProfilePic(savedPic);
    }
  }, [user]);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("http://localhost:5000/api/upload-profile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.imageUrl) {
      const fullUrl = `http://localhost:5000${data.imageUrl}`;
      localStorage.setItem(`admin_profile_${user.id}`, fullUrl);
      setProfilePic(fullUrl);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartTheme.surface,
        titleColor: chartTheme.text,
        bodyColor: chartTheme.muted,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTheme.muted, font: { size: 11 } } },
      y: { grid: { color: chartTheme.grid }, ticks: { color: chartTheme.muted, font: { size: 11 } } },
    },
  };

  if (!dashboardData) {
    return <div className="data-card">Loading dashboard...</div>;
  }

  const deptBarData = {
    labels: dashboardData?.departmentDistribution?.map((d: any) => deptShortNames[d.name] || d.name),
    datasets: [{
      label: "Students",
      data: dashboardData?.departmentDistribution?.map((d: any) => d.count) || [],
      backgroundColor: chartTheme.palette,
      borderRadius: 18,
      maxBarThickness: 42,
    }],
  };

  const semesterTrend = {
    labels: dashboardData?.sgpaTrend?.map((d: any) => d.semester) || [],
    datasets: [{
      label: "Avg SGPA",
      data: dashboardData?.sgpaTrend?.map((d: any) => Number(d.avg_sgpa)) || [],
      borderColor: chartTheme.cyan,
      backgroundColor: `${chartTheme.cyan}22`,
      fill: true,
      tension: 0.45,
      pointRadius: 4,
      pointBackgroundColor: chartTheme.violet,
    }],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-kicker mb-3">Admin Overview</span>
          <h1 className="page-header">Admin Dashboard</h1>
          <p className="page-description">Academic operations, visibility, and institutional health at a glance.</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Students" value={dashboardData.totalStudents} icon={Users} />
          <StatCard title="Total Faculty" value={dashboardData.totalFaculty} icon={GraduationCap} />
          <StatCard title="Departments" value={dashboardData.departments} icon={Building2} />
          <StatCard title="Classrooms" value={dashboardData.classrooms} icon={DoorOpen} />
          <StatCard title="Upcoming Exams" value={dashboardData.upcomingExams} icon={FileText} />
          <StatCard title="Average SGPA" value={dashboardData.averageCGPA} icon={TrendingUp} />
          <StatCard title="Pass %" value={`${dashboardData.passPercentage}%`} icon={CheckCircle} />
        </div>

        <div className="data-card relative flex justify-center">
          <label className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/10 bg-white/[0.04] p-2 text-primary">
            <Camera size={16} />
            <input type="file" className="hidden" onChange={handleImageUpload} />
          </label>

          <div className="space-y-4 text-center">
            <img
              src={profilePic || "/default-avatar.png"}
              className="mx-auto h-24 w-24 rounded-full border-2 border-primary/50 object-cover shadow-[0_0_36px_var(--glow-violet)]"
            />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Admin</h3>
              <p className="text-sm text-muted-foreground">Role: Admin</p>
              <p className="text-sm text-muted-foreground">Malla Reddy College of Engineering</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-success">Active</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div className="chart-panel">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Students by Department</h3>
        <div className="h-72">
          <Bar data={deptBarData} options={chartOptions} />
        </div>
      </motion.div>

      <motion.div className="chart-panel">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Semester Performance Trend</h3>
        <div className="h-72">
          <Line data={semesterTrend} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

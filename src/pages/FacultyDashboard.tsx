import { StatCard } from "@/components/StatCard";
import { Users, GraduationCap, FileText, TrendingUp, CheckCircle, Camera, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement, Filler,
} from "chart.js";
import { useEffect, useState } from "react";
import { useChartTheme } from "@/lib/useChartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

const FacultyDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(localStorage.getItem("profilePic"));
  const chartTheme = useChartTheme();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.reference_id) return;

    fetch(`http://localhost:5000/api/faculty-dashboard?id=${user.reference_id}`)
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data);
        if (data?.facultyInfo?.profile_pic) {
          setProfilePic(`http://localhost:5000${data.facultyInfo.profile_pic}`);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", user.reference_id);
    formData.append("role", user.role);

    const res = await fetch("http://localhost:5000/api/upload-profile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.imageUrl) {
      setProfilePic(`http://localhost:5000${data.imageUrl}`);
      setDashboardData((prev: any) => ({
        ...prev,
        facultyInfo: { ...prev.facultyInfo, profile_pic: data.imageUrl },
      }));
    }
  };

  if (!dashboardData) {
    return <div className="data-card">Loading dashboard...</div>;
  }

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
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: chartTheme.muted } },
      y: { grid: { color: chartTheme.grid }, ticks: { font: { size: 11 }, color: chartTheme.muted } },
    },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-kicker mb-3">Faculty Overview</span>
          <h1 className="page-header">Faculty Dashboard</h1>
          <p className="page-description">Department-focused visibility for subjects, students, and outcomes.</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="data-card relative flex min-h-[360px] items-center justify-center lg:min-h-[420px]">
          <label className="absolute left-4 top-4 cursor-pointer rounded-full border border-white/10 bg-white/[0.04] p-2 text-primary">
            <Pencil size={16} />
            <input type="file" className="hidden" onChange={handleImageUpload} />
          </label>
          <label className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/10 bg-white/[0.04] p-2 text-primary">
            <Camera size={16} />
            <input type="file" className="hidden" onChange={handleImageUpload} />
          </label>

          <div className="flex min-h-full w-full flex-col items-center justify-center gap-6 py-6 text-center">
            <div className="relative h-36 w-36 lg:h-40 lg:w-40">
              <div className="pointer-events-none absolute inset-[-12px] rounded-full bg-[radial-gradient(circle,var(--glow-cyan),transparent_62%)] opacity-90 blur-xl" />
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg_at_50%_50%,rgba(124,58,237,0.95),rgba(22,217,255,0.9),rgba(124,58,237,0.95))] p-[3px] shadow-[0_0_40px_var(--glow-violet)]">
                <img
                  src={
                    profilePic
                      ? profilePic
                      : dashboardData?.facultyInfo?.profile_pic
                        ? `http://localhost:5000${dashboardData.facultyInfo.profile_pic}`
                        : "/default-avatar.png"
                  }
                  className="h-full w-full rounded-full border border-white/15 object-cover bg-background"
                />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-foreground">{dashboardData?.facultyInfo?.name}</h3>
              <p className="mt-2 text-base text-muted-foreground">Designation: {dashboardData?.facultyInfo?.designation}</p>
              <p className="text-base text-muted-foreground">Department: {dashboardData?.facultyInfo?.department_name}</p>
              <p className="text-base text-muted-foreground">Malla Reddy College of Engineering</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-success">Active</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total Students" value={dashboardData.totalStudents} icon={Users} />
          <StatCard title="Faculty (Dept)" value={dashboardData.totalFaculty} icon={GraduationCap} />
          <StatCard title="Subjects" value={dashboardData.subjects} icon={FileText} />
          <StatCard title="Average SGPA" value={dashboardData.averageCGPA} icon={TrendingUp} />
          <StatCard title="Pass %" value={`${dashboardData.passPercentage || 0}%`} icon={CheckCircle} />
        </div>
      </div>

      <motion.div className="chart-panel">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Semester Performance Trend</h3>
        <div className="h-72">
          <Line data={semesterTrend} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
};

export default FacultyDashboard;

import { StatCard } from "@/components/StatCard";
import { Users, GraduationCap, Building2, DoorOpen, FileText, TrendingUp, CheckCircle, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

import { useEffect, useState } from "react";
import { deptShortNames } from "@/lib/mock-data";

const chartColors = [
  'hsl(239, 84%, 67%)',
  'hsl(199, 89%, 48%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 67%, 55%)',
];

const AdminDashboard = () => {

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(
    localStorage.getItem("profilePic")
  );

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard")
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error(err));
  }, []);

  // 📊 Bar Chart
  const deptBarData = {
    labels: dashboardData?.departmentDistribution?.map(
      (d: any) => deptShortNames[d.name] || d.name
    ),
    datasets: [{
      label: 'Students',
      data: dashboardData?.departmentDistribution?.map((d: any) => d.count) || [],
      backgroundColor: chartColors,
      borderRadius: 6,
    }],
  };

  // 📈 Line Chart
  const sgpaLabels = dashboardData?.sgpaTrend?.map((d: any) => d.semester) || [];
  const sgpaValues = dashboardData?.sgpaTrend?.map((d: any) => Number(d.avg_sgpa)) || [];

  const semesterTrend = {
    labels: sgpaLabels,
    datasets: [{
      label: 'Avg SGPA',
      data: sgpaValues,
      borderColor: 'hsl(239, 84%, 67%)',
      backgroundColor: 'hsla(239, 84%, 67%, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'hsl(220, 13%, 91%)' }, ticks: { font: { size: 11 } } },
    },
  };

  // 📷 Upload
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("http://localhost:5000/api/upload-profile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    localStorage.setItem("profilePic", data.imageUrl);
    setProfilePic(data.imageUrl);
  };

  if (!dashboardData) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-10">

      {/* 🔹 Header */}
      <div>
        <h1 className="page-header">Admin Dashboard</h1>
        <p className="page-description">Overview of academic operations</p>
      </div>

      {/* 👤 PROFILE CARD CENTERED */}
      <div className="flex justify-center relative">

        {/* Upload Button (Top Right Floating) */}
        <label className="absolute right-4 top-4 bg-purple-600 p-2 rounded-full cursor-pointer hover:scale-105 transition">
          <Camera size={16} />
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>

        <div className="stat-card w-[320px] text-center p-6 space-y-4">

          <img
            src={profilePic || "/default-avatar.png"}
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-purple-500"
          />

          <div>
            <h3 className="text-lg font-semibold">Admin Name</h3>
            <p className="text-sm text-muted-foreground">Role: Admin</p>
            <p className="text-sm text-muted-foreground">Malla Reddy College of Engineering</p>
            <p className="text-xs text-green-500 mt-1">Active</p>
          </div>

        </div>
      </div>

      {/* 📊 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard title="Total Students" value={dashboardData.totalStudents} icon={Users} />
        <StatCard title="Total Faculty" value={dashboardData.totalFaculty} icon={GraduationCap} />
        <StatCard title="Departments" value={dashboardData.departments} icon={Building2} />
        <StatCard title="Classrooms" value={dashboardData.classrooms} icon={DoorOpen} />
        <StatCard title="Upcoming Exams" value={dashboardData.upcomingExams} icon={FileText} />
        <StatCard title="Average SGPA" value={dashboardData.averageCGPA} icon={TrendingUp} />
        <StatCard title="Pass %" value={`${dashboardData.passPercentage}%`} icon={CheckCircle} />

      </div>

      {/* 📊 BAR CHART */}
      <motion.div className="stat-card">
        <h3 className="text-sm font-medium mb-4">Students by Department</h3>
        <div className="h-64">
          <Bar data={deptBarData} options={chartOptions} />
        </div>
      </motion.div>

      {/* 📈 LINE CHART */}
      <motion.div className="stat-card">
        <h3 className="text-sm font-medium mb-4">Semester Performance Trend</h3>
        <div className="h-64">
          <Line data={semesterTrend} options={chartOptions} />
        </div>
      </motion.div>

    </div>
  );
};

export default AdminDashboard;
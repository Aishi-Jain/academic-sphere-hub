import { StatCard } from "@/components/StatCard";
import { Users, GraduationCap, FileText, TrendingUp, CheckCircle, Camera, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, PointElement, LineElement, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

import { useEffect, useState } from "react";

const chartColors = [
  'hsl(239, 84%, 67%)',
  'hsl(199, 89%, 48%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
];

const FacultyDashboard = () => {

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(
    localStorage.getItem("profilePic")
  );

  // 🔐 Get logged-in faculty
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const department = user?.department?.trim();
  console.log("Faculty Department:", department);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?.reference_id) return;

    fetch(`http://localhost:5000/api/faculty-dashboard?id=${user.reference_id}`)
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);

        // 🔥 LOAD IMAGE AFTER FETCH
        if (data?.facultyInfo?.profile_pic) {
          setProfilePic(`http://localhost:5000${data.facultyInfo.profile_pic}`);
        }
      })
      .catch(err => console.error(err));

  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?.reference_id) return;

    const url = `http://localhost:5000/uploads/profile_${user.reference_id}.jpg`;

    setProfilePic(url);

  }, []);

  // 📊 Bar Chart (optional - can still show single department count)
  {/*const deptBarData = {
    labels: [department],
    datasets: [{
      label: 'Students',
      data: [dashboardData?.totalStudents || 0],
      backgroundColor: chartColors,
      borderRadius: 6,
    }],
  };*/}

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

  // 📷 Upload Profile Image
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = JSON.parse(localStorage.getItem("user") || "null");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", user.reference_id);
    formData.append("role", user.role);

    try {
      const res = await fetch("http://localhost:5000/api/upload-profile", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      const fullUrl = `http://localhost:5000${data.imageUrl}`;

      // ✅ Update local image instantly
      setProfilePic(fullUrl);

      setDashboardData((prev: any) => ({
        ...prev,
        facultyInfo: {
          ...prev.facultyInfo,
          profile_pic: data.imageUrl
        }
      }));

    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  if (!dashboardData) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-10">

      {/* 🔹 Header */}
      <div>
        <h1 className="page-header">Faculty Dashboard</h1>
        <p className="page-description">Department-wise academic overview</p>
      </div>

      {/* 👤 PROFILE CARD */}
      <div className="flex justify-center relative">

        {/* 📷 Camera Icon */}
        <label className="absolute right-4 top-4 bg-purple-600 p-2 rounded-full cursor-pointer hover:scale-105 transition">
          <Camera size={16} />
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* ✏️ Edit Icon */}
        <label className="absolute left-4 top-4 bg-purple-600 p-2 rounded-full cursor-pointer hover:scale-105 transition">
          <Pencil size={16} />
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>

        <div className="stat-card w-[320px] text-center p-6 space-y-4">

          <img
            src={
              profilePic
                ? profilePic
                : dashboardData?.facultyInfo?.profile_pic
                  ? `http://localhost:5000${dashboardData.facultyInfo.profile_pic}`
                  : "/default-avatar.png"
            }
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-purple-500"
          />

          <div>
            <h3 className="text-lg font-semibold">
              {dashboardData?.facultyInfo?.name}
            </h3>

            <p className="text-sm text-muted-foreground">
              Designation: {dashboardData?.facultyInfo?.designation}
            </p>

            <p className="text-sm text-muted-foreground">
              Department: {dashboardData?.facultyInfo?.department_name}
            </p>
            
            <p className="text-sm text-muted-foreground">Malla Reddy College of Engineering</p>
            <p className="text-xs text-green-500 mt-1">Active</p>
          </div>

        </div>
      </div>

      {/* 📊 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard title="Total Students" value={dashboardData.totalStudents} icon={Users} />
        <StatCard title="Faculty (Dept)" value={dashboardData.totalFaculty} icon={GraduationCap} />
        <StatCard title="Subjects" value={dashboardData.subjects} icon={FileText} />
        <StatCard title="Average SGPA" value={dashboardData.averageCGPA} icon={TrendingUp} />
        <StatCard title="Pass %" value={`${dashboardData.passPercentage || 0}%`} icon={CheckCircle} />

      </div>

      {/* 📊 BAR CHART */}
      {/*<motion.div className="stat-card">
        <h3 className="text-sm font-medium mb-4">Department Student Count</h3>
        <div className="h-64">
          <Bar data={deptBarData} options={chartOptions} />
        </div>
      </motion.div>*/}

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

export default FacultyDashboard;
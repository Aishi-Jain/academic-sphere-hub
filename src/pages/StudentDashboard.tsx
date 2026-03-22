import { useEffect, useState } from "react";
import { Camera, Pencil } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend
);

const StudentDashboard = () => {

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // 🔥 FETCH DATA (ALSO LOAD PROFILE PIC FROM DB)
  useEffect(() => {
    if (!user?.username) return;

    fetch(`http://localhost:5000/api/student-dashboard?roll=${user.username}`)
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);

        // 🔥 CRITICAL FIX → load profile pic on refresh
        if (data?.studentInfo?.profile_pic) {
          setProfilePic(`http://localhost:5000${data.studentInfo.profile_pic}`);
        } else {
          setProfilePic(null);
        }
      })
      .catch(err => console.error(err));

  }, [user]);

  // 🔥 IMAGE UPLOAD
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("role", "student");

    // 🔥 FIX: backend expects userId NOT id
    formData.append("userId", user.username);

    try {
      const res = await fetch("http://localhost:5000/api/upload-profile", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.imageUrl) {
        const fullUrl = `http://localhost:5000${data.imageUrl}`;

        // update UI instantly
        setProfilePic(fullUrl);

        // update dashboard state
        setDashboardData((prev: any) => ({
          ...prev,
          studentInfo: {
            ...prev.studentInfo,
            profile_pic: data.imageUrl
          }
        }));
      }

    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 CHART DATA
  const chartData = {
    labels: dashboardData?.trend?.map((item: any) => item.semester) || [],
    datasets: [
      {
        label: "SGPA",
        data: dashboardData?.trend?.map((item: any) => Number(item.sgpa)) || [],

        borderColor: "#8b5cf6",

        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(139, 92, 246, 0.4)");
          gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
          return gradient;
        },

        fill: true,
        tension: 0.4,

        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#8b5cf6",
        pointBorderWidth: 2,
        pointBorderColor: "#111",

        borderWidth: 3
      }
    ]
  };

  // 🔥 CHART OPTIONS
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111",
        borderColor: "#333",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#ccc"
      }
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#aaa" }
      },
      y: {
        min: 6,
        max: 10,
        grid: {
          color: "#2a2a2a",
          borderDash: [4, 4]
        },
        ticks: { color: "#aaa" }
      }
    }
  };

  // 🔥 SAFE LOADING
  if (!dashboardData || !dashboardData.studentInfo) {
    return <div className="p-10 text-white">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-gray-400">Your academic performance overview</p>
      </div>

      {/* 👤 PROFILE */}
      <div className="flex justify-center relative">

        {/* EDIT ICON */}
        <label className="absolute left-4 top-4 bg-purple-600 p-2 rounded-full cursor-pointer hover:scale-105 transition">
          <Pencil size={16} />
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* CAMERA ICON */}
        <label className="absolute right-4 top-4 bg-purple-600 p-2 rounded-full cursor-pointer hover:scale-105 transition">
          <Camera size={16} />
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>

        <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-[320px] text-center space-y-4">

          <img
            src={profilePic || "/default-avatar.png"}
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-purple-500"
          />

          <div>
            <h3 className="text-lg font-semibold">
              {dashboardData.studentInfo.name}
            </h3>

            <p className="text-sm text-gray-400">
              Roll No: {dashboardData.studentInfo.roll_number}
            </p>

            <p className="text-sm text-gray-400">
              {dashboardData.studentInfo.department_name} {dashboardData.studentInfo.section}
            </p>

            <p className="text-sm text-gray-400">
              Year: {dashboardData.studentInfo.year}
            </p>

            <p className="text-sm text-gray-400">
              Malla Reddy College of Engineering
            </p>

            <p className="text-xs text-green-500 mt-1">Active</p>
          </div>

        </div>
      </div>

      {/* 📊 STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Current CGPA" value={dashboardData.cgpa} />
        <StatCard title="Semester SGPA" value={dashboardData.latestSGPA} />
        <StatCard title="Section Rank" value={dashboardData.sectionRank} />
        <StatCard title="Dept Rank" value={dashboardData.deptRank} />
        <StatCard title="College Rank" value={dashboardData.collegeRank} />
      </div>

      {/* 📈 CHART */}
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6">

        <h3 className="text-lg font-semibold mb-2">CGPA Growth</h3>
        <p className="text-sm text-gray-400 mb-4">
          Your academic performance across semesters
        </p>

        <div className="w-full h-[320px]">
          <Line data={chartData} options={chartOptions} />
        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;

// 🔥 STAT CARD
const StatCard = ({ title, value }: any) => (
  <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-4">
    <p className="text-sm text-gray-400">{title}</p>
    <h2 className="text-xl font-bold mt-1">{value}</h2>
  </div>
);
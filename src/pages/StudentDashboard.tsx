import { useEffect, useState } from "react";
import { Camera, Pencil, Medal, ChartNoAxesCombined, School, Sparkles } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { StatCard } from "@/components/StatCard";
import { useChartTheme } from "@/lib/useChartTheme";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const chartTheme = useChartTheme();

  useEffect(() => {
    if (!user?.username) return;

    fetch(`http://localhost:5000/api/student-dashboard?roll=${user.username}`)
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data);
        if (data?.studentInfo?.profile_pic) {
          setProfilePic(`http://localhost:5000${data.studentInfo.profile_pic}`);
        } else {
          setProfilePic(null);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("role", "student");
    formData.append("userId", user.username);

    const res = await fetch("http://localhost:5000/api/upload-profile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.imageUrl) {
      const fullUrl = `http://localhost:5000${data.imageUrl}`;
      setProfilePic(fullUrl);
      setDashboardData((prev: any) => ({
        ...prev,
        studentInfo: {
          ...prev.studentInfo,
          profile_pic: data.imageUrl,
        },
      }));
    }
  };

  if (!dashboardData || !dashboardData.studentInfo) {
    return <div className="data-card">Loading dashboard...</div>;
  }

  const chartData = {
    labels: dashboardData?.trend?.map((item: any) => item.semester) || [],
    datasets: [
      {
        label: "SGPA",
        data: dashboardData?.trend?.map((item: any) => Number(item.sgpa)) || [],
        borderColor: chartTheme.cyan,
        backgroundColor: `${chartTheme.cyan}22`,
        fill: true,
        tension: 0.42,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: chartTheme.violet,
        pointBorderWidth: 2,
        pointBorderColor: chartTheme.surface,
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartTheme.surface,
        borderColor: chartTheme.grid,
        borderWidth: 1,
        titleColor: chartTheme.text,
        bodyColor: chartTheme.muted,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTheme.muted },
      },
      y: {
        min: 6,
        max: 10,
        grid: { color: chartTheme.grid },
        ticks: { color: chartTheme.muted },
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-kicker mb-3">Student Overview</span>
          <h1 className="page-header">Student Dashboard</h1>
          <p className="page-description">Your performance, ranks, and academic progress in one refined view.</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="data-card relative flex justify-center">
          <label className="absolute left-4 top-4 cursor-pointer rounded-full border border-white/10 bg-white/[0.04] p-2 text-primary">
            <Pencil size={16} />
            <input type="file" className="hidden" onChange={handleImageUpload} />
          </label>
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
              <h3 className="text-xl font-semibold text-foreground">{dashboardData.studentInfo.name}</h3>
              <p className="text-sm text-muted-foreground">Roll No: {dashboardData.studentInfo.roll_number}</p>
              <p className="text-sm text-muted-foreground">
                {dashboardData.studentInfo.department_name} {dashboardData.studentInfo.section}
              </p>
              <p className="text-sm text-muted-foreground">Year: {dashboardData.studentInfo.year}</p>
              <p className="text-sm text-muted-foreground">Malla Reddy College of Engineering</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Current CGPA" value={dashboardData.cgpa} icon={Sparkles} />
          <StatCard title="Semester SGPA" value={dashboardData.latestSGPA} icon={ChartNoAxesCombined} />
          <StatCard title="Section Rank" value={dashboardData.sectionRank} icon={Medal} />
          <StatCard title="Dept Rank" value={dashboardData.deptRank} icon={School} />
          <StatCard title="College Rank" value={dashboardData.collegeRank} icon={Medal} />
        </div>
      </div>

      <div className="chart-panel">
        <h3 className="mb-2 text-lg font-semibold text-foreground">CGPA Growth</h3>
        <p className="mb-4 text-sm text-muted-foreground">Your academic performance across semesters.</p>
        <div className="h-[320px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

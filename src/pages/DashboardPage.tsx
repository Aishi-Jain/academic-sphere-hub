import { motion } from "framer-motion";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { StatCard } from "@/components/StatCard";
import { dashboardStats, departmentDistribution } from "@/lib/mock-data";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  Building2,
  CheckCircle,
  DoorOpen,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { useChartTheme } from "@/lib/useChartTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const DashboardPage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const chartTheme = useChartTheme();

  const deptBarData = {
    labels: departmentDistribution.map((item) => item.name),
    datasets: [
      {
      label: "Students",
      data: departmentDistribution.map((item) => item.count),
      backgroundColor: chartTheme.palette,
      borderRadius: 12,
    },
    ],
  };

  const deptDoughnutData = {
    labels: departmentDistribution.map((item) => item.name),
    datasets: [
      {
        data: departmentDistribution.map((item) => item.count),
        backgroundColor: chartTheme.palette,
        borderWidth: 0,
      },
    ],
  };

  const semesterTrend = {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"],
    datasets: [
      {
        label: "Avg CGPA",
        data: [7.2, 7.5, 7.8, 7.6, 8.0, 8.2],
        borderColor: chartTheme.violet,
        backgroundColor: `${chartTheme.violet}22`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTheme.muted,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTheme.muted, font: { size: 11 } },
      },
      y: {
        grid: { color: chartTheme.grid },
        ticks: { color: chartTheme.muted, font: { size: 11 } },
      },
    },
  };

  if (role === "student") {
    const cgpa = 8.4;
    const sgpa = 8.7;
    const attendance = 92;

    return (
      <div className="space-y-8">
        <section className="hero-surface">
          <p className="section-kicker">Student Snapshot</p>
          <h1 className="page-header">Welcome back, Student</h1>
          <p className="page-description max-w-2xl">
            Review your academic momentum, semester performance, and attendance from a cleaner dashboard overview.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Current CGPA" value={cgpa} icon={TrendingUp} />
          <StatCard title="Semester GPA" value={sgpa} icon={CheckCircle} />
          <StatCard title="Attendance" value={`${attendance}%`} icon={Users} />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-panel">
          <div className="mb-4">
            <p className="section-kicker">Trend</p>
            <h3 className="section-header mt-1">CGPA Growth</h3>
          </div>
          <div className="h-64">
            <Line data={semesterTrend} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <p className="section-kicker">Operations Overview</p>
        <h1 className="page-header">{role === "admin" ? "Admin Dashboard" : "Faculty Dashboard"}</h1>
        <p className="page-description max-w-2xl">
          Monitor students, departments, exam readiness, and performance trends from a more refined academic operations dashboard.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={dashboardStats.totalStudents} icon={Users} trend="+12% this year" />
        <StatCard title="Total Faculty" value={dashboardStats.totalFaculty} icon={GraduationCap} />
        <StatCard title="Departments" value={dashboardStats.departments} icon={Building2} />
        {role === "admin" && <StatCard title="Classrooms" value={dashboardStats.classrooms} icon={DoorOpen} />}
        {role === "admin" && <StatCard title="Upcoming Exams" value={dashboardStats.upcomingExams} icon={FileText} />}
        <StatCard title="Average CGPA" value={dashboardStats.averageCGPA} icon={TrendingUp} />
        <StatCard title="Pass %" value={`${dashboardStats.passPercentage}%`} icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="chart-panel">
          <div className="mb-4">
            <p className="section-kicker">Distribution</p>
            <h3 className="section-header mt-1">Students by Department</h3>
          </div>
          <div className="h-64">
            <Bar data={deptBarData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="chart-panel"
        >
          <div className="mb-4">
            <p className="section-kicker">Composition</p>
            <h3 className="section-header mt-1">Department Distribution</h3>
          </div>
          <div className="flex h-64 items-center justify-center">
            <Doughnut
              data={deptDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: chartTheme.muted,
                      font: { size: 11 },
                      padding: 12,
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="chart-panel lg:col-span-2"
        >
          <div className="mb-4">
            <p className="section-kicker">Performance Trend</p>
            <h3 className="section-header mt-1">Semester Performance Trend</h3>
          </div>
          <div className="h-64">
            <Line data={semesterTrend} options={chartOptions} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;

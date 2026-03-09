import { useRole } from "@/lib/role-context";
import { StatCard } from "@/components/StatCard";
import { dashboardStats, departmentDistribution, students } from "@/lib/mock-data";
import { Users, GraduationCap, Building2, DoorOpen, FileText, TrendingUp, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const chartColors = [
  'hsl(239, 84%, 67%)', 'hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 67%, 55%)',
];

const DashboardPage = () => {
  const { role } = useRole();

  const deptBarData = {
    labels: departmentDistribution.map(d => d.name),
    datasets: [{
      label: 'Students',
      data: departmentDistribution.map(d => d.count),
      backgroundColor: chartColors,
      borderRadius: 6,
    }],
  };

  const deptDoughnutData = {
    labels: departmentDistribution.map(d => d.name),
    datasets: [{
      data: departmentDistribution.map(d => d.count),
      backgroundColor: chartColors,
      borderWidth: 0,
    }],
  };

  const semesterTrend = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    datasets: [{
      label: 'Avg CGPA',
      data: [7.2, 7.5, 7.8, 7.6, 8.0, 8.2],
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

  if (role === 'student') {
    const cgpa = 8.4;
    const sgpa = 8.7;
    const attendance = 92;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Welcome back, Student</h1>
          <p className="page-description">Here's your academic overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Current CGPA" value={cgpa} icon={TrendingUp} />
          <StatCard title="Semester GPA" value={sgpa} icon={CheckCircle} />
          <StatCard title="Attendance" value={`${attendance}%`} icon={Users} />
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">CGPA Growth</h3>
          <div className="h-64">
            <Line data={semesterTrend} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">{role === 'admin' ? 'Admin' : 'Faculty'} Dashboard</h1>
        <p className="page-description">Overview of academic operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={dashboardStats.totalStudents} icon={Users} trend="+12% this year" />
        <StatCard title="Total Faculty" value={dashboardStats.totalFaculty} icon={GraduationCap} />
        <StatCard title="Departments" value={dashboardStats.departments} icon={Building2} />
        {role === 'admin' && <StatCard title="Classrooms" value={dashboardStats.classrooms} icon={DoorOpen} />}
        {role === 'admin' && <StatCard title="Upcoming Exams" value={dashboardStats.upcomingExams} icon={FileText} />}
        <StatCard title="Average CGPA" value={dashboardStats.averageCGPA} icon={TrendingUp} />
        <StatCard title="Pass %" value={`${dashboardStats.passPercentage}%`} icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Students by Department</h3>
          <div className="h-64">
            <Bar data={deptBarData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Department Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={deptDoughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } } }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Semester Performance Trend</h3>
          <div className="h-64">
            <Line data={semesterTrend} options={chartOptions} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;

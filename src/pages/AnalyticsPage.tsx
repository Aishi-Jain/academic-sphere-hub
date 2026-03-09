import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler,
} from "chart.js";
import { departmentDistribution, marks } from "@/lib/mock-data";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const chartColors = ['hsl(239,84%,67%)', 'hsl(199,89%,48%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(280,67%,55%)'];

const AnalyticsPage = () => {
  const avgBySubject: Record<string, number[]> = {};
  marks.forEach(m => {
    if (!avgBySubject[m.subject]) avgBySubject[m.subject] = [];
    avgBySubject[m.subject].push(m.total);
  });
  const subjectAvg = Object.entries(avgBySubject).map(([name, vals]) => ({
    name,
    avg: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
  }));

  const passRate = {
    labels: departmentDistribution.map(d => d.name),
    datasets: [{
      label: 'Pass %',
      data: [92, 88, 85, 90, 87, 84],
      backgroundColor: chartColors,
      borderRadius: 6,
    }],
  };

  const subjectChart = {
    labels: subjectAvg.map(s => s.name.slice(0, 12)),
    datasets: [{
      label: 'Average',
      data: subjectAvg.map(s => s.avg),
      borderColor: 'hsl(239,84%,67%)',
      backgroundColor: 'hsla(239,84%,67%,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const failData = {
    labels: ['Pass', 'Fail'],
    datasets: [{
      data: [87.5, 12.5],
      backgroundColor: ['hsl(142,71%,45%)', 'hsl(0,84%,60%)'],
      borderWidth: 0,
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'hsl(220,13%,91%)' } } },
  };

  return (
    <div className="space-y-6">
      <div><h1 className="page-header">Analytics</h1><p className="page-description">Academic performance insights</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Pass Rate by Department</h3>
          <div className="h-64"><Bar data={passRate} options={opts} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Overall Pass/Fail</h3>
          <div className="h-64 flex items-center justify-center"><Doughnut data={failData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="stat-card lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Subject Average Scores</h3>
          <div className="h-64"><Line data={subjectChart} options={opts} /></div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

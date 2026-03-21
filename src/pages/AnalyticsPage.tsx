import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const departments = [
  { id: 7, name: "CSE" },
  { id: 8, name: "CSM" },
  { id: 9, name: "CSD" },
  { id: 10, name: "ECE" },
  { id: 11, name: "IT" },
  { id: 12, name: "AIDS" }
];

const deptMap: any = {
  7: "CSE",
  8: "CSM",
  9: "CSD",
  10: "ECE",
  11: "IT",
  12: "AIDS"
};

const AnalyticsPage = () => {
  const [tab, setTab] = useState("overall");
  const [overall, setOverall] = useState<any>(null);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState(5);

  // 🔥 FETCH OVERALL
  useEffect(() => {
    axios.get("http://localhost:5000/api/analytics/overall")
      .then(res => setOverall(res.data));
  }, []);

  // 🔥 FETCH TOP STUDENTS
  useEffect(() => {
    axios.get("http://localhost:5000/api/analytics/top-students")
      .then(res => setTopStudents(res.data));
  }, []);

  // 🔥 FETCH DEPT DATA
  useEffect(() => {
    if (tab !== "department") return;

    axios.get(`http://localhost:5000/api/analytics/department/${selectedDept}`)
      .then(res => setDeptData(res.data));

  }, [selectedDept, tab]);

  // ===============================
  // 📊 CHART DATA
  // ===============================

  const deptChart = {
    labels: overall?.departments?.map((d: any) => deptMap[d.department_id] || d.department_id),
    datasets: [{
      label: "Pass %",
      data: overall?.departments?.map((d: any) => d.pass_percentage),
      backgroundColor: [
        "#6366F1", "#06B6D4", "#22C55E",
        "#F59E0B", "#EF4444", "#A855F7"
      ],
      borderRadius: 6
    }]
  };

  const pfChart = {
    labels: ["Pass", "Fail"],
    datasets: [{
      data: [
        Number(overall?.passPercentage || 0),
        Number(overall?.failPercentage || 0)
      ],
      backgroundColor: ["#22C55E", "#EF4444"],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="page-header">Analytics</h1>
        <p className="page-description">Deep academic insights</p>
      </div>

      {/* 🔥 TAB SWITCH */}
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded ${tab === "overall" ? "bg-blue-600" : "bg-gray-800"}`}
          onClick={() => setTab("overall")}
        >
          Overall
        </button>

        <button
          className={`px-4 py-2 rounded ${tab === "department" ? "bg-blue-600" : "bg-gray-800"}`}
          onClick={() => setTab("department")}
        >
          Department
        </button>
      </div>

      {/* ===================================== */}
      {/* 🔥 OVERALL TAB */}
      {/* ===================================== */}
      {tab === "overall" && overall && (
        <>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">

            <div className="stat-card">
              <p>Total Students</p>
              <h2>{overall.totalStudents}</h2>
            </div>

            <div className="stat-card">
              <p>Pass %</p>
              <h2>{overall.passPercentage}%</h2>
            </div>

            <div className="stat-card">
              <p>Avg SGPA</p>
              <h2>{overall.avgSGPA}</h2>
            </div>

          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-2 gap-6">

            <div className="stat-card">
              <h3>Department Performance</h3>
              <div className="h-64">
                <Bar data={deptChart} />
              </div>
            </div>

            <div className="stat-card">
              <h3>Pass vs Fail</h3>
              <div className="h-64">
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={pfChart}
                    options={{
                      plugins: {
                        legend: { position: "bottom", labels: { color: "white" } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* TOP STUDENTS */}
          <div className="stat-card">
            <h3 className="mb-4">Top 30 Students</h3>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>SGPA</th>
                </tr>
              </thead>

              <tbody>
                {topStudents.map((s, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td>{s.roll_number}</td>
                    <td>{s.name}</td>
                    <td>{deptMap[s.department_id] || s.department_id}</td>
                    <td className="text-green-400 font-semibold">{s.sgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

        </>
      )}

      {/* ===================================== */}
      {/* 🔥 DEPARTMENT TAB */}
      {/* ===================================== */}
      {tab === "department" && (
        <>

          {/* DEPT SELECT */}
          <div className="flex gap-4">
            {departments.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDept(d.id)}
                className={`px-4 py-2 rounded ${
                  selectedDept === d.id ? "bg-green-600" : "bg-gray-800"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {deptData && (
            <div className="grid grid-cols-3 gap-4">

              <div className="stat-card">
                <p>Total</p>
                <h2>{deptData.total}</h2>
              </div>

              <div className="stat-card">
                <p>Passed</p>
                <h2>{deptData.passed}</h2>
              </div>

              <div className="stat-card">
                <p>Pass %</p>
                <h2>{deptData.passPercentage}%</h2>
              </div>

            </div>
          )}

        </>
      )}

    </div>
  );
};

export default AnalyticsPage;
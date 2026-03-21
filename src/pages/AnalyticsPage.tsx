import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend, ArcElement
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
  const [selectedDept, setSelectedDept] = useState(7);
  const [deptFull, setDeptFull] = useState<any>(null);

  // OVERALL
  useEffect(() => {
    axios.get("http://localhost:5000/api/analytics/overall")
      .then(res => setOverall(res.data));
  }, []);

  // TOP STUDENTS
  useEffect(() => {
    axios.get("http://localhost:5000/api/analytics/top-students")
      .then(res => setTopStudents(res.data));
  }, []);

  // DEPARTMENT FULL
  useEffect(() => {
    if (tab !== "department") return;

    axios.get(`http://localhost:5000/api/analytics/department-full/${selectedDept}`)
      .then(res => setDeptFull(res.data));

  }, [selectedDept, tab]);

  // CHARTS
  const deptChart = {
    labels: overall?.departments?.map((d: any) => deptMap[d.department_id]),
    datasets: [{
      label: "Pass %",
      data: overall?.departments?.map((d: any) => d.pass_percentage),
      backgroundColor: ["#6366F1","#06B6D4","#22C55E","#F59E0B","#EF4444","#A855F7"]
    }]
  };

  const pfChart = {
    labels: ["Pass","Fail"],
    datasets: [{
      data: [
        Number(overall?.passPercentage || 0),
        Number(overall?.failPercentage || 0)
      ],
      backgroundColor: ["#22C55E","#EF4444"]
    }]
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="page-header">Analytics</h1>
        <p className="page-description">Deep academic insights</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4">
        <button onClick={()=>setTab("overall")} className={`px-4 py-2 rounded ${tab==="overall"?"bg-blue-600":"bg-gray-800"}`}>Overall</button>
        <button onClick={()=>setTab("department")} className={`px-4 py-2 rounded ${tab==="department"?"bg-blue-600":"bg-gray-800"}`}>Department</button>
      </div>

      {/* ================= OVERALL ================= */}
      {tab==="overall" && overall && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card"><p>Total</p><h2>{overall.totalStudents}</h2></div>
            <div className="stat-card"><p>Pass %</p><h2>{overall.passPercentage}%</h2></div>
            <div className="stat-card"><p>Avg SGPA</p><h2>{overall.avgSGPA}</h2></div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="stat-card">
              <Bar data={deptChart}/>
            </div>

            <div className="stat-card flex justify-center items-center">
              <div className="w-64">
                <Doughnut data={pfChart}/>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3>Top 30 Students</h3>
            <table className="w-full text-sm">
              <tbody>
                {topStudents.map((s,i)=>(
                  <tr key={i}>
                    <td>{s.roll_number}</td>
                    <td>{s.name}</td>
                    <td>{deptMap[s.department_id]}</td>
                    <td className="text-green-400">{s.sgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= DEPARTMENT ================= */}
      {tab==="department" && (
        <>
          <div className="flex gap-3">
            {departments.map(d=>(
              <button key={d.id}
                onClick={()=>setSelectedDept(d.id)}
                className={`px-4 py-2 rounded ${selectedDept===d.id?"bg-green-600":"bg-gray-800"}`}>
                {d.name}
              </button>
            ))}
          </div>

          {deptFull && (
            <>
              {/* SUMMARY */}
              <div className="grid grid-cols-3 gap-4">
                <div className="stat-card"><p>Total</p><h2>{deptFull.summary.total}</h2></div>
                <div className="stat-card"><p>Passed</p><h2>{deptFull.summary.passed}</h2></div>
                <div className="stat-card"><p>Pass %</p><h2>{deptFull.summary.pass_percentage}%</h2></div>
              </div>

              {/* SUBJECT TABLE */}
              <div className="stat-card">
                <h3>Subject-wise</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {deptFull.subjects.map((s:any,i:number)=>(
                      <tr key={i}>
                        <td>{s.subject_name}</td>
                        <td>{s.total}</td>
                        <td>{s.passed}</td>
                        <td className="text-green-400">{s.pass_percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CLASS WISE */}
              <div className="grid grid-cols-3 gap-6">
                {Object.keys(deptFull.classes).map(sec=>{
                  const c = deptFull.classes[sec];

                  return (
                    <div key={sec} className="stat-card">
                      <h3>Section {sec}</h3>
                      <p>Total: {c.total}</p>
                      <p>Pass %: {c.passPercentage}%</p>

                      <h4 className="mt-2">Top 10</h4>

                      {c.top10.map((s:any,i:number)=>(
                        <p key={i}>
                          {s.roll_number} - {s.name} - 
                          <span className="text-green-400 font-semibold"> {s.sgpa}</span>
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
};

export default AnalyticsPage;
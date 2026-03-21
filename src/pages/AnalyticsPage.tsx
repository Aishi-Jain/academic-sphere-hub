import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend, ArcElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const deptMap:any = {
  7:"CSE",8:"CSM",9:"CSD",10:"ECE",11:"IT",12:"AIDS"
};

const departments = [
  {id:7,name:"CSE"},
  {id:8,name:"CSM"},
  {id:9,name:"CSD"},
  {id:10,name:"ECE"},
  {id:11,name:"IT"},
  {id:12,name:"AIDS"}
];

const AnalyticsPage = () => {

  const [mode,setMode]=useState("current");
  const [tab,setTab]=useState("overall");
  const [overall,setOverall]=useState<any>(null);
  const [topStudents,setTopStudents]=useState<any[]>([]);
  const [selectedDept,setSelectedDept]=useState(7);
  const [deptFull,setDeptFull]=useState<any>(null);

  // 🔥 OVERALL
  useEffect(()=>{
    const url = mode==="current"
      ? "/api/analytics/overall"
      : "/api/analytics/overall-all";

    axios.get("http://localhost:5000"+url).then(res=>setOverall(res.data));
  },[mode]);

  // 🔥 TOP STUDENTS
  useEffect(()=>{
    const url = mode==="current"
      ? "/api/analytics/top-students"
      : "/api/analytics/top-students-all";

    axios.get("http://localhost:5000"+url).then(res=>setTopStudents(res.data));
  },[mode]);

  // 🔥 DEPARTMENT
  useEffect(()=>{
    if(tab!=="department") return;

    const url = mode==="current"
      ? `/api/analytics/department-full/${selectedDept}`
      : `/api/analytics/department-all/${selectedDept}`;

    axios.get("http://localhost:5000"+url).then(res=>setDeptFull(res.data));
  },[tab,selectedDept,mode]);

  // 🔥 CHART
  const deptChart = {
    labels: overall?.departments?.map((d:any)=>deptMap[d.department_id]),
    datasets:[{
      label:"Pass %",
      data: overall?.departments?.map((d:any)=>Number(d.pass_percentage)),
      backgroundColor:["#6366F1","#06B6D4","#22C55E","#F59E0B","#EF4444","#A855F7"]
    }]
  };

  const pfChart = {
    labels:["Pass","Fail"],
    datasets:[{
      data:[
        Number(overall?.passPercentage||0),
        Number(overall?.failPercentage||0)
      ],
      backgroundColor:["#22C55E","#EF4444"]
    }]
  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* MODE */}
      <div className="flex gap-3">
        <button onClick={()=>setMode("current")} className={mode==="current"?"bg-purple-600 px-4 py-2":"bg-gray-800 px-4 py-2"}>Current Semester</button>
        <button onClick={()=>setMode("overall")} className={mode==="overall"?"bg-purple-600 px-4 py-2":"bg-gray-800 px-4 py-2"}>All Semesters</button>
      </div>

      {/* TAB */}
      <div className="flex gap-3">
        <button onClick={()=>setTab("overall")} className={tab==="overall"?"bg-blue-600 px-4 py-2":"bg-gray-800 px-4 py-2"}>Overall</button>
        <button onClick={()=>setTab("department")} className={tab==="department"?"bg-blue-600 px-4 py-2":"bg-gray-800 px-4 py-2"}>Department</button>
      </div>

      {/* ================= OVERALL ================= */}
      {tab==="overall" && overall && (
        <>
          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card"><p>Total</p><h2>{overall.totalStudents}</h2></div>
            <div className="stat-card"><p>Pass %</p><h2>{overall.passPercentage}%</h2></div>
            <div className="stat-card">
              <p>{mode==="current"?"Avg SGPA":"Avg CGPA"}</p>
              <h2>{mode==="current"?overall.avgSGPA:overall.avgCGPA}</h2>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-2 gap-6">
            <div className="stat-card"><Bar data={deptChart}/></div>

            <div className="stat-card flex justify-center items-center">
              <div className="w-64">
                <Doughnut data={pfChart}/>
              </div>
            </div>
          </div>

          {/* TOP 30 */}
          <div className="stat-card">
            <h3 className="mb-4 text-lg font-semibold">Top 30 Students</h3>

            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2">Roll</th>
                  <th className="text-left">Name</th>
                  <th className="text-center">Dept</th>
                  <th className="text-center">{mode==="current"?"SGPA":"CGPA"}</th>
                </tr>
              </thead>

              <tbody>
                {topStudents.map((s:any,i:number)=>(
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2">{s.roll_number}</td>
                    <td>{s.name}</td>
                    <td className="text-center">{deptMap[s.department_id]}</td>
                    <td className="text-center text-green-400 font-semibold">
                      {mode==="current"?s.sgpa:Number(s.cgpa).toFixed(2)}
                    </td>
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
          {/* SELECT */}
          <div className="flex gap-3">
            {departments.map(d=>(
              <button key={d.id}
                onClick={()=>setSelectedDept(d.id)}
                className={selectedDept===d.id?"bg-green-600 px-3 py-1":"bg-gray-800 px-3 py-1"}>
                {d.name}
              </button>
            ))}
          </div>

          {deptFull && (
            <>
              {/* SUMMARY */}
              <div className="grid grid-cols-3 gap-4">
                <div className="stat-card"><p>Total</p><h2>{mode==="current"?deptFull.summary?.total:deptFull.total}</h2></div>
                <div className="stat-card"><p>Passed</p><h2>{mode==="current"?deptFull.summary?.passed:deptFull.passed}</h2></div>
                <div className="stat-card"><p>Pass %</p><h2>{mode==="current"?deptFull.summary?.pass_percentage:deptFull.passPercentage}%</h2></div>
              </div>

              {/* 🔥 TOP 10 DEPT */}
              {deptFull.top10Dept && (
                <div className="stat-card">
                  <h3 className="mb-3 font-semibold">Top 10 in Department</h3>

                  <table className="w-full text-sm">
                    <tbody>
                      {deptFull.top10Dept.map((s:any,i:number)=>(
                        <tr key={i} className="border-b border-gray-800">
                          <td className="py-1">{s.roll_number}</td>
                          <td>{s.name}</td>
                          <td className="text-right text-green-400 font-semibold">
                            {mode==="current"?s.sgpa:Number(s.cgpa).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUBJECT TABLE */}
              {mode==="current" && (
                <div className="stat-card">
                  <h3 className="mb-4 text-lg font-semibold">Subject Analysis</h3>

                  <table className="w-full text-sm">
                    <thead className="text-gray-400 border-b border-gray-700">
                      <tr>
                        <th className="text-left py-2">Subject</th>
                        <th className="text-center">Passed</th>
                        <th className="text-center">Pass %</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deptFull.subjects.map((s:any,i:number)=>(
                        <tr key={i} className="border-b border-gray-800">
                          <td className="py-2">{s.subject_name}</td>
                          <td className="text-center">{s.passed}</td>
                          <td className="text-center text-green-400 font-semibold">
                            {s.pass_percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SECTIONS */}
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(deptFull.classes).map(([sec,c]:any)=>(
                  <div key={sec} className="stat-card p-5">

                    <h3 className="text-lg font-semibold mb-3">Section {sec}</h3>

                    <div className="flex justify-between text-sm text-gray-400 mb-3">
                      <span>Total: {c.total}</span>
                      <span className="text-green-400">Pass %: {c.passPercentage}%</span>
                    </div>

                    <table className="w-full text-sm">
                      <tbody>
                        {c.top10.map((s:any,i:number)=>(
                          <tr key={i} className="border-b border-gray-800">
                            <td className="py-1">{s.roll_number}</td>
                            <td>{s.name}</td>
                            <td className="text-right text-green-400 font-semibold">
                              {mode==="current"?s.sgpa:Number(s.cgpa).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
};

export default AnalyticsPage;
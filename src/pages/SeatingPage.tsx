import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Grid3X3, Download, Upload } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DoorOpen, Building2 } from "lucide-react";

interface BenchAllocation {
  bench: number;
  student1: { name: string; roll: string; dept: string };
  student2: { name: string; roll: string; dept: string };
}

const SeatingPage = () => {

  const [rooms, setRooms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [openRooms, setOpenRooms] = useState(false);

  const [generated, setGenerated] = useState(false);
  const [allocations, setAllocations] = useState<{ room: string; benches: BenchAllocation[] }[]>([]);

  // 🔥 FETCH ROOMS + EXAMS
  useEffect(() => {

    fetch("http://localhost:5000/api/classrooms")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((r: any) => ({
          id: r.id,
          roomNumber: r.room_number
        }));
        setRooms(formatted);
      });

    fetch("http://localhost:5000/api/exams")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((e: any) => ({
          id: e.exam_id,
          name: `${e.exam_name} (Sem ${e.semester})`
        }));
        setExams(formatted);
      });

  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // ONLY close if clicking outside dropdown
      if (!target.closest("#rooms-dropdown")) {
        setOpenRooms(false);
      }
    };

    if (openRooms) {
      window.addEventListener("click", handleClick);
    }

    return () => window.removeEventListener("click", handleClick);
  }, [openRooms]);

  const toggleRoom = (id: string) => {
    if (selectedRooms.includes(id)) {
      setSelectedRooms(selectedRooms.filter(r => r !== id));
    } else {
      setSelectedRooms([...selectedRooms, id]);
    }
  };

  // 🔥 CSV UPLOAD
  const uploadCSV = async () => {
    if (!csvFile) {
      alert("Select CSV");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    await fetch("http://localhost:5000/api/upload-seating", {
      method: "POST",
      body: formData
    });

    alert("Students CSV uploaded");
  };

  //  GENERATE 
  const generateSeating = async () => {

    if (!selectedExam) {
      alert("Select exam");
      return;
    }

    const body = {
      exam_id: selectedExam,
      room_ids: selectedRooms.length === 0 ? [] : selectedRooms
    };

    try {

      // 🔥 STEP 1: GENERATE
      const res = await fetch("http://localhost:5000/api/seating/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Generation failed");
        return;
      }

      // 🔥 STEP 2: FETCH GENERATED DATA
      const fetchRes = await fetch(`http://localhost:5000/api/seating/${selectedExam}`);
      const seatingData = await fetchRes.json();

      console.log("SEATING DATA:", seatingData);

      // 🔥 STEP 3: FORMAT DATA
      const grouped: any = {};

      seatingData.forEach((row: any) => {

        if (!grouped[row.room_number]) {
          grouped[row.room_number] = [];
        }

        grouped[row.room_number].push({
          bench: row.bench_number,
          student1: {
            roll: row.student1_id,
          },
          student2: {
            roll: row.student2_id,
          }
        });

      });

      const formatted = Object.keys(grouped).map(room => ({
        room,
        benches: grouped[room]
      }));

      setAllocations(formatted);
      setGenerated(true);

      alert("Seating generated successfully!");

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="page-header">Seating Allocation Engine</h1>
        <p className="page-description">
          Generate exam seating with department-pair rules
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Available Rooms" value={rooms.length} icon={DoorOpen} />
        <StatCard title="Departments" value={6} icon={Building2} />
      </div>

      {/* CONFIG */}
      <div className="stat-card space-y-4 overflow-visible">

        <h3 className="text-sm font-medium text-foreground">Configuration</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* EXAM */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Exam</label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>

              <SelectContent className="max-h-60 overflow-y-auto z-50">
                {exams.map((e: any) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ROOMS */}
          <div id="rooms-dropdown" className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Rooms</label>

            {/* Trigger */}
            <div
              onClick={() => setOpenRooms(!openRooms)}
              className="h-9 flex items-center justify-between px-3 border border-border rounded-md text-sm cursor-pointer bg-background"
            >
              <span>
                {selectedRooms.length === 0
                  ? "All Rooms"
                  : `${selectedRooms.length} room(s) selected`}
              </span>
              <span>▼</span>
            </div>

            {/* Dropdown */}
            {openRooms && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto border border-border rounded-md bg-background shadow-lg p-2"
              >

                {/* ALL ROOMS */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedRooms.length === 0}
                    onChange={() => setSelectedRooms([])}
                  />
                  <span className="text-sm">All Rooms</span>
                </div>

                {/* ROOMS LIST */}
                {rooms.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(String(r.id))}
                      onChange={() => toggleRoom(String(r.id))}
                    />
                    <span className="text-sm">{r.roomNumber}</span>
                  </div>
                ))}

              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-end gap-2">

            <input
              type="file"
              accept=".csv"
              className="text-xs max-w-[140px]"
              onChange={(e) => {
                if (e.target.files) {
                  setCsvFile(e.target.files[0]);
                }
              }}
            />

            <Button variant="outline" size="sm" onClick={uploadCSV}>
              <Upload className="h-3.5 w-3.5" /> Upload CSV
            </Button>

            <Button size="sm" onClick={generateSeating}>
              <Grid3X3 className="h-3.5 w-3.5" /> Generate Seating
            </Button>

          </div>

        </div>

        {/* RULE */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Rule:</strong> Each bench has 2 students from different departments.
            Pairs: CSE↔CSM, CSD↔ECE, IT↔AIDS
          </p>
        </div>

      </div>

      {/* OUTPUT */}
      {generated && (
        <div className="space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Seating Report
            </h3>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </Button>
          </div>

          {allocations.map((alloc, ri) => (
            <motion.div
              key={alloc.room}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ri * 0.1 }}
              className="stat-card space-y-4"
            >

              {/* ROOM HEADER */}
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground">
                  Room {alloc.room}
                </h4>

                <Badge variant="secondary">
                  {alloc.benches.length * 2} Students
                </Badge>
              </div>

              {/* 🔥 VISUAL GRID */}
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {alloc.benches.map((b) => (
                  <div key={b.bench} className="text-[10px] text-center space-y-1">

                    <div className="text-muted-foreground">
                      B{b.bench}
                    </div>

                    <div className="bg-primary/20 rounded p-1 font-mono text-primary">
                      {b.student1.roll}
                    </div>

                    <div className="bg-info/20 rounded p-1 font-mono text-info">
                      {b.student2.roll}
                    </div>

                  </div>
                ))}
              </div>

              {/* 🔥 TABLE VIEW (CLEAN LIKE YOUR DESIGN) */}
              <div className="overflow-x-auto border border-border rounded-lg">

                <table className="w-full text-xs">

                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left">Bench</th>
                      <th className="px-3 py-2 text-left">Student 1</th>
                      <th className="px-3 py-2 text-left">Student 2</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alloc.benches.map((b) => (
                      <tr
                        key={b.bench}
                        className="border-b border-border last:border-0"
                      >

                        <td className="px-3 py-2 font-medium">
                          B{b.bench}
                        </td>

                        <td className="px-3 py-2 font-mono">
                          {b.student1.roll}
                        </td>

                        <td className="px-3 py-2 font-mono">
                          {b.student2.roll}
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>

            </motion.div>
          ))}

        </div>
      )}

    </div>
  );
};

export default SeatingPage;
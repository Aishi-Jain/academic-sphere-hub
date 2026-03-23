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
  student1: { roll: string };
  student2: { roll: string };
}

const SeatingPage = () => {

  // 🔥 ROLE DETECTION
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role; // admin | faculty | student

  const [rooms, setRooms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [openRooms, setOpenRooms] = useState(false);

  const [generated, setGenerated] = useState(false);
  const [allocations, setAllocations] = useState<{ room: string; benches: BenchAllocation[] }[]>([]);
  const [searchRoll, setSearchRoll] = useState("");
  const [filteredAllocations, setFilteredAllocations] = useState<any[]>([]);

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

  // 🔥 AUTO SELECT EXAM FOR STUDENTS/FACULTY
  useEffect(() => {
    if (role !== "admin" && exams.length > 0) {
      setSelectedExam(String(exams[0].id));
    }
  }, [exams, role]);

  // 🔥 FETCH SEATING
  useEffect(() => {
    if (!selectedExam) return;

    const fetchSeating = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/seating/${selectedExam}`);
        const seatingData = await res.json();

        if (!seatingData || seatingData.length === 0) {
          setGenerated(false);
          return;
        }

        const grouped: any = {};

        seatingData.forEach((row: any) => {
          if (!grouped[row.room_number]) {
            grouped[row.room_number] = [];
          }

          grouped[row.room_number].push({
            bench: row.bench_number,
            student1: { roll: row.student1_id },
            student2: { roll: row.student2_id }
          });
        });

        const formatted = Object.keys(grouped).map(room => ({
          room,
          benches: grouped[room]
        }));

        setAllocations(formatted);
        setGenerated(true);

      } catch (err) {
        console.error("Error fetching seating:", err);
      }
    };

    fetchSeating();
  }, [selectedExam]);

  // 🔥 DROPDOWN CLOSE
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
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

  // 🔥 CSV UPLOAD (ADMIN ONLY)
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

  const handleSearch = () => {
    if (!searchRoll.trim()) {
      setFilteredAllocations([]);
      return;
    }

    const result = allocations.filter((room) =>
      room.benches.some(
        (b: any) =>
          b.student1.roll === searchRoll ||
          b.student2.roll === searchRoll
      )
    );

    setFilteredAllocations(result);
  };

  // 🔥 GENERATE (ADMIN ONLY)
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
        <h1 className="page-header">
          {role === "admin" ? "Seating Allocation Engine" : "Seating Arrangement"}
        </h1>

        <p className="page-description">
          {role === "admin"
            ? "Generate exam seating with department-pair rules"
            : "View your exam seating arrangement"}
        </p>
      </div>

      {/* STATS (ADMIN ONLY) */}
      {role === "admin" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Available Rooms" value={rooms.length} icon={DoorOpen} />
          <StatCard title="Departments" value={6} icon={Building2} />
        </div>
      )}

      {/* CONFIG (ADMIN ONLY) */}
      {role === "admin" && (
        <div className="stat-card space-y-4 overflow-visible">

          <h3 className="text-sm font-medium text-foreground">Configuration</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* EXAM */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Exam</label>
              <Select
                value={selectedExam}
                onValueChange={(value) => {
                  setSelectedExam(value);
                  localStorage.setItem("selectedExam", value);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>

                <SelectContent>
                  {exams.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ROOMS */}
            <div id="rooms-dropdown">
              <label className="text-xs text-muted-foreground mb-1 block">Rooms</label>

              <div
                onClick={() => setOpenRooms(!openRooms)}
                className="h-9 flex items-center justify-between px-3 border rounded-md text-sm cursor-pointer"
              >
                {selectedRooms.length === 0 ? "All Rooms" : `${selectedRooms.length} selected`}
              </div>

              {openRooms && (
                <div className="absolute bg-background p-2 border rounded mt-1">
                  {rooms.map((r: any) => (
                    <div key={r.id}>
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(String(r.id))}
                        onChange={() => toggleRoom(String(r.id))}
                      />
                      {r.roomNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 items-end">
              <input type="file" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />

              <Button onClick={uploadCSV}>
                <Upload /> Upload CSV
              </Button>

              <Button onClick={generateSeating}>
                <Grid3X3 /> Generate Seating
              </Button>
            </div>

          </div>
        </div>
      )}

      <div className="flex gap-3 items-center mb-4">
        <input
          type="text"
          placeholder="Enter Roll Number"
          value={searchRoll}
          onChange={(e) => setSearchRoll(e.target.value)}
          className="px-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-sm"
        />

        <Button size="sm" onClick={handleSearch}>
          Search
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchRoll("");
            setFilteredAllocations([]);
          }}
        >
          Reset
        </Button>
      </div>

      {/* OUTPUT (ALL USERS) */}
      {generated && (
        <div className="space-y-6">

          <div className="flex justify-between">
            <h3>Seating Report</h3>

            <Button onClick={() => window.print()}>
              <Download /> Export PDF
            </Button>
          </div>

          {(filteredAllocations.length > 0 ? filteredAllocations : allocations)
            .map((alloc, i) => (
            <motion.div key={alloc.room} className="stat-card space-y-4">

              <div className="flex justify-between">
                <h4>Room {alloc.room}</h4>
                <Badge>{alloc.benches.length * 2} Students</Badge>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {alloc.benches.map((b) => (
                  <div
                    key={b.bench}
                    className="text-[10px] text-center space-y-1"
                  >
                    {/* Bench label */}
                    <div className="text-muted-foreground font-medium">
                      B{b.bench}
                    </div>

                    {/* Student 1 */}
                    <div className={`rounded-md px-2 py-1 font-mono transition-all duration-200
                      ${b.student1.roll === searchRoll
                        ? "bg-yellow-400 text-black font-bold scale-110 shadow-lg"
                        : "bg-primary/20 text-primary hover:scale-105 hover:shadow-lg"}
                    `}>
                      {b.student1.roll}
                    </div>

                    {/* Student 2 */}
                    <div className={`rounded-md px-2 py-1 font-mono transition-all duration-200
                      ${b.student2.roll === searchRoll
                        ? "bg-yellow-400 text-black font-bold scale-110 shadow-lg"
                        : "bg-blue-500/20 text-blue-400 hover:scale-105 hover:shadow-lg"}
                    `}>
                      {b.student2.roll}
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          ))}

        </div>
      )}

    </div>
  );
};

export default SeatingPage;
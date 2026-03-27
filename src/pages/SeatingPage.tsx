import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/StatCard";
import { Building2, DoorOpen, Download, Grid3X3, Search, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BenchAllocation {
  bench: number;
  student1: { roll: string };
  student2: { roll: string };
}

const SeatingPage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;

  const [rooms, setRooms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [allocations, setAllocations] = useState<{ room: string; benches: BenchAllocation[] }[]>([]);
  const [searchRoll, setSearchRoll] = useState("");
  const [filteredAllocations, setFilteredAllocations] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/classrooms")
      .then((res) => res.json())
      .then((data) => {
        setRooms(
          data.map((room: any) => ({
            id: room.id,
            roomNumber: room.room_number,
          }))
        );
      });

    fetch("http://localhost:5000/api/exams")
      .then((res) => res.json())
      .then((data) => {
        setExams(
          data.map((exam: any) => ({
            id: exam.exam_id,
            name: `${exam.exam_name} (Sem ${exam.semester})`,
          }))
        );
      });
  }, []);

  useEffect(() => {
    if (role !== "admin" && exams.length > 0) {
      setSelectedExam(String(exams[0].id));
    }
  }, [exams, role]);

  useEffect(() => {
    if (!selectedExam) return;

    const fetchSeating = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/seating/${selectedExam}`);
        const seatingData = await res.json();

        if (!seatingData || seatingData.length === 0) {
          setGenerated(false);
          setAllocations([]);
          return;
        }

        const grouped: Record<string, BenchAllocation[]> = {};

        seatingData.forEach((row: any) => {
          if (!grouped[row.room_number]) grouped[row.room_number] = [];

          grouped[row.room_number].push({
            bench: row.bench_number,
            student1: { roll: row.student1_id },
            student2: { roll: row.student2_id },
          });
        });

        setAllocations(
          Object.keys(grouped).map((room) => ({
            room,
            benches: grouped[room],
          }))
        );
        setGenerated(true);
      } catch (err) {
        console.error("Error fetching seating:", err);
      }
    };

    void fetchSeating();
  }, [selectedExam]);

  const toggleRoom = (id: string) => {
    setSelectedRooms((current) =>
      current.includes(id) ? current.filter((room) => room !== id) : [...current, id]
    );
  };

  const uploadCSV = async () => {
    if (!csvFile) {
      alert("Select CSV");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    await fetch("http://localhost:5000/api/upload-seating", {
      method: "POST",
      body: formData,
    });

    alert("Students CSV uploaded");
  };

  const handleSearch = () => {
    if (!searchRoll.trim()) {
      setFilteredAllocations([]);
      return;
    }

    const normalizedRoll = searchRoll.trim().toUpperCase();
    setFilteredAllocations(
      allocations.filter((room) =>
        room.benches.some(
          (bench) =>
            bench.student1.roll.toUpperCase() === normalizedRoll ||
            bench.student2.roll.toUpperCase() === normalizedRoll
        )
      )
    );
  };

  const generateSeating = async () => {
    if (!selectedExam) {
      alert("Select exam");
      return;
    }

    const body = {
      exam_id: selectedExam,
      room_ids: selectedRooms.length === 0 ? [] : selectedRooms,
    };

    try {
      const res = await fetch("http://localhost:5000/api/seating/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Generation failed");
        return;
      }

      alert("Seating generated successfully!");
      setSelectedExam(String(selectedExam));
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const displayAllocations = filteredAllocations.length > 0 ? filteredAllocations : allocations;
  const selectedRoomLabels = useMemo(
    () =>
      rooms
        .filter((room) => selectedRooms.includes(String(room.id)))
        .map((room) => room.roomNumber),
    [rooms, selectedRooms]
  );

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="hero-layout-wide">
          <div>
            <p className="section-kicker">Seating Operations</p>
            <h1 className="page-header">
              {role === "admin" ? "Seating Allocation Engine" : "Seating Arrangement"}
            </h1>
            <p className="page-description max-w-2xl">
              {role === "admin"
                ? "Generate exam seating with cleaner room configuration, search tools, and export-ready visual reports."
                : "View your exam seating arrangement in a structured, room-wise layout."}
            </p>
          </div>

          <div className="glass-panel space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Quick Snapshot
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-muted-foreground">Exam Records</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{exams.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-muted-foreground">Generated Rooms</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{allocations.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Available Rooms" value={rooms.length} icon={DoorOpen} />
          <StatCard title="Departments" value={6} icon={Building2} />
        </div>
      )}

      {role === "admin" && (
        <section className="data-card space-y-6 overflow-visible">
          <div>
            <p className="section-kicker">Configuration</p>
            <h2 className="section-header mt-1">Build The Seating Plan</h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr_1fr]">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Exam</label>
              <Select
                value={selectedExam}
                onValueChange={(value) => {
                  setSelectedExam(value);
                  localStorage.setItem("selectedExam", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam: any) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rooms</label>
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-2xl border border-border/70 bg-white/[0.03] p-3">
                {rooms.map((room: any) => {
                  const active = selectedRooms.includes(String(room.id));
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => toggleRoom(String(room.id))}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-[hsl(var(--accent-cyan))/0.25] bg-[hsl(var(--accent-cyan))/0.12] text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
                      }`}
                    >
                      {room.roomNumber}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedRoomLabels.length === 0
                  ? "No rooms selected. All rooms will be considered."
                  : `${selectedRoomLabels.length} rooms selected: ${selectedRoomLabels.join(", ")}`}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Upload Student CSV
                </label>
                <Input type="file" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={uploadCSV} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
                <Button onClick={generateSeating} className="gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Generate Seating
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="data-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Lookup</p>
            <h2 className="section-header mt-1">Search By Roll Number</h2>
            <p className="text-sm text-muted-foreground">
              Narrow the report to the room where a specific student is seated.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Enter Roll Number"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
            />
            <Button size="sm" onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
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
        </div>
      </section>

      {generated && (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker">Output</p>
              <h2 className="section-header mt-1">Seating Report</h2>
            </div>
            <Button onClick={() => window.print()} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {displayAllocations.map((allocation, index) => (
            <motion.div
              key={allocation.room}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="data-card space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-kicker">Room</p>
                  <h3 className="section-header mt-1">{allocation.room}</h3>
                </div>
                <Badge>{allocation.benches.length * 2} Students</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
                {allocation.benches.map((bench) => (
                  <div
                    key={bench.bench}
                    className="rounded-2xl border border-border/70 bg-white/[0.03] p-3 text-center"
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      B{bench.bench}
                    </div>
                    <div
                      className={`mt-3 rounded-xl px-3 py-2 font-mono text-xs transition ${
                        bench.student1.roll.toUpperCase() === searchRoll.trim().toUpperCase()
                          ? "bg-amber-400 text-black shadow-lg"
                          : "bg-[hsl(var(--accent-cyan))/0.12] text-cyan-100"
                      }`}
                    >
                      {bench.student1.roll}
                    </div>
                    <div
                      className={`mt-2 rounded-xl px-3 py-2 font-mono text-xs transition ${
                        bench.student2.roll.toUpperCase() === searchRoll.trim().toUpperCase()
                          ? "bg-amber-400 text-black shadow-lg"
                          : "bg-[hsl(var(--accent-violet))/0.12] text-violet-100"
                      }`}
                    >
                      {bench.student2.roll}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </section>
      )}
    </div>
  );
};

export default SeatingPage;

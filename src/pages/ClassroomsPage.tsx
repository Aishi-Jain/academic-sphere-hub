import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ClassroomRow = {
  id: number;
  roomNumber: string;
  capacity: number;
  block: string;
};

const ClassroomsPage = () => {
  const [open, setOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [block, setBlock] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchClassrooms = () => {
    fetch("http://localhost:5000/api/classrooms")
      .then((res) => res.json())
      .then((data) => {
        setClassrooms(
          data.map((classroom: any) => ({
            id: classroom.id,
            roomNumber: classroom.room_number,
            capacity: classroom.capacity,
            block: classroom.block,
          }))
        );
      });
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setRoomNumber("");
    setCapacity("");
    setBlock("");
  };

  const addClassroom = async () => {
    await fetch("http://localhost:5000/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_number: roomNumber,
        capacity,
        block,
      }),
    });

    setOpen(false);
    resetForm();
    fetchClassrooms();
  };

  const deleteClassroom = async (id: number) => {
    await fetch(`http://localhost:5000/api/classrooms/${id}`, {
      method: "DELETE",
    });

    fetchClassrooms();
  };

  const updateClassroom = async (id: number) => {
    await fetch(`http://localhost:5000/api/classrooms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_number: roomNumber,
        capacity,
        block,
      }),
    });

    setOpen(false);
    resetForm();
    fetchClassrooms();
  };

  const totalCapacity = classrooms.reduce((sum, classroom) => sum + Number(classroom.capacity || 0), 0);

  const columns = [
    {
      key: "roomNumber",
      header: "Room",
      render: (classroom: ClassroomRow) => <span className="font-medium">{classroom.roomNumber}</span>,
    },
    { key: "capacity", header: "Capacity" },
    { key: "block", header: "Block" },
    {
      key: "actions",
      header: "Actions",
      render: (classroom: ClassroomRow) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingId(classroom.id);
              setRoomNumber(classroom.roomNumber);
              setCapacity(String(classroom.capacity));
              setBlock(classroom.block);
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteClassroom(classroom.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-surface">
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Campus Resources</p>
            <h1 className="page-header">Classrooms</h1>
            <p className="page-description max-w-2xl">
              Maintain room inventory, block allocation, and exam-ready capacity from one streamlined classroom registry.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Rooms</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{classrooms.length}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{totalCapacity}</p>
            </div>
          </div>
        </div>
      </section>

      <DataTable
        data={classrooms}
        columns={columns}
        searchKey="roomNumber"
        actions={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Classroom
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId !== null ? "Edit Classroom" : "Add Classroom"}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Room Number</Label>
                  <Input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Capacity</Label>
                  <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Block</Label>
                  <Input value={block} onChange={(e) => setBlock(e.target.value)} />
                </div>

                <Button onClick={() => (editingId !== null ? updateClassroom(editingId) : addClassroom())}>
                  {editingId !== null ? "Update Classroom" : "Add Classroom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
    </div>
  );
};

export default ClassroomsPage;

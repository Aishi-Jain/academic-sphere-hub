import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ClassroomsPage = () => {
  const [open, setOpen] = useState(false);
  const [classrooms, setClassrooms] = useState([]);

  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [block, setBlock] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔥 FETCH DATA
  useEffect(() => {
    fetch("http://localhost:5000/api/classrooms")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((c: any) => ({
          id: c.id,
          roomNumber: c.room_number,
          capacity: c.capacity,
          block: c.block,
        }));

        setClassrooms(formatted);
      });
  }, []);

  // 🔥 ADD
  const addClassroom = async () => {
    await fetch("http://localhost:5000/api/classrooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_number: roomNumber,
        capacity,
        block,
      }),
    });

    setOpen(false);
    window.location.reload();
  };

  // 🔥 DELETE
  const deleteClassroom = async (id: number) => {
    await fetch(`http://localhost:5000/api/classrooms/${id}`, {
      method: "DELETE",
    });

    window.location.reload();
  };

  // 🔥 UPDATE
  const updateClassroom = async (id: number) => {
    await fetch(`http://localhost:5000/api/classrooms/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_number: roomNumber,
        capacity,
        block,
      }),
    });

    setEditingId(null);
    setOpen(false);
    window.location.reload();
  };

  const columns = [
    {
      key: "roomNumber",
      header: "Room",
      render: (c: any) => (
        <span className="font-medium">{c.roomNumber}</span>
      ),
    },
    { key: "capacity", header: "Capacity" },
    { key: "block", header: "Block" },

    {
      key: "actions",
      header: "Actions",
      render: (c: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingId(c.id);
              setRoomNumber(c.roomNumber);
              setCapacity(c.capacity);
              setBlock(c.block);
              setOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteClassroom(c.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Classrooms</h1>
        <p className="page-description">
          Manage classroom resources
        </p>
      </div>

      <DataTable
        data={classrooms}
        columns={columns}
        searchKey="roomNumber"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Classroom
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId !== null
                    ? "Edit Classroom"
                    : "Add Classroom"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Room Number</Label>
                  <Input
                    value={roomNumber}
                    onChange={(e) =>
                      setRoomNumber(e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Block</Label>
                  <Input
                    value={block}
                    onChange={(e) =>
                      setBlock(e.target.value)
                    }
                  />
                </div>

                <Button
                  onClick={() => {
                    if (editingId !== null) {
                      updateClassroom(editingId);
                    } else {
                      addClassroom();
                    }
                  }}
                >
                  {editingId !== null
                    ? "Update Classroom"
                    : "Add Classroom"}
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
import { deptShortNames, departments } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const CircularsPage = () => {
  const { role } = useRole();

  const [circulars, setCirculars] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchCirculars = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/circulars");
      setCirculars(res.data);
    } catch (err) {
      console.error("Error fetching circulars");
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, []);

  const addCircular = async () => {
    try {
      if (!title || !description || !department) {
        alert("Please fill all fields");
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("department_id", department);
      if (file) formData.append("file", file);

      await axios.post("http://localhost:5000/api/circulars", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      setDepartment("");
      setFile(null);

      fetchCirculars();
    } catch (err) {
      console.error("Error adding circular", err);
    }
  };

  const deleteCircular = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/circulars/${id}`);
      fetchCirculars();
    } catch (err) {
      console.error("Delete failed");
    }
  };

  const getDeptShortName = (deptId: any) => {
    if (deptId === "global") return "Global";
    const dept = departments.find(
      (d) => String(d.id) === String(deptId)
    );
    return dept ? deptShortNames[dept.name] : deptId;
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Circulars</h1>
          <p className="page-description">Announcements and notices</p>
        </div>

        {role === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> New Circular
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Circular</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">

                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Attachment</Label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {deptShortNames[d.name]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={addCircular}>
                  Add Circular
                </Button>

              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {circulars.map((c, i) => (
          <motion.div
            key={c.circular_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between gap-4">

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <h3 className="font-medium text-sm">{c.title}</h3>

                  <p className="text-xs text-muted-foreground mt-1">
                    {c.description}
                  </p>

                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(c.date).toLocaleDateString()}
                  </p>

                  {/* 🔥 FILE DISPLAY */}
                  {c.file && (
                    <div className="mt-3">

                      {/\.(jpg|jpeg|png|gif)$/i.test(c.file) && (
                        <img
                          src={`http://localhost:5000/uploads/${c.file}`}
                          className="rounded-lg max-h-72 w-full border"
                        />
                      )}

                      {/\.pdf$/i.test(c.file) && (
                        <iframe
                          src={`http://localhost:5000/uploads/${c.file}`}
                          className="w-full h-72 border rounded-lg"
                        />
                      )}

                      {!/\.(jpg|jpeg|png|gif|pdf)$/i.test(c.file) && (
                        <a
                          href={`http://localhost:5000/uploads/${c.file}`}
                          target="_blank"
                          className="text-primary underline text-sm"
                        >
                          📎 View Attachment
                        </a>
                      )}

                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="text-xs">
                  {getDeptShortName(c.department_id)}
                </Badge>

                {role === "admin" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteCircular(c.circular_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};

export default CircularsPage;
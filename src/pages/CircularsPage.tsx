import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { deptShortNames, departments } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Paperclip, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CircularsPage = () => {
  const { role } = useRole();
  const canManageCirculars = role === "admin" || role === "faculty";

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
    void fetchCirculars();
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
        headers: { "Content-Type": "multipart/form-data" },
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
    const dept = departments.find((department) => String(department.id) === String(deptId));
    return dept ? deptShortNames[dept.name] : deptId;
  };

  return (
    <div className="space-y-8">
      <section className="hero-surface">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">Announcements</p>
            <h1 className="page-header">Circulars</h1>
            <p className="page-description max-w-2xl">
              Publish, review, and distribute academic notices through a cleaner department-aware announcement hub.
            </p>
          </div>

          {canManageCirculars && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Circular
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Circular</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Attachment</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>

                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <Select onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        {departments.map((departmentItem) => (
                          <SelectItem key={departmentItem.id} value={String(departmentItem.id)}>
                            {deptShortNames[departmentItem.name]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addCircular}>Add Circular</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric-tile">
          <p className="text-sm text-muted-foreground">Total Circulars</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{circulars.length}</p>
        </div>
        <div className="metric-tile">
          <p className="text-sm text-muted-foreground">Global Notices</p>
          <p className="mt-3 text-3xl font-semibold text-cyan-200">
            {circulars.filter((circular) => circular.department_id === "global").length}
          </p>
        </div>
        <div className="metric-tile">
          <p className="text-sm text-muted-foreground">Role Access</p>
          <p className="mt-3 text-3xl font-semibold text-violet-200">
            {canManageCirculars ? "Publish" : "View"}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {circulars.length === 0 ? (
          <div className="data-card text-center text-muted-foreground">
            No circulars have been published yet.
          </div>
        ) : (
          circulars.map((circular, index) => (
            <motion.div
              key={circular.circular_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="data-card"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--accent-cyan))/0.16] bg-[hsl(var(--accent-cyan))/0.12]">
                    <Megaphone className="h-5 w-5 text-[hsl(var(--accent-cyan))]" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{circular.title}</h3>
                      <Badge>{getDeptShortName(circular.department_id)}</Badge>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{circular.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {new Date(circular.date).toLocaleDateString()}
                    </p>

                    {circular.file ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Paperclip className="h-4 w-4" />
                          Attachment Preview
                        </div>

                        {/\.(jpg|jpeg|png|gif)$/i.test(circular.file) && (
                          <img
                            src={`http://localhost:5000/uploads/${circular.file}`}
                            className="max-h-80 w-full rounded-xl border border-border/70 object-cover"
                          />
                        )}

                        {/\.pdf$/i.test(circular.file) && (
                          <iframe
                            src={`http://localhost:5000/uploads/${circular.file}`}
                            className="h-80 w-full rounded-xl border border-border/70"
                          />
                        )}

                        {!/\.(jpg|jpeg|png|gif|pdf)$/i.test(circular.file) && (
                          <a
                            href={`http://localhost:5000/uploads/${circular.file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-[hsl(var(--accent-cyan))] underline"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {canManageCirculars && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteCircular(circular.circular_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
};

export default CircularsPage;

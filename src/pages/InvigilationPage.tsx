import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { InvigilationCycleDetail } from "@/lib/types";
import { departments, deptShortNames } from "@/lib/mock-data";

type SubjectOption = {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  department_id: number;
  semester: number;
  year: number;
};

type ExamOption = {
  exam_id: number;
  exam_name: string;
  semester: number;
  year: number;
};

type FacultyIdentity = {
  faculty_id: string;
  name: string;
  designation: string;
  department_id: number;
  department_name: string;
};

type SessionDraft = {
  client_key: string;
  session_order: number;
  exam_date: string;
  session_type: "FN" | "AN";
  source_exam_id: number | null;
  occupied_room_count?: number;
  capacity_slots?: number;
};

type TimetableDraftRow = {
  department_id: number;
  department_name: string;
  department_short_name: string;
  sessions: {
    client_session_key: string;
    session_id?: number;
    subject_id: number | null;
    subject_label: string;
  }[];
};

const YEAR_OPTIONS = [1, 2, 3, 4];
const SESSION_OPTIONS: Array<"FN" | "AN"> = ["FN", "AN"];

const API_URL = "http://localhost:5000";

const getUser = () => JSON.parse(localStorage.getItem("user") || "null");

const formatDateTimeLocalValue = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const buildTimetableDraft = (
  detail: InvigilationCycleDetail | null,
  sessions: SessionDraft[],
  year: number
): TimetableDraftRow[] => {
  const allowedCodes = year === 4 ? ["CSE", "CSM", "CSD", "ECE", "IT", "AIDS"] : ["CSE", "CSM", "CSD", "ECE"];
  const mappedDepartments = departments
    .map((department) => ({
      department_id: Number(department.id),
      department_name: department.name,
      department_short_name: deptShortNames[department.name] || department.name,
    }))
    .filter((department) => allowedCodes.includes(department.department_short_name));

  return mappedDepartments.map((department) => {
    const detailRow = detail?.timetable.find((row) => row.department_id === department.department_id);
    return {
      ...department,
      sessions: sessions.map((session) => {
        const existingEntry = detailRow?.sessions.find((entry) => entry.session_id === Number(session.client_key));
        return {
          client_session_key: session.client_key,
          session_id: session.client_key.startsWith("session-") ? undefined : Number(session.client_key),
          subject_id: existingEntry?.subject_id ?? null,
          subject_label: existingEntry?.subject_label ?? "",
        };
      }),
    };
  });
};

const renderSessionLabel = (session: { exam_date: string; session_type: "FN" | "AN"; session_order: number }) =>
  `${session.exam_date || `Session ${session.session_order}`} (${session.session_type})`;

const InvigilationPage = () => {
  const user = getUser();
  const role = user?.role;
  const [selectedYear, setSelectedYear] = useState(4);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [cycleList, setCycleList] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [cycleDetail, setCycleDetail] = useState<InvigilationCycleDetail | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [facultyIdentity, setFacultyIdentity] = useState<FacultyIdentity | null>(null);
  const [cycleTitle, setCycleTitle] = useState("");
  const [bookingDeadline, setBookingDeadline] = useState("");
  const [sessionsDraft, setSessionsDraft] = useState<SessionDraft[]>([]);
  const [timetableDraft, setTimetableDraft] = useState<TimetableDraftRow[]>([]);
  const [allocationDraft, setAllocationDraft] = useState<Record<string, number>>({});
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredExams = useMemo(
    () => exams.filter((exam) => exam.year === selectedYear && exam.semester === selectedSemester),
    [exams, selectedYear, selectedSemester]
  );

  const loadCycleDetail = async (cycleId: number, options?: { hod?: boolean; faculty?: boolean }) => {
    const basePath = options?.hod
      ? `/api/invigilation/hod/cycles/${cycleId}?facultyId=${user.reference_id}`
      : options?.faculty
        ? `/api/invigilation/faculty/cycles/${cycleId}?facultyId=${user.reference_id}`
        : `/api/invigilation/cycles/${cycleId}`;

    const res = await fetch(`${API_URL}${basePath}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load invigilation cycle");
    }

    setCycleDetail(data);
    setSelectedCycleId(data.cycle.id);
    setCycleTitle(data.cycle.title);
    setSelectedSemester(data.cycle.semester);
    setBookingDeadline(formatDateTimeLocalValue(data.cycle.booking_deadline));

    const draftSessions = data.sessions.map((session: any) => ({
      client_key: String(session.id),
      session_order: session.session_order,
      exam_date: session.exam_date,
      session_type: session.session_type,
      source_exam_id: session.source_exam_id,
      occupied_room_count: session.occupied_room_count,
      capacity_slots: session.capacity_slots,
    }));

    setSessionsDraft(draftSessions);
    setTimetableDraft(buildTimetableDraft(data, draftSessions, data.cycle.year));
    setSelectedSessionIds(data.faculty_context?.selected_session_ids || []);

    if (data.faculty_list) {
      setAllocationDraft(
        data.faculty_list.reduce((acc: Record<string, number>, faculty: any) => {
          acc[faculty.faculty_id] = faculty.required_slot_count || 0;
          return acc;
        }, {})
      );
    }
  };

  useEffect(() => {
    const loadSharedData = async () => {
      const [subjectRes, examRes, cycleRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects`),
        fetch(`${API_URL}/api/exams`),
        fetch(`${API_URL}/api/invigilation/cycles?year=${selectedYear}&semester=${selectedSemester}`),
      ]);

      const [subjectData, examData, cycleData] = await Promise.all([subjectRes.json(), examRes.json(), cycleRes.json()]);

      setSubjects(subjectData);
      setExams(
        examData.map((exam: any) => ({
          exam_id: Number(exam.exam_id),
          exam_name: exam.exam_name,
          semester: Number(exam.semester),
          year: Number(exam.year),
        }))
      );
      setCycleList(Array.isArray(cycleData) ? cycleData : []);
    };

    loadSharedData().catch((error) => setMessage(error.message));
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    if (role !== "faculty" || !user?.reference_id) return;

    fetch(`${API_URL}/api/faculty`)
      .then((res) => res.json())
      .then((data) => {
        const currentFaculty = data.find((faculty: any) => faculty.faculty_id === user.reference_id);
        if (currentFaculty) {
          const staticDepartment = departments.find((department) => Number(department.id) === Number(currentFaculty.department_id));
          setFacultyIdentity({
            faculty_id: currentFaculty.faculty_id,
            name: currentFaculty.name,
            designation: currentFaculty.designation,
            department_id: Number(currentFaculty.department_id),
            department_name: staticDepartment?.name || String(currentFaculty.department_id),
          });
        }
      })
      .catch((error) => setMessage(error.message));
  }, [role, user?.reference_id]);

  useEffect(() => {
    const loadRoleView = async () => {
      try {
        setLoading(true);
        setMessage("");

        if (role === "admin") {
          if (selectedCycleId) {
            await loadCycleDetail(selectedCycleId);
          } else {
            setCycleDetail(null);
            setSessionsDraft([]);
            setTimetableDraft(buildTimetableDraft(null, [], selectedYear));
          }
          return;
        }

        const endpoint = `${API_URL}/api/invigilation/cycles/active?year=${selectedYear}`;
        const res = await fetch(endpoint);
        const active = await res.json();

        if (!res.ok) {
          setCycleDetail(null);
          setSessionsDraft([]);
          setTimetableDraft(buildTimetableDraft(null, [], selectedYear));
          return;
        }

        await loadCycleDetail(active.cycle.id, {
          hod: facultyIdentity?.designation === "HOD",
          faculty: role === "faculty",
        });
      } catch (error: any) {
        setMessage(error.message || "Failed to load invigilation data");
      } finally {
        setLoading(false);
      }
    };

    if (role === "faculty" && !facultyIdentity) return;
    loadRoleView();
  }, [role, selectedYear, selectedCycleId, facultyIdentity]);

  const addSession = () => {
    const nextSession: SessionDraft = {
      client_key: `session-${Date.now()}`,
      session_order: sessionsDraft.length + 1,
      exam_date: "",
      session_type: "FN",
      source_exam_id: null,
    };
    setSessionsDraft((current) => [...current, nextSession]);
    setTimetableDraft((current) =>
      current.map((row) => ({
        ...row,
        sessions: [
          ...row.sessions,
          {
            client_session_key: nextSession.client_key,
            subject_id: null,
            subject_label: "",
          },
        ],
      }))
    );
  };

  const updateSession = (clientKey: string, patch: Partial<SessionDraft>) => {
    setSessionsDraft((current) => current.map((session) =>
      session.client_key === clientKey ? { ...session, ...patch } : session
    ));
  };

  const updateTimetableEntry = (departmentId: number, clientSessionKey: string, subjectId: number) => {
    const subject = subjects.find((item) => Number(item.subject_id) === Number(subjectId));
    setTimetableDraft((current) =>
      current.map((row) =>
        row.department_id !== departmentId
          ? row
          : {
              ...row,
              sessions: row.sessions.map((entry) =>
                entry.client_session_key !== clientSessionKey
                  ? entry
                  : {
                      ...entry,
                      subject_id: subject ? Number(subject.subject_id) : null,
                      subject_label: subject ? `${subject.subject_name} (${subject.subject_code})` : "",
                    }
              ),
            }
      )
    );
  };

  const ensureCycle = async () => {
    if (selectedCycleId) return selectedCycleId;

    const res = await fetch(`${API_URL}/api/invigilation/cycles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: cycleTitle || `Year ${selectedYear} Semester ${selectedSemester} Invigilation`,
        year: selectedYear,
        semester: selectedSemester,
        booking_deadline: bookingDeadline || new Date(Date.now() + 86400000).toISOString(),
        created_by: user?.username || "admin",
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create invigilation cycle");
    }

    setSelectedCycleId(data.cycle.id);
    return data.cycle.id as number;
  };

  const saveAdminCycle = async () => {
    try {
      setLoading(true);
      setMessage("");
      const cycleId = await ensureCycle();
      const res = await fetch(`${API_URL}/api/invigilation/cycles/${cycleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cycleTitle || `Year ${selectedYear} Semester ${selectedSemester} Invigilation`,
          year: selectedYear,
          semester: selectedSemester,
          booking_deadline: bookingDeadline,
          created_by: user?.username || "admin",
          sessions: sessionsDraft,
          timetable: timetableDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invigilation cycle");
      setCycleDetail(data);
      setMessage("Draft saved successfully.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const runAdminAction = async (path: string, successMessage: string) => {
    if (!selectedCycleId) return;
    try {
      setLoading(true);
      setMessage("");
      const res = await fetch(`${API_URL}${path}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setCycleDetail(data.cycle ? data : { ...cycleDetail, ...data });
      if (data.cycle) {
        setCycleDetail(data);
      } else if (path.endsWith("/recalculate")) {
        await loadCycleDetail(selectedCycleId);
      }
      setMessage(successMessage);
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveHodAllocations = async () => {
    if (!cycleDetail || !facultyIdentity) return;
    try {
      setLoading(true);
      setMessage("");
      const facultyList = (cycleDetail as any).faculty_list || [];
      const res = await fetch(
        `${API_URL}/api/invigilation/hod/cycles/${cycleDetail.cycle.id}/faculty-slot-allocations`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facultyId: facultyIdentity.faculty_id,
            allocations: facultyList.map((faculty: any) => ({
              faculty_id: faculty.faculty_id,
              required_slot_count: Number(allocationDraft[faculty.faculty_id] || 0),
            })),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save department allocations");
      await loadCycleDetail(data.cycle.id, { hod: true });
      setMessage("Department slot distribution saved.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveFacultyChoices = async () => {
    if (!cycleDetail || !facultyIdentity) return;
    try {
      setLoading(true);
      setMessage("");
      const res = await fetch(`${API_URL}/api/invigilation/faculty/cycles/${cycleDetail.cycle.id}/choices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: facultyIdentity.faculty_id,
          sessionIds: selectedSessionIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save slot choices");
      await loadCycleDetail(data.cycle.id, { faculty: true, hod: facultyIdentity.designation === "HOD" });
      setMessage("Slot preferences submitted.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTimetable = (editable: boolean) => (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="min-w-full text-sm">
        <thead className="bg-white/[0.04] text-muted-foreground">
          <tr>
            <th className="border-b border-r border-border/60 px-3 py-3 text-left">Branch</th>
            {sessionsDraft.map((session) => (
              <th key={session.client_key} className="border-b border-border/60 px-3 py-3 text-left min-w-[220px]">
                <div>{renderSessionLabel(session)}</div>
                <div className="text-xs text-muted-foreground">
                  {session.occupied_room_count ?? 0} rooms / {session.capacity_slots ?? 0} slots
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timetableDraft.map((row) => (
            <tr key={row.department_id}>
              <td className="border-r border-t border-border/60 px-3 py-3 font-medium">{row.department_short_name}</td>
              {row.sessions.map((entry) => {
                const options = subjects.filter(
                  (subject) =>
                    Number(subject.year) === selectedYear &&
                    Number(subject.semester) === selectedSemester &&
                    Number(subject.department_id) === row.department_id
                );
                return (
                  <td key={`${row.department_id}-${entry.client_session_key}`} className="border-t border-border/60 px-3 py-3">
                    {editable ? (
                      <select
                        className="h-11 w-full rounded-xl border border-border/70 bg-white/[0.03] px-3 text-foreground"
                        value={entry.subject_id || ""}
                        onChange={(event) => updateTimetableEntry(row.department_id, entry.client_session_key, Number(event.target.value))}
                      >
                        <option value="">Select subject</option>
                        {options.map((subject) => (
                          <option key={subject.subject_id} value={subject.subject_id}>
                            {subject.subject_name} ({subject.subject_code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{entry.subject_label || "-"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const activeDepartmentSlot =
    facultyIdentity &&
    cycleDetail?.department_slots.find((slot) => slot.department_id === facultyIdentity.department_id);
  const canBook = Boolean(
    cycleDetail &&
      facultyIdentity &&
      cycleDetail.cycle.status === "published" &&
      new Date(cycleDetail.cycle.booking_deadline).getTime() > Date.now()
  );

  return (
    <div className="space-y-6">
      <section className="hero-surface">
        <div className="hero-layout">
          <div>
            <p className="section-kicker">Invigilation Control</p>
            <h1 className="page-header">Faculty Invigilation</h1>
            <p className="page-description max-w-2xl">
              Manage timetable publishing, HOD quota distribution, faculty slot booking, and final room assignment generation.
            </p>
          </div>
          <div className="glass-panel self-start">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Current Context</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex min-h-[116px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="text-4xl font-semibold leading-none text-foreground">{selectedYear}</p>
              </div>
              <div className="flex min-h-[116px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="text-4xl font-semibold leading-none text-foreground">{selectedSemester}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {YEAR_OPTIONS.map((year) => (
          <Button key={year} variant={selectedYear === year ? "default" : "outline"} onClick={() => setSelectedYear(year)}>
            {year} Year
          </Button>
        ))}
      </div>

      {message && <div className="data-card py-4 text-sm">{message}</div>}

      {role === "admin" && (
        <div className="data-card space-y-6">
          <div>
            <p className="section-kicker">Admin Workspace</p>
            <h2 className="section-header mt-1">Cycle Builder</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Semester</label>
              <select
                className="h-11 w-full rounded-xl border border-border/70 bg-white/[0.03] px-3 text-foreground"
                value={selectedSemester}
                onChange={(event) => setSelectedSemester(Number(event.target.value))}
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Cycle</label>
              <select
                className="h-11 w-full rounded-xl border border-border/70 bg-white/[0.03] px-3 text-foreground"
                value={selectedCycleId || ""}
                onChange={(event) => setSelectedCycleId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">New cycle</option>
                {cycleList.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.title} ({cycle.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Title</label>
              <Input value={cycleTitle} onChange={(event) => setCycleTitle(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Booking Deadline</label>
              <Input type="datetime-local" value={bookingDeadline} onChange={(event) => setBookingDeadline(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Sessions</h3>
              <Button size="sm" variant="outline" onClick={addSession}>Add Session</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {sessionsDraft.map((session) => (
                <div key={session.client_key} className="rounded-lg border border-border p-3 space-y-2">
                  <Input type="date" value={session.exam_date} onChange={(event) => updateSession(session.client_key, { exam_date: event.target.value })} />
                  <select
                    className="h-11 w-full rounded-xl border border-border/70 bg-white/[0.03] px-3 text-foreground"
                    value={session.session_type}
                    onChange={(event) => updateSession(session.client_key, { session_type: event.target.value as "FN" | "AN" })}
                  >
                    {SESSION_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <select
                    className="h-11 w-full rounded-xl border border-border/70 bg-white/[0.03] px-3 text-foreground"
                    value={session.source_exam_id || ""}
                    onChange={(event) => updateSession(session.client_key, { source_exam_id: event.target.value ? Number(event.target.value) : null })}
                  >
                    <option value="">Select seating exam</option>
                    {filteredExams.map((exam) => (
                      <option key={exam.exam_id} value={exam.exam_id}>{exam.exam_name}</option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">
                    Snapshot: {session.occupied_room_count ?? 0} rooms / {session.capacity_slots ?? 0} slots
                  </div>
                </div>
              ))}
            </div>
          </div>

          {renderTimetable(true)}

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAdminCycle} disabled={loading}>Save Draft</Button>
            <Button variant="outline" onClick={() => runAdminAction(`/api/invigilation/cycles/${selectedCycleId}/department-slots/recalculate`, "Department slots recalculated.")} disabled={!selectedCycleId || loading}>Recalculate Slots</Button>
            <Button variant="outline" onClick={() => runAdminAction(`/api/invigilation/cycles/${selectedCycleId}/publish`, "Cycle published.")} disabled={!selectedCycleId || loading}>Publish</Button>
            <Button variant="outline" onClick={() => runAdminAction(`/api/invigilation/cycles/${selectedCycleId}/generate`, "Invigilation assignments generated.")} disabled={!selectedCycleId || loading}>Generate Assignments</Button>
          </div>
        </div>
      )}

      {cycleDetail && role !== "admin" && renderTimetable(false)}

      {cycleDetail?.department_slots?.length ? (
        <div className="data-card space-y-3">
          <div>
            <p className="section-kicker">Quota View</p>
            <h3 className="section-header mt-1">Department Slot Summary</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cycleDetail.department_slots.map((slot) => (
              <div key={slot.department_id} className="rounded-2xl border border-border/70 bg-white/[0.03] p-4">
                <div className="font-medium">{slot.department_short_name}</div>
                <div className="text-sm text-muted-foreground">Allocated: {slot.allocated_slots}</div>
                <div className="text-sm text-muted-foreground">Assigned by HOD: {slot.assigned_slots}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {role === "faculty" && facultyIdentity?.designation === "HOD" && cycleDetail && (
        <div className="data-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-kicker">Department Scheduling</p>
              <h3 className="section-header mt-1">HOD Allocation Desk</h3>
              <p className="text-sm text-muted-foreground">
                {activeDepartmentSlot?.department_short_name}: {activeDepartmentSlot?.allocated_slots || 0} slots
              </p>
            </div>
            <Button onClick={saveHodAllocations} disabled={loading}>Save Department Allocation</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.04] text-muted-foreground">
                <tr>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Faculty ID</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Faculty Name</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Designation</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Required Slots</th>
                </tr>
              </thead>
              <tbody>
                {((cycleDetail as any).faculty_list || []).map((faculty: any) => (
                  <tr key={faculty.faculty_id} className="border-t border-border/60">
                    <td className="px-3 py-3">{faculty.faculty_id}</td>
                    <td className="px-3 py-3">{faculty.faculty_name}</td>
                    <td className="px-3 py-3">{faculty.designation}</td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={cycleDetail.sessions.length}
                        value={allocationDraft[faculty.faculty_id] ?? 0}
                        onChange={(event) =>
                          setAllocationDraft((current) => ({
                            ...current,
                            [faculty.faculty_id]: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {role === "faculty" && facultyIdentity && cycleDetail && (
        <div className="data-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-kicker">Booking</p>
              <h3 className="section-header mt-1">Faculty Slot Booking</h3>
              <p className="text-sm text-muted-foreground">
                Assigned slots: {cycleDetail.faculty_context?.required_slot_count || 0}
              </p>
            </div>
            <Badge variant={canBook ? "default" : "secondary"}>
              {canBook ? "Booking Open" : "Read Only"}
            </Badge>
          </div>
          <div className="grid gap-3">
            {cycleDetail.sessions.map((session) => {
              const checked = selectedSessionIds.includes(session.id);
              const full = session.available_slots === 0 && !checked;
              return (
                <label key={session.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/[0.03] p-4">
                  <Checkbox
                    checked={checked}
                    disabled={!canBook || full}
                    onCheckedChange={(value) => {
                      setSelectedSessionIds((current) =>
                        value
                          ? Array.from(new Set([...current, session.id]))
                          : current.filter((sessionId) => sessionId !== session.id)
                      );
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{renderSessionLabel(session)}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.booked_slots}/{session.capacity_slots} booked
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <Button onClick={saveFacultyChoices} disabled={!canBook || loading}>Submit Slot Choices</Button>
        </div>
      )}

      {cycleDetail?.results?.length ? (
        <div className="data-card space-y-4">
          <div>
            <p className="section-kicker">Output</p>
            <h3 className="section-header mt-1">Generated Room Assignments</h3>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.04] text-muted-foreground">
                <tr>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Exam Date</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Session</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Room</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Faculty 1</th>
                  <th className="border-b border-border/60 px-3 py-3 text-left">Faculty 2</th>
                </tr>
              </thead>
              <tbody>
                {cycleDetail.results.map((result) => {
                  const session = cycleDetail.sessions.find((item) => item.id === result.session_id);
                  return (
                    <tr key={`${result.session_id}-${result.room_id}`} className="border-t border-border/60">
                      <td className="px-3 py-3">{session?.exam_date}</td>
                      <td className="px-3 py-3">{session?.session_type}</td>
                      <td className="px-3 py-3">{result.room_number}</td>
                      <td className="px-3 py-3">{result.faculty_1.name} ({deptShortNames[result.faculty_1.department_name] || result.faculty_1.department_name})</td>
                      <td className="px-3 py-3">{result.faculty_2.name} ({deptShortNames[result.faculty_2.department_name] || result.faculty_2.department_name})</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!cycleDetail && !loading && (
        <div className="data-card border-dashed py-8 text-center text-sm text-muted-foreground">
          No invigilation cycle is available for the selected year yet.
        </div>
      )}
    </div>
  );
};

export default InvigilationPage;

export type UserRole = 'admin' | 'faculty' | 'student';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  year: number;
  semester: number;
  section: string;
  cgpa?: number;
  email?: string;
}

export interface Faculty {
  id: string;
  name: string;
  facultyId: string;
  department: string;
  subjectsAssigned: string[];
  email?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
}

export interface Classroom {
  id: string;
  roomNumber: string;
  capacity: number;
  department: string;
}

export interface Exam {
  id: string;
  name: string;
  semester: number;
  startDate: string;
  endDate: string;
  subjects: string[];
}

export interface Mark {
  id: string;
  studentRollNumber: string;
  subject: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
}

export interface Circular {
  id: string;
  title: string;
  content: string;
  department: string | 'global';
  date: string;
  author: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'exam' | 'marks' | 'circular' | 'seating';
  date: string;
  read: boolean;
}

export interface SeatingAllocation {
  roomNumber: string;
  benches: { student1: Student; student2: Student }[];
}

export type ResultSubjectStatus = "pass" | "active_backlog" | "cleared_backlog";

export interface MergedSubjectResult {
  code: string;
  name: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
  credits: string;
  status: ResultSubjectStatus;
  clearedFromGrade: string | null;
  latestExamCode: string;
  latestAttemptLabel?: string;
}

export interface SemesterResult {
  semester: string;
  regulation: string;
  examCodesTried: string[];
  attemptsFetched: number;
  sgpa: string;
  hasActiveBacklog: boolean;
  subjects: MergedSubjectResult[];
}

export interface ResultsSummary {
  cgpa: string;
  activeBacklogCount: number;
  clearedBacklogCount: number;
  semesterCount: number;
}

export interface ResultResponse {
  student: {
    name: string;
    branch: string;
    college: string;
    regulation: string;
  };
  semesters: SemesterResult[];
  summary: ResultsSummary;
  fetchProgress?: {
    stages: string[];
    completed: string[];
  };
  warnings?: string[];
  message?: string;
}

export interface AnalyticsSyncStatus {
  required: boolean;
  year: number;
  semester: string;
  status: "idle" | "running" | "completed" | "failed";
  totalStudents: number;
  completedStudents: number;
  queuedStudents: number;
  successfulStudents: number;
  failedStudents: number;
  progressPercent: number;
  startedAt: string | null;
  updatedAt: string | null;
  completedAt?: string | null;
  lastError: string | null;
  activeSyncYear?: number | null;
  canStart?: boolean;
  message?: string | null;
}

import { Department, Student, Faculty, Subject, Classroom, Exam, Mark, Circular, Notification } from './types';

export const departments: Department[] = [
  { id: '7', name: 'Computer Science & Engineering', code: '05' },
  { id: '8', name: 'CSE (Artificial Intelligence & Machine Learning)', code: '66' },
  { id: '9', name: 'CSE (Data Science)', code: '67' },
  { id: '10', name: 'Electronics & Communication Engineering', code: '04' },
  { id: '11', name: 'Information Technology', code: '12' },
  { id: '12', name: 'AI & Data Science', code: '72' },
];

export const deptShortNames: Record<string, string> = {
  'Computer Science & Engineering': 'CSE',
  'CSE (Artificial Intelligence & Machine Learning)': 'CSM',
  'CSE (Data Science)': 'CSD',
  'Electronics & Communication Engineering': 'ECE',
  'Information Technology': 'IT',
  'AI & Data Science': 'AIDS',
};

const deptNames = departments.map(d => d.name);
const sections = ['A', 'B', 'C'];

function generateStudents(): Student[] {
  const students: Student[] = [];
  let id = 1;
  for (const dept of deptNames) {
    const code = departments.find(d => d.name === dept)!.code;
    for (let i = 1; i <= 30; i++) {
      const roll = `22Q91A${code}${String(i).padStart(2, '0')}`;
      students.push({
        id: String(id++),
        name: `Student ${roll.slice(-4)}`,
        rollNumber: roll,
        department: dept,
        year: Math.ceil(Math.random() * 4),
        semester: Math.ceil(Math.random() * 8),
        section: sections[Math.floor(Math.random() * 3)],
        cgpa: +(6 + Math.random() * 4).toFixed(2),
      });
    }
  }
  return students;
}

export const students: Student[] = generateStudents();

export const faculty: Faculty[] = [
  { id: '1', name: 'Dr. Ramesh Kumar', facultyId: 'FAC001', department: 'Computer Science & Engineering', subjectsAssigned: ['Data Structures', 'Algorithms'] },
  { id: '2', name: 'Dr. Priya Sharma', facultyId: 'FAC002', department: 'Computer Science & Engineering', subjectsAssigned: ['Operating Systems'] },
  { id: '3', name: 'Dr. Anil Reddy', facultyId: 'FAC003', department: 'Computer Science & Machine Learning', subjectsAssigned: ['Machine Learning', 'Deep Learning'] },
  { id: '4', name: 'Dr. Sunita Devi', facultyId: 'FAC004', department: 'Computer Science & Data Science', subjectsAssigned: ['Data Mining'] },
  { id: '5', name: 'Dr. Vikram Singh', facultyId: 'FAC005', department: 'Electronics & Communication Engineering', subjectsAssigned: ['Digital Electronics', 'VLSI'] },
  { id: '6', name: 'Dr. Meera Patel', facultyId: 'FAC006', department: 'Information Technology', subjectsAssigned: ['Web Technologies', 'Cloud Computing'] },
  { id: '7', name: 'Dr. Karthik Rao', facultyId: 'FAC007', department: 'AI & Data Science', subjectsAssigned: ['AI Fundamentals', 'NLP'] },
  { id: '8', name: 'Dr. Lakshmi Narayan', facultyId: 'FAC008', department: 'Computer Science & Engineering', subjectsAssigned: ['Database Systems'] },
];

export const subjects: Subject[] = [
  { id: '1', code: 'CS301', name: 'Data Structures', department: 'Computer Science & Engineering', semester: 3 },
  { id: '2', code: 'CS302', name: 'Algorithms', department: 'Computer Science & Engineering', semester: 3 },
  { id: '3', code: 'CS401', name: 'Operating Systems', department: 'Computer Science & Engineering', semester: 4 },
  { id: '4', code: 'CS501', name: 'Database Systems', department: 'Computer Science & Engineering', semester: 5 },
  { id: '5', code: 'ML301', name: 'Machine Learning', department: 'Computer Science & Machine Learning', semester: 3 },
  { id: '6', code: 'ML401', name: 'Deep Learning', department: 'Computer Science & Machine Learning', semester: 4 },
  { id: '7', code: 'DS301', name: 'Data Mining', department: 'Computer Science & Data Science', semester: 3 },
  { id: '8', code: 'EC301', name: 'Digital Electronics', department: 'Electronics & Communication Engineering', semester: 3 },
  { id: '9', code: 'IT301', name: 'Web Technologies', department: 'Information Technology', semester: 3 },
  { id: '10', code: 'AI301', name: 'AI Fundamentals', department: 'AI & Data Science', semester: 3 },
];

export const classrooms: Classroom[] = [
  { id: '1', roomNumber: 'Room 101', capacity: 60, department: 'CSE Block' },
  { id: '2', roomNumber: 'Room 102', capacity: 60, department: 'CSE Block' },
  { id: '3', roomNumber: 'Room 201', capacity: 60, department: 'ECE Block' },
  { id: '4', roomNumber: 'Room 202', capacity: 60, department: 'ECE Block' },
  { id: '5', roomNumber: 'Room 301', capacity: 60, department: 'IT Block' },
  { id: '6', roomNumber: 'Room 302', capacity: 60, department: 'IT Block' },
];

export const exams: Exam[] = [
  { id: '1', name: 'Mid 1', semester: 3, startDate: '2026-03-15', endDate: '2026-03-20', subjects: ['CS301', 'CS302', 'ML301', 'DS301'] },
  { id: '2', name: 'Mid 2', semester: 3, startDate: '2026-04-15', endDate: '2026-04-20', subjects: ['CS301', 'CS302', 'ML301', 'DS301'] },
  { id: '3', name: 'Semester', semester: 3, startDate: '2026-05-15', endDate: '2026-05-30', subjects: ['CS301', 'CS302', 'CS401', 'ML301', 'DS301'] },
];

export const marks: Mark[] = students.slice(0, 60).map((s, i) => ({
  id: String(i + 1),
  studentRollNumber: s.rollNumber,
  subject: subjects[i % subjects.length].name,
  internal: Math.floor(20 + Math.random() * 10),
  external: Math.floor(40 + Math.random() * 20),
  total: 0,
  grade: '',
})).map(m => {
  const total = m.internal + m.external;
  const grade = total >= 90 ? 'O' : total >= 80 ? 'A+' : total >= 70 ? 'A' : total >= 60 ? 'B+' : total >= 50 ? 'B' : total >= 40 ? 'C' : 'F';
  return { ...m, total, grade };
});

export const circulars: Circular[] = [
  { id: '1', title: 'Mid-1 Exam Schedule Released', content: 'The Mid-1 examination schedule has been released. Please check the exam portal for details.', department: 'global', date: '2026-03-01', author: 'Admin Office' },
  { id: '2', title: 'Workshop on AI/ML', content: 'A two-day workshop on AI/ML will be conducted on March 10-11.', department: 'Computer Science & Engineering', date: '2026-03-05', author: 'CSE Department' },
  { id: '3', title: 'Lab Timings Updated', content: 'New lab timings are effective from March 15.', department: 'Information Technology', date: '2026-03-07', author: 'IT Department' },
];

export const notifications: Notification[] = [
  { id: '1', title: 'Exam Announcement', message: 'Mid-1 exams start on March 15', type: 'exam', date: '2026-03-01', read: false },
  { id: '2', title: 'Marks Published', message: 'Internal marks for Semester 2 have been published', type: 'marks', date: '2026-02-28', read: false },
  { id: '3', title: 'New Circular', message: 'Workshop on AI/ML announced', type: 'circular', date: '2026-03-05', read: true },
  { id: '4', title: 'Seating Released', message: 'Mid-1 seating arrangement is now available', type: 'seating', date: '2026-03-10', read: false },
];

export const dashboardStats = {
  totalStudents: students.length,
  totalFaculty: faculty.length,
  departments: departments.length,
  classrooms: classrooms.length,
  upcomingExams: exams.filter(e => new Date(e.startDate) > new Date()).length,
  averageCGPA: +(students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / students.length).toFixed(2),
  passPercentage: 87.5,
};

export const departmentDistribution = departments.map(d => ({
  name: deptShortNames[d.name],
  count: students.filter(s => s.department === d.name).length,
}));

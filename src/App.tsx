import { Suspense, lazy } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/lib/role-context";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const Index = lazy(() => import("./pages/Index"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const FacultyDashboard = lazy(() => import("./pages/FacultyDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const FacultyPage = lazy(() => import("./pages/FacultyPage"));
const DepartmentsPage = lazy(() => import("./pages/DepartmentsPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const ClassroomsPage = lazy(() => import("./pages/ClassroomsPage"));
const ExamsPage = lazy(() => import("./pages/ExamsPage"));
const SeatingPage = lazy(() => import("./pages/SeatingPage"));
const InvigilationPage = lazy(() => import("./pages/InvigilationPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const MarksPage = lazy(() => import("./pages/MarksPage"));
const StudentMarksPage = lazy(() => import("./pages/StudentMarksPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CircularsPage = lazy(() => import("./pages/CircularsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="app-shell flex min-h-screen items-center justify-center px-6">
    <div className="glass-panel w-full max-w-md text-center">
      <p className="section-kicker mx-auto">Loading</p>
      <h2 className="page-header mt-4">Preparing your workspace</h2>
      <p className="page-description mt-3">
        Loading the next screen with route-based code splitting for a faster experience.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RoleProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
                      <AppLayoutWrapper />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/AdminDashboard" element={<AdminDashboard />} />
                  <Route path="/FacultyDashboard" element={<FacultyDashboard />} />
                  <Route path="/StudentDashboard" element={<StudentDashboard />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/faculty" element={<FacultyPage />} />
                  <Route path="/departments" element={<DepartmentsPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/classrooms" element={<ClassroomsPage />} />
                  <Route path="/exams" element={<ExamsPage />} />
                  <Route path="/seating" element={<SeatingPage />} />
                  <Route path="/invigilation" element={<InvigilationPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/marks" element={<MarksPage />} />
                  <Route path="/student/marks" element={<StudentMarksPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/circulars" element={<CircularsPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </RoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

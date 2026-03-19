import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/lib/role-context";
import  AppLayout from "@/components/AppLayout";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import FacultyPage from "./pages/FacultyPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import SubjectsPage from "./pages/SubjectsPage";
import ClassroomsPage from "./pages/ClassroomsPage";
import ExamsPage from "./pages/ExamsPage";
import SeatingPage from "./pages/SeatingPage";
import ResultsPage from "./pages/ResultsPage";
import MarksPage from "./pages/MarksPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CircularsPage from "./pages/CircularsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {

  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RoleProvider>
          <BrowserRouter>
            <Routes>

              {/* LOGIN */}
              <Route path="/login" element={<LoginPage />} />

              {/* PAGES WITH LAYOUT */}
              <Route path="/" element={<AppLayoutWrapper />}>
                
                <Route index element={<HomePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="faculty" element={<FacultyPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="classrooms" element={<ClassroomsPage />} />
                <Route path="exams" element={<ExamsPage />} />
                <Route path="seating" element={<SeatingPage />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="marks" element={<MarksPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="circulars" element={<CircularsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />

              </Route>

            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
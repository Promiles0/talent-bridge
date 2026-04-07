import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Students = lazy(() => import("./pages/Students"));
const Internships = lazy(() => import("./pages/Internships"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StudentPublicProfile = lazy(() => import("./pages/StudentPublicProfile"));
const InternshipDetail = lazy(() => import("./pages/InternshipDetail"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// Student Dashboard
const StudentOverview = lazy(() => import("./pages/dashboard/student/StudentOverview"));
const StudentProfile = lazy(() => import("./pages/dashboard/student/StudentProfile"));
const StudentApplications = lazy(() => import("./pages/dashboard/student/StudentApplications"));
const StudentProjects = lazy(() => import("./pages/dashboard/student/StudentProjects"));
const StudentMessages = lazy(() => import("./pages/dashboard/student/StudentMessages"));
const StudentCVBuilder = lazy(() => import("./pages/dashboard/student/StudentCVBuilder"));
const StudentSavedInternships = lazy(() => import("./pages/dashboard/student/StudentSavedInternships"));

// Employer Dashboard
const EmployerOverview = lazy(() => import("./pages/dashboard/employer/EmployerOverview"));
const EmployerCompany = lazy(() => import("./pages/dashboard/employer/EmployerCompany"));
const EmployerInternships = lazy(() => import("./pages/dashboard/employer/EmployerInternships"));
const EmployerApplications = lazy(() => import("./pages/dashboard/employer/EmployerApplications"));
const EmployerMessages = lazy(() => import("./pages/dashboard/employer/EmployerMessages"));

// Admin Dashboard
const AdminOverview = lazy(() => import("./pages/dashboard/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/dashboard/admin/AdminUsers"));
const AdminFlags = lazy(() => import("./pages/dashboard/admin/AdminFlags"));
const AdminAnalytics = lazy(() => import("./pages/dashboard/admin/AdminAnalytics"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/students" element={<Students />} />
                <Route path="/internships" element={<Internships />} />
                <Route path="/internships/:id" element={<InternshipDetail />} />
                <Route path="/students/:studentId" element={<StudentPublicProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                {/* Student Dashboard */}
                <Route path="/dashboard/student" element={<ProtectedRoute requiredRole="student"><StudentOverview /></ProtectedRoute>} />
                <Route path="/dashboard/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
                <Route path="/dashboard/student/applications" element={<ProtectedRoute requiredRole="student"><StudentApplications /></ProtectedRoute>} />
                <Route path="/dashboard/student/projects" element={<ProtectedRoute requiredRole="student"><StudentProjects /></ProtectedRoute>} />
                <Route path="/dashboard/student/messages" element={<ProtectedRoute requiredRole="student"><StudentMessages /></ProtectedRoute>} />
                <Route path="/dashboard/student/cv-builder" element={<ProtectedRoute requiredRole="student"><StudentCVBuilder /></ProtectedRoute>} />
                <Route path="/dashboard/student/saved" element={<ProtectedRoute requiredRole="student"><StudentSavedInternships /></ProtectedRoute>} />

                {/* Employer Dashboard */}
                <Route path="/dashboard/employer" element={<ProtectedRoute requiredRole="employer"><EmployerOverview /></ProtectedRoute>} />
                <Route path="/dashboard/employer/company" element={<ProtectedRoute requiredRole="employer"><EmployerCompany /></ProtectedRoute>} />
                <Route path="/dashboard/employer/internships" element={<ProtectedRoute requiredRole="employer"><EmployerInternships /></ProtectedRoute>} />
                <Route path="/dashboard/employer/applications" element={<ProtectedRoute requiredRole="employer"><EmployerApplications /></ProtectedRoute>} />
                <Route path="/dashboard/employer/messages" element={<ProtectedRoute requiredRole="employer"><EmployerMessages /></ProtectedRoute>} />

                {/* Admin Dashboard */}
                <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><AdminOverview /></ProtectedRoute>} />
                <Route path="/dashboard/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
                <Route path="/dashboard/admin/flags" element={<ProtectedRoute requiredRole="admin"><AdminFlags /></ProtectedRoute>} />
                <Route path="/dashboard/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

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
const StudentSettings = lazy(() => import("./pages/dashboard/student/StudentSettings"));

// Employer Dashboard
const EmployerOverview = lazy(() => import("./pages/dashboard/employer/EmployerOverview"));
const EmployerCompany = lazy(() => import("./pages/dashboard/employer/EmployerCompany"));
const EmployerInternships = lazy(() => import("./pages/dashboard/employer/EmployerInternships"));
const EmployerApplications = lazy(() => import("./pages/dashboard/employer/EmployerApplications"));
const EmployerMessages = lazy(() => import("./pages/dashboard/employer/EmployerMessages"));
const EmployerSettings = lazy(() => import("./pages/dashboard/employer/EmployerSettings"));
const EmployerAnalytics = lazy(() => import("./pages/dashboard/employer/EmployerAnalytics"));

// Admin Dashboard
const AdminOverview = lazy(() => import("./pages/dashboard/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/dashboard/admin/AdminUsers"));
const AdminFlags = lazy(() => import("./pages/dashboard/admin/AdminFlags"));
const AdminAnalytics = lazy(() => import("./pages/dashboard/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/dashboard/admin/AdminSettings"));
const AdminContent = lazy(() => import("./pages/dashboard/admin/AdminContent"));

// Student extras
const StudentInterviewPrep = lazy(() => import("./pages/dashboard/student/StudentInterviewPrep"));
const StudentAchievements = lazy(() => import("./pages/dashboard/student/StudentAchievements"));
const StudentSkillGap = lazy(() => import("./pages/dashboard/student/StudentSkillGap"));
const StudentCalendar = lazy(() => import("./pages/dashboard/student/StudentCalendar"));
const EmployerTalent = lazy(() => import("./pages/dashboard/employer/EmployerTalent"));
const EmployerBranding = lazy(() => import("./pages/dashboard/employer/EmployerBranding"));
const AdminAudit = lazy(() => import("./pages/dashboard/admin/AdminAudit"));
const AdminVerifications = lazy(() => import("./pages/dashboard/admin/AdminVerifications"));
const StudentInterviews = lazy(() => import("./pages/dashboard/student/StudentInterviews"));
const StudentOffers = lazy(() => import("./pages/dashboard/student/StudentOffers"));
const OfferPrint = lazy(() => import("./pages/OfferPrint"));

import { CommandPalette } from "@/components/CommandPalette";
import { CursorFollower } from "@/components/CursorFollower";
import { BackToTop } from "@/components/BackToTop";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { CommandKHint } from "@/components/CommandKHint";

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
            <ScrollProgressBar />
            <CursorFollower />
            <BackToTop />
            <CommandPalette />
            <CommandKHint />
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
                <Route path="/dashboard/student/settings" element={<ProtectedRoute requiredRole="student"><StudentSettings /></ProtectedRoute>} />
                <Route path="/dashboard/student/interview-prep" element={<ProtectedRoute requiredRole="student"><StudentInterviewPrep /></ProtectedRoute>} />
                <Route path="/dashboard/student/achievements" element={<ProtectedRoute requiredRole="student"><StudentAchievements /></ProtectedRoute>} />
                <Route path="/dashboard/student/skill-gap" element={<ProtectedRoute requiredRole="student"><StudentSkillGap /></ProtectedRoute>} />
                <Route path="/dashboard/student/calendar" element={<ProtectedRoute requiredRole="student"><StudentCalendar /></ProtectedRoute>} />
                <Route path="/dashboard/student/interviews" element={<ProtectedRoute requiredRole="student"><StudentInterviews /></ProtectedRoute>} />
                <Route path="/dashboard/student/offers" element={<ProtectedRoute requiredRole="student"><StudentOffers /></ProtectedRoute>} />
                <Route path="/offers/:id/print" element={<OfferPrint />} />

                {/* Employer Dashboard */}
                <Route path="/dashboard/employer" element={<ProtectedRoute requiredRole="employer"><EmployerOverview /></ProtectedRoute>} />
                <Route path="/dashboard/employer/company" element={<ProtectedRoute requiredRole="employer"><EmployerCompany /></ProtectedRoute>} />
                <Route path="/dashboard/employer/internships" element={<ProtectedRoute requiredRole="employer"><EmployerInternships /></ProtectedRoute>} />
                <Route path="/dashboard/employer/applications" element={<ProtectedRoute requiredRole="employer"><EmployerApplications /></ProtectedRoute>} />
                <Route path="/dashboard/employer/messages" element={<ProtectedRoute requiredRole="employer"><EmployerMessages /></ProtectedRoute>} />
                <Route path="/dashboard/employer/settings" element={<ProtectedRoute requiredRole="employer"><EmployerSettings /></ProtectedRoute>} />
                <Route path="/dashboard/employer/analytics" element={<ProtectedRoute requiredRole="employer"><EmployerAnalytics /></ProtectedRoute>} />
                <Route path="/dashboard/employer/talent" element={<ProtectedRoute requiredRole="employer"><EmployerTalent /></ProtectedRoute>} />
                <Route path="/dashboard/employer/branding" element={<ProtectedRoute requiredRole="employer"><EmployerBranding /></ProtectedRoute>} />

                {/* Admin Dashboard */}
                <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><AdminOverview /></ProtectedRoute>} />
                <Route path="/dashboard/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
                <Route path="/dashboard/admin/flags" element={<ProtectedRoute requiredRole="admin"><AdminFlags /></ProtectedRoute>} />
                <Route path="/dashboard/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/dashboard/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
                <Route path="/dashboard/admin/content" element={<ProtectedRoute requiredRole="admin"><AdminContent /></ProtectedRoute>} />
                <Route path="/dashboard/admin/audit" element={<ProtectedRoute requiredRole="admin"><AdminAudit /></ProtectedRoute>} />
                <Route path="/dashboard/admin/verifications" element={<ProtectedRoute requiredRole="admin"><AdminVerifications /></ProtectedRoute>} />

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

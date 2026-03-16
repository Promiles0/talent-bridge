import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import { Home, Search, FileText, MessageSquare, User, LayoutDashboard, Briefcase, Users, Building2 } from "lucide-react";

const studentTabs = [
  { label: "Home", icon: Home, href: "/dashboard/student" },
  { label: "Search", icon: Search, href: "/internships" },
  { label: "Applications", icon: FileText, href: "/dashboard/student/applications" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/student/messages" },
  { label: "Profile", icon: User, href: "/dashboard/student/profile" },
];

const employerTabs = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard/employer" },
  { label: "Internships", icon: Briefcase, href: "/dashboard/employer/internships" },
  { label: "Applicants", icon: Users, href: "/dashboard/employer/applications" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/employer/messages" },
  { label: "Company", icon: Building2, href: "/dashboard/employer/company" },
];

export function MobileTabBar() {
  const { role } = useAuth();
  const location = useLocation();
  const tabs = role === "employer" ? employerTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-center justify-around border-t border-border bg-card/80 backdrop-blur-lg">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.href;
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="hidden min-[360px]:block">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

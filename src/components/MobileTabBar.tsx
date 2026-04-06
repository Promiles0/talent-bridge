import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import { Home, Search, FileText, MessageSquare, Bookmark, LayoutDashboard, Briefcase, Users, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const studentTabs = [
  { label: "Home", icon: Home, href: "/dashboard/student" },
  { label: "Search", icon: Search, href: "/internships" },
  { label: "Saved", icon: Bookmark, href: "/dashboard/student/saved" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/student/messages" },
  { label: "Applications", icon: FileText, href: "/dashboard/student/applications" },
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
    <motion.nav
      initial={{ y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-center justify-around border-t border-border bg-card/80 backdrop-blur-lg"
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.href;
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className="relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute -top-1 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <motion.div animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <tab.icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            </motion.div>
            <span className={`hidden min-[360px]:block transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}

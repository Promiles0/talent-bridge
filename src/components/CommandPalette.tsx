import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home, User, Briefcase, FolderKanban, MessageSquare, FileText,
  Bookmark, Settings, Brain, Building2, Users, BarChart3, Flag,
  Trophy, Sun, Moon, LogOut, Search, Target, CalendarDays, Sparkles, History,
  Bell, FileSignature, CalendarCheck, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
}

const studentNav: NavItem[] = [
  { label: "Overview", to: "/dashboard/student", icon: Home },
  { label: "Profile", to: "/dashboard/student/profile", icon: User },
  { label: "Calendar", to: "/dashboard/student/calendar", icon: CalendarDays },
  { label: "Applications", to: "/dashboard/student/applications", icon: Briefcase, keywords: "jobs apply status" },
  { label: "Saved Internships", to: "/dashboard/student/saved", icon: Bookmark, keywords: "jobs bookmarks" },
  { label: "Interviews", to: "/dashboard/student/interviews", icon: CalendarCheck, keywords: "schedule slots" },
  { label: "Offers", to: "/dashboard/student/offers", icon: FileSignature, keywords: "contract sign accept" },
  { label: "Projects", to: "/dashboard/student/projects", icon: FolderKanban },
  { label: "Messages", to: "/dashboard/student/messages", icon: MessageSquare },
  { label: "CV Builder", to: "/dashboard/student/cv-builder", icon: FileText },
  { label: "Interview Prep", to: "/dashboard/student/interview-prep", icon: Brain },
  { label: "Skill Gap", to: "/dashboard/student/skill-gap", icon: Target },
  { label: "Achievements", to: "/dashboard/student/achievements", icon: Trophy },
  { label: "Settings", to: "/dashboard/student/settings", icon: Settings },
];

const employerNav: NavItem[] = [
  { label: "Overview", to: "/dashboard/employer", icon: Home },
  { label: "Company", to: "/dashboard/employer/company", icon: Building2 },
  { label: "Branding Studio", to: "/dashboard/employer/branding", icon: Sparkles },
  { label: "Talent Search", to: "/dashboard/employer/talent", icon: Search },
  { label: "Internships (Jobs)", to: "/dashboard/employer/internships", icon: Briefcase, keywords: "jobs posts" },
  { label: "Applications", to: "/dashboard/employer/applications", icon: Users, keywords: "candidates jobs offers interviews" },
  { label: "Analytics", to: "/dashboard/employer/analytics", icon: BarChart3 },
  { label: "Messages", to: "/dashboard/employer/messages", icon: MessageSquare },
  { label: "Settings", to: "/dashboard/employer/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview", to: "/dashboard/admin", icon: Home },
  { label: "Users", to: "/dashboard/admin/users", icon: Users },
  { label: "Verifications", to: "/dashboard/admin/verifications", icon: ShieldCheck },
  { label: "Flags", to: "/dashboard/admin/flags", icon: Flag },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
  { label: "Content", to: "/dashboard/admin/content", icon: FileText },
  { label: "Audit Log", to: "/dashboard/admin/audit", icon: History },
  { label: "Settings", to: "/dashboard/admin/settings", icon: Settings },
];

const publicNav: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Browse Internships (Jobs)", to: "/internships", icon: Briefcase, keywords: "jobs roles openings" },
  { label: "Browse Students", to: "/students", icon: Users },
  { label: "How it works", to: "/how-it-works", icon: FileText },
  { label: "About", to: "/about", icon: User },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const jobsPath =
    role === "employer" ? "/dashboard/employer/internships" :
    role === "student" ? "/dashboard/student/applications" :
    "/internships";
  const offersPath =
    role === "employer" ? "/dashboard/employer/applications" :
    "/dashboard/student/offers";
  const openNotifications = () => {
    window.dispatchEvent(new CustomEvent("open-notifications"));
  };

  useEffect(() => {
    let lastG = 0;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (typing) return;

      // "g" then j/o/n leader shortcuts
      if (e.key === "g") { lastG = Date.now(); return; }
      if (Date.now() - lastG < 1200) {
        if (e.key === "j") { e.preventDefault(); navigate(jobsPath); lastG = 0; }
        else if (e.key === "o") { e.preventDefault(); navigate(offersPath); lastG = 0; }
        else if (e.key === "n") { e.preventDefault(); openNotifications(); lastG = 0; }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, jobsPath, offersPath]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const roleNav =
    role === "student" ? studentNav :
    role === "employer" ? employerNav :
    role === "admin" ? adminNav : [];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions, or jump anywhere…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Quick jump">
          <CommandItem keywords="jobs internships openings roles" onSelect={() => go(jobsPath)}>
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Jobs</span>
            <CommandShortcut>g j</CommandShortcut>
          </CommandItem>
          <CommandItem keywords="offers contracts signing letters" onSelect={() => go(offersPath)}>
            <FileSignature className="mr-2 h-4 w-4" />
            <span>Offers</span>
            <CommandShortcut>g o</CommandShortcut>
          </CommandItem>
          <CommandItem keywords="notifications alerts inbox bell" onSelect={() => { setOpen(false); openNotifications(); }}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            <CommandShortcut>g n</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {roleNav.length > 0 && (
          <CommandGroup heading={`${role?.[0].toUpperCase()}${role?.slice(1)} dashboard`}>
            {roleNav.map((item) => (
              <CommandItem key={item.to} keywords={item.keywords} onSelect={() => go(item.to)}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Browse">
          {publicNav.map((item) => (
            <CommandItem key={item.to} onSelect={() => go(item.to)}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { toggleTheme(); setOpen(false); }}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Toggle theme</span>
          </CommandItem>
          {user && (
            <CommandItem onSelect={async () => { setOpen(false); await signOut(); navigate("/"); }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </CommandItem>
          )}
          {!user && (
            <>
              <CommandItem onSelect={() => go("/login")}>
                <User className="mr-2 h-4 w-4" />
                <span>Sign in</span>
              </CommandItem>
              <CommandItem onSelect={() => go("/signup")}>
                <Search className="mr-2 h-4 w-4" />
                <span>Create account</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

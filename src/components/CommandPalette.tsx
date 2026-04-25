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
  Trophy, Sun, Moon, LogOut, Search,
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
  { label: "Applications", to: "/dashboard/student/applications", icon: Briefcase },
  { label: "Saved Internships", to: "/dashboard/student/saved", icon: Bookmark },
  { label: "Projects", to: "/dashboard/student/projects", icon: FolderKanban },
  { label: "Messages", to: "/dashboard/student/messages", icon: MessageSquare },
  { label: "CV Builder", to: "/dashboard/student/cv-builder", icon: FileText },
  { label: "Interview Prep", to: "/dashboard/student/interview-prep", icon: Brain },
  { label: "Achievements", to: "/dashboard/student/achievements", icon: Trophy },
  { label: "Settings", to: "/dashboard/student/settings", icon: Settings },
];

const employerNav: NavItem[] = [
  { label: "Overview", to: "/dashboard/employer", icon: Home },
  { label: "Company", to: "/dashboard/employer/company", icon: Building2 },
  { label: "Internships", to: "/dashboard/employer/internships", icon: Briefcase },
  { label: "Applications", to: "/dashboard/employer/applications", icon: Users },
  { label: "Analytics", to: "/dashboard/employer/analytics", icon: BarChart3 },
  { label: "Messages", to: "/dashboard/employer/messages", icon: MessageSquare },
  { label: "Settings", to: "/dashboard/employer/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview", to: "/dashboard/admin", icon: Home },
  { label: "Users", to: "/dashboard/admin/users", icon: Users },
  { label: "Flags", to: "/dashboard/admin/flags", icon: Flag },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
  { label: "Content", to: "/dashboard/admin/content", icon: FileText },
  { label: "Settings", to: "/dashboard/admin/settings", icon: Settings },
];

const publicNav: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Browse Internships", to: "/internships", icon: Briefcase },
  { label: "Browse Students", to: "/students", icon: Users },
  { label: "How it works", to: "/how-it-works", icon: FileText },
  { label: "About", to: "/about", icon: User },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

        {roleNav.length > 0 && (
          <CommandGroup heading={`${role?.[0].toUpperCase()}${role?.slice(1)} dashboard`}>
            {roleNav.map((item) => (
              <CommandItem key={item.to} onSelect={() => go(item.to)}>
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

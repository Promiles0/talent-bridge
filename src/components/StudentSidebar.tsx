import { Home, User, Briefcase, FolderKanban, MessageSquare, FileText, LogOut, Bookmark, Settings, Brain, Trophy, Target, CalendarDays } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const items = [
  { title: "Overview", url: "/dashboard/student", icon: Home },
  { title: "Profile", url: "/dashboard/student/profile", icon: User },
  { title: "Applications", url: "/dashboard/student/applications", icon: Briefcase },
  { title: "Saved", url: "/dashboard/student/saved", icon: Bookmark },
  { title: "Projects", url: "/dashboard/student/projects", icon: FolderKanban },
  { title: "Calendar", url: "/dashboard/student/calendar", icon: CalendarDays },
  { title: "Messages", url: "/dashboard/student/messages", icon: MessageSquare, badgeKey: "messages" as const },
  { title: "CV Builder", url: "/dashboard/student/cv-builder", icon: FileText },
  { title: "Interview Prep", url: "/dashboard/student/interview-prep", icon: Brain },
  { title: "Skill Gap", url: "/dashboard/student/skill-gap", icon: Target },
  { title: "Achievements", url: "/dashboard/student/achievements", icon: Trophy },
  { title: "Settings", url: "/dashboard/student/settings", icon: Settings },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user!.id)
        .eq("read", false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const isActive = (url: string) => {
    if (url === "/dashboard/student") return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && "Student Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="relative">
                  {isActive(item.url) && (
                    <motion.div
                      layoutId="student-sidebar-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard/student"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.badgeKey === "messages" && unreadCount && unreadCount > 0 ? (
                        <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      ) : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={async () => { await signOut(); navigate("/"); }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

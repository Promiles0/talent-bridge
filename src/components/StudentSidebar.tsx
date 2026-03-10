import { Home, User, Briefcase, FolderKanban, MessageSquare, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
  { title: "Projects", url: "/dashboard/student/projects", icon: FolderKanban },
  { title: "Messages", url: "/dashboard/student/messages", icon: MessageSquare, badgeKey: "messages" as const },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
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
                <SidebarMenuItem key={item.title}>
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

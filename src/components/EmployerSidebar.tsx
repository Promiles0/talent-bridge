import { Home, Building2, Briefcase, Users, MessageSquare, LogOut, Settings, BarChart3, Search, Sparkles } from "lucide-react";
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
  { title: "Overview", url: "/dashboard/employer", icon: Home },
  { title: "Company", url: "/dashboard/employer/company", icon: Building2 },
  { title: "Branding Studio", url: "/dashboard/employer/branding", icon: Sparkles },
  { title: "Talent Search", url: "/dashboard/employer/talent", icon: Search },
  { title: "Internships", url: "/dashboard/employer/internships", icon: Briefcase },
  { title: "Applications", url: "/dashboard/employer/applications", icon: Users },
  { title: "Analytics", url: "/dashboard/employer/analytics", icon: BarChart3 },
  { title: "Messages", url: "/dashboard/employer/messages", icon: MessageSquare, badgeKey: "messages" as const },
  { title: "Settings", url: "/dashboard/employer/settings", icon: Settings },
];

export function EmployerSidebar() {
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
    if (url === "/dashboard/employer") return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && "Employer Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="relative">
                  {isActive(item.url) && (
                    <motion.div
                      layoutId="employer-sidebar-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard/employer"}
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

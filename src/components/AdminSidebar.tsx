import { Home, Users, Flag, BarChart3, Shield, LogOut, Settings, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

const items = [
  { title: "Overview", url: "/dashboard/admin", icon: Home },
  { title: "Users", url: "/dashboard/admin/users", icon: Users },
  { title: "Flags", url: "/dashboard/admin/flags", icon: Flag },
  { title: "Analytics", url: "/dashboard/admin/analytics", icon: BarChart3 },
  { title: "Content", url: "/dashboard/admin/content", icon: FileText },
  { title: "Settings", url: "/dashboard/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (url: string) => {
    if (url === "/dashboard/admin") return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="relative">
                  {isActive(item.url) && (
                    <motion.div
                      layoutId="admin-sidebar-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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

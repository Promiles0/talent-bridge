import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Palette, Lock } from "lucide-react";
import {
  isNotificationSoundEnabled, setNotificationSoundEnabled,
  isPushEnabled, setPushEnabled, requestPushPermission,
} from "@/lib/notifications";

export default function EmployerSettings() {
  const { user, updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [soundOn, setSoundOn] = useState(isNotificationSoundEnabled());
  const [pushOn, setPushOn] = useState(isPushEnabled());

  useEffect(() => {
    if (profile) setFullName(profile.full_name || "");
    if (user) setEmail(user.email || "");
  }, [profile, user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
      if (error) throw error;
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast.success("Confirmation email sent to new address");
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    const { error } = await updatePassword(password);
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setPassword(""); setConfirmPassword(""); }
  };

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>

        <Card className="glass-card-themed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account</CardTitle>
            <CardDescription>Manage your name and email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>

        <Card className="glass-card-themed">
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
            <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <Button variant="outline" onClick={handleChangePassword} disabled={!password}>Update Password</Button>
          </CardContent>
        </Card>

        <Card className="glass-card-themed">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Notification Sounds</p><p className="text-xs text-muted-foreground">Play a tone for new notifications</p></div>
              <Switch checked={soundOn} onCheckedChange={(v) => { setSoundOn(v); setNotificationSoundEnabled(v); }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Browser Notifications</p><p className="text-xs text-muted-foreground">Desktop notifications for messages</p></div>
              <Switch checked={pushOn} onCheckedChange={async (v) => { if (v) { const ok = await requestPushPermission(); if (!ok) { toast.error("Permission denied"); return; } } setPushOn(v); setPushEnabled(v); }} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-themed">
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Dark Mode</p><p className="text-xs text-muted-foreground">Toggle between light and dark</p></div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}

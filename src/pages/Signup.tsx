import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Signup() {
  const [role, setRole] = useState<"student" | "employer">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName, role);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account!");
      navigate("/login");
    }
  };

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 flex justify-center">
          <GlassCard hover={false} className="w-full max-w-md">
            <h1 className="font-heading text-2xl font-bold mb-1 text-center">Create your account</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Join TalentBridge as a student or employer</p>

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                  role === "student"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <GraduationCap className="h-4 w-4" /> Student
              </button>
              <button
                type="button"
                onClick={() => setRole("employer")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                  role === "employer"
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border text-muted-foreground hover:border-secondary/30"
                )}
              >
                <Building2 className="h-4 w-4" /> Employer
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your full name" className="bg-background" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="bg-background" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="bg-background" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign up as {role === "student" ? "Student" : "Employer"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </div>
          </GlassCard>
        </section>
      </PageTransition>
    </Layout>
  );
}

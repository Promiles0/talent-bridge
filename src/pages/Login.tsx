import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      const path = role === "admin" ? "/dashboard/admin" : role === "employer" ? "/dashboard/employer" : "/dashboard/student";
      navigate(path, { replace: true });
    }
  }, [user, role, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      // Role-based redirect will happen via useEffect when role is loaded
    }
  };

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 flex justify-center">
          <GlassCard hover={false} className="w-full max-w-md">
            <h1 className="font-heading text-2xl font-bold mb-1 text-center">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Log in to your TalentBridge account</p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="bg-background" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="bg-background" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Log in
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="mt-2 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
            </div>
          </GlassCard>
        </section>
      </PageTransition>
    </Layout>
  );
}

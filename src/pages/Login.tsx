import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 flex justify-center">
          <GlassCard hover={false} className="w-full max-w-md">
            <h1 className="font-heading text-2xl font-bold mb-1 text-center">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Log in to your TalentBridge account</p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="bg-background" />
              </div>
              <Button type="submit" className="w-full">Log in</Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/auth/reset" className="text-primary hover:underline">Forgot password?</Link>
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

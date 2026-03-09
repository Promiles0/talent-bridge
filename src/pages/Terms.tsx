import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";

export default function Terms() {
  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 max-w-3xl">
          <h1 className="font-heading text-3xl font-bold mb-6">Terms of Service</h1>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p>Welcome to TalentBridge. By using our platform, you agree to these terms of service.</p>
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing TalentBridge, you agree to be bound by these Terms of Service and our Privacy Policy.</p>
            <h2 className="font-heading text-lg font-semibold text-foreground">2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Acceptable Use</h2>
            <p>You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the service.</p>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}

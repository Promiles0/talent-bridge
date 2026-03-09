import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";

export default function Privacy() {
  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 max-w-3xl">
          <h1 className="font-heading text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p>TalentBridge is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your data.</p>
            <h2 className="font-heading text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly, such as your name, email, skills, education, and uploaded documents.</p>
            <h2 className="font-heading text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to provide our services, match students with employers, and improve the platform experience.</p>
            <h2 className="font-heading text-lg font-semibold text-foreground">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information.</p>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}

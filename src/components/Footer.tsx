import { Link } from "react-router-dom";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "How it Works", href: "/how-it-works" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-heading text-lg font-bold">
          <span className="text-foreground">Talent</span>
          <span className="text-primary">Bridge</span>
        </div>
        <div className="flex gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TalentBridge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

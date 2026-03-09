import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";

const skills = [
  { name: "React", category: "Frontend", color: "hsl(var(--primary))" },
  { name: "Python", category: "Backend", color: "hsl(var(--secondary))" },
  { name: "Node.js", category: "Backend", color: "hsl(var(--primary))" },
  { name: "Figma", category: "Design", color: "hsl(var(--secondary))" },
  { name: "TypeScript", category: "Frontend", color: "hsl(var(--primary))" },
  { name: "PostgreSQL", category: "Database", color: "hsl(var(--secondary))" },
  { name: "Machine Learning", category: "AI/ML", color: "hsl(var(--primary))" },
  { name: "UI/UX Design", category: "Design", color: "hsl(var(--secondary))" },
];

export function SkillsShowcase() {
  return (
    <section className="relative container mx-auto px-4 pb-16 section-skills">
      <div className="text-center mb-10">
        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
          Skills in <span className="text-primary">Demand</span>
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Top skills employers are looking for on TalentBridge
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <GlassCard className="text-center group" delay={0}>
              <motion.div
                whileHover={{ scale: 1.08, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div
                  className="h-12 w-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-lg font-bold transition-shadow duration-300 group-hover:shadow-lg"
                  style={{
                    background: `${skill.color}15`,
                    color: skill.color,
                  }}
                >
                  {skill.name.charAt(0)}
                </div>
                <h3 className="font-heading font-semibold text-sm mb-1">{skill.name}</h3>
                <p className="text-xs text-muted-foreground">{skill.category}</p>
              </motion.div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

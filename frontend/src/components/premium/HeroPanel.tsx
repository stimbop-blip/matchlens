import { type ReactNode } from "react";
import { motion } from "framer-motion";

export function HeroPanel({
  eyebrow,
  title,
  subtitle,
  right,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.section
      className="pb-hero-panel pb-hero-panel-v2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <header className="pb-hero-v2-head">
        <div>
          {eyebrow ? <span className="pb-hero-v2-eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {right ? <div className="pb-hero-v2-right">{right}</div> : null}
      </header>
      {children ? <div className="pb-hero-v2-body">{children}</div> : null}
    </motion.section>
  );
}

import { motion } from "framer-motion";

type PremiumKpiTone = "default" | "accent" | "vip" | "success" | "warning";

export function PremiumKpi({
  label,
  value,
  hint,
  tone = "default",
  emphasized = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: PremiumKpiTone;
  emphasized?: boolean;
}) {
  return (
    <motion.article
      className={`pb-kpi-card pb-kpi-${tone}${emphasized ? " emphasized" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </motion.article>
  );
}

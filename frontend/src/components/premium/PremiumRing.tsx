export function PremiumRing({
  value,
  label,
  caption,
  tone = "accent",
}: {
  value: number;
  label: string;
  caption: string;
  tone?: "accent" | "vip";
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const style = {
    background: `conic-gradient(${tone === "vip" ? "var(--vip-accent)" : "var(--accent-primary)"} ${safe}%, rgba(255,255,255,0.08) ${safe}% 100%)`,
  };

  return (
    <div className={`pb-premium-ring ${tone}`} style={style}>
      <span className="pb-premium-ring-halo" aria-hidden="true" />
      <span className="pb-premium-ring-sheen" aria-hidden="true" />
      <div>
        <small>{label}</small>
        <strong>{safe}%</strong>
        <p>{caption}</p>
      </div>
    </div>
  );
}

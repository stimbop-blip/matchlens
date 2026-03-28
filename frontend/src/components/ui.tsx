import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSportKind, resolveSportLabel, type SportKind } from "../app/sport";

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

const SPORT_GLYPH: Record<SportKind, string> = {
  football: "⚽",
  hockey: "🏒",
  tennis: "🎾",
  table_tennis: "🏓",
  basketball: "🏀",
  volleyball: "🏐",
  esports: "🎮",
  darts: "🎯",
  mma: "🥊",
  baseball: "⚾",
  generic: "🏅",
};

export function SportIcon({ sport, className }: { sport: string; className?: string }) {
  const kind = resolveSportKind(sport);
  return (
    <span className={cx("pb-sport-icon", `kind-${kind}`, className)} aria-hidden="true">
      {SPORT_GLYPH[kind]}
    </span>
  );
}

export function RocketLoader({
  title,
  subtitle,
  className,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cx("pb-rocket-loader", compact && "compact", className)} role="status" aria-live="polite">
      <div className="pb-rocket-visual" aria-hidden="true">
        <span className="pb-rocket-tail" />
        <span className="pb-rocket-mark">🚀</span>
        <span className="pb-rocket-glow" />
      </div>
      <div className="pb-rocket-copy">
        <strong>{title}</strong>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="pb-loader-shimmer" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cx("pb-skeleton-block", className)} aria-hidden="true" />;
}

export function SignalCardSkeleton() {
  return (
    <article className="pb-signal-card pb-skeleton-card" aria-hidden="true">
      <div className="pb-skeleton-row">
        <SkeletonBlock className="w-55" />
        <SkeletonBlock className="w-24" />
      </div>
      <SkeletonBlock className="w-40" />
      <div className="pb-skeleton-grid-two">
        <SkeletonBlock className="h-42" />
        <SkeletonBlock className="h-42" />
      </div>
      <SkeletonBlock className="w-90" />
      <SkeletonBlock className="w-65" />
    </article>
  );
}

export function AppShellSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cx("pb-panel pb-reveal", className)}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="pb-section-head">
      <div>
        {eyebrow ? <span className="pb-eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="pb-section-action">{action}</div> : null}
    </div>
  );
}

export function AccessBadge({
  level,
  label,
  className,
}: {
  level: "free" | "premium" | "vip";
  label?: string;
  className?: string;
}) {
  return <span className={cx("pb-access-badge", level, className)}>{label || level.toUpperCase()}</span>;
}

export function AnimatedNumber({
  value,
  duration = 700,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const delta = value - from;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(from + delta * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const text = useMemo(() => `${prefix}${display.toFixed(decimals)}${suffix}`, [display, decimals, prefix, suffix]);
  return <strong className={cx("pb-animated-number", className)}>{text}</strong>;
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={cx("pb-sparkline", className)} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

export function MarketPulse({ label, values, tag }: { label: string; values: number[]; tag: string }) {
  return (
    <div className="pb-market-pulse">
      <span>{label}</span>
      <Sparkline values={values} />
      <em>{tag}</em>
    </div>
  );
}

export function CTACluster({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("pb-cta-cluster", className)}>{children}</div>;
}

export function ActivityBand({
  items,
}: {
  items: Array<{ label: string; value: string | number; tone?: "default" | "accent" | "success" | "warning" }>;
}) {
  return (
    <div className="pb-activity-band">
      {items.map((item) => (
        <article key={item.label} className={cx("pb-activity-item", item.tone || "default")}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}

export function InsightCard({
  title,
  text,
  tone = "default",
}: {
  title: string;
  text: string;
  tone?: "default" | "accent" | "warning";
}) {
  return (
    <article className={cx("pb-insight-card", tone)}>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export function RingStat({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const total = Math.max(1, items.reduce((acc, item) => acc + item.value, 0));
  let cursor = 0;
  const segments = items
    .map((item) => {
      const start = (cursor / total) * 360;
      const end = ((cursor + item.value) / total) * 360;
      cursor += item.value;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="pb-ring-stat">
      <div className="pb-ring" style={{ background: `conic-gradient(${segments})` }}>
        <div>
          <small>{subtitle}</small>
          <strong>{total}</strong>
        </div>
      </div>
      <div className="pb-ring-legend">
        <h3>{title}</h3>
        {items.map((item) => (
          <div key={item.label}>
            <span style={{ background: item.color }} />
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsRibbon({
  title,
  body,
  category,
  meta,
  to,
  cta,
}: {
  title: string;
  body: string;
  category: string;
  meta: string;
  to?: string;
  cta?: string;
}) {
  const { t } = useI18n();
  return (
    <article className="pb-news-card">
      <div className="pb-news-card-head">
        <strong>{title}</strong>
        <span>{category}</span>
      </div>
      <p>{body}</p>
      <div className="pb-news-card-foot">
        <small>{meta}</small>
        {to ? (
          <Link to={to} className="pb-link-inline">
            {cta || t("news.read")}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function SignalCardV3({
  to,
  match,
  league,
  sport,
  accessLevel,
  mode,
  modeKey,
  access,
  status,
  statusKey,
  kickoff,
  odds,
  risk,
  signal,
  teaser,
  tags,
  hint,
}: {
  to: string;
  match: string;
  league: string;
  sport: string;
  accessLevel: "free" | "premium" | "vip";
  mode: string;
  modeKey: "prematch" | "live";
  access: ReactNode;
  status: string;
  statusKey: "pending" | "won" | "lost" | "refund";
  kickoff: string;
  odds: string | number;
  risk: string;
  signal: string;
  teaser: string;
  tags: string[];
  hint: string;
}) {
  const { t, language } = useI18n();
  const sportLabel = resolveSportLabel(sport, language);

  return (
    <Link to={to} className={cx("pb-signal-card pb-signal-card-compact pb-reveal", accessLevel)}>
      <div className="pb-signal-head">
        <div>
          <h3>{match}</h3>
          <p>{league}</p>
        </div>
        {access}
      </div>

      <div className="pb-signal-topline">
        <span className="pb-signal-sportline">
          <SportIcon sport={sport} />
          <em>{sportLabel}</em>
        </span>
        <span className="pb-meta-pill kickoff">{kickoff}</span>
        <span className={cx("pb-meta-pill", modeKey)}>{mode}</span>
      </div>

      <div className="pb-signal-grid compact">
        <div className="pb-signal-grid-cell">
          <small>{t("feed.label.odds")}</small>
          <strong>{odds}</strong>
        </div>
        <div className="pb-signal-grid-cell">
          <small>{t("feed.label.risk")}</small>
          <strong>{risk}</strong>
        </div>
        <div className="pb-signal-grid-cell">
          <small>{t("feed.label.signal")}</small>
          <strong>{signal}</strong>
        </div>
        <div className="pb-signal-grid-cell">
          <small>{t("feed.filter.status")}</small>
          <strong className={cx("pb-status-inline", statusKey)}>{status}</strong>
        </div>
      </div>

      <p className="pb-signal-teaser">{teaser}</p>

      <div className="pb-signal-foot compact">
        <div className="pb-tag-row">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="pb-signal-action compact">
          <span>{hint}</span>
          <em>&gt;</em>
        </div>
      </div>
    </Link>
  );
}

export function MoreFeatureCard({
  to,
  title,
  subtitle,
  metrics,
}: {
  to: string;
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string | number }>;
}) {
  return (
    <Link to={to} className="pb-more-feature-card">
      <div className="pb-more-feature-head">
        <strong>{title}</strong>
        <em>&gt;</em>
      </div>
      <p>{subtitle}</p>
      <div className="pb-more-feature-metrics">
        {metrics.map((metric) => (
          <span key={metric.label}>
            <small>{metric.label}</small>
            <b>{metric.value}</b>
          </span>
        ))}
      </div>
    </Link>
  );
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pb-settings-section">
      <h3>{title}</h3>
      <div className="pb-settings-list">{children}</div>
    </section>
  );
}

type SettingsRowProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  right?: ReactNode;
};

function SettingsRowBody({ icon, title, subtitle, value, right }: Omit<SettingsRowProps, "to" | "href" | "onClick" | "disabled">) {
  return (
    <>
      <div className="pb-settings-main">
        <span className="pb-settings-icon">{icon}</span>
        <span>
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
      </div>
      <div className="pb-settings-side">
        {value ? <span>{value}</span> : null}
        {right || <em>&gt;</em>}
      </div>
    </>
  );
}

export function SettingsRow(props: SettingsRowProps) {
  const className = cx("pb-settings-row", props.disabled && "disabled");
  const body = <SettingsRowBody icon={props.icon} title={props.title} subtitle={props.subtitle} value={props.value} right={props.right} />;

  if (props.disabled) return <div className={className}>{body}</div>;
  if (props.onClick)
    return (
      <button className={className} onClick={props.onClick} type="button">
        {body}
      </button>
    );
  if (props.href)
    return (
      <a className={className} href={props.href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  if (props.to)
    return (
      <Link className={className} to={props.to}>
        {body}
      </Link>
    );
  return <div className={className}>{body}</div>;
}

export function SegmentedTabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (next: string) => void;
}) {
  return (
    <div className="pb-segmented-tabs" role="tablist">
      {options.map((option) => (
        <button key={option.value} className={option.value === value ? "active" : ""} onClick={() => onChange(option.value)} type="button">
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function MembershipCard({
  title,
  badge,
  description,
  price,
  features,
  active,
  action,
}: {
  title: string;
  badge?: string;
  description: string;
  price: string;
  features: string[];
  active: boolean;
  action: ReactNode;
}) {
  return (
    <article className={cx("pb-membership-card", active && "active")}>
      <div className="pb-membership-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {badge ? <span>{badge}</span> : null}
      </div>
      <strong className="pb-membership-price">{price}</strong>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="pb-membership-action">{action}</div>
    </article>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="pb-toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export function PremiumFooterNote({ children }: { children: ReactNode }) {
  return <footer className="pb-footer-note">{children}</footer>;
}

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
}) {
  return <span className={cx("pb-status-pill", tone)}>{label}</span>;
}

export function ProgressMeter({
  label,
  value,
  total,
  tone = "accent",
}: {
  label: string;
  value: number;
  total: number;
  tone?: "accent" | "success" | "warning" | "danger";
}) {
  const safeTotal = Math.max(1, total);
  const width = Math.max(0, Math.min(100, Math.round((value / safeTotal) * 100)));
  return (
    <div className="pb-progress-meter">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="pb-progress-track" role="presentation">
        <span className={cx("pb-progress-fill", tone)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

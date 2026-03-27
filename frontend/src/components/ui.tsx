import { type ReactNode } from "react";
import { Link } from "react-router-dom";

type Classable = {
  className?: string;
};

export function AppShellSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  id?: string;
} & Classable) {
  return (
    <section id={id} className={className ? `app-section ${className}` : "app-section"}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

export function HeroCard({
  eyebrow,
  title,
  description,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="hero-card">
      <div className="hero-top">
        <div>
          <span className="hero-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <p className="hero-description">{description}</p>
      {children ? <div className="hero-actions">{children}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

export function SectionActions({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <div className={compact ? "section-actions compact" : "section-actions"}>{children}</div>;
}

export function CardFooterActions({ children }: { children: ReactNode }) {
  return <div className="card-footer-actions">{children}</div>;
}

export function QuickActionRow({ children }: { children: ReactNode }) {
  return <div className="quick-action-row">{children}</div>;
}

export function AccessBadge({
  level,
  label,
}: {
  level: "free" | "premium" | "vip";
  label?: string;
}) {
  return <span className={`access-badge ${level}`}>{label || level.toUpperCase()}</span>;
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <h3>{title}</h3>
      <div className="settings-list">{children}</div>
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
  danger?: boolean;
};

function RowContent({ icon, title, subtitle, value, right }: Omit<SettingsRowProps, "to" | "href" | "onClick" | "disabled" | "danger">) {
  return (
    <>
      <div className="settings-row-main">
        <span className="settings-row-icon">{icon}</span>
        <span className="settings-row-text">
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
      </div>
      <div className="settings-row-side">
        {value ? <span className="settings-row-value">{value}</span> : null}
        {right || <span className="settings-row-chevron">›</span>}
      </div>
    </>
  );
}

export function SettingsRow(props: SettingsRowProps) {
  const className = props.danger ? "settings-row danger" : "settings-row";
  const content = <RowContent icon={props.icon} title={props.title} subtitle={props.subtitle} value={props.value} right={props.right} />;

  if (props.disabled) {
    return <div className={`${className} disabled`}>{content}</div>;
  }

  if (props.onClick) {
    return (
      <button className={className} onClick={props.onClick} type="button">
        {content}
      </button>
    );
  }

  if (props.href) {
    return (
      <a className={className} href={props.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  if (props.to) {
    return (
      <Link className={className} to={props.to}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
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
    <div className="segmented-tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? "active" : ""}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function NewsPreviewCard({
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
  return (
    <article className="news-card">
      <div className="news-card-head">
        <strong>{title}</strong>
        <span className="badge info">{category}</span>
      </div>
      <p className="news-preview-body">{body}</p>
      <div className="news-meta-row">
        <small>{meta}</small>
        {to ? (
          <Link className="news-open-link" to={to}>
            {cta || "Подробнее"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function PromoCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="promo-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <div>{children}</div>
    </section>
  );
}

export function BottomNavItem({
  to,
  active,
  label,
  icon,
  accent = false,
}: {
  to: string;
  active: boolean;
  label: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <Link to={to} className={active ? `tab-item ${accent ? "accent" : ""} active` : `tab-item ${accent ? "accent" : ""}`}>
      <span className="tab-item-icon">{icon}</span>
      <span className="tab-item-label">{label}</span>
    </Link>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - value;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="sparkline" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

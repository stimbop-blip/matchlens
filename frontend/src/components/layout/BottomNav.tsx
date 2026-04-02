import { Link } from "react-router-dom";

type BottomNavItem = {
  key?: string;
  to: string;
  label: string;
  active?: boolean;
};

function glyphByIndex(index: number) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.4 10.4 12 4l7.6 6.4V20H14v-5h-4v5H4.4z" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 16.4 9.6 8h3l-1.8 4h3.5l-5.1 8.6H6.1l2.3-4.2z" />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18.4h16v1.6H4zm2-2.2h2.6V9.4H6zm4.5 0h2.6V6.2h-2.6zm4.5 0h2.6v-4.6H15z" />
      </svg>
    );
  }

  if (index === 3) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2m0 10.4c4.7 0 7.7 2.3 8.1 4.8H3.9c.4-2.5 3.4-4.8 8.1-4.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.5 1.4 2.3 2.6-.1.8 2.5 2.2 1.4-1 2.4 1 2.4-2.2 1.4-.8 2.5-2.6-.1L12 20.5l-1.4-2.3-2.6.1-.8-2.5-2.2-1.4 1-2.4-1-2.4 2.2-1.4.8-2.5 2.6.1z" />
      <circle cx="12" cy="12" r="2.3" />
    </svg>
  );
}

export function BottomNav({ items, ariaLabel }: { items: BottomNavItem[]; ariaLabel: string }) {
  return (
    <nav className="pb-orb-dock pb-nav-dock-v2" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const key = item.key || (index === 2 ? "tariffs" : `tab-${index}`);
        const active = item.active ? "active" : "";
        const center = key === "tariffs" ? " center" : "";

        return (
          <Link key={`${item.to}-${item.label}`} to={item.to} className={`${active}${center}`} data-key={key}>
            <span className="pb-nav-pill" aria-hidden="true" />
            <span className="pb-orb-icon-wrap">{glyphByIndex(index)}</span>
            <span className="pb-orb-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

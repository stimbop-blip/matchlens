import { Link } from "react-router-dom";

type BottomNavItem = {
  to: string;
  label: string;
  active?: boolean;
};

export function BottomNav({ items, ariaLabel }: { items: BottomNavItem[]; ariaLabel: string }) {
  return (
    <nav className="pb-orb-dock" aria-label={ariaLabel}>
      {items.map((item) => (
        <Link key={`${item.to}-${item.label}`} to={item.to} className={item.active ? "active" : undefined}>
          <span className="pb-orb-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

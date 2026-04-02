import { type CSSProperties, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { triggerHaptic } from "../../services/telegram";

type BottomNavItem = {
  key?: string;
  to: string;
  label: string;
  active?: boolean;
};

type BottomNavSlot = "overview" | "signals" | "stats" | "account" | "center";

const SLOT_ORDER: BottomNavSlot[] = ["overview", "signals", "stats", "account", "center"];

function resolveSlot(item: BottomNavItem, index: number): BottomNavSlot {
  const key = (item.key || "").toLowerCase();
  if (key.includes("overview") || key === "home") return "overview";
  if (key.includes("signal") || key.includes("feed")) return "signals";
  if (key.includes("stat")) return "stats";
  if (key.includes("account") || key.includes("profile")) return "account";
  if (key.includes("center") || key.includes("menu") || key.includes("hub")) return "center";
  return SLOT_ORDER[index] || "overview";
}

function glyph(slot: BottomNavSlot) {
  if (slot === "overview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 10.4 12 4.6l7.5 5.8V19a1 1 0 0 1-1 1h-4.1v-4.3h-4.8V20H5.5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }

  if (slot === "signals") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 15.8h3.6l2.2-7.2 2.5 7.2h1.9l3.8-7.2" />
        <path d="M5 10.2h3.3l1.1 2.2 2.1-6.4 2.5 7.6h5" />
      </svg>
    );
  }

  if (slot === "stats") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 19.2h14.4" />
        <path d="M7.2 16.8V10" />
        <path d="M12 16.8V7.2" />
        <path d="M16.8 16.8v-4.6" />
      </svg>
    );
  }

  if (slot === "account") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.4" r="3.3" />
        <path d="M5.2 18.8c1.5-2.5 4.2-4 6.8-4s5.3 1.5 6.8 4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" />
    </svg>
  );
}

export function BottomNav({ items, ariaLabel }: { items: BottomNavItem[]; ariaLabel: string }) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.slice(0, 5), [items]);

  const dockStyle: CSSProperties = {
    position: "fixed",
    left: "50%",
    bottom: "calc(env(safe-area-inset-bottom) + 10px)",
    transform: "translateX(-50%)",
    width: "min(92vw, 460px)",
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(185, 212, 248, 0.2)",
    background: "linear-gradient(180deg, rgba(10, 18, 31, 0.78) 0%, rgba(7, 14, 24, 0.7) 100%)",
    boxShadow: "0 18px 34px rgba(2, 8, 18, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(18px) saturate(145%)",
    WebkitBackdropFilter: "blur(18px) saturate(145%)",
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 6,
    zIndex: 42,
  };

  const iconSize = (center: boolean): CSSProperties => ({
    width: center ? 22 : 20,
    height: center ? 22 : 20,
  });

  const itemStyle = (active: boolean, center: boolean, pressed: boolean): CSSProperties => {
    const restingY = center ? -9 : 0;
    const pressedY = center ? -6 : 1;
    return {
      position: "relative",
      minHeight: center ? 58 : 50,
      borderRadius: 999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      textDecoration: "none",
      color: active ? "#f1f6ff" : "rgba(186, 203, 226, 0.92)",
      transform: `translateY(${pressed ? pressedY : restingY}px) scale(${pressed ? 0.985 : center ? 1.02 : 1})`,
      transition: "transform 180ms ease, color 180ms ease, filter 180ms ease",
      filter: active ? "saturate(1.05)" : "saturate(0.9)",
      outline: "none",
      WebkitTapHighlightColor: "transparent",
    };
  };

  const iconWrapStyle = (active: boolean, center: boolean): CSSProperties => ({
    width: center ? 42 : 34,
    height: center ? 42 : 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: center
      ? "linear-gradient(150deg, rgba(28, 238, 196, 0.3) 0%, rgba(34, 133, 255, 0.28) 100%)"
      : active
        ? "linear-gradient(160deg, rgba(70, 175, 255, 0.22), rgba(39, 224, 185, 0.2))"
        : "linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
    border: center ? "1px solid rgba(110, 252, 225, 0.7)" : "1px solid rgba(184, 209, 243, 0.24)",
    boxShadow: center
      ? "0 0 0 1px rgba(110, 252, 225, 0.26), 0 0 20px rgba(47, 228, 197, 0.38), 0 10px 16px rgba(7, 20, 35, 0.4)"
      : active
        ? "0 8px 14px rgba(6, 20, 38, 0.3)"
        : "none",
    transition: "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
  });

  const labelStyle = (active: boolean, center: boolean): CSSProperties => ({
    fontSize: center ? 10.5 : 10,
    fontWeight: center ? 700 : 600,
    letterSpacing: 0.2,
    opacity: active || center ? 1 : 0.86,
    textAlign: "center",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  });

  const centerAuraStyle: CSSProperties = {
    position: "absolute",
    inset: "-4px",
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(45, 225, 194, 0.2) 0%, rgba(45, 225, 194, 0) 70%)",
    zIndex: -1,
    pointerEvents: "none",
  };

  return (
    <nav className="pb-bottom-nav-telegram" aria-label={ariaLabel} style={dockStyle}>
      {visibleItems.map((item, index) => {
        const slot = resolveSlot(item, index);
        const key = item.key || slot;
        const isCenter = slot === "center";
        const isActive = Boolean(item.active);
        const isPressed = pressedKey === key;

        return (
          <Link
            key={`${item.to}-${item.label}`}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            style={itemStyle(isActive, isCenter, isPressed)}
            onClick={() => triggerHaptic(isCenter ? "impact-medium" : "selection")}
            onPointerDown={() => setPressedKey(key)}
            onPointerUp={() => setPressedKey(null)}
            onPointerCancel={() => setPressedKey(null)}
            onPointerLeave={() => setPressedKey(null)}
          >
            {isCenter ? <span aria-hidden="true" style={centerAuraStyle} /> : null}
            <span style={iconWrapStyle(isActive, isCenter)} aria-hidden="true">
              <span style={iconSize(isCenter)}>{glyph(slot)}</span>
            </span>
            <span style={labelStyle(isActive, isCenter)}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

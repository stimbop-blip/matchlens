import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { triggerHaptic } from "../../services/telegram";

type DockItem = {
  key: string;
  label: string;
  to: string;
  active: boolean;
  glyph: ReactNode;
};

const MotionLink = motion(Link);

export function PremiumDock({ items, ariaLabel }: { items: DockItem[]; ariaLabel: string }) {
  const [ripples, setRipples] = useState<Record<string, number>>({});

  const onPress = (key: string) => {
    triggerHaptic("selection");
    setRipples((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  return (
    <nav className="pb-orb-dock pb-nav-dock-v2" aria-label={ariaLabel}>
      {items.map((item) => (
        <MotionLink
          key={item.key}
          to={item.to}
          data-key={item.key}
          className={`${item.active ? "active" : ""}${item.key === "tariffs" ? " center" : ""}`}
          aria-current={item.active ? "page" : undefined}
          onClick={() => onPress(item.key)}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.64 }}
        >
          <span className="pb-nav-pill" aria-hidden="true" />
          <motion.span
            className="pb-orb-icon-wrap"
            animate={item.active ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            {item.glyph}
            <AnimatePresence>
              {item.active ? (
                <motion.span
                  key={`active-${item.key}`}
                  className="pb-orb-active-glow"
                  layoutId="pb-orb-active"
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                />
              ) : null}
            </AnimatePresence>
            {ripples[item.key] ? <span key={`ripple-${item.key}-${ripples[item.key]}`} className="pb-orb-ripple" aria-hidden="true" /> : null}
          </motion.span>
          <motion.span className="pb-orb-label" animate={item.active ? { opacity: 1 } : { opacity: 0.88 }} transition={{ duration: 0.16 }}>
            {item.label}
          </motion.span>
        </MotionLink>
      ))}
    </nav>
  );
}

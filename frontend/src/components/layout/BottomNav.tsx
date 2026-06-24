import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useI18n } from "../../app/i18n";
import { useHaptics } from "../../hooks/useHaptics";
import { ChatIcon, HomeIcon, NewsIcon, ProfileIcon, SignalsIcon } from "../icons/NavIcons";

type NavItem = {
  to: string;
  labelKey: string;
  Icon: typeof HomeIcon;
};

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const h = useHaptics();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const left: NavItem[] = [
    { to: "/", labelKey: "layout.nav.home", Icon: HomeIcon },
    { to: "/chat", labelKey: "layout.nav.chat", Icon: ChatIcon },
  ];
  const right: NavItem[] = [
    { to: "/news", labelKey: "layout.nav.news", Icon: NewsIcon },
    { to: "/profile", labelKey: "layout.nav.profile", Icon: ProfileIcon },
  ];

  const centerActive = isActive("/feed");

  const renderSide = (item: NavItem) => {
    const active = isActive(item.to);
    const { Icon } = item;
    return (
      <button
        key={item.to}
        type="button"
        onClick={() => {
          h.tap();
          navigate(item.to);
        }}
        className={`pb-dock-item ${active ? "active" : ""}`}
        aria-label={t(item.labelKey)}
        aria-current={active ? "page" : undefined}
      >
        <span className="pb-dock-icon">
          <Icon active={active} />
        </span>
        <span className="pb-dock-label">{t(item.labelKey)}</span>
      </button>
    );
  };

  return (
    <nav className="pb-dock" aria-label={t("layout.nav.aria")}>
      <div className="pb-dock-bar">
        {/* SVG-впадина (notch) под парящую кнопку — рисует дугу цвета панели */}
        <div className="pb-dock-notch-bg" aria-hidden="true">
          <svg viewBox="0 0 78 30" preserveAspectRatio="none">
            <path
              d="M0 30 L0 8 Q39 -22 78 8 L78 30 Z"
              fill="var(--pb-nav-bg)"
            />
          </svg>
        </div>

        {/* 5 слотов: 2 слева · центр (notch) · 2 справа */}
        {left.map(renderSide)}

        <span className="pb-dock-notch-slot" aria-hidden="true" />

        {right.map(renderSide)}
      </div>

      {/* Парящая FAB «Сигналы» над впадиной */}
      <button
        type="button"
        onClick={() => {
          h.tap();
          navigate("/feed");
        }}
        className={`pb-dock-fab ${centerActive ? "active" : ""}`}
        aria-label={t("layout.nav.feed")}
        aria-current={centerActive ? "page" : undefined}
      >
        <motion.span
          className="pb-dock-fab-inner"
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <SignalsIcon active={true} />
        </motion.span>
        <span className={`pb-dock-fab-label ${centerActive ? "active" : ""}`}>{t("layout.nav.feed")}</span>
      </button>
    </nav>
  );
}

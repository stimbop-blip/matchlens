import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useI18n } from "../../app/i18n";
import { useHaptics } from "../../hooks/useHaptics";
import { api } from "../../services/api";
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
  const [liveCount, setLiveCount] = useState(0);

  // Подгружаем количество активных сигналов (для бейджа + пульсации)
  useEffect(() => {
    let alive = true;
    const load = () => {
      api
        .predictions({ status: "active", limit: 50 })
        .then((list) => {
          if (alive) setLiveCount(Array.isArray(list) ? list.length : 0);
        })
        .catch(() => {
          if (alive) setLiveCount(0);
        });
    };
    load();
    const timer = window.setInterval(load, 45_000); // обновляем раз в 45с
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

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
  const hasLive = liveCount > 0;

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
        className={`pb-dock-fab ${centerActive ? "active" : ""} ${hasLive ? "live" : ""}`}
        aria-label={t("layout.nav.feed")}
        aria-current={centerActive ? "page" : undefined}
      >
        {/* Радар-кольца (только когда есть live-сигналы) */}
        {hasLive ? (
          <>
            <span className="pb-dock-fab-ring" aria-hidden="true" />
            <span className="pb-dock-fab-ring pb-dock-fab-ring-2" aria-hidden="true" />
          </>
        ) : null}

        <motion.span
          className="pb-dock-fab-inner"
          animate={hasLive && !centerActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: hasLive && !centerActive ? Infinity : 0, ease: "easeInOut" }}
          whileTap={{ scale: 0.88 }}
        >
          <SignalsIcon active={true} />
          {hasLive ? <span className="pb-dock-fab-badge">{liveCount > 9 ? "9+" : liveCount}</span> : null}
        </motion.span>
        <span className={`pb-dock-fab-label ${centerActive ? "active" : ""}`}>
          {hasLive ? "LIVE" : t("layout.nav.feed")}
        </span>
      </button>
    </nav>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useI18n } from "../../app/i18n";
import { useHaptics } from "../../hooks/useHaptics";
import { ChatIcon, HomeIcon, NewsIcon, ProfileIcon, SignalsIcon } from "../icons/NavIcons";

type NavItem = {
  to: string;
  labelKey: string;
  Icon: typeof HomeIcon;
  center?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "layout.nav.home", Icon: HomeIcon },
  { to: "/chat", labelKey: "layout.nav.chat", Icon: ChatIcon },
  { to: "/feed", labelKey: "layout.nav.feed", Icon: SignalsIcon, center: true },
  { to: "/news", labelKey: "layout.nav.news", Icon: NewsIcon },
  { to: "/profile", labelKey: "layout.nav.profile", Icon: ProfileIcon },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const h = useHaptics();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav className="pb-dock" aria-label={t("layout.nav.aria")}>
      <div className="pb-dock-bar">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          const { Icon } = item;

          // Парящая центральная кнопка «Сигналы»
          if (item.center) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => {
                  h.tap();
                  navigate(item.to);
                }}
                className={`pb-dock-center ${active ? "active" : ""}`}
                aria-label={t(item.labelKey)}
              >
                <span className="pb-dock-center-glow" aria-hidden="true" />
                <motion.span
                  className="pb-dock-center-inner"
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                >
                  <Icon active={true} />
                </motion.span>
                <span className={`pb-dock-label ${active ? "active" : ""}`}>{t(item.labelKey)}</span>
              </button>
            );
          }

          // Обычные кнопки по бокам
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
            >
              <span className="pb-dock-icon">
                <Icon active={active} />
              </span>
              <span className={`pb-dock-label ${active ? "active" : ""}`}>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

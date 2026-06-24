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

// 5 слотов: 2 слева, центр (FAB), 2 справа. Центр — пустой слот под парящую кнопку.
const SIDE_ITEMS: NavItem[] = [
  { to: "/", labelKey: "layout.nav.home", Icon: HomeIcon },
  { to: "/chat", labelKey: "layout.nav.chat", Icon: ChatIcon },
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

  const centerActive = isActive("/feed");
  const [home, chat, news, profile] = SIDE_ITEMS;

  return (
    <nav className="pb-dock" aria-label={t("layout.nav.aria")}>
      {/* Единая панель во весь экран с notch-вырезом по центру сверху */}
      <div className="pb-dock-bar">
        <button
          type="button"
          onClick={() => { h.tap(); navigate(home.to); }}
          className={`pb-dock-item ${isActive(home.to) ? "active" : ""}`}
          aria-label={t(home.labelKey)}
        >
          <span className="pb-dock-icon"><home.Icon active={isActive(home.to)} /></span>
          <span className="pb-dock-label">{t(home.labelKey)}</span>
        </button>

        <button
          type="button"
          onClick={() => { h.tap(); navigate(chat.to); }}
          className={`pb-dock-item ${isActive(chat.to) ? "active" : ""}`}
          aria-label={t(chat.labelKey)}
        >
          <span className="pb-dock-icon"><chat.Icon active={isActive(chat.to)} /></span>
          <span className="pb-dock-label">{t(chat.labelKey)}</span>
        </button>

        {/* пустой слот под парящую FAB */}
        <span className="pb-dock-notch-slot" aria-hidden="true" />

        <button
          type="button"
          onClick={() => { h.tap(); navigate(news.to); }}
          className={`pb-dock-item ${isActive(news.to) ? "active" : ""}`}
          aria-label={t(news.labelKey)}
        >
          <span className="pb-dock-icon"><news.Icon active={isActive(news.to)} /></span>
          <span className="pb-dock-label">{t(news.labelKey)}</span>
        </button>

        <button
          type="button"
          onClick={() => { h.tap(); navigate(profile.to); }}
          className={`pb-dock-item ${isActive(profile.to) ? "active" : ""}`}
          aria-label={t(profile.labelKey)}
        >
          <span className="pb-dock-icon"><profile.Icon active={isActive(profile.to)} /></span>
          <span className="pb-dock-label">{t(profile.labelKey)}</span>
        </button>
      </div>

      {/* Парящая центральная FAB «Сигналы» над вырезом */}
      <button
        type="button"
        onClick={() => { h.tap(); navigate("/feed"); }}
        className={`pb-dock-fab ${centerActive ? "active" : ""}`}
        aria-label={t("layout.nav.feed")}
      >
        <span className="pb-dock-fab-glow" aria-hidden="true" />
        <motion.span
          className="pb-dock-fab-inner"
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          <SignalsIcon active={true} />
        </motion.span>
        <span className={`pb-dock-fab-label ${centerActive ? "active" : ""}`}>{t("layout.nav.feed")}</span>
      </button>
    </nav>
  );
}

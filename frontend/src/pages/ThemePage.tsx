import { useNavigate } from "react-router-dom";

import { useLanguage, useTheme } from "../app/language";
import { Layout } from "../components/Layout";
import type { AppTheme } from "../services/telegram";

function ThemeItem({
  label,
  subtitle,
  icon,
  active,
  onClick,
}: {
  label: string;
  subtitle: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "menu-row language-row active" : "menu-row language-row"} onClick={onClick}>
      <div className="menu-row-main">
        <span className="menu-row-icon">{icon}</span>
        <span>
          {label}
          <small>{subtitle}</small>
        </span>
      </div>
      <div className="menu-row-side">
        {active ? <span className="language-check">✓</span> : <span className="menu-row-chevron">›</span>}
      </div>
    </button>
  );
}

export function ThemePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isRu = language === "ru";

  const applyTheme = (next: AppTheme) => {
    setTheme(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <section className="menu-screen">
        <div className="section-head menu-title-row">
          <h2>{isRu ? "Тема" : "Theme"}</h2>
          <span className="muted">PIT BET</span>
        </div>

        <section className="menu-block">
          <h3>{isRu ? "Выберите тему" : "Choose theme"}</h3>
          <div className="menu-list">
            <ThemeItem
              label={isRu ? "Темная" : "Dark"}
              subtitle={isRu ? "Контрастная и мягкая" : "High contrast and soft"}
              icon="🌙"
              active={theme === "dark"}
              onClick={() => applyTheme("dark")}
            />
            <ThemeItem
              label={isRu ? "Светлая" : "Light"}
              subtitle={isRu ? "Чистая дневная палитра" : "Clean daytime palette"}
              icon="☀️"
              active={theme === "light"}
              onClick={() => applyTheme("light")}
            />
          </div>
        </section>
      </section>
    </Layout>
  );
}

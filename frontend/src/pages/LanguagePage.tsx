import { useNavigate } from "react-router-dom";

import { useLanguage, type AppLanguage } from "../app/language";
import { Layout } from "../components/Layout";

function LanguageItem({
  label,
  subtitle,
  active,
  onClick,
}: {
  label: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "menu-row language-row active" : "menu-row language-row"} onClick={onClick}>
      <div className="menu-row-main">
        <span className="menu-row-icon">🌐</span>
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

export function LanguagePage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const isRu = language === "ru";

  const applyLanguage = (next: AppLanguage) => {
    setLanguage(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <section className="menu-screen">
        <div className="section-head menu-title-row">
          <h2>{isRu ? "Язык" : "Language"}</h2>
          <span className="muted">PIT BET</span>
        </div>

        <section className="menu-block">
          <h3>{isRu ? "Выберите язык" : "Choose language"}</h3>
          <div className="menu-list">
            <LanguageItem
              label="Русский"
              subtitle="Russian"
              active={language === "ru"}
              onClick={() => applyLanguage("ru")}
            />
            <LanguageItem
              label="English"
              subtitle="Английский"
              active={language === "en"}
              onClick={() => applyLanguage("en")}
            />
          </div>
        </section>
      </section>
    </Layout>
  );
}

import { useMemo } from "react";

import { useI18n } from "../app/i18n";
import { sportCoverDataUri } from "../app/sportArt";

export function StartupLoader() {
  const { language } = useI18n();

  const cards = useMemo(
    () => [
      { key: "football", title: language === "ru" ? "Футбол" : "Football", src: sportCoverDataUri("football", "landscape") },
      { key: "hockey", title: language === "ru" ? "Хоккей" : "Hockey", src: sportCoverDataUri("hockey", "landscape") },
      { key: "tennis", title: language === "ru" ? "Теннис" : "Tennis", src: sportCoverDataUri("tennis", "landscape") },
    ],
    [language],
  );

  return (
    <main className="pb-startup-root">
      <section className="pb-startup-shell pb-reveal">
        <div className="pb-startup-orb" aria-hidden="true" />
        <span className="pb-brand-chip large">PIT BET</span>
        <h1>{language === "ru" ? "Загружаем ленту" : "Loading feed"}</h1>
        <p>{language === "ru" ? "Проверяем доступ и подготавливаем сигналы" : "Verifying access and preparing signals"}</p>

        <div className="pb-startup-cards" aria-hidden="true">
          {cards.map((item) => (
            <article key={item.key} className="pb-startup-card">
              <img src={item.src} alt="" loading="lazy" />
              <span>{item.title}</span>
            </article>
          ))}
        </div>

        <div className="pb-startup-progress" aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}

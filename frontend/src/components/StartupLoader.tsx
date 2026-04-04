import { useI18n } from "../app/i18n";

export function StartupLoader() {
  const { language } = useI18n();

  return (
    <main className="pb-startup-root">
      <section className="pb-startup-shell pb-reveal">
        <div className="pb-startup-orb" aria-hidden="true" />
        <span className="pb-brand-chip large">PIT BET</span>
        <div className="pb-startup-visual" aria-hidden="true">
          <span className="ring ring-a" />
          <span className="ring ring-b" />
          <span className="ring ring-c" />
          <span className="core" />
          <span className="spark spark-1" />
          <span className="spark spark-2" />
          <span className="spark spark-3" />
        </div>
        <h1>{language === "ru" ? "Загружаем ленту" : "Loading feed"}</h1>
        <p>{language === "ru" ? "Проверяем доступ и подготавливаем сигналы" : "Verifying access and preparing signals"}</p>

        <div className="pb-startup-progress" aria-hidden="true">
          <span />
        </div>
        <div className="pb-startup-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

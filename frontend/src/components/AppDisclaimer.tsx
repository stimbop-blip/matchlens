import { useLanguage } from "../app/language";

export function AppDisclaimer() {
  const { language } = useLanguage();
  const text =
    language === "ru"
      ? "PIT BET предоставляет аналитическую информацию. Результат не гарантирован — используйте сервис ответственно."
      : "PIT BET provides analytical information. Results are not guaranteed — use responsibly.";

  return (
    <footer className="app-disclaimer" role="note" aria-live="polite">
      {text}
    </footer>
  );
}

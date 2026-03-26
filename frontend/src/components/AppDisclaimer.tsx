import { useLanguage } from "../app/language";

export function AppDisclaimer() {
  const { language } = useLanguage();
  const text =
    language === "ru"
      ? "PIT BET дает аналитическую информацию. Ставки связаны с риском, результат не гарантируется. Играйте ответственно."
      : "PIT BET provides analytical information. Betting involves risk, and results are not guaranteed. Please play responsibly.";

  return (
    <footer className="app-disclaimer" role="note" aria-live="polite">
      {text}
    </footer>
  );
}

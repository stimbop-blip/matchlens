import { useLanguage } from "../app/language";

export function AppDisclaimer() {
  const { language } = useLanguage();
  const text =
    language === "ru"
      ? "Информация в PIT BET носит аналитический и ознакомительный характер. Ставки связаны с финансовым риском, а результат не может быть гарантирован. Используйте сервис ответственно."
      : "PIT BET provides analytical information for educational use. Betting involves financial risk, and results cannot be guaranteed. Please use the service responsibly.";

  return (
    <footer className="app-disclaimer" role="note" aria-live="polite">
      {text}
    </footer>
  );
}

import { useLanguage } from "../app/language";

export function AppDisclaimer() {
  const { language } = useLanguage();
  const text =
    language === "ru"
      ? "Информация в PIT BET носит аналитический и ознакомительный характер. Ставки связаны с финансовым риском, а результат не может быть гарантирован. Используйте сервис ответственно."
      : "PIT BET content is analytical and informational. Betting involves financial risk, and results cannot be guaranteed. Use the service responsibly.";

  return <p className="app-disclaimer">{text}</p>;
}

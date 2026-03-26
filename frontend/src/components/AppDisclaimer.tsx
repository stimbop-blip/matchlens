const DISCLAIMER_TEXT =
  "Информация в PIT BET носит аналитический и ознакомительный характер. Ставки связаны с финансовым риском, а результат не может быть гарантирован. Используйте сервис ответственно.";

export function AppDisclaimer() {
  return <p className="app-disclaimer">{DISCLAIMER_TEXT}</p>;
}

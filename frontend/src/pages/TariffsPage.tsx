import { useEffect, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type Tariff } from "../services/api";

const PAYMENTS_ENABLED = (import.meta.env.VITE_PAYMENTS_ENABLED || "false") === "true";

const FEATURES: Record<string, string[]> = {
  free: ["Базовая лента", "Ограниченный объем сигналов", "Стартовый доступ"],
  premium: ["Расширенная аналитика", "Больше прогнозов", "Более частые обновления"],
  vip: ["Максимальный доступ", "Приоритетные уведомления", "Полный набор сигналов"],
};

export function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.tariffs().then(setTariffs).catch(() => setTariffs([]));
  }, []);

  const onPay = async (code: "premium" | "vip") => {
    if (!PAYMENTS_ENABLED) {
      setMessage("Оплата временно недоступна. Подключение платежей в процессе.");
      return;
    }
    try {
      const payment = await api.createPayment(code);
      window.location.href = payment.payment_url;
    } catch {
      setMessage("Не удалось создать платеж. Повторите попытку позже.");
    }
  };

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Тарифы доступа</h2>
          <span className="muted">Выберите уровень под свой стиль работы</span>
        </div>

        <div className="tariff-grid">
          {tariffs.map((item) => (
            <article key={item.code} className={`tariff-card ${item.code}`}>
              <div className="prediction-top">
                <strong>{item.name}</strong>
                <span className={`access-pill ${item.access_level}`}>{item.access_level.toUpperCase()}</span>
              </div>
              <p className="price">{item.price_rub} RUB</p>
              <p className="muted">{item.duration_days} дней доступа</p>
              <ul>
                {(FEATURES[item.code] || []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {item.code === "premium" || item.code === "vip" ? (
                <button className="btn" onClick={() => onPay(item.code)}>
                  {PAYMENTS_ENABLED ? `Оформить ${item.name}` : "Скоро доступно"}
                </button>
              ) : (
                <button className="btn ghost" disabled>
                  Уже доступно
                </button>
              )}
            </article>
          ))}
        </div>

        {message ? <p className="error-msg">{message}</p> : null}
      </section>
    </Layout>
  );
}

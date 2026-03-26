import { useEffect, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type Tariff } from "../services/api";

const PAYMENTS_ENABLED = (import.meta.env.VITE_PAYMENTS_ENABLED || "false") === "true";

type TariffCode = "free" | "premium" | "vip";

const TARIFF_TEXT: Record<TariffCode, { label: string; tag: string; points: string[]; reason: string }> = {
  free: {
    label: "Free",
    tag: "Старт",
    points: ["часть бесплатных прогнозов", "базовый доступ к статистике", "знакомство с подходом PIT BET"],
    reason: "Подходит, чтобы понять продукт и начать без лишней нагрузки.",
  },
  premium: {
    label: "Premium",
    tag: "Лучший выбор",
    points: ["полная Premium-лента", "оперативные уведомления", "разборы по ключевым матчам"],
    reason: "Оптимальный баланс цены и глубины для регулярной работы.",
  },
  vip: {
    label: "VIP",
    tag: "Максимум",
    points: ["VIP-сигналы сильного отбора", "ранний доступ к сигналам", "live/hot picks и расширенные разборы"],
    reason: "Максимальный пакет для тех, кому нужен полный доступ и скорость.",
  },
};

const COMPARISON_ROWS = [
  { label: "Открытая Free-лента", free: "Да", premium: "Да", vip: "Да" },
  { label: "Полная Premium-лента", free: "Частично", premium: "Да", vip: "Да" },
  { label: "VIP-сигналы", free: "-", premium: "-", vip: "Да" },
  { label: "Уведомления и разборы", free: "База", premium: "Да", vip: "Расширенно" },
  { label: "Скорость доступа", free: "Стандарт", premium: "Быстро", vip: "Ранний доступ" },
];

export function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    api.tariffs().then(setTariffs).catch(() => setTariffs([]));
  }, []);

  const onPay = async (code: "premium" | "vip") => {
    if (!PAYMENTS_ENABLED) {
      setMessage({ tone: "info", text: "Оплата временно недоступна. Подключение платежей в процессе." });
      return;
    }
    try {
      const payment = await api.createPayment(code);
      window.location.href = payment.payment_url;
    } catch {
      setMessage({ tone: "error", text: "Не удалось создать платеж. Повторите попытку позже." });
    }
  };

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Тарифы PIT BET</h2>
          <span className="muted">Free / Premium / VIP без лишнего шума</span>
        </div>

        <p className="stacked">PIT BET — сигналы, статистика и доступ к сильным прогнозам.</p>

        <div className="tariff-grid">
          {tariffs.map((item) => {
            const text = TARIFF_TEXT[item.code as TariffCode] || TARIFF_TEXT.free;
            return (
              <article key={item.code} className={`tariff-card ${item.code}`}>
                <div className="prediction-top">
                  <strong>{text.label}</strong>
                  <span className={`badge ${item.code === "premium" ? "success" : item.code === "vip" ? "warning" : "info"}`}>{text.tag}</span>
                </div>
                <p className="price">{item.price_rub} RUB</p>
                <p className="muted">{item.duration_days} дней доступа</p>
                <ul>
                  {text.points.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <p className="muted">{text.reason || item.description || "Описание обновляется"}</p>
                {item.code === "premium" || item.code === "vip" ? (
                  <button className="btn" onClick={() => onPay(item.code)}>
                    {PAYMENTS_ENABLED ? `Оформить ${text.label}` : "Скоро доступно"}
                  </button>
                ) : (
                  <button className="btn ghost" disabled>
                    Уже доступно
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="card-lite" style={{ marginTop: 10 }}>
          <h3 style={{ margin: 0 }}>Что входит и почему переходить выше</h3>
          {COMPARISON_ROWS.map((row) => (
            <p key={row.label} className="stacked">
              <b>{row.label}:</b> Free — {row.free} | Premium — {row.premium} | VIP — {row.vip}
            </p>
          ))}
        </div>

        {message ? <p className={`notice ${message.tone}`}>{message.text}</p> : null}
      </section>
    </Layout>
  );
}

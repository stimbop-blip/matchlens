import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { api, type Tariff } from "../services/api";

const PAYMENTS_ENABLED = (import.meta.env.VITE_PAYMENTS_ENABLED || "false") === "true";

type TariffCode = "free" | "premium" | "vip";

export function TariffsPage() {
  const { language } = useLanguage();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    api.tariffs().then(setTariffs).catch(() => setTariffs([]));
  }, []);

  const isRu = language === "ru";

  const tariffText: Record<TariffCode, { tag: string; points: string[]; reason: string }> = {
    free: {
      tag: isRu ? "Старт" : "Start",
      points: isRu
        ? ["часть бесплатных сигналов", "базовый доступ к статистике", "знакомство с подходом PIT BET"]
        : ["part of free signals", "basic stats access", "entry-level PIT BET approach"],
      reason: isRu ? "Входной уровень для знакомства с платформой." : "Entry level to explore the platform.",
    },
    premium: {
      tag: isRu ? "Лучший выбор" : "Best choice",
      points: isRu
        ? ["полная Premium-лента", "оперативные уведомления", "разборы по ключевым матчам"]
        : ["full Premium feed", "fast notifications", "key match analysis"],
      reason: isRu ? "Основной рабочий тариф для ежедневной работы." : "Main working tier for daily usage.",
    },
    vip: {
      tag: isRu ? "Максимум" : "Maximum",
      points: isRu
        ? ["VIP-сигналы сильного отбора", "ранний доступ", "расширенная аналитика"]
        : ["high-select VIP signals", "early access", "extended analytics"],
      reason: isRu ? "Максимальный пакет по глубине и скорости." : "Maximum package for depth and speed.",
    },
  };

  const onPay = async (code: "premium" | "vip") => {
    if (!PAYMENTS_ENABLED) {
      setMessage({ tone: "info", text: isRu ? "Оплата временно недоступна." : "Payments are temporarily disabled." });
      return;
    }
    try {
      const payment = await api.createPayment(code);
      window.location.href = payment.payment_url;
    } catch {
      setMessage({ tone: "error", text: isRu ? "Не удалось создать платеж." : "Failed to create payment." });
    }
  };

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>{isRu ? "Тарифы PIT BET" : "PIT BET Tariffs"}</h2>
          <span className="muted">Free / Premium / VIP</span>
        </div>

        <p className="stacked">
          {isRu
            ? "PIT BET — сигналы, статистика и доступ к сильным игровым ситуациям."
            : "PIT BET gives access to signals, statistics, and strong market setups."}
        </p>

        <div className="tariff-grid">
          {tariffs.map((item) => {
            const text = tariffText[item.code as TariffCode] || tariffText.free;
            return (
              <article key={item.code} className={`tariff-card ${item.code}`}>
                <div className="prediction-top">
                  <strong>{item.code === "free" ? "Free" : item.code === "premium" ? "Premium" : "VIP"}</strong>
                  <span className={`badge ${item.code === "premium" ? "success" : item.code === "vip" ? "warning" : "info"}`}>{text.tag}</span>
                </div>
                <p className="price">{item.price_rub} RUB</p>
                <p className="muted">{item.duration_days} {isRu ? "дней доступа" : "days access"}</p>
                <ul>
                  {text.points.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <p className="muted">{text.reason || item.description || (isRu ? "Описание обновляется" : "Description pending")}</p>
                {item.code === "premium" || item.code === "vip" ? (
                  <button className="btn" onClick={() => onPay(item.code)}>
                    {PAYMENTS_ENABLED ? (isRu ? `Оформить ${item.code === "vip" ? "VIP" : "Premium"}` : `Choose ${item.code === "vip" ? "VIP" : "Premium"}`) : isRu ? "Скоро" : "Soon"}
                  </button>
                ) : (
                  <button className="btn ghost" disabled>
                    {isRu ? "Уже доступно" : "Already active"}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {message ? <p className={`notice ${message.tone}`}>{message.text}</p> : null}
      </section>
      <AppDisclaimer />
    </Layout>
  );
}

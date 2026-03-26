import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionHeader } from "../components/ui";
import { api, type Tariff } from "../services/api";

const PAYMENTS_ENABLED = (import.meta.env.VITE_PAYMENTS_ENABLED || "false") === "true";

type TariffCode = "free" | "premium" | "vip";

export function TariffsPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    api.tariffs().then(setTariffs).catch(() => setTariffs([]));
  }, []);

  const tariffText: Record<TariffCode, { tag: string; points: string[]; reason: string }> = {
    free: {
      tag: isRu ? "Старт" : "Start",
      points: isRu
        ? ["Часть бесплатных сигналов", "Базовые метрики", "Вход в экосистему PIT BET"]
        : ["Part of free signals", "Basic performance metrics", "Entry access to PIT BET"],
      reason: isRu ? "Оптимально для знакомства с продуктом." : "Best to explore the product.",
    },
    premium: {
      tag: isRu ? "Лучший выбор" : "Best choice",
      points: isRu
        ? ["Полная Premium-лента", "Быстрые уведомления", "Расширенная аналитика"]
        : ["Full Premium feed", "Fast notifications", "Extended analytics"],
      reason: isRu
        ? "Основной рабочий тариф для стабильной ежедневной работы."
        : "Main working plan for consistent daily execution.",
    },
    vip: {
      tag: isRu ? "Максимум" : "Maximum",
      points: isRu
        ? ["VIP-отбор сигналов", "Ранний и приоритетный доступ", "Глубокая аналитика"]
        : ["VIP-selected signals", "Early and priority access", "Deep analytics"],
      reason: isRu ? "Максимальный пакет для интенсивной работы." : "Maximum package for intensive workflow.",
    },
  };

  const onPay = async (code: "premium" | "vip") => {
    if (!PAYMENTS_ENABLED) {
      setMessage({ tone: "info", text: isRu ? "Оплата временно недоступна." : "Payments are temporarily unavailable." });
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
      <HeroCard
        eyebrow="PIT BET"
        title={isRu ? "Выберите подходящий тариф" : "Choose your access tier"}
        description={
          isRu
            ? "Free для старта, Premium для постоянной работы, VIP для максимальной скорости и глубины."
            : "Free to start, Premium for consistent workflow, VIP for maximum speed and depth."
        }
      />

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Планы доступа" : "Access plans"}
          subtitle={isRu ? "Free, Premium, VIP — под разную нагрузку" : "Free, Premium, VIP for different workload"}
        />

        {tariffs.length === 0 ? <p className="empty-state">{isRu ? "Тарифы временно недоступны." : "Tariffs are temporarily unavailable."}</p> : null}

        <div className="tariff-grid">
          {tariffs.map((item) => {
            const code = item.code as TariffCode;
            const text = tariffText[code] || tariffText.free;
            const isFeatured = code === "premium";
            const isMax = code === "vip";

            return (
              <article key={item.code} className={`tariff-card ${isFeatured ? "featured" : ""} ${isMax ? "max" : ""}`}>
                <div className="tariff-head">
                  <div>
                    <h3>{code === "free" ? "Free" : code === "premium" ? "Premium" : "VIP"}</h3>
                    <p className="tariff-chip">{text.tag}</p>
                  </div>
                  <AccessBadge level={code === "free" ? "free" : code === "premium" ? "premium" : "vip"} />
                </div>

                <p className="tariff-price">{item.price_rub} RUB</p>
                <small>{item.duration_days} {isRu ? "дней доступа" : "days of access"}</small>

                <ul>
                  {text.points.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <p className="tariff-note">{text.reason || item.description || (isRu ? "Описание обновляется" : "Description updating")}</p>

                {code === "premium" || code === "vip" ? (
                  <button className="btn" onClick={() => onPay(code)} type="button">
                    {PAYMENTS_ENABLED
                      ? isRu
                        ? `Выбрать ${code === "vip" ? "VIP" : "Premium"}`
                        : `Choose ${code === "vip" ? "VIP" : "Premium"}`
                      : isRu
                        ? "Скоро откроем"
                        : "Soon"}
                  </button>
                ) : (
                  <button className="btn ghost" disabled type="button">
                    {isRu ? "Уже доступно" : "Already active"}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        {message ? <p className={`notice ${message.tone}`}>{message.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

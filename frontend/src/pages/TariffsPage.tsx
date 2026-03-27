import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionHeader, Sparkline } from "../components/ui";
import { api, type PaymentCreateResult, type PaymentMethod, type PaymentQuote, type Tariff } from "../services/api";

type PlanCode = "premium" | "vip";
type Duration = 7 | 30 | 90;

const DURATION_LABEL: Record<Duration, string> = { 7: "7", 30: "30", 90: "90" };

export function TariffsPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>("premium");
  const [selectedDuration, setSelectedDuration] = useState<Duration>(30);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [promoCode, setPromoCode] = useState("");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentCreateResult | null>(null);
  const [manualMeta, setManualMeta] = useState({ transfer_reference: "", note: "", proof: "" });
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info" | "success"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([api.tariffs(), api.paymentMethods()])
      .then(([tariffData, methodData]) => {
        setTariffs(tariffData);
        setMethods(methodData);
        if (methodData.length > 0) setSelectedMethod(methodData[0].code);
      })
      .catch(() => {
        setTariffs([]);
        setMethods([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedMethod) return;
    setLoadingQuote(true);
    api
      .quotePayment({ tariff_code: selectedPlan, duration_days: selectedDuration, promo_code: promoCode.trim() || undefined })
      .then((result) => setQuote(result))
      .catch(() => setQuote(null))
      .finally(() => setLoadingQuote(false));
  }, [selectedPlan, selectedDuration, promoCode, selectedMethod]);

  const freeTariff = tariffs.find((x) => x.code === "free");
  const selectedTariff = tariffs.find((x) => x.code === selectedPlan);
  const selectedMethodObj = methods.find((x) => x.code === selectedMethod) || null;
  const selectedOptions = useMemo(() => (selectedTariff?.options?.length ? selectedTariff.options : []), [selectedTariff]);

  const createPayment = async () => {
    if (!selectedMethod) {
      setMessage({ tone: "error", text: isRu ? "Выберите способ оплаты" : "Choose payment method" });
      return;
    }
    setLoadingPay(true);
    setMessage(null);
    try {
      const result = await api.createPayment({
        tariff_code: selectedPlan,
        duration_days: selectedDuration,
        payment_method_code: selectedMethod,
        promo_code: promoCode.trim() || undefined,
      });
      setPaymentResult(result);
      if (result.payment_method_type === "auto" && result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }
      setMessage({
        tone: "info",
        text: isRu
          ? "Реквизиты готовы. Сделайте перевод и нажмите 'Я оплатил'."
          : "Payment details are ready. Complete transfer and click 'I paid'.",
      });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : isRu ? "Не удалось создать платеж" : "Failed to create payment" });
    } finally {
      setLoadingPay(false);
    }
  };

  const confirmManual = async () => {
    if (!paymentResult) return;
    try {
      const result = await api.confirmManualPayment(paymentResult.payment_id, manualMeta);
      setMessage({
        tone: "success",
        text:
          result.status === "pending_manual_review"
            ? isRu
              ? "Платеж отправлен на ручную проверку."
              : "Payment sent for manual review."
            : isRu
              ? "Статус платежа обновлен"
              : "Payment status updated",
      });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : isRu ? "Не удалось подтвердить платеж" : "Failed to confirm payment" });
    }
  };

  return (
    <Layout>
      <HeroCard
        eyebrow={isRu ? "PIT BET Подписка" : "PIT BET Membership"}
        title={isRu ? "Подписка с разной глубиной сигналов" : "Membership access with different signal depth"}
        description={
          isRu
            ? "Free для знакомства, Premium как основной рабочий уровень, VIP как elite-доступ с максимальной скоростью."
            : "Free for onboarding, Premium as core workflow, VIP as elite access with maximum speed."
        }
      >
        <div className="market-ribbon">
          <span>{isRu ? "Пульс доступа" : "Access momentum"}</span>
          <Sparkline values={[74, 69, 64, 60, 54, 49, 43, 38, 34, 30]} />
          <span className="live-pulse">{isRu ? "ВИП" : "VIP"}</span>
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader title={isRu ? "Тарифные уровни" : "Membership tiers"} subtitle="Free / Premium / VIP" />

        <div className="tariff-grid premium-membership-grid">
          {freeTariff ? (
            <article className="tariff-card free-tier">
              <div className="tariff-head">
                <div>
                    <h3>Free</h3>
                  <p className="tariff-chip">{isRu ? "Входной уровень" : "Entry level"}</p>
                </div>
                <AccessBadge level="free" />
              </div>
              <p className="tariff-price">0 RUB</p>
              <ul>{(freeTariff.perks || []).map((perk) => <li key={perk}>{perk}</li>)}</ul>
            </article>
          ) : null}

          {(["premium", "vip"] as PlanCode[]).map((plan) => {
            const tariff = tariffs.find((x) => x.code === plan);
            if (!tariff) return null;
            const active = selectedPlan === plan;
            return (
              <article key={plan} className={`tariff-card ${plan === "premium" ? "featured" : "max"} ${active ? "selected" : ""}`}>
                <div className="tariff-head">
                  <div>
                    <h3>{plan === "premium" ? "Premium" : "VIP"}</h3>
                    <p className="tariff-chip">{plan === "premium" ? (isRu ? "Лучший выбор" : "Best choice") : isRu ? "Элитный доступ" : "Elite access"}</p>
                  </div>
                  <AccessBadge level={plan} />
                </div>
                <ul>{(tariff.perks || []).map((perk) => <li key={perk}>{perk}</li>)}</ul>
                <button type="button" className={`btn ${active ? "secondary" : "ghost"}`} onClick={() => setSelectedPlan(plan)}>
                  {active ? (isRu ? "Выбран" : "Selected") : isRu ? "Выбрать" : "Select"}
                </button>
              </article>
            );
          })}
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={isRu ? "Настройка доступа" : "Configure access"} subtitle={isRu ? "Срок, метод оплаты и финальная цена" : "Duration, payment method, final price"} />

        <div className="period-switcher">
          {(selectedOptions.length ? selectedOptions : [{ duration_days: 7, price_rub: 0 }, { duration_days: 30, price_rub: 0 }, { duration_days: 90, price_rub: 0 }]).map((option) => {
            const days = option.duration_days as Duration;
            const active = selectedDuration === days;
            return (
              <button key={days} className={`period-pill ${active ? "active" : ""}`} onClick={() => setSelectedDuration(days)} type="button">
                <strong>{DURATION_LABEL[days]} {isRu ? "дней" : "days"}</strong>
                {option.price_rub ? <span>{option.price_rub} RUB</span> : null}
                {option.badge ? <small>{option.badge}</small> : null}
              </button>
            );
          })}
        </div>

        <div className="payment-method-grid">
          {methods.map((method) => (
            <button key={method.code} type="button" className={`payment-method-card ${selectedMethod === method.code ? "active" : ""}`} onClick={() => setSelectedMethod(method.code)}>
              <strong>{method.name}</strong>
              <span>{method.method_type === "manual" ? (isRu ? "Ручная оплата" : "Manual") : isRu ? "Автоматическая оплата" : "Automatic"}</span>
              {method.instructions ? <small>{method.instructions}</small> : null}
            </button>
          ))}
        </div>

        <div className="input-stack">
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={isRu ? "Промокод (опционально)" : "Promo code (optional)"} />
        </div>

        <div className="payment-summary-card">
          <div className="info-row"><span>{isRu ? "Тариф" : "Plan"}</span><strong>{selectedPlan === "premium" ? "Premium" : "VIP"}</strong></div>
          <div className="info-row"><span>{isRu ? "Период" : "Duration"}</span><strong>{selectedDuration} {isRu ? "дней" : "days"}</strong></div>
          <div className="info-row"><span>{isRu ? "Способ оплаты" : "Payment method"}</span><strong>{selectedMethodObj?.name || "—"}</strong></div>
          <div className="info-row"><span>{isRu ? "Базовая цена" : "Base amount"}</span><strong>{quote?.original_amount_rub ?? "—"} RUB</strong></div>
          <div className="info-row"><span>{isRu ? "Скидка" : "Discount"}</span><strong>{quote ? `${quote.discount_rub} RUB` : "—"}</strong></div>
          <div className="info-row total"><span>{isRu ? "Итого" : "Final"}</span><strong>{quote?.final_amount_rub ?? "—"} RUB</strong></div>
          {loadingQuote ? <p className="muted-line">{isRu ? "Обновляем расчет..." : "Updating quote..."}</p> : null}
          {quote?.message ? <p className="muted-line">{quote.message}</p> : null}
        </div>

        <button className="btn" onClick={createPayment} type="button" disabled={loadingPay || loadingQuote || !selectedMethod}>
          {loadingPay
            ? isRu
              ? "Подготавливаем..."
              : "Preparing..."
            : selectedMethodObj?.method_type === "manual"
              ? isRu
                ? "Получить реквизиты"
                : "Get transfer details"
              : isRu
                ? "Перейти к оплате"
                : "Proceed to payment"}
        </button>

        {paymentResult?.payment_method_type === "manual" ? (
          <div className="manual-payment-card">
            <h3>{isRu ? "Оплата переводом" : "Manual transfer"}</h3>
            <p>{isRu ? "Сделайте перевод по реквизитам ниже, затем отправьте подтверждение." : "Complete transfer and submit confirmation."}</p>
            <div className="stack-list compact">
              {paymentResult.card_number ? <div className="info-row"><span>{isRu ? "Номер карты" : "Card number"}</span><strong>{paymentResult.card_number}</strong></div> : null}
              {paymentResult.recipient_name ? <div className="info-row"><span>{isRu ? "Получатель" : "Recipient"}</span><strong>{paymentResult.recipient_name}</strong></div> : null}
              {paymentResult.payment_details ? <div className="info-row"><span>{isRu ? "Реквизиты" : "Details"}</span><strong>{paymentResult.payment_details}</strong></div> : null}
              <div className="info-row"><span>{isRu ? "Сумма" : "Amount"}</span><strong>{paymentResult.amount_rub} RUB</strong></div>
            </div>
            <div className="input-stack">
              <input placeholder={isRu ? "ID перевода / комментарий" : "Transfer ID / comment"} value={manualMeta.transfer_reference} onChange={(e) => setManualMeta((prev) => ({ ...prev, transfer_reference: e.target.value }))} />
              <textarea rows={3} placeholder={isRu ? "Примечание (опционально)" : "Note (optional)"} value={manualMeta.note} onChange={(e) => setManualMeta((prev) => ({ ...prev, note: e.target.value }))} />
              <input placeholder={isRu ? "Ссылка на скриншот (опционально)" : "Screenshot URL (optional)"} value={manualMeta.proof} onChange={(e) => setManualMeta((prev) => ({ ...prev, proof: e.target.value }))} />
              <button className="btn secondary" type="button" onClick={confirmManual}>{isRu ? "Я оплатил" : "I paid"}</button>
            </div>
          </div>
        ) : null}

        {message ? <p className={`notice ${message.tone}`}>{message.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionHeader, Sparkline } from "../components/ui";
import { api, type PaymentCreateResult, type PaymentMethod, type PaymentQuote, type Tariff } from "../services/api";

type PlanCode = "premium" | "vip";
type Duration = 7 | 30 | 90;

const DURATION_LABEL: Record<Duration, string> = { 7: "7", 30: "30", 90: "90" };

export function TariffsPage() {
  const { t } = useI18n();

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
      setMessage({ tone: "error", text: t("tariffs.pay.needMethod") });
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
      setMessage({ tone: "info", text: t("tariffs.pay.manualHint") });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : t("tariffs.pay.createFail") });
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
        text: result.status === "pending_manual_review" ? t("tariffs.pay.review") : t("tariffs.pay.confirmed"),
      });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : t("tariffs.pay.confirmFail") });
    }
  };

  return (
    <Layout>
      <HeroCard eyebrow="PIT BET" title={t("tariffs.hero.title")} description={t("tariffs.hero.subtitle")}>
        <div className="market-ribbon">
          <span>{t("tariffs.hero.pulse")}</span>
          <Sparkline values={[74, 69, 64, 60, 54, 49, 43, 38, 34, 30]} />
          <span className="live-pulse">{t("common.vip")}</span>
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader title={t("tariffs.levels.title")} subtitle={t("tariffs.levels.subtitle")} />

        <div className="tariff-grid premium-membership-grid">
          {freeTariff ? (
            <article className="tariff-card free-tier">
              <div className="tariff-head">
                <div>
                  <h3>{t("common.free")}</h3>
                  <p className="tariff-chip">{t("tariffs.free.entry")}</p>
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
                    <h3>{plan === "premium" ? t("common.premium") : t("common.vip")}</h3>
                    <p className="tariff-chip">{plan === "premium" ? t("tariffs.bestChoice") : t("tariffs.elite")}</p>
                  </div>
                  <AccessBadge level={plan} />
                </div>
                <ul>{(tariff.perks || []).map((perk) => <li key={perk}>{perk}</li>)}</ul>
                <button type="button" className={`btn ${active ? "secondary" : "ghost"}`} onClick={() => setSelectedPlan(plan)}>
                  {active ? t("tariffs.selected") : t("tariffs.select")}
                </button>
              </article>
            );
          })}
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("tariffs.setup.title")} subtitle={t("tariffs.setup.subtitle")} />

        <div className="period-switcher">
          {(selectedOptions.length ? selectedOptions : [{ duration_days: 7, price_rub: 0 }, { duration_days: 30, price_rub: 0 }, { duration_days: 90, price_rub: 0 }]).map((option) => {
            const days = option.duration_days as Duration;
            const active = selectedDuration === days;
            return (
              <button key={days} className={`period-pill ${active ? "active" : ""}`} onClick={() => setSelectedDuration(days)} type="button">
                <strong>{DURATION_LABEL[days]} {t("tariffs.days")}</strong>
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
              <span>{method.method_type === "manual" ? t("tariffs.method.manual") : t("tariffs.method.auto")}</span>
              {method.instructions ? <small>{method.instructions}</small> : null}
            </button>
          ))}
        </div>

        <div className="input-stack">
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={t("tariffs.promo.placeholder")} />
        </div>

        <div className="payment-summary-card">
          <div className="info-row"><span>{t("tariffs.summary.plan")}</span><strong>{selectedPlan === "premium" ? t("common.premium") : t("common.vip")}</strong></div>
          <div className="info-row"><span>{t("tariffs.summary.period")}</span><strong>{selectedDuration} {t("tariffs.days")}</strong></div>
          <div className="info-row"><span>{t("tariffs.summary.method")}</span><strong>{selectedMethodObj?.name || "—"}</strong></div>
          <div className="info-row"><span>{t("tariffs.summary.base")}</span><strong>{quote?.original_amount_rub ?? "—"} RUB</strong></div>
          <div className="info-row"><span>{t("tariffs.summary.discount")}</span><strong>{quote ? `${quote.discount_rub} RUB` : "—"}</strong></div>
          <div className="info-row total"><span>{t("tariffs.summary.final")}</span><strong>{quote?.final_amount_rub ?? "—"} RUB</strong></div>
          {loadingQuote ? <p className="muted-line">{t("tariffs.summary.refresh")}</p> : null}
          {quote?.message ? <p className="muted-line">{quote.message}</p> : null}
        </div>

        <button className="btn" onClick={createPayment} type="button" disabled={loadingPay || loadingQuote || !selectedMethod}>
          {loadingPay
            ? t("tariffs.pay.prepare")
            : selectedMethodObj?.method_type === "manual"
              ? t("tariffs.pay.details")
              : t("tariffs.pay.go")}
        </button>

        {paymentResult?.payment_method_type === "manual" ? (
          <div className="manual-payment-card">
            <h3>{t("tariffs.pay.manualTitle")}</h3>
            <p>{t("tariffs.pay.manualHint")}</p>
            <div className="stack-list compact">
              {paymentResult.card_number ? <div className="info-row"><span>{t("tariffs.pay.card")}</span><strong>{paymentResult.card_number}</strong></div> : null}
              {paymentResult.recipient_name ? <div className="info-row"><span>{t("tariffs.pay.recipient")}</span><strong>{paymentResult.recipient_name}</strong></div> : null}
              {paymentResult.payment_details ? <div className="info-row"><span>{t("tariffs.pay.detailsLabel")}</span><strong>{paymentResult.payment_details}</strong></div> : null}
              <div className="info-row"><span>{t("tariffs.pay.amount")}</span><strong>{paymentResult.amount_rub} RUB</strong></div>
            </div>
            <div className="input-stack">
              <input placeholder={t("tariffs.pay.ref")} value={manualMeta.transfer_reference} onChange={(e) => setManualMeta((prev) => ({ ...prev, transfer_reference: e.target.value }))} />
              <textarea rows={3} placeholder={t("tariffs.pay.note")} value={manualMeta.note} onChange={(e) => setManualMeta((prev) => ({ ...prev, note: e.target.value }))} />
              <input placeholder={t("tariffs.pay.proof")} value={manualMeta.proof} onChange={(e) => setManualMeta((prev) => ({ ...prev, proof: e.target.value }))} />
              <button className="btn secondary" type="button" onClick={confirmManual}>{t("tariffs.pay.confirm")}</button>
            </div>
          </div>
        ) : null}

        {message ? <p className={`notice ${message.tone}`}>{message.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

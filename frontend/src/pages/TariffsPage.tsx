import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
import { ActivityBand, AppShellSection, CTACluster, SectionHeader, SkeletonBlock, StatusPill } from "../components/ui";
import { api, type PaymentCreateResult, type PaymentMethod, type PaymentQuote, type Tariff } from "../services/api";

type PlanCode = "premium" | "vip";
type Duration = 7 | 30 | 90;

const DEFAULT_OPTIONS: Array<{ duration_days: Duration; price_rub: number }> = [
  { duration_days: 7, price_rub: 0 },
  { duration_days: 30, price_rub: 0 },
  { duration_days: 90, price_rub: 0 },
];

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function formatRub(value: number): string {
  return `${value} RUB`;
}

export function TariffsPage() {
  const { t } = useI18n();

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<PlanCode>("premium");
  const [selectedDuration, setSelectedDuration] = useState<Duration>(30);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [promoCode, setPromoCode] = useState("");

  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentCreateResult | null>(null);
  const [manualMeta, setManualMeta] = useState({ transfer_reference: "", note: "", proof: "" });

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setInitialLoading(true);
      setLoadError("");

      const results = await Promise.allSettled([api.tariffs(), api.paymentMethods(), api.mySubscription()]);
      if (!alive) return;

      const [tariffRes, methodRes, subRes] = results;
      const nextTariffs = tariffRes.status === "fulfilled" ? tariffRes.value : [];
      setTariffs(nextTariffs);

      const nextMethods = methodRes.status === "fulfilled" ? methodRes.value : [];
      setMethods(nextMethods);
      if (nextMethods.length > 0) setSelectedMethod(nextMethods[0].code);

      const nextSub = subRes.status === "fulfilled" ? subRes.value : null;
      setSubscriptionRaw(nextSub);
      if (nextSub?.tariff === "vip" || nextSub?.tariff === "premium") {
        setSelectedPlan(nextSub.tariff);
      }

      if (tariffRes.status === "rejected") {
        setLoadError(parseErrorMessage(tariffRes.reason, ""));
      } else if (nextTariffs.length === 0) {
        setLoadError("empty");
      }

      setInitialLoading(false);
    };

    void load();

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    setLoadingQuote(true);
    api
      .quotePayment({ tariff_code: selectedPlan, duration_days: selectedDuration, promo_code: promoCode.trim() || undefined })
      .then(setQuote)
      .catch(() => setQuote(null))
      .finally(() => setLoadingQuote(false));
  }, [selectedDuration, selectedPlan, promoCode]);

  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const freePlan = tariffs.find((item) => item.code === "free");
  const selectedTariff = tariffs.find((item) => item.code === selectedPlan);
  const selectedMethodMeta = methods.find((method) => method.code === selectedMethod) || null;

  const durationBadges: Record<Duration, string> = {
    7: t("tariffs.duration.badge7"),
    30: t("tariffs.duration.badge30"),
    90: t("tariffs.duration.badge90"),
  };

  const durationOptions = useMemo(() => {
    if (!selectedTariff?.options?.length) return DEFAULT_OPTIONS;
    return selectedTariff.options
      .map((option) => ({
        duration_days: option.duration_days as Duration,
        price_rub: option.price_rub,
        badge: option.badge || undefined,
        benefit_label: option.benefit_label || undefined,
      }))
      .filter((option) => option.duration_days === 7 || option.duration_days === 30 || option.duration_days === 90);
  }, [selectedTariff]);

  const features = useMemo(() => {
    const perkMap = new Map(tariffs.map((item) => [item.code, item.perks] as const));
    const freePerks = perkMap.get("free") || [];
    const premiumPerks = perkMap.get("premium") || [];
    const vipPerks = perkMap.get("vip") || [];
    return {
      free: freePerks.length ? freePerks : [t("tariffs.feature.free1"), t("tariffs.feature.free2"), t("tariffs.feature.free3")],
      premium: premiumPerks.length
        ? premiumPerks
        : [t("tariffs.feature.premium1"), t("tariffs.feature.premium2"), t("tariffs.feature.premium3"), t("tariffs.feature.premium4")],
      vip: vipPerks.length ? vipPerks : [t("tariffs.feature.vip1"), t("tariffs.feature.vip2"), t("tariffs.feature.vip3"), t("tariffs.feature.vip4")],
    };
  }, [t, tariffs]);

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
      setMessage({ tone: "info", text: t("tariffs.manual.hint") });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : t("tariffs.pay.createFail") });
    } finally {
      setLoadingPay(false);
    }
  };

  const confirmManual = async () => {
    if (!paymentResult) return;
    try {
      const result = await api.confirmManualPayment(paymentResult.payment_id, manualMeta);
      setMessage({ tone: "success", text: result.status === "pending_manual_review" ? t("tariffs.manual.review") : t("tariffs.manual.confirmed") });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : t("tariffs.manual.confirmFail") });
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <AppShellSection>
          <AIScanningLoader />
          <div className="pb-plan-grid" aria-hidden="true">
            <article className="pb-plan-card pb-skeleton-card">
              <SkeletonBlock className="w-44" />
              <SkeletonBlock className="w-88 h-84" />
              <SkeletonBlock className="w-35" />
            </article>
            <article className="pb-plan-card pb-skeleton-card">
              <SkeletonBlock className="w-55" />
              <SkeletonBlock className="w-90 h-84" />
              <SkeletonBlock className="w-45" />
            </article>
          </div>
        </AppShellSection>
        <AppDisclaimer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-screen pb-screen-tariffs">
        <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <StatusPill
            label={subscription.tariff === "vip" ? t("common.vip") : subscription.tariff === "premium" ? t("common.premium") : t("common.free")}
            tone="accent"
          />
        </div>
        <h2>{t("tariffs.hero.title")}</h2>
        <p>{t("tariffs.hero.subtitle")}</p>
        <ActivityBand
          items={[
            { label: t("tariffs.summary.plan"), value: selectedPlan === "premium" ? t("common.premium") : t("common.vip"), tone: "accent" },
            { label: t("tariffs.summary.period"), value: `${selectedDuration} ${t("common.days")}` },
            { label: t("tariffs.summary.final"), value: quote ? formatRub(quote.final_amount_rub) : "-", tone: "success" },
          ]}
        />
      </section>

      <AppShellSection>
        <SectionHeader title={t("tariffs.tiers.title")} subtitle={t("tariffs.tiers.subtitle")} />

        {loadError ? (
          <div className="pb-error-state">
            <p>{loadError === "empty" ? t("tariffs.loadEmpty") : loadError}</p>
            <CTACluster>
              <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
                {t("common.retry")}
              </button>
            </CTACluster>
          </div>
        ) : null}

        <div className="pb-plan-grid">
          {freePlan ? (
            <article className="pb-plan-card free">
              <div className="pb-plan-head">
                <h3>{t("common.free")}</h3>
                {subscription.tariff === "free" ? <StatusPill label={t("tariffs.currentPlan")} tone="success" /> : null}
              </div>
              <p>{t("tariffs.free.entry")}</p>
              <strong className="pb-plan-price">0 RUB</strong>
              <ul>
                {features.free.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ) : null}

          {(["premium", "vip"] as PlanCode[]).map((plan) => {
            const tariff = tariffs.find((item) => item.code === plan);
            if (!tariff) return null;
            const active = selectedPlan === plan;
            const current = subscription.tariff === plan;
            return (
              <article key={plan} className={active ? "pb-plan-card active" : "pb-plan-card"}>
                <div className="pb-plan-head">
                  <h3>{plan === "premium" ? t("common.premium") : t("common.vip")}</h3>
                  <span className="pb-plan-badge">{plan === "premium" ? t("tariffs.premium.badge") : t("tariffs.vip.badge")}</span>
                </div>
                <p>{tariff.description || "-"}</p>
                <strong className="pb-plan-price">{formatRub(tariff.price_rub)}</strong>
                <ul>
                  {(plan === "premium" ? features.premium : features.vip).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <div className="pb-plan-actions">
                  {current ? <StatusPill label={t("tariffs.currentPlan")} tone="success" /> : null}
                  <button className={active ? "pb-btn pb-btn-secondary" : "pb-btn pb-btn-ghost"} type="button" onClick={() => setSelectedPlan(plan)}>
                    {active ? t("tariffs.selected") : t("tariffs.select")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("tariffs.setup.title")} subtitle={t("tariffs.setup.subtitle")} />

        <div className="pb-pay-grid">
          <article className="pb-pay-card">
            <h3>{t("tariffs.duration")}</h3>
            <div className="pb-duration-row">
              {(durationOptions.length > 0 ? durationOptions : DEFAULT_OPTIONS).map((option) => {
                const active = selectedDuration === option.duration_days;
                return (
                  <button
                    key={option.duration_days}
                    type="button"
                    className={active ? "pb-duration-pill active" : "pb-duration-pill"}
                    onClick={() => setSelectedDuration(option.duration_days)}
                  >
                    <strong>
                      {option.duration_days} {t("common.days")}
                    </strong>
                    <span>{formatRub(option.price_rub)}</span>
                    <small>{("benefit_label" in option && option.benefit_label) || ("badge" in option && option.badge) || durationBadges[option.duration_days]}</small>
                  </button>
                );
              })}
            </div>

            <div className="pb-input-stack">
              <input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} placeholder={t("tariffs.promo.placeholder")} />
            </div>
          </article>

          <article className="pb-pay-card">
            <h3>{t("tariffs.summary.method")}</h3>
            <div className="pb-method-grid">
              {methods.map((method) => {
                const active = selectedMethod === method.code;
                return (
                  <button key={method.code} type="button" className={active ? "pb-method-card active" : "pb-method-card"} onClick={() => setSelectedMethod(method.code)}>
                    <strong>{method.name}</strong>
                    <span>{method.method_type === "manual" ? t("tariffs.method.manual") : t("tariffs.method.auto")}</span>
                    {method.instructions ? <p>{method.instructions}</p> : null}
                  </button>
                );
              })}
            </div>
          </article>
        </div>

        <article className="pb-summary-card">
          <h3>{t("tariffs.summary.title")}</h3>
          <div>
            <span>{t("tariffs.summary.plan")}</span>
            <strong>{selectedPlan === "premium" ? t("common.premium") : t("common.vip")}</strong>
          </div>
          <div>
            <span>{t("tariffs.summary.period")}</span>
            <strong>
              {selectedDuration} {t("common.days")}
            </strong>
          </div>
          <div>
            <span>{t("tariffs.summary.method")}</span>
            <strong>{selectedMethodMeta?.name || "-"}</strong>
          </div>
          <div>
            <span>{t("tariffs.summary.base")}</span>
            <strong>{quote ? formatRub(quote.original_amount_rub) : "-"}</strong>
          </div>
          <div>
            <span>{t("tariffs.summary.discount")}</span>
            <strong>{quote ? formatRub(quote.discount_rub) : "-"}</strong>
          </div>
          <div className="total">
            <span>{t("tariffs.summary.final")}</span>
            <strong>{quote ? formatRub(quote.final_amount_rub) : "-"}</strong>
          </div>
          {loadingQuote ? <p>{t("tariffs.summary.refresh")}</p> : null}
          {quote?.message ? <p>{quote.message}</p> : null}
        </article>

        <CTACluster>
          <button className="pb-btn pb-btn-primary" type="button" onClick={createPayment} disabled={loadingPay || loadingQuote || !selectedMethod}>
            {loadingPay ? t("tariffs.pay.prepare") : selectedMethodMeta?.method_type === "manual" ? t("tariffs.pay.details") : t("tariffs.pay.go")}
          </button>
        </CTACluster>

        {paymentResult?.payment_method_type === "manual" ? (
          <article className="pb-manual-card">
            <h3>{t("tariffs.manual.title")}</h3>
            <p>{t("tariffs.manual.hint")}</p>
            <div className="pb-info-list">
              {paymentResult.card_number ? (
                <div>
                  <span>{t("tariffs.manual.card")}</span>
                  <strong>{paymentResult.card_number}</strong>
                </div>
              ) : null}
              {paymentResult.recipient_name ? (
                <div>
                  <span>{t("tariffs.manual.recipient")}</span>
                  <strong>{paymentResult.recipient_name}</strong>
                </div>
              ) : null}
              {paymentResult.payment_details ? (
                <div>
                  <span>{t("tariffs.manual.details")}</span>
                  <strong>{paymentResult.payment_details}</strong>
                </div>
              ) : null}
              <div>
                <span>{t("tariffs.manual.amount")}</span>
                <strong>{formatRub(paymentResult.amount_rub)}</strong>
              </div>
            </div>

            <div className="pb-input-stack">
              <input
                value={manualMeta.transfer_reference}
                onChange={(event) => setManualMeta((prev) => ({ ...prev, transfer_reference: event.target.value }))}
                placeholder={t("tariffs.manual.ref")}
              />
              <textarea rows={3} value={manualMeta.note} onChange={(event) => setManualMeta((prev) => ({ ...prev, note: event.target.value }))} placeholder={t("tariffs.manual.note")} />
              <input value={manualMeta.proof} onChange={(event) => setManualMeta((prev) => ({ ...prev, proof: event.target.value }))} placeholder={t("tariffs.manual.proof")} />

              <button className="pb-btn pb-btn-secondary" type="button" onClick={confirmManual}>
                {t("tariffs.manual.confirm")}
              </button>
            </div>
          </article>
        ) : null}

        {message ? <p className={message.tone === "error" ? "pb-notice error" : message.tone === "success" ? "pb-notice success" : "pb-notice"}>{message.text}</p> : null}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("tariffs.extra.title")} />
        <p className="pb-article-text">{t("tariffs.extra.text")}</p>
      </AppShellSection>

        <AppDisclaimer />
      </div>
    </Layout>
  );
}

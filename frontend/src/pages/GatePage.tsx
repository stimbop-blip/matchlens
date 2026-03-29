import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { isConsentAccepted, writeConsentCache } from "../app/consent";
import { LEGAL_ACCEPTED_VERSION, LEGAL_TEXTS } from "../app/legal";
import { useI18n } from "../app/i18n";
import { api, type UserConsent } from "../services/api";

type GatePageProps = {
  consent: UserConsent | null;
  checkingRemote?: boolean;
  onAccepted: (value: UserConsent) => void;
};

function parseError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Failed to save consent";
}

export function GatePage({ consent, checkingRemote = false, onAccepted }: GatePageProps) {
  const { language } = useI18n();
  const locale = language === "en" ? "en" : "ru";
  const copy = LEGAL_TEXTS[locale].gate;

  const [accepted18, setAccepted18] = useState(Boolean(consent?.accepted_18_plus));
  const [acceptedRules, setAcceptedRules] = useState(Boolean(consent?.accepted_rules));
  const [acceptedPayment, setAcceptedPayment] = useState(Boolean(consent?.accepted_payment_terms));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAccepted18(Boolean(consent?.accepted_18_plus));
    setAcceptedRules(Boolean(consent?.accepted_rules));
    setAcceptedPayment(Boolean(consent?.accepted_payment_terms));
  }, [consent?.accepted_18_plus, consent?.accepted_rules, consent?.accepted_payment_terms]);

  const canContinue = accepted18 && acceptedRules && acceptedPayment && !submitting && !checkingRemote;

  const onContinue = async () => {
    if (!accepted18 || !acceptedRules || !acceptedPayment) return;
    setError(null);
    setSubmitting(true);
    try {
      const next = await api.updateMyConsent({
        accepted_18_plus: true,
        accepted_rules: true,
        accepted_payment_terms: true,
        accepted_version: LEGAL_ACCEPTED_VERSION,
      });
      writeConsentCache(next);
      if (isConsentAccepted(next)) {
        onAccepted(next);
      }
    } catch (nextError) {
      setError(parseError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const onClose = () => {
    const webApp = window.Telegram?.WebApp;
    const withClose = webApp as { close?: () => void } | undefined;
    if (withClose?.close) {
      withClose.close();
      return;
    }
    window.close();
  };

  return (
    <main className="pb-gate-root">
      <section className="pb-gate-card pb-reveal">
        <span className="pb-brand-chip large">PIT BET</span>
        <h1>{copy.title}</h1>
        <p className="pb-gate-subtitle">{copy.subtitle}</p>
        <p className="pb-gate-body">{copy.body}</p>

        <div className="pb-gate-checks">
          <label className="pb-gate-check-row">
            <input type="checkbox" checked={accepted18} onChange={(event) => setAccepted18(event.target.checked)} />
            <span>{copy.checkbox18}</span>
          </label>
          <label className="pb-gate-check-row">
            <input type="checkbox" checked={acceptedRules} onChange={(event) => setAcceptedRules(event.target.checked)} />
            <span>{copy.checkboxRules}</span>
          </label>
          <label className="pb-gate-check-row">
            <input type="checkbox" checked={acceptedPayment} onChange={(event) => setAcceptedPayment(event.target.checked)} />
            <span>{copy.checkboxPayment}</span>
          </label>
        </div>

        <div className="pb-gate-links">
          <Link className="pb-btn pb-btn-ghost" to="/menu/rules">
            {copy.buttonRules}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/menu/responsible">
            {copy.buttonResponsible}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/menu/payment-refund">
            {copy.buttonPayment}
          </Link>
        </div>

        <p className="pb-gate-blocked">{copy.blockedText}</p>

        {error ? <p className="pb-notice error">{error}</p> : null}

        <div className="pb-gate-actions">
          <button className="pb-btn pb-btn-primary" type="button" onClick={onContinue} disabled={!canContinue}>
            {copy.buttonContinue}
          </button>
          <button className="pb-btn pb-btn-secondary" type="button" onClick={onClose}>
            {copy.buttonClose}
          </button>
        </div>
      </section>
    </main>
  );
}

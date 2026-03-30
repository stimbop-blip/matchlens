import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { isConsentAccepted, writeConsentCache } from "../app/consent";
import { LEGAL_ACCEPTED_VERSION, LEGAL_TEXTS } from "../app/legal";
import { useI18n } from "../app/i18n";
import { api, type UserConsent } from "../services/api";
import { triggerHaptic } from "../services/telegram";

type GatePageProps = {
  consent: UserConsent | null;
  checkingRemote?: boolean;
  onAccepted: (value: UserConsent) => void;
};

function parseError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
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

  const acceptedCount = Number(accepted18) + Number(acceptedRules) + Number(acceptedPayment);
  const acceptedProgress = Math.round((acceptedCount / 3) * 100);
  const canContinue = accepted18 && acceptedRules && acceptedPayment && !submitting && !checkingRemote;
  const gateStateText = checkingRemote
    ? locale === "ru"
      ? "Проверяем согласия..."
      : "Checking consent..."
    : submitting
      ? locale === "ru"
        ? "Сохраняем..."
        : "Saving..."
      : canContinue
        ? locale === "ru"
          ? "Готово"
          : "Ready"
        : locale === "ru"
          ? "Требуется подтверждение"
          : "Confirmation required";

  const onToggle = (setter: (next: boolean) => void, next: boolean) => {
    triggerHaptic("selection");
    setter(next);
  };

  const onContinue = async () => {
    if (!accepted18 || !acceptedRules || !acceptedPayment) return;
    triggerHaptic("impact-medium");
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
      setError(parseError(nextError, copy.saveError));
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
      <section className="pb-gate-card pb-gate-cinematic pb-reveal">
        <div className="pb-gate-orbit" aria-hidden="true">
          <span className="ring ring-a" />
          <span className="ring ring-b" />
          <span className="core" />
        </div>

        <span className="pb-brand-chip large">PIT BET</span>
        <h1>{copy.title}</h1>
        <p className="pb-gate-subtitle">{copy.subtitle}</p>
        <p className="pb-gate-body">{copy.body}</p>

        <div className="pb-gate-checks">
          <label className="pb-gate-check-row pb-gate-switch">
            <input type="checkbox" checked={accepted18} onChange={(event) => onToggle(setAccepted18, event.target.checked)} />
            <span className="pb-gate-check-copy">{copy.checkbox18}</span>
          </label>
          <label className="pb-gate-check-row pb-gate-switch">
            <input type="checkbox" checked={acceptedRules} onChange={(event) => onToggle(setAcceptedRules, event.target.checked)} />
            <span className="pb-gate-check-copy">{copy.checkboxRules}</span>
          </label>
          <label className="pb-gate-check-row pb-gate-switch">
            <input type="checkbox" checked={acceptedPayment} onChange={(event) => onToggle(setAcceptedPayment, event.target.checked)} />
            <span className="pb-gate-check-copy">{copy.checkboxPayment}</span>
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

        <div className="pb-gate-progress">
          <div className="pb-gate-progress-head">
            <span>{copy.blockedText}</span>
            <strong>{acceptedCount}/3</strong>
          </div>
          <div className="pb-gate-progress-track" role="presentation" aria-hidden="true">
            <span style={{ width: `${acceptedProgress}%` }} />
          </div>
          <p className="pb-gate-progress-note">{gateStateText}</p>
        </div>

        {error ? <p className="pb-notice error">{error}</p> : null}

        <div className="pb-gate-actions">
          <button className="pb-btn pb-btn-primary" type="button" onClick={onContinue} disabled={!canContinue}>
            <span className="pb-gate-launch-icon" aria-hidden="true">
              →
            </span>
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

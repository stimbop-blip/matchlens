import { LEGAL_ACCEPTED_VERSION } from "./legal";
import type { UserConsent } from "../services/api";

const CONSENT_STORAGE_KEY = "pitbet_legal_consent_cache";

type StoredConsent = {
  accepted_18_plus: boolean;
  accepted_rules: boolean;
  accepted_payment_terms: boolean;
  accepted_at: string | null;
  accepted_version: string | null;
};

function asStored(value: UserConsent): StoredConsent {
  return {
    accepted_18_plus: Boolean(value.accepted_18_plus),
    accepted_rules: Boolean(value.accepted_rules),
    accepted_payment_terms: Boolean(value.accepted_payment_terms),
    accepted_at: value.accepted_at || null,
    accepted_version: value.accepted_version || null,
  };
}

export function readConsentCache(): UserConsent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    return {
      accepted_18_plus: Boolean(parsed.accepted_18_plus),
      accepted_rules: Boolean(parsed.accepted_rules),
      accepted_payment_terms: Boolean(parsed.accepted_payment_terms),
      accepted_at: typeof parsed.accepted_at === "string" ? parsed.accepted_at : null,
      accepted_version: typeof parsed.accepted_version === "string" ? parsed.accepted_version : null,
    };
  } catch {
    return null;
  }
}

export function writeConsentCache(value: UserConsent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(asStored(value)));
}

export function clearConsentCache(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
}

export function isConsentAccepted(value: UserConsent | null | undefined): boolean {
  if (!value) return false;
  return Boolean(
    value.accepted_18_plus &&
      value.accepted_rules &&
      value.accepted_payment_terms &&
      value.accepted_at &&
      value.accepted_version === LEGAL_ACCEPTED_VERSION
  );
}

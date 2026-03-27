export type RawSubscription = {
  tariff: string;
  status: string;
  ends_at: string | null;
};

export type SubscriptionSnapshot = {
  tariff: "free" | "premium" | "vip";
  status: "active" | "expired" | "canceled" | "inactive" | "unknown";
  ends_at: string | null;
  is_active: boolean;
};

export type PaymentStatus = "pending" | "pending_manual_review" | "requires_clarification" | "succeeded" | "failed" | "canceled";

function normalizeTariff(value: string | null | undefined): SubscriptionSnapshot["tariff"] {
  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  return "free";
}

function normalizeStatus(value: string | null | undefined): SubscriptionSnapshot["status"] {
  if (value === "active") return "active";
  if (value === "expired") return "expired";
  if (value === "canceled") return "canceled";
  if (value === "inactive") return "inactive";
  return "unknown";
}

function isPendingLike(status: string): boolean {
  return status === "pending" || status === "pending_manual_review" || status === "requires_clarification";
}

export function countPendingPayments(payments: Array<{ status: string }> | null | undefined): number {
  if (!payments?.length) return 0;
  return payments.filter((item) => isPendingLike(item.status)).length;
}

export function paymentStatusTone(status: string): "warning" | "success" | "danger" | "muted" {
  if (status === "succeeded") return "success";
  if (status === "failed" || status === "canceled") return "danger";
  if (isPendingLike(status)) return "warning";
  return "muted";
}

export function resolveSubscriptionSnapshot(input: RawSubscription | null | undefined): SubscriptionSnapshot {
  if (!input) {
    return { tariff: "free", status: "unknown", ends_at: null, is_active: false };
  }

  const tariff = normalizeTariff(input.tariff);
  const normalized = normalizeStatus(input.status);
  const endsAt = input.ends_at;
  if (!endsAt) {
    const status = normalized === "unknown" ? "inactive" : normalized;
    return {
      tariff,
      status,
      ends_at: null,
      is_active: status === "active",
    };
  }

  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) {
    return { tariff, status: normalized, ends_at: null, is_active: normalized === "active" };
  }
  const now = Date.now();
  const isFuture = date.getTime() > now;

  if (isFuture && normalized !== "active") {
    return { tariff, status: "active", ends_at: endsAt, is_active: true };
  }
  if (!isFuture && normalized === "active") {
    return { tariff, status: "expired", ends_at: endsAt, is_active: false };
  }
  return { tariff, status: normalized, ends_at: endsAt, is_active: normalized === "active" && isFuture };
}

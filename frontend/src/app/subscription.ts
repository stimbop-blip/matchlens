export type RawSubscription = {
  tariff: string;
  status: string;
  ends_at: string | null;
};

export type SubscriptionSnapshot = {
  tariff: "free" | "premium" | "vip";
  status: "active" | "expired" | "canceled" | "inactive" | "unknown";
  ends_at: string | null;
};

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

export function resolveSubscriptionSnapshot(input: RawSubscription | null | undefined): SubscriptionSnapshot {
  if (!input) {
    return { tariff: "free", status: "unknown", ends_at: null };
  }

  const tariff = normalizeTariff(input.tariff);
  const normalized = normalizeStatus(input.status);
  const endsAt = input.ends_at;
  if (!endsAt) {
    return {
      tariff,
      status: normalized === "unknown" ? "inactive" : normalized,
      ends_at: null,
    };
  }

  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) {
    return { tariff, status: normalized, ends_at: null };
  }
  const now = Date.now();
  const isFuture = date.getTime() > now;

  if (isFuture && normalized !== "active") {
    return { tariff, status: "active", ends_at: endsAt };
  }
  if (!isFuture && normalized === "active") {
    return { tariff, status: "expired", ends_at: endsAt };
  }
  return { tariff, status: normalized, ends_at: endsAt };
}

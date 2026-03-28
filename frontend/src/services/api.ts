import { getTelegramInitData, waitForTelegramInitData } from "./telegram";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const REQUEST_INITDATA_TIMEOUT_MS = 1200;

let initDataWaitPromise: Promise<string> | null = null;

async function resolveInitData(): Promise<string> {
  const existing = getTelegramInitData();
  if (existing) return existing;

  if (!initDataWaitPromise) {
    initDataWaitPromise = waitForTelegramInitData(REQUEST_INITDATA_TIMEOUT_MS).finally(() => {
      initDataWaitPromise = null;
    });
  }
  return initDataWaitPromise;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) return "API error";

  try {
    const parsed = JSON.parse(raw) as { detail?: unknown };
    const detail = parsed.detail;
    if (typeof detail === "string" && detail.trim()) return detail;

    if (Array.isArray(detail)) {
      const joined = detail
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "msg" in entry) {
            return String((entry as { msg?: unknown }).msg ?? "");
          }
          return "";
        })
        .filter(Boolean)
        .join("; ");
      if (joined) return joined;
    }
  } catch {
    // ignore JSON parsing errors and return raw payload below
  }

  return raw;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers || {});
  headers.set("Content-Type", "application/json");
  const initData = await resolveInitData();
  if (initData) {
    headers.set("X-Telegram-Init-Data", initData);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

export type Prediction = {
  id: string;
  title: string;
  match_name: string;
  league: string | null;
  sport_type: string;
  event_start_at: string;
  signal_type: string;
  odds: number;
  short_description: string | null;
  result_screenshot: string | null;
  risk_level: string;
  access_level: "free" | "premium" | "vip";
  status: "pending" | "won" | "lost" | "refund";
  mode: "prematch" | "live";
  published_at: string | null;
};

export type Me = {
  id: string;
  role: string;
  is_admin: boolean;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language: "ru" | "en";
  theme: "dark" | "light";
};

export type UserPreferences = {
  language: "ru" | "en";
  theme: "dark" | "light";
};

export type Tariff = {
  code: "free" | "premium" | "vip";
  name: string;
  price_rub: number;
  duration_days: number;
  access_level: "free" | "premium" | "vip";
  description: string | null;
  perks: string[];
  options: Array<{
    duration_days: number;
    price_rub: number;
    badge?: string | null;
    benefit_label?: string | null;
  }>;
};

export type AdminUser = {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  role: "user" | "admin";
  tariff: "free" | "premium" | "vip";
  subscription_ends_at: string | null;
  referral_code?: string | null;
  referred_by_code?: string | null;
  referrals_invited?: number;
  referrals_activated?: number;
  referral_bonus_days?: number;
  created_at: string | null;
  is_blocked?: boolean;
};

export type AdminPayment = {
  id: string;
  user_id: string;
  telegram_id: number;
  username: string | null;
  tariff_code: string;
  access_level: "free" | "premium" | "vip";
  duration_days: number;
  amount_rub: number;
  status: "pending" | "pending_manual_review" | "requires_clarification" | "succeeded" | "failed" | "canceled";
  method_code: string | null;
  method_name: string | null;
  provider_order_id: string;
  manual_note: string | null;
  manual_proof: string | null;
  review_comment: string | null;
  created_at: string | null;
};

export type PaymentMethod = {
  code: string;
  name: string;
  method_type: "auto" | "manual";
  is_active: boolean;
  sort_order: number;
  card_number?: string | null;
  recipient_name?: string | null;
  payment_details?: string | null;
  instructions?: string | null;
};

export type PaymentQuote = {
  tariff_code: "premium" | "vip";
  duration_days: number;
  access_level: "premium" | "vip";
  original_amount_rub: number;
  final_amount_rub: number;
  discount_rub: number;
  applied_discount_source?: "promo" | "referral" | null;
  promo_code?: string | null;
  message?: string | null;
};

export type PaymentCreateResult = {
  payment_id: string;
  status: string;
  amount_rub: number;
  original_amount_rub: number;
  discount_rub: number;
  applied_discount_source?: "promo" | "referral" | null;
  promo_code?: string | null;
  promo_message?: string | null;
  tariff_code: "premium" | "vip";
  duration_days: number;
  access_level: "premium" | "vip";
  payment_method_code: string;
  payment_method_name: string;
  payment_method_type: "auto" | "manual";
  payment_url?: string | null;
  instructions?: string | null;
  card_number?: string | null;
  recipient_name?: string | null;
  payment_details?: string | null;
};

export type MyPayment = {
  id: string;
  status: "pending" | "pending_manual_review" | "requires_clarification" | "succeeded" | "failed" | "canceled";
  amount_rub: number;
  tariff_code: string;
  duration_days: number;
  payment_method_code?: string | null;
  payment_method_name?: string | null;
  manual_note?: string | null;
  manual_proof?: string | null;
  review_comment?: string | null;
  created_at: string;
};

export type AdminSubscription = {
  id: string;
  user_id: string;
  telegram_id: number;
  username: string | null;
  tariff_code: "free" | "premium" | "vip";
  status: "active" | "expired" | "canceled";
  starts_at: string;
  ends_at: string;
  created_at: string | null;
};

export type AdminStats = {
  users_total: number;
  predictions_total: number;
  predictions_by_status: Record<string, number>;
  active_subscriptions: number;
  users_by_access: Record<string, number>;
  hit_rate: number;
  roi: number;
  events_placeholder: string[];
};

export type NotificationSettings = {
  notifications_enabled: boolean;
  notify_free: boolean;
  notify_premium: boolean;
  notify_vip: boolean;
  notify_results: boolean;
  notify_news: boolean;
};

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  category: string;
  is_published: boolean;
  published_at: string | null;
};

export type ReferralStats = {
  referral_code: string;
  referral_link: string;
  invited: number;
  activated: number;
  bonus_days: number;
};

export type PromoApplyResult = {
  ok: boolean;
  mode: string;
  kind: string;
  code: string;
  message: string;
  tariff_code?: string | null;
  discount_rub?: number | null;
  final_price_rub?: number | null;
  bonus_days?: number | null;
};

export type AdminPromoCode = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  kind: "percent_discount" | "fixed_discount" | "extra_days" | "free_access";
  value: number;
  tariff_code: "free" | "premium" | "vip" | null;
  max_activations: number | null;
  activations: number;
  is_active: boolean;
  expires_at: string | null;
};

export type PublicStats = {
  total: number;
  wins: number;
  loses: number;
  refunds: number;
  pending: number;
  hit_rate: number;
  winrate: number;
  roi: number;
  by_access: Record<string, number>;
};

export const api = {
  me: () => request<Me>("/users/me"),
  myPreferences: () => request<UserPreferences>("/users/me/preferences"),
  updateMyPreferences: (payload: Partial<UserPreferences>) =>
    request<UserPreferences>("/users/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  myNotificationSettings: () => request<NotificationSettings>("/users/me/notification-settings"),
  updateMyNotificationSettings: (payload: Partial<NotificationSettings>) =>
    request<NotificationSettings>("/users/me/notification-settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  mySubscription: () => request<{ tariff: string; status: string; ends_at: string | null }>("/subscriptions/me"),
  tariffs: () => request<Tariff[]>("/tariffs"),
  predictions: (params?: { mode?: string; status?: string; access_level?: string; risk_level?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.mode) search.set("mode", params.mode);
    if (params?.status) search.set("status", params.status);
    if (params?.access_level) search.set("access_level", params.access_level);
    if (params?.risk_level) search.set("risk_level", params.risk_level);
    if (typeof params?.limit === "number") {
      const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(params.limit)));
      search.set("limit", String(normalizedLimit));
    }
    if (typeof params?.offset === "number") search.set("offset", String(params.offset));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Prediction[]>(`/predictions${suffix}`);
  },
  prediction: (id: string) => request<Prediction>(`/predictions/${id}`),
  stats: () => request<PublicStats>("/stats/overview"),
  news: () => request<NewsPost[]>("/news"),
  myReferral: () => request<ReferralStats>("/users/me/referral"),
  applyPromoCode: (payload: { code: string; tariff_code?: "free" | "premium" | "vip" }) =>
    request<PromoApplyResult>("/promocodes/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  paymentMethods: () => request<PaymentMethod[]>("/payments/methods"),
  quotePayment: (payload: { tariff_code: "premium" | "vip"; duration_days: 7 | 30 | 90; promo_code?: string }) =>
    request<PaymentQuote>("/payments/quote", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createPayment: (payload: { tariff_code: "premium" | "vip"; duration_days: 7 | 30 | 90; payment_method_code?: string; promo_code?: string }) =>
    request<PaymentCreateResult>("/payments/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  confirmManualPayment: (paymentId: string, payload: { transfer_reference?: string; note?: string; proof?: string }) =>
    request<{ ok?: boolean; status: string }>(`/payments/${paymentId}/manual-confirm`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myPayments: () => request<MyPayment[]>("/payments/my"),

  adminPredictions: () => request<Prediction[]>("/admin/predictions"),
  adminCreatePrediction: (payload: Record<string, unknown>) =>
    request<Prediction>("/admin/predictions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUpdatePrediction: (id: string, payload: Record<string, unknown>) =>
    request<Prediction>(`/admin/predictions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  adminDeletePrediction: (id: string) =>
    request<{ ok: boolean }>(`/admin/predictions/${id}`, {
      method: "DELETE",
    }),

  adminUsers: (params?: { q?: string; role?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.role) search.set("role", params.role);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<AdminUser[]>(`/admin/users${suffix}`);
  },
  adminUpdateUserRole: (id: string, role: "user" | "admin") =>
    request<{ ok: boolean }>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  adminDeleteUser: (id: string) =>
    request<{ ok: boolean }>(`/admin/users/${id}`, {
      method: "DELETE",
    }),

  adminSubscriptions: (params?: { q?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<AdminSubscription[]>(`/admin/subscriptions${suffix}`);
  },
  adminGrantSubscription: (payload: { user_id?: string; telegram_id?: number; tariff_code: "free" | "premium" | "vip"; duration_days: number }) =>
    request<{ ok: boolean }>("/admin/subscriptions/grant", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminExtendSubscription: (id: string, days: number) =>
    request<{ ok: boolean }>(`/admin/subscriptions/${id}/extend`, {
      method: "PATCH",
      body: JSON.stringify({ days }),
    }),
  adminChangeSubscriptionTariff: (id: string, payload: { tariff_code: "free" | "premium" | "vip"; duration_days?: number }) =>
    request<{ ok: boolean }>(`/admin/subscriptions/${id}/tariff`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminCancelSubscription: (id: string) =>
    request<{ ok: boolean }>(`/admin/subscriptions/${id}/cancel`, {
      method: "PATCH",
    }),

  adminPayments: (params?: { status?: string; user_query?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.user_query) search.set("user_query", params.user_query);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<AdminPayment[]>(`/admin/payments${suffix}`);
  },
  adminUpdatePaymentStatus: (
    id: string,
    status: "pending" | "pending_manual_review" | "requires_clarification" | "succeeded" | "failed" | "canceled",
    review_comment?: string
  ) =>
    request<{ ok: boolean }>(`/admin/payments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, review_comment }),
    }),
  adminPaymentMethods: () => request<PaymentMethod[]>("/admin/payment-methods"),
  adminCreatePaymentMethod: (payload: PaymentMethod) =>
    request<PaymentMethod>("/admin/payment-methods", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUpdatePaymentMethod: (code: string, payload: Partial<PaymentMethod>) =>
    request<PaymentMethod>(`/admin/payment-methods/${code}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  adminStats: () => request<AdminStats>("/admin/stats"),
  adminNews: () => request<NewsPost[]>("/admin/news"),
  adminCreateNews: (payload: { title: string; body: string; category?: string; is_published?: boolean }) =>
    request<NewsPost>("/admin/news", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUpdateNews: (id: string, payload: { title?: string; body?: string; category?: string; is_published?: boolean }) =>
    request<NewsPost>(`/admin/news/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminDeleteNews: (id: string) =>
    request<{ ok: boolean }>(`/admin/news/${id}`, {
      method: "DELETE",
    }),
  adminPromoCodes: () => request<AdminPromoCode[]>("/admin/promocodes"),
  adminCreatePromoCode: (payload: {
    code: string;
    title: string;
    description?: string;
    kind: "percent_discount" | "fixed_discount" | "extra_days" | "free_access";
    value: number;
    tariff_code?: "free" | "premium" | "vip";
    max_activations?: number;
    expires_at?: string;
    is_active?: boolean;
  }) =>
    request<AdminPromoCode>("/admin/promocodes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUpdatePromoCode: (
    id: string,
    payload: {
      title?: string;
      description?: string;
      kind?: "percent_discount" | "fixed_discount" | "extra_days" | "free_access";
      value?: number;
      tariff_code?: "free" | "premium" | "vip";
      max_activations?: number;
      expires_at?: string;
      is_active?: boolean;
    }
  ) =>
    request<AdminPromoCode>(`/admin/promocodes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  adminDeletePromoCode: (id: string) =>
    request<{ ok: boolean }>(`/admin/promocodes/${id}`, {
      method: "DELETE",
    }),
  adminBroadcast: (payload: { title: string; message: string; access_level: string; button_text?: string; button_url?: string }) =>
    request<{ ok: boolean; queued: number }>("/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminCampaignPreview: (payload: {
    segment: string;
    access_level?: string;
    notifications_enabled_only?: boolean;
    title?: string;
    message?: string;
    button_text?: string;
    button_url?: string;
  }) =>
    request<{
      ok: boolean;
      count: number;
      sample: Array<{ telegram_id: number; username: string | null; role: string }>;
      preview?: { title?: string | null; message?: string | null; button_text?: string | null; button_url?: string | null };
    }>(
      "/admin/notifications/preview",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
  adminCampaignSend: (payload: {
    title: string;
    message: string;
    segment: string;
    access_level?: string;
    notifications_enabled_only?: boolean;
    button_text?: string;
    button_url?: string;
  }) =>
    request<{ ok: boolean; queued: number; recipients: number }>("/admin/notifications/campaign", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminDirectSend: (payload: {
    title: string;
    message: string;
    telegram_id?: number;
    user_id?: string;
    button_text?: string;
    button_url?: string;
  }) =>
    request<{ ok: boolean; queued: number; reason?: string }>("/admin/notifications/direct", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminNotificationStats: () => request<{ ok: boolean; total: number; sent: number; failed: number; queued: number }>("/admin/notifications/stats"),
};

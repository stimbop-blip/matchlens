import { waitForTelegramInitData } from "./telegram";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers || {});
  headers.set("Content-Type", "application/json");
  const initData = await waitForTelegramInitData();
  if (initData) {
    headers.set("X-Telegram-Init-Data", initData);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "API error");
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
};

export type Tariff = {
  code: "free" | "premium" | "vip";
  name: string;
  price_rub: number;
  duration_days: number;
  access_level: "free" | "premium" | "vip";
  description: string | null;
};

export type AdminUser = {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  role: "user" | "admin";
  tariff: "free" | "premium" | "vip";
  subscription_ends_at: string | null;
  created_at: string | null;
  is_blocked?: boolean;
};

export type AdminPayment = {
  id: string;
  user_id: string;
  telegram_id: number;
  username: string | null;
  tariff_code: string;
  amount_rub: number;
  status: "pending" | "succeeded" | "failed" | "canceled";
  provider_order_id: string;
  created_at: string | null;
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
  myNotificationSettings: () => request<NotificationSettings>("/users/me/notification-settings"),
  updateMyNotificationSettings: (payload: Partial<NotificationSettings>) =>
    request<NotificationSettings>("/users/me/notification-settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  mySubscription: () => request<{ tariff: string; status: string; ends_at: string | null }>("/subscriptions/me"),
  tariffs: () => request<Tariff[]>("/tariffs"),
  predictions: (params?: { mode?: string; status?: string; access_level?: string; risk_level?: string }) => {
    const search = new URLSearchParams();
    if (params?.mode) search.set("mode", params.mode);
    if (params?.status) search.set("status", params.status);
    if (params?.access_level) search.set("access_level", params.access_level);
    if (params?.risk_level) search.set("risk_level", params.risk_level);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<Prediction[]>(`/predictions${suffix}`);
  },
  stats: () => request<PublicStats>("/stats/overview"),
  createPayment: (tariffCode: "premium" | "vip") =>
    request<{ payment_id: string; payment_url: string; amount_rub: number; status: string }>("/payments/create", {
      method: "POST",
      body: JSON.stringify({ tariff_code: tariffCode }),
    }),

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
  adminUpdatePaymentStatus: (id: string, status: "pending" | "succeeded" | "failed" | "canceled") =>
    request<{ ok: boolean }>(`/admin/payments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  adminStats: () => request<AdminStats>("/admin/stats"),
  adminBroadcast: (payload: { title: string; message: string; access_level: string }) =>
    request<{ ok: boolean; queued: number }>("/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminCampaignPreview: (payload: { segment: string; access_level?: string; notifications_enabled_only?: boolean }) =>
    request<{ ok: boolean; count: number; sample: Array<{ telegram_id: number; username: string | null; role: string }> }>(
      "/admin/notifications/preview",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
  adminCampaignSend: (payload: { title: string; message: string; segment: string; access_level?: string; notifications_enabled_only?: boolean }) =>
    request<{ ok: boolean; queued: number; recipients: number }>("/admin/notifications/campaign", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminDirectSend: (payload: { title: string; message: string; telegram_id?: number; user_id?: string }) =>
    request<{ ok: boolean; queued: number; reason?: string }>("/admin/notifications/direct", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

import { getTelegramInitData } from "./telegram";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers || {});
  headers.set("Content-Type", "application/json");
  const initData = getTelegramInitData();
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
  access_level: string;
  status: string;
  mode: string;
  published_at: string | null;
};

export type AdminUser = {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  role: string;
  tariff: string;
  subscription_ends_at: string | null;
  created_at: string | null;
};

export type AdminPayment = {
  id: string;
  user_id: string;
  telegram_id: number;
  username: string | null;
  tariff_code: string;
  amount_rub: number;
  status: string;
  provider_order_id: string;
  created_at: string | null;
};

export const api = {
  me: () => request<{ id: string; role: string; telegram_id: number; username: string | null; first_name: string | null; last_name: string | null }>("/users/me"),
  mySubscription: () => request<{ tariff: string; status: string; ends_at: string | null }>("/subscriptions/me"),
  tariffs: () => request<Array<{ code: string; name: string; price_rub: number; duration_days: number; access_level: string; description: string | null }>>("/tariffs"),
  predictions: () => request<Prediction[]>("/predictions"),
  stats: () => request<{ total: number; winrate: number; roi: number }>("/stats/overview"),
  createPayment: (tariffCode: "premium" | "vip") => request<{ payment_id: string; payment_url: string; amount_rub: number; status: string }>("/payments/create", {
    method: "POST",
    body: JSON.stringify({ tariff_code: tariffCode }),
  }),
  adminPredictions: () => request<Prediction[]>("/admin/predictions"),
  adminCreatePrediction: (payload: Record<string, unknown>) => request<Prediction>("/admin/predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  adminUpdatePrediction: (id: string, payload: Record<string, unknown>) => request<Prediction>(`/admin/predictions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  adminBroadcast: (payload: { title: string; message: string; access_level: string }) =>
    request<{ ok: boolean; queued: number }>("/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminUsers: () => request<AdminUser[]>("/admin/users"),
  adminPayments: () => request<AdminPayment[]>("/admin/payments"),
};

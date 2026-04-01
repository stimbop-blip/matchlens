import { getTelegramInitData } from "./telegram";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type Signal = {
  id: string;
  sport: "football" | "tennis" | "basketball" | "other";
  league: string;
  teams: string;
  market: string;
  pick: string;
  odds: number;
  confidence: number;
  roi?: number;
  startsAt: string;
  status: "new" | "live" | "won" | "lost" | "void";
};

export type Tariff = {
  id: string;
  title: string;
  price: number;
  periodDays: number;
  isBestChoice?: boolean;
  features: string[];
};

export type Profile = {
  id: string;
  username?: string;
  firstName?: string;
  avatarUrl?: string;
  role: "user" | "admin";
  subscription: {
    tariffId?: string;
    activeUntil?: string;
    progressPercent: number;
  };
  stats: {
    winRate: number;
    roi: number;
    signalsTotal: number;
  };
  referrals: {
    invited: number;
    active: number;
    bonusDays: number;
  };
};

export type PurchasePayload = {
  tariffId: string;
  paymentMethod: "card" | "stars" | "manual";
  promoCode?: string;
};

class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const initData = getTelegramInitData();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message || `HTTP ${res.status}`)
        : `HTTP ${res.status}`;

    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

export const api = {
  getProfile: () => request<ApiResponse<Profile>>("/api/profile").then((r) => r.data),

  getSignals: (params?: { sport?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.sport) search.set("sport", params.sport);
    if (params?.status) search.set("status", params.status);
    const query = search.toString() ? `?${search.toString()}` : "";
    return request<ApiResponse<Signal[]>>(`/api/signals${query}`).then((r) => r.data);
  },

  getTariffs: () => request<ApiResponse<Tariff[]>>("/api/tariffs").then((r) => r.data),

  buyTariff: (payload: PurchasePayload) =>
    request<ApiResponse<{ checkoutUrl?: string; paymentId: string }>>("/api/tariffs/purchase", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => r.data),

  adminOverview: () =>
    request<ApiResponse<{ users: number; activeSubs: number; mrr: number; signalsToday: number }>>(
      "/api/admin/overview",
    ).then((r) => r.data),
};

export { ApiError };

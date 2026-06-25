import type {
  AdCampaign,
  AdminPayment,
  AdminPromoCode,
  AdminStats,
  AdminSubscription,
  AdminUser,
  NewsPost,
  PaymentMethod,
  Prediction,
} from "../../services/api";

export type {
  AdCampaign,
  AdminPayment,
  AdminPromoCode,
  AdminStats,
  AdminSubscription,
  AdminUser,
  NewsPost,
  PaymentMethod,
  Prediction,
};

export type TabKey =
  | "predictions"
  | "users"
  | "subscriptions"
  | "payments"
  | "payment_methods"
  | "news"
  | "ads"
  | "promocodes"
  | "broadcasts"
  | "events";

export type PredictionStatusFilter = "all" | Prediction["status"];
export type AccessFilter = "all" | Prediction["access_level"];
export type NewsFilter = "all" | "published" | "draft";
export type PromoFilter = "all" | "active" | "inactive";
export type MethodFilter = "all" | "active" | "inactive";
export type ReportPeriod = "daily" | "weekly" | "monthly";
export type ReportDigestAccess = "all" | "premium" | "vip";

export type PredictionDraft = {
  title: string;
  match_name: string;
  league: string;
  sport_type: string;
  event_start_at: string;
  signal_type: string;
  odds: string;
  risk_level: "low" | "medium" | "high";
  access_level: "free" | "premium" | "vip";
  mode: "prematch" | "live";
  status: "pending" | "won" | "lost" | "refund";
  brief: string;
  breakdown: string;
  comments: string;
  tag_pick: boolean;
  tag_strong: boolean;
  tag_hot: boolean;
  bet_screenshot: string | null;
  result_screenshot: string | null;
  notify_subscribers: boolean;
};

export type NewsDraft = {
  title: string;
  preview: string;
  body: string;
  category: string;
  is_published: boolean;
};

export type AdDraft = {
  title: string;
  body: string;
  image_url: string;
  cta_text: string;
  cta_url: string;
  is_active: boolean;
  sort_order: string;
};

export type PromoDraft = {
  code: string;
  title: string;
  description: string;
  kind: "percent_discount" | "fixed_discount" | "extra_days" | "free_access";
  value: string;
  tariff_code: "" | "free" | "premium" | "vip";
  max_activations: string;
  expires_at: string;
  is_active: boolean;
};

export type PaymentMethodDraft = {
  code: string;
  name: string;
  method_type: "auto" | "manual";
  is_active: boolean;
  sort_order: string;
  card_number: string;
  recipient_name: string;
  payment_details: string;
  instructions: string;
};

export type Language = "ru" | "en";

export function textError(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function accessLabel(value: string, language: Language): string {
  if (value === "premium") return language === "ru" ? "Премиум" : "Premium";
  if (value === "vip") return "VIP";
  return language === "ru" ? "Бесплатный" : "Free";
}

export function statusLabel(value: string, language: Language): string {
  if (value === "won") return language === "ru" ? "Выигрыш" : "Won";
  if (value === "lost") return language === "ru" ? "Проигрыш" : "Lost";
  if (value === "refund") return language === "ru" ? "Возврат" : "Refund";
  if (value === "succeeded") return language === "ru" ? "Подтвержден" : "Approved";
  if (value === "failed") return language === "ru" ? "Отклонен" : "Rejected";
  if (value === "canceled") return language === "ru" ? "Отменен" : "Canceled";
  if (value === "active") return language === "ru" ? "Активна" : "Active";
  if (value === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (value === "pending_manual_review") return language === "ru" ? "На проверке" : "Manual review";
  if (value === "requires_clarification") return language === "ru" ? "Нужно уточнение" : "Needs clarification";
  return language === "ru" ? "В ожидании" : "Pending";
}

export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(value: string | null | undefined, isRu: boolean): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(isRu ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toShortText(value: string, maxLength = 180): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function extractNewsPreviewAndBody(body: string): { preview: string; body: string } {
  const normalized = body.replace(/\r/g, "").trim();
  if (!normalized) return { preview: "", body: "" };
  const parts = normalized.split(/\n\s*\n+/);
  if (parts.length > 1) {
    return {
      preview: parts[0].trim(),
      body: parts.slice(1).join("\n\n").trim(),
    };
  }
  return {
    preview: toShortText(normalized, 180),
    body: normalized,
  };
}

export function joinNewsPreviewAndBody(preview: string, body: string): string {
  const p = preview.trim();
  const b = body.trim();
  if (!p && !b) return "";
  if (!p) return b;
  if (!b) return p;
  if (b.startsWith(p)) return b;
  return `${p}\n\n${b}`;
}

export function reportPeriodLabel(period: ReportPeriod, language: Language): string {
  if (period === "daily") return language === "ru" ? "За день" : "Daily";
  if (period === "weekly") return language === "ru" ? "За неделю" : "Weekly";
  return language === "ru" ? "За месяц" : "Monthly";
}

export function reportAccessLabel(access: string, language: Language): string {
  if (access === "premium") return language === "ru" ? "Только Premium" : "Premium only";
  if (access === "vip") return language === "ru" ? "Только VIP" : "VIP only";
  return language === "ru" ? "Premium + VIP" : "Premium + VIP";
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Invalid image payload"));
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function proofLooksLikeImage(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.startsWith("data:image/")) return true;
  return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/.test(lower);
}

/** Лёгкая форма статистики доставки уведомлений для использования в табах. */
export type NotificationDeliveryStatsLike = {
  total: number;
  sent: number;
  failed: number;
  queued: number;
};

/* ------------------------------------------------------------------ */
/* Панель видов спорта: популярные наверху                             */
/* ------------------------------------------------------------------ */

export type SportTemplate = {
  code: string;
  emoji: string;
  ru: string;
  en: string;
};

export const SPORT_TEMPLATES: SportTemplate[] = [
  { code: "football", emoji: "⚽", ru: "Футбол", en: "Football" },
  { code: "hockey", emoji: "🏒", ru: "Хоккей", en: "Hockey" },
  { code: "tennis", emoji: "🎾", ru: "Теннис", en: "Tennis" },
  { code: "basketball", emoji: "🏀", ru: "Баскетбол", en: "Basketball" },
  { code: "volleyball", emoji: "🏐", ru: "Волейбол", en: "Volleyball" },
  { code: "table_tennis", emoji: "🏓", ru: "Настольный теннис", en: "Table tennis" },
  { code: "mma", emoji: "🥊", ru: "Единоборства", en: "MMA" },
  { code: "esports", emoji: "🎮", ru: "Киберспорт", en: "Esports" },
  { code: "darts", emoji: "🎯", ru: "Дартс", en: "Darts" },
  { code: "baseball", emoji: "⚾", ru: "Бейсбол", en: "Baseball" },
];

export function sportTemplateLabel(code: string, language: Language): string {
  const tpl = SPORT_TEMPLATES.find((item) => item.code === code);
  if (!tpl) return code;
  return `${tpl.emoji} ${language === "ru" ? tpl.ru : tpl.en}`;
}

/* ------------------------------------------------------------------ */
/* Теги прогноза — всегда на русском                                    */
/* ------------------------------------------------------------------ */

export type PredictionTag = "pick" | "strong" | "hot";

export const TAG_DEFS: Array<{ key: PredictionTag; emoji: string; ru: string; en: string }> = [
  { key: "pick", emoji: "⭐", ru: "Выбор дня", en: "Pick of the day" },
  { key: "strong", emoji: "💪", ru: "Уверенный", en: "Strong" },
  { key: "hot", emoji: "🔥", ru: "Горячий", en: "Hot" },
];

export function tagLabel(key: PredictionTag, language: Language): string {
  const def = TAG_DEFS.find((item) => item.key === key)!;
  return `${def.emoji} ${language === "ru" ? def.ru : def.en}`;
}

export function tagsFromDescription(description: string | null | undefined): Record<PredictionTag, boolean> {
  const text = (description || "").toLowerCase();
  const result: Record<PredictionTag, boolean> = { pick: false, strong: false, hot: false };
  if (/выбор дня|pick of the day/.test(text)) result.pick = true;
  if (/уверенный|strong setup|\bstrong\b/.test(text)) result.strong = true;
  if (/горячий|hot pick|\bhot\b/.test(text)) result.hot = true;
  return result;
}

export function composePredictionDescription(
  draft: Pick<PredictionDraft, "brief" | "breakdown" | "comments" | "tag_pick" | "tag_strong" | "tag_hot">,
  language: Language,
): string | null {
  const parts: string[] = [];
  const brief = draft.brief.trim();
  const breakdown = draft.breakdown.trim();
  const comments = draft.comments.trim();

  const tags: string[] = [];
  if (draft.tag_pick) tags.push(tagLabel("pick", language).replace(/^\S+\s/, ""));
  if (draft.tag_strong) tags.push(tagLabel("strong", language).replace(/^\S+\s/, ""));
  if (draft.tag_hot) tags.push(tagLabel("hot", language).replace(/^\S+\s/, ""));

  if (brief) parts.push(brief);
  if (breakdown) parts.push(`${language === "ru" ? "Разбор" : "Breakdown"}:\n${breakdown}`);
  if (comments) parts.push(`${language === "ru" ? "Комментарии" : "Comments"}:\n${comments}`);
  if (tags.length) parts.push(`${language === "ru" ? "Метки" : "Tags"}: ${tags.join(", ")}`);

  if (!parts.length) return null;
  return parts.join("\n\n");
}

export function createEmptyPredictionDraft(): PredictionDraft {
  const inOneHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    title: "",
    match_name: "",
    league: "",
    sport_type: "football",
    event_start_at: toDateTimeLocal(inOneHour),
    signal_type: "",
    odds: "1.80",
    risk_level: "medium",
    access_level: "free",
    mode: "prematch",
    status: "pending",
    brief: "",
    breakdown: "",
    comments: "",
    tag_pick: false,
    tag_strong: false,
    tag_hot: false,
    bet_screenshot: null,
    result_screenshot: null,
    notify_subscribers: true,
  };
}

export function createPredictionDraftFromItem(item: Prediction): PredictionDraft {
  const tags = tagsFromDescription(item.short_description);
  // разбираем сохранённый текст обратно на поля
  const description = item.short_description || "";
  let brief = "";
  let breakdown = "";
  let comments = "";
  const sections = description.split(/\n\n+/);
  const breakdownLabel = /^Разбор:|^Breakdown:/;
  const commentsLabel = /^Комментарии:|^Comments:/;
  const tagsLabel = /^Метки:|^Tags:/;
  for (const section of sections) {
    if (breakdownLabel.test(section)) {
      breakdown = section.replace(breakdownLabel, "").trim();
    } else if (commentsLabel.test(section)) {
      comments = section.replace(commentsLabel, "").trim();
    } else if (tagsLabel.test(section)) {
      // skip — теги уже распарсены выше
    } else {
      brief = section.trim();
    }
  }

  return {
    title: item.title || "",
    match_name: item.match_name,
    league: item.league || "",
    sport_type: item.sport_type,
    event_start_at: toDateTimeLocal(item.event_start_at),
    signal_type: item.signal_type,
    odds: String(item.odds),
    risk_level: (item.risk_level as "low" | "medium" | "high") || "medium",
    access_level: item.access_level,
    mode: item.mode,
    status: item.status,
    brief,
    breakdown,
    comments,
    tag_pick: tags.pick,
    tag_strong: tags.strong,
    tag_hot: tags.hot,
    bet_screenshot: item.bet_screenshot,
    result_screenshot: item.result_screenshot,
    notify_subscribers: true,
  };
}

export function createEmptyNewsDraft(): NewsDraft {
  return {
    title: "",
    preview: "",
    body: "",
    category: "news",
    is_published: true,
  };
}

export function createNewsDraftFromItem(item: NewsPost): NewsDraft {
  const parsed = extractNewsPreviewAndBody(item.body || "");
  return {
    title: item.title,
    preview: parsed.preview,
    body: parsed.body || item.body,
    category: item.category || "news",
    is_published: item.is_published,
  };
}

export function createEmptyAdDraft(): AdDraft {
  return {
    title: "",
    body: "",
    image_url: "",
    cta_text: "",
    cta_url: "",
    is_active: true,
    sort_order: "0",
  };
}

export function createAdDraftFromItem(item: AdCampaign): AdDraft {
  return {
    title: item.title || "",
    body: item.body || "",
    image_url: item.image_url || "",
    cta_text: item.cta_text || "",
    cta_url: item.cta_url || "",
    is_active: item.is_active,
    sort_order: String(item.sort_order ?? 0),
  };
}

export function createEmptyPromoDraft(): PromoDraft {
  return {
    code: "",
    title: "",
    description: "",
    kind: "percent_discount",
    value: "20",
    tariff_code: "premium",
    max_activations: "",
    expires_at: "",
    is_active: true,
  };
}

export function createPromoDraftFromItem(item: AdminPromoCode): PromoDraft {
  return {
    code: item.code,
    title: item.title,
    description: item.description || "",
    kind: item.kind,
    value: String(item.value),
    tariff_code: item.tariff_code || "",
    max_activations: item.max_activations ? String(item.max_activations) : "",
    expires_at: toDateTimeLocal(item.expires_at),
    is_active: item.is_active,
  };
}

export function createEmptyPaymentMethodDraft(): PaymentMethodDraft {
  return {
    code: "",
    name: "",
    method_type: "manual",
    is_active: true,
    sort_order: "100",
    card_number: "",
    recipient_name: "",
    payment_details: "",
    instructions: "",
  };
}

export function createPaymentMethodDraftFromItem(item: PaymentMethod): PaymentMethodDraft {
  return {
    code: item.code,
    name: item.name,
    method_type: item.method_type,
    is_active: item.is_active,
    sort_order: String(item.sort_order),
    card_number: item.card_number || "",
    recipient_name: item.recipient_name || "",
    payment_details: item.payment_details || "",
    instructions: item.instructions || "",
  };
}

/* ------------------------------------------------------------------ */
/* Подсказки для полей матча/лиги/сигнала из истории прогнозов         */
/* ------------------------------------------------------------------ */

export function buildUniqueSuggestions(values: Array<string | null | undefined>, limit = 24): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = (raw || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Быстрые пресеты времени для формы прогноза                          */
/* ------------------------------------------------------------------ */

export type TimePreset = {
  key: string;
  ru: string;
  en: string;
  apply: () => string;
};

export function buildTimePresets(): TimePreset[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const atTime = (date: Date, hours: number, minutes = 0) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return toLocal(d);
  };
  const now = new Date();
  const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return [
    { key: "now", ru: "Сейчас", en: "Now", apply: () => toLocal(now) },
    { key: "+1h", ru: "+1 час", en: "+1 hour", apply: () => toLocal(inOneHour) },
    { key: "today_evening", ru: "Сегодня 19:00", en: "Today 19:00", apply: () => atTime(now, 19, 0) },
    { key: "tomorrow_evening", ru: "Завтра 18:00", en: "Tomorrow 18:00", apply: () => atTime(tomorrow, 18, 0) },
  ];
}

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import { useLanguage } from "../app/language";
import { Layout } from "../components/Layout";
import {
  api,
  type AdminPayment,
  type AdminPromoCode,
  type AdminStats,
  type AdminSubscription,
  type AdminUser,
  type NewsPost,
  type PaymentMethod,
  type Prediction,
} from "../services/api";

type TabKey = "predictions" | "users" | "subscriptions" | "payments" | "payment_methods" | "news" | "promocodes" | "broadcasts" | "events";

const TABS: Array<{ key: TabKey; ru: string; en: string }> = [
  { key: "predictions", ru: "Прогнозы", en: "Predictions" },
  { key: "users", ru: "Пользователи", en: "Users" },
  { key: "subscriptions", ru: "Подписки", en: "Subscriptions" },
  { key: "payments", ru: "Платежи", en: "Payments" },
  { key: "payment_methods", ru: "Способы оплаты", en: "Payment methods" },
  { key: "news", ru: "Новости", en: "News" },
  { key: "promocodes", ru: "Промокоды", en: "Promo codes" },
  { key: "broadcasts", ru: "Рассылки", en: "Campaigns" },
  { key: "events", ru: "Статистика", en: "Stats" },
];

type PredictionStatusFilter = "all" | Prediction["status"];
type AccessFilter = "all" | Prediction["access_level"];
type NewsFilter = "all" | "published" | "draft";
type PromoFilter = "all" | "active" | "inactive";
type MethodFilter = "all" | "active" | "inactive";

type PredictionDraft = {
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
  result_screenshot: string | null;
};

type NewsDraft = {
  title: string;
  preview: string;
  body: string;
  category: string;
  is_published: boolean;
};

type PromoDraft = {
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

type PaymentMethodDraft = {
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

function textError(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function accessLabel(value: string, language: "ru" | "en"): string {
  if (value === "premium") return language === "ru" ? "Премиум" : "Premium";
  if (value === "vip") return "VIP";
  return language === "ru" ? "Бесплатный" : "Free";
}

function statusLabel(value: string, language: "ru" | "en"): string {
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

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(value: string | null | undefined, isRu: boolean): string {
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

function toShortText(value: string, maxLength = 180): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function extractNewsPreviewAndBody(body: string): { preview: string; body: string } {
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

function joinNewsPreviewAndBody(preview: string, body: string): string {
  const p = preview.trim();
  const b = body.trim();
  if (!p && !b) return "";
  if (!p) return b;
  if (!b) return p;
  if (b.startsWith(p)) return b;
  return `${p}\n\n${b}`;
}

function createEmptyPredictionDraft(): PredictionDraft {
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
    result_screenshot: null,
  };
}

function createPredictionDraftFromItem(item: Prediction): PredictionDraft {
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
    brief: item.short_description || "",
    breakdown: "",
    comments: "",
    tag_pick: false,
    tag_strong: false,
    tag_hot: false,
    result_screenshot: item.result_screenshot,
  };
}

function createEmptyNewsDraft(): NewsDraft {
  return {
    title: "",
    preview: "",
    body: "",
    category: "news",
    is_published: true,
  };
}

function createNewsDraftFromItem(item: NewsPost): NewsDraft {
  const parsed = extractNewsPreviewAndBody(item.body || "");
  return {
    title: item.title,
    preview: parsed.preview,
    body: parsed.body || item.body,
    category: item.category || "news",
    is_published: item.is_published,
  };
}

function createEmptyPromoDraft(): PromoDraft {
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

function createPromoDraftFromItem(item: AdminPromoCode): PromoDraft {
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

function createEmptyPaymentMethodDraft(): PaymentMethodDraft {
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

function createPaymentMethodDraftFromItem(item: PaymentMethod): PaymentMethodDraft {
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

function composePredictionDescription(draft: PredictionDraft, isRu: boolean): string | null {
  const parts: string[] = [];
  const brief = draft.brief.trim();
  const breakdown = draft.breakdown.trim();
  const comments = draft.comments.trim();
  const tags: string[] = [];

  if (draft.tag_pick) tags.push(isRu ? "Выбор дня" : "Pick of the day");
  if (draft.tag_strong) tags.push(isRu ? "Strong setup" : "Strong setup");
  if (draft.tag_hot) tags.push(isRu ? "Hot pick" : "Hot pick");

  if (brief) parts.push(brief);
  if (breakdown) parts.push(`${isRu ? "Разбор" : "Breakdown"}:\n${breakdown}`);
  if (comments) parts.push(`${isRu ? "Комментарии" : "Comments"}:\n${comments}`);
  if (tags.length) parts.push(`${isRu ? "Метки" : "Tags"}: ${tags.join(", ")}`);

  if (!parts.length) return null;
  return parts.join("\n\n");
}

function fileToDataUrl(file: File): Promise<string> {
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

function proofLooksLikeImage(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.startsWith("data:image/")) return true;
  return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/.test(lower);
}

function AdminSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="admin-sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="admin-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="admin-sheet-head">
          <strong>{title}</strong>
          <button type="button" className="admin-sheet-close" onClick={onClose}>
            x
          </button>
        </div>
        <div className="admin-sheet-body">{children}</div>
      </section>
    </div>
  );
}

export function AdminPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [tab, setTab] = useState<TabKey>("predictions");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [predQuery, setPredQuery] = useState("");
  const [predStatusFilter, setPredStatusFilter] = useState<PredictionStatusFilter>("all");
  const [predAccessFilter, setPredAccessFilter] = useState<AccessFilter>("all");

  const [usersQuery, setUsersQuery] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");
  const [usersTariffFilter, setUsersTariffFilter] = useState<"all" | "free" | "premium" | "vip">("all");

  const [subQuery, setSubQuery] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");

  const [paymentQuery, setPaymentQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  const [newsQuery, setNewsQuery] = useState("");
  const [newsStatusFilter, setNewsStatusFilter] = useState<NewsFilter>("all");

  const [promoQuery, setPromoQuery] = useState("");
  const [promoStatusFilter, setPromoStatusFilter] = useState<PromoFilter>("all");

  const [methodQuery, setMethodQuery] = useState("");
  const [methodStatusFilter, setMethodStatusFilter] = useState<MethodFilter>("all");

  const [predictionStatusPanelId, setPredictionStatusPanelId] = useState<string | null>(null);
  const [predictionScreenshotPanelId, setPredictionScreenshotPanelId] = useState<string | null>(null);

  const [predictionSheetMode, setPredictionSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [predictionSheetId, setPredictionSheetId] = useState<string | null>(null);
  const [predictionDraft, setPredictionDraft] = useState<PredictionDraft>(createEmptyPredictionDraft());
  const [predictionSaving, setPredictionSaving] = useState(false);

  const [newsSheetMode, setNewsSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [newsSheetId, setNewsSheetId] = useState<string | null>(null);
  const [newsDraft, setNewsDraft] = useState<NewsDraft>(createEmptyNewsDraft());
  const [newsSaving, setNewsSaving] = useState(false);

  const [promoSheetMode, setPromoSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [promoSheetId, setPromoSheetId] = useState<string | null>(null);
  const [promoDraft, setPromoDraft] = useState<PromoDraft>(createEmptyPromoDraft());
  const [promoSaving, setPromoSaving] = useState(false);

  const [methodSheetMode, setMethodSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [methodSheetId, setMethodSheetId] = useState<string | null>(null);
  const [methodDraft, setMethodDraft] = useState<PaymentMethodDraft>(createEmptyPaymentMethodDraft());
  const [methodSaving, setMethodSaving] = useState(false);

  const [showGrantSubscriptionSheet, setShowGrantSubscriptionSheet] = useState(false);

  const [campaignSegment, setCampaignSegment] = useState("all");
  const [campaignAccess, setCampaignAccess] = useState("all");
  const [campaignNotifOnly, setCampaignNotifOnly] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignButtonText, setCampaignButtonText] = useState("");
  const [campaignButtonUrl, setCampaignButtonUrl] = useState("");
  const [campaignPreviewCount, setCampaignPreviewCount] = useState<number | null>(null);
  const [campaignPreviewPayload, setCampaignPreviewPayload] = useState<{
    title?: string | null;
    message?: string | null;
    button_text?: string | null;
    button_url?: string | null;
  } | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<{ total: number; sent: number; failed: number; queued: number } | null>(null);
  const [uploadingPredictionId, setUploadingPredictionId] = useState<string | null>(null);

  const notifyInfo = (text: string) => {
    setMessageTone("info");
    setMessage(text);
  };

  const notifySuccess = (text: string) => {
    setMessageTone("success");
    setMessage(text);
  };

  const notifyError = (text: string) => {
    setMessageTone("error");
    setMessage(text);
  };

  const loadAll = async () => {
    const [p, u, s, pay, paymentMethodList, n, promos, st] = await Promise.all([
      api.adminPredictions(),
      api.adminUsers(),
      api.adminSubscriptions(),
      api.adminPayments(),
      api.adminPaymentMethods(),
      api.adminNews(),
      api.adminPromoCodes(),
      api.adminStats(),
    ]);
    setPredictions(p);
    setUsers(u);
    setSubscriptions(s);
    setPayments(pay);
    setPaymentMethods(paymentMethodList);
    setNews(n);
    setPromoCodes(promos);
    setStats(st);
    api.adminNotificationStats().then((v) => setDeliveryStats(v)).catch(() => setDeliveryStats(null));
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось обновить данные", "Failed to refresh data")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .me()
      .then(async (me) => {
        const allowed = Boolean(me.is_admin || me.role === "admin");
        setIsAdmin(allowed);
        if (!allowed) return;
        setLoading(true);
        await loadAll();
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  const latestSubscriptionByUser = useMemo(() => {
    const map = new Map<string, AdminSubscription>();
    subscriptions.forEach((item) => {
      const current = map.get(item.user_id);
      if (!current || new Date(item.ends_at).getTime() > new Date(current.ends_at).getTime()) {
        map.set(item.user_id, item);
      }
    });
    return map;
  }, [subscriptions]);

  const visiblePredictions = useMemo(() => {
    const q = predQuery.trim().toLowerCase();
    return predictions.filter((item) => {
      if (predStatusFilter !== "all" && item.status !== predStatusFilter) return false;
      if (predAccessFilter !== "all" && item.access_level !== predAccessFilter) return false;
      if (!q) return true;
      const dateText = formatDateTime(item.event_start_at, isRu).toLowerCase();
      const base = `${item.match_name} ${item.title} ${item.league || ""} ${item.signal_type} ${item.sport_type} ${dateText}`.toLowerCase();
      return base.includes(q);
    });
  }, [predictions, predQuery, predStatusFilter, predAccessFilter, isRu]);

  const visibleUsers = useMemo(() => {
    const q = usersQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (usersRoleFilter !== "all" && user.role !== usersRoleFilter) return false;
      if (usersTariffFilter !== "all" && user.tariff !== usersTariffFilter) return false;
      if (!q) return true;
      const base = `${user.first_name || ""} ${user.username || ""} ${user.telegram_id}`.toLowerCase();
      return base.includes(q);
    });
  }, [users, usersQuery, usersRoleFilter, usersTariffFilter]);

  const visibleSubscriptions = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (subStatusFilter !== "all" && sub.status !== subStatusFilter) return false;
      if (!q) return true;
      const base = `${sub.username || ""} ${sub.telegram_id} ${sub.tariff_code}`.toLowerCase();
      return base.includes(q);
    });
  }, [subscriptions, subQuery, subStatusFilter]);

  const visiblePayments = useMemo(() => {
    const q = paymentQuery.trim().toLowerCase();
    return payments.filter((payment) => {
      if (paymentStatusFilter !== "all" && payment.status !== paymentStatusFilter) return false;
      if (paymentMethodFilter !== "all" && (payment.method_code || "") !== paymentMethodFilter) return false;
      if (!q) return true;
      const base = `${payment.username || ""} ${payment.telegram_id} ${payment.provider_order_id} ${payment.method_name || ""} ${payment.method_code || ""}`.toLowerCase();
      return base.includes(q);
    });
  }, [payments, paymentQuery, paymentStatusFilter, paymentMethodFilter]);

  const visibleNews = useMemo(() => {
    const q = newsQuery.trim().toLowerCase();
    return news.filter((item) => {
      if (newsStatusFilter === "published" && !item.is_published) return false;
      if (newsStatusFilter === "draft" && item.is_published) return false;
      if (!q) return true;
      const base = `${item.title} ${item.body} ${item.category}`.toLowerCase();
      return base.includes(q);
    });
  }, [news, newsQuery, newsStatusFilter]);

  const visiblePromos = useMemo(() => {
    const q = promoQuery.trim().toLowerCase();
    return promoCodes.filter((promo) => {
      if (promoStatusFilter === "active" && !promo.is_active) return false;
      if (promoStatusFilter === "inactive" && promo.is_active) return false;
      if (!q) return true;
      const base = `${promo.code} ${promo.title} ${promo.description || ""} ${promo.kind}`.toLowerCase();
      return base.includes(q);
    });
  }, [promoCodes, promoQuery, promoStatusFilter]);

  const visiblePaymentMethods = useMemo(() => {
    const q = methodQuery.trim().toLowerCase();
    return paymentMethods.filter((item) => {
      if (methodStatusFilter === "active" && !item.is_active) return false;
      if (methodStatusFilter === "inactive" && item.is_active) return false;
      if (!q) return true;
      const base = `${item.code} ${item.name} ${item.method_type} ${item.card_number || ""} ${item.recipient_name || ""}`.toLowerCase();
      return base.includes(q);
    });
  }, [paymentMethods, methodQuery, methodStatusFilter]);

  const onUpdatePrediction = async (id: string, payload: Record<string, unknown>) => {
    try {
      await api.adminUpdatePrediction(id, payload);
      notifySuccess(tx("Прогноз обновлен", "Prediction updated"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Ошибка обновления прогноза", "Failed to update prediction")));
    }
  };

  const onDeletePrediction = async (id: string) => {
    if (!window.confirm(tx("Удалить прогноз из ленты?", "Delete prediction from feed?"))) return;
    try {
      await api.adminDeletePrediction(id);
      notifySuccess(tx("Прогноз удален", "Prediction deleted"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Ошибка удаления прогноза", "Failed to delete prediction")));
    }
  };

  const onUploadPredictionScreenshot = async (predictionId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      notifyError(tx("Нужен файл изображения", "Please upload an image file"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      notifyError(tx("Скрин слишком большой (максимум 4MB)", "Image is too large (max 4MB)"));
      return;
    }

    setUploadingPredictionId(predictionId);
    try {
      const payload = await fileToDataUrl(file);
      await api.adminUpdatePrediction(predictionId, { result_screenshot: payload });
      notifySuccess(tx("Скрин прогноза сохранен", "Prediction screenshot saved"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось загрузить скрин", "Failed to upload screenshot")));
    } finally {
      setUploadingPredictionId(null);
    }
  };

  const onClearPredictionScreenshot = async (predictionId: string) => {
    try {
      await api.adminUpdatePrediction(predictionId, { result_screenshot: "" });
      notifySuccess(tx("Скрин удален", "Screenshot removed"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось удалить скрин", "Failed to remove screenshot")));
    }
  };

  const openPredictionCreate = () => {
    setPredictionDraft(createEmptyPredictionDraft());
    setPredictionSheetId(null);
    setPredictionSheetMode("create");
  };

  const openPredictionEdit = (item: Prediction) => {
    setPredictionDraft(createPredictionDraftFromItem(item));
    setPredictionSheetId(item.id);
    setPredictionSheetMode("edit");
  };

  const closePredictionSheet = () => {
    setPredictionSheetMode("closed");
    setPredictionSheetId(null);
    setPredictionSaving(false);
  };

  const onPredictionDraftScreenshotPick = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      notifyError(tx("Нужен файл изображения", "Please upload an image file"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      notifyError(tx("Скрин слишком большой (максимум 4MB)", "Image is too large (max 4MB)"));
      return;
    }
    try {
      const payload = await fileToDataUrl(file);
      setPredictionDraft((prev) => ({ ...prev, result_screenshot: payload }));
    } catch (e) {
      notifyError(textError(e, tx("Не удалось прочитать файл", "Failed to read file")));
    }
  };

  const onSavePredictionDraft = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const matchName = predictionDraft.match_name.trim();
    const signalType = predictionDraft.signal_type.trim();
    const eventStart = predictionDraft.event_start_at.trim();
    const odds = Number(predictionDraft.odds);

    if (!matchName || !signalType || !eventStart || !Number.isFinite(odds) || odds <= 1) {
      notifyError(tx("Заполните обязательные поля прогноза", "Fill required prediction fields"));
      return;
    }

    const description = composePredictionDescription(predictionDraft, isRu);
    const screenshot = predictionDraft.result_screenshot && predictionDraft.result_screenshot.trim() ? predictionDraft.result_screenshot : null;

    const payload = {
      title: predictionDraft.title.trim() || `${matchName} • ${signalType}`,
      match_name: matchName,
      league: predictionDraft.league.trim() || null,
      sport_type: predictionDraft.sport_type.trim() || "football",
      event_start_at: eventStart,
      signal_type: signalType,
      odds,
      short_description: description,
      result_screenshot: predictionSheetMode === "edit" ? screenshot || "" : screenshot,
      risk_level: predictionDraft.risk_level,
      access_level: predictionDraft.access_level,
      mode: predictionDraft.mode,
      status: predictionDraft.status,
      publish_now: true,
    };

    setPredictionSaving(true);
    try {
      if (predictionSheetMode === "create") {
        await api.adminCreatePrediction(payload);
        notifySuccess(tx("Прогноз создан", "Prediction created"));
      } else if (predictionSheetMode === "edit" && predictionSheetId) {
        await api.adminUpdatePrediction(predictionSheetId, payload);
        notifySuccess(tx("Прогноз обновлен", "Prediction updated"));
      }
      closePredictionSheet();
      await loadAll();
    } catch (err) {
      notifyError(textError(err, tx("Не удалось сохранить прогноз", "Failed to save prediction")));
    } finally {
      setPredictionSaving(false);
    }
  };

  const onUpdateRole = async (userId: string, role: "user" | "admin") => {
    try {
      await api.adminUpdateUserRole(userId, role);
      notifySuccess(role === "admin" ? tx("Права администратора выданы", "Admin permissions granted") : tx("Права администратора сняты", "Admin permissions revoked"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось изменить роль", "Failed to update role")));
    }
  };

  const onDeleteUser = async (userId: string) => {
    if (!window.confirm(tx("Удалить пользователя? Действие необратимо.", "Delete user? This action is irreversible."))) return;
    try {
      await api.adminDeleteUser(userId);
      notifySuccess(tx("Пользователь удален", "User deleted"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Удаление пользователя недоступно", "User deletion is unavailable")));
    }
  };

  const onSubAction = async (action: () => Promise<unknown>, success: string, fail: string) => {
    try {
      await action();
      notifySuccess(success);
      await loadAll();
    } catch (e) {
      notifyError(textError(e, fail));
    }
  };

  const onGrantSubscription = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminGrantSubscription({
        user_id: String(formData.get("user_id") || "").trim() || undefined,
        telegram_id: String(formData.get("telegram_id") || "").trim() ? Number(formData.get("telegram_id")) : undefined,
        tariff_code: String(formData.get("tariff_code") || "free") as "free" | "premium" | "vip",
        duration_days: Number(formData.get("duration_days") || 30),
      });
      notifySuccess(tx("Подписка выдана", "Subscription granted"));
      setShowGrantSubscriptionSheet(false);
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось выдать подписку", "Failed to grant subscription")));
    }
  };

  const onPaymentStatus = async (
    paymentId: string,
    status: "pending" | "pending_manual_review" | "requires_clarification" | "succeeded" | "failed" | "canceled",
    reviewComment?: string
  ) => {
    try {
      await api.adminUpdatePaymentStatus(paymentId, status, reviewComment);
      notifySuccess(tx("Статус платежа обновлен", "Payment status updated"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось обновить платеж", "Failed to update payment")));
    }
  };

  const openNewsCreate = () => {
    setNewsDraft(createEmptyNewsDraft());
    setNewsSheetId(null);
    setNewsSheetMode("create");
  };

  const openNewsEdit = (item: NewsPost) => {
    setNewsDraft(createNewsDraftFromItem(item));
    setNewsSheetId(item.id);
    setNewsSheetMode("edit");
  };

  const closeNewsSheet = () => {
    setNewsSheetMode("closed");
    setNewsSheetId(null);
    setNewsSaving(false);
  };

  const onSaveNewsDraft = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = newsDraft.title.trim();
    const body = joinNewsPreviewAndBody(newsDraft.preview, newsDraft.body);
    if (!title || !body.trim()) {
      notifyError(tx("Заполните заголовок и текст", "Fill title and text"));
      return;
    }

    setNewsSaving(true);
    try {
      if (newsSheetMode === "create") {
        await api.adminCreateNews({
          title,
          body,
          category: newsDraft.category.trim() || "news",
          is_published: newsDraft.is_published,
        });
        notifySuccess(tx("Новость добавлена", "News post created"));
      } else if (newsSheetMode === "edit" && newsSheetId) {
        await api.adminUpdateNews(newsSheetId, {
          title,
          body,
          category: newsDraft.category.trim() || "news",
          is_published: newsDraft.is_published,
        });
        notifySuccess(tx("Новость обновлена", "News post updated"));
      }
      closeNewsSheet();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось сохранить новость", "Failed to save news")));
    } finally {
      setNewsSaving(false);
    }
  };

  const onToggleNews = async (item: NewsPost) => {
    try {
      await api.adminUpdateNews(item.id, { is_published: !item.is_published });
      notifySuccess(item.is_published ? tx("Новость снята с публикации", "News post unpublished") : tx("Новость опубликована", "News post published"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось обновить новость", "Failed to update news post")));
    }
  };

  const onDeleteNews = async (newsId: string) => {
    if (!window.confirm(tx("Удалить новость?", "Delete news post?"))) return;
    try {
      await api.adminDeleteNews(newsId);
      notifySuccess(tx("Новость удалена", "News post deleted"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось удалить новость", "Failed to delete news post")));
    }
  };

  const openPromoCreate = () => {
    setPromoDraft(createEmptyPromoDraft());
    setPromoSheetId(null);
    setPromoSheetMode("create");
  };

  const openPromoEdit = (item: AdminPromoCode) => {
    setPromoDraft(createPromoDraftFromItem(item));
    setPromoSheetId(item.id);
    setPromoSheetMode("edit");
  };

  const closePromoSheet = () => {
    setPromoSheetMode("closed");
    setPromoSheetId(null);
    setPromoSaving(false);
  };

  const onSavePromoDraft = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const title = promoDraft.title.trim();
    const value = Number(promoDraft.value);
    if (!title || !Number.isFinite(value) || value < 0) {
      notifyError(tx("Проверьте поля промокода", "Check promo code fields"));
      return;
    }

    setPromoSaving(true);
    try {
      if (promoSheetMode === "create") {
        const code = promoDraft.code.trim();
        if (!code) {
          notifyError(tx("Укажите код промокода", "Provide promo code"));
          setPromoSaving(false);
          return;
        }
        await api.adminCreatePromoCode({
          code,
          title,
          description: promoDraft.description.trim() || undefined,
          kind: promoDraft.kind,
          value,
          tariff_code: (promoDraft.tariff_code || undefined) as "free" | "premium" | "vip" | undefined,
          max_activations: promoDraft.max_activations.trim() ? Number(promoDraft.max_activations) : undefined,
          expires_at: promoDraft.expires_at ? new Date(promoDraft.expires_at).toISOString() : undefined,
          is_active: promoDraft.is_active,
        });
        notifySuccess(tx("Промокод добавлен", "Promo code created"));
      } else if (promoSheetMode === "edit" && promoSheetId) {
        await api.adminUpdatePromoCode(promoSheetId, {
          title,
          description: promoDraft.description.trim() || undefined,
          kind: promoDraft.kind,
          value,
          tariff_code: (promoDraft.tariff_code || undefined) as "free" | "premium" | "vip" | undefined,
          max_activations: promoDraft.max_activations.trim() ? Number(promoDraft.max_activations) : undefined,
          expires_at: promoDraft.expires_at ? new Date(promoDraft.expires_at).toISOString() : undefined,
          is_active: promoDraft.is_active,
        });
        notifySuccess(tx("Промокод обновлен", "Promo code updated"));
      }
      closePromoSheet();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось сохранить промокод", "Failed to save promo code")));
    } finally {
      setPromoSaving(false);
    }
  };

  const onTogglePromo = async (item: AdminPromoCode) => {
    try {
      await api.adminUpdatePromoCode(item.id, { is_active: !item.is_active });
      notifySuccess(item.is_active ? tx("Промокод отключен", "Promo code disabled") : tx("Промокод активирован", "Promo code enabled"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось обновить промокод", "Failed to update promo code")));
    }
  };

  const onDeletePromo = async (id: string) => {
    if (!window.confirm(tx("Удалить промокод?", "Delete promo code?"))) return;
    try {
      await api.adminDeletePromoCode(id);
      notifySuccess(tx("Промокод удален", "Promo code deleted"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось удалить промокод", "Failed to delete promo code")));
    }
  };

  const openMethodCreate = () => {
    setMethodDraft(createEmptyPaymentMethodDraft());
    setMethodSheetId(null);
    setMethodSheetMode("create");
  };

  const openMethodEdit = (item: PaymentMethod) => {
    setMethodDraft(createPaymentMethodDraftFromItem(item));
    setMethodSheetId(item.code);
    setMethodSheetMode("edit");
  };

  const closeMethodSheet = () => {
    setMethodSheetMode("closed");
    setMethodSheetId(null);
    setMethodSaving(false);
  };

  const onSaveMethodDraft = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const code = methodDraft.code.trim();
    const name = methodDraft.name.trim();
    if (!code || !name) {
      notifyError(tx("Заполните код и название метода", "Fill method code and name"));
      return;
    }

    const payload: PaymentMethod = {
      code,
      name,
      method_type: methodDraft.method_type,
      is_active: methodDraft.is_active,
      sort_order: Number(methodDraft.sort_order) || 100,
      card_number: methodDraft.card_number.trim() || null,
      recipient_name: methodDraft.recipient_name.trim() || null,
      payment_details: methodDraft.payment_details.trim() || null,
      instructions: methodDraft.instructions.trim() || null,
    };

    setMethodSaving(true);
    try {
      if (methodSheetMode === "create") {
        await api.adminCreatePaymentMethod(payload);
        notifySuccess(tx("Метод оплаты создан", "Payment method created"));
      } else if (methodSheetMode === "edit" && methodSheetId) {
        await api.adminUpdatePaymentMethod(methodSheetId, {
          name: payload.name,
          method_type: payload.method_type,
          is_active: payload.is_active,
          sort_order: payload.sort_order,
          card_number: payload.card_number,
          recipient_name: payload.recipient_name,
          payment_details: payload.payment_details,
          instructions: payload.instructions,
        });
        notifySuccess(tx("Метод оплаты обновлен", "Payment method updated"));
      }
      closeMethodSheet();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось сохранить метод оплаты", "Failed to save payment method")));
    } finally {
      setMethodSaving(false);
    }
  };

  const onDirectMessageUser = async (user: AdminUser) => {
    const text = window.prompt(tx(`Сообщение для @${user.username || user.telegram_id}:`, `Message for @${user.username || user.telegram_id}:`));
    if (!text || !text.trim()) return;

    const buttonTextRaw = window.prompt(tx("Текст кнопки (опционально):", "Button text (optional):")) || "";
    const buttonText = buttonTextRaw.trim();
    let buttonUrl: string | undefined;
    if (buttonText) {
      const buttonUrlRaw = window.prompt(tx("Ссылка кнопки (https://...):", "Button URL (https://...):")) || "";
      if (!buttonUrlRaw.trim()) {
        notifyError(tx("Чтобы отправить кнопку, укажите ссылку", "Provide a URL to send a button"));
        return;
      }
      buttonUrl = buttonUrlRaw.trim();
    }

    try {
      const result = await api.adminDirectSend({
        title: tx("Сообщение от PIT BET", "Message from PIT BET"),
        message: text.trim(),
        user_id: user.id,
        button_text: buttonText || undefined,
        button_url: buttonUrl,
      });
      if (result.queued > 0) {
        notifySuccess(tx("Личное сообщение поставлено в очередь", "Direct message queued"));
      } else {
        notifyError(tx("Не удалось поставить сообщение в очередь", "Failed to queue direct message"));
      }
    } catch (e) {
      notifyError(textError(e, tx("Ошибка отправки личного сообщения", "Failed to send direct message")));
    }
  };

  const onCampaignPreview = async () => {
    const buttonText = campaignButtonText.trim();
    const buttonUrl = campaignButtonUrl.trim();
    if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
      notifyError(tx("Для кнопки укажите и текст, и ссылку", "For button, provide both text and URL"));
      return;
    }

    try {
      const preview = await api.adminCampaignPreview({
        segment: campaignSegment,
        access_level: campaignAccess === "all" ? undefined : campaignAccess,
        notifications_enabled_only: campaignNotifOnly,
        title: campaignTitle.trim() || undefined,
        message: campaignMessage.trim() || undefined,
        button_text: buttonText || undefined,
        button_url: buttonUrl || undefined,
      });
      setCampaignPreviewCount(preview.count);
      setCampaignPreviewPayload(preview.preview || null);
      notifyInfo(tx(`Найдено получателей: ${preview.count}`, `Recipients found: ${preview.count}`));
    } catch (e) {
      notifyError(textError(e, tx("Не удалось сделать превью рассылки", "Failed to preview campaign")));
    }
  };

  const onCampaignSend = async () => {
    if (!campaignTitle.trim() || !campaignMessage.trim()) {
      notifyError(tx("Заполните заголовок и текст рассылки", "Fill campaign title and message"));
      return;
    }
    const buttonText = campaignButtonText.trim();
    const buttonUrl = campaignButtonUrl.trim();
    if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
      notifyError(tx("Для кнопки укажите и текст, и ссылку", "For button, provide both text and URL"));
      return;
    }
    if (!window.confirm(tx("Подтвердить массовую рассылку?", "Confirm mass campaign send?"))) return;
    try {
      const result = await api.adminCampaignSend({
        title: campaignTitle.trim(),
        message: campaignMessage.trim(),
        segment: campaignSegment,
        access_level: campaignAccess === "all" ? undefined : campaignAccess,
        notifications_enabled_only: campaignNotifOnly,
        button_text: buttonText || undefined,
        button_url: buttonUrl || undefined,
      });
      notifySuccess(tx(`Рассылка поставлена в очередь: ${result.queued}`, `Campaign queued: ${result.queued}`));
      setCampaignTitle("");
      setCampaignMessage("");
      setCampaignButtonText("");
      setCampaignButtonUrl("");
      setCampaignPreviewCount(null);
      setCampaignPreviewPayload(null);
    } catch (e) {
      notifyError(textError(e, tx("Не удалось запустить рассылку", "Failed to start campaign")));
    }
  };

  if (isAdmin === false) {
    return (
      <Layout>
        <section className="card">
          <h2>{tx("Админка", "Admin")}</h2>
          <p className="empty-state">{tx("Доступ открыт только администраторам.", "Access is available to admins only.")}</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="card pb-admin-shell pb-admin-mobile">
        <div className="section-head">
          <h2>{tx("Админка PIT BET", "PIT BET admin panel")}</h2>
          <span className="muted">{tx("Мобильная control panel для контента, пользователей и платежей", "Mobile control panel for content, users, and payments")}</span>
        </div>

        <div className="admin-tabs-wrap admin-tabs-mobile">
          <div className="admin-tabs" role="tablist" aria-label={tx("Разделы админки", "Admin sections")}>
            {TABS.map((item) => (
              <button type="button" key={item.key} className={tab === item.key ? "tab active" : "tab"} onClick={() => setTab(item.key)}>
                {isRu ? item.ru : item.en}
              </button>
            ))}
          </div>
        </div>

        {message ? <p className={`notice admin-toast ${messageTone}`}>{message}</p> : null}
        {loading ? <p className="muted">{tx("Обновляем данные...", "Refreshing data...")}</p> : null}

        {tab === "predictions" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <button className="btn" type="button" onClick={openPredictionCreate}>
                  {tx("Добавить прогноз", "Add prediction")}
                </button>
                <button className="btn ghost" type="button" onClick={() => void refreshAll()}>
                  {tx("Обновить", "Refresh")}
                </button>
                <span className="admin-count-chip">{visiblePredictions.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={predQuery} onChange={(e) => setPredQuery(e.target.value)} placeholder={tx("Поиск: матч, спорт, дата", "Search: match, sport, date")} />
                <select value={predStatusFilter} onChange={(e) => setPredStatusFilter(e.target.value as PredictionStatusFilter)}>
                  <option value="all">{tx("Все статусы", "All statuses")}</option>
                  <option value="pending">{tx("В ожидании", "Pending")}</option>
                  <option value="won">{tx("Выигрыш", "Won")}</option>
                  <option value="lost">{tx("Проигрыш", "Lost")}</option>
                  <option value="refund">{tx("Возврат", "Refund")}</option>
                </select>
                <select value={predAccessFilter} onChange={(e) => setPredAccessFilter(e.target.value as AccessFilter)}>
                  <option value="all">{tx("Любой доступ", "Any access")}</option>
                  <option value="free">{tx("Бесплатный", "Free")}</option>
                  <option value="premium">{tx("Премиум", "Premium")}</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visiblePredictions.map((item) => (
                <article key={item.id} className="prediction-card admin-item admin-card-compact">
                  <div className="prediction-top admin-card-title-row">
                    <strong>{item.match_name}</strong>
                    <span className={`access-pill ${item.access_level}`}>{accessLabel(item.access_level, language)}</span>
                  </div>
                  <p className="muted admin-card-sub">
                    {item.league || tx("Без лиги", "No league")} • {item.sport_type} • {formatDateTime(item.event_start_at, isRu)}
                  </p>
                  <div className="admin-meta-row">
                    <span>{tx("кф", "odds")} {item.odds}</span>
                    <span>{item.mode === "live" ? tx("Лайв", "Live") : tx("Прематч", "Prematch")}</span>
                    <span>{item.signal_type}</span>
                    <span className={`badge ${item.status}`}>{statusLabel(item.status, language)}</span>
                  </div>

                  {item.result_screenshot ? (
                    <div className="admin-mini-shot">
                      <img src={item.result_screenshot} alt={tx("Скрин результата", "Result screenshot")} loading="lazy" />
                    </div>
                  ) : null}

                  <div className="admin-quick-actions">
                    <button className="btn ghost" type="button" onClick={() => openPredictionEdit(item)}>
                      {tx("Редактировать", "Edit")}
                    </button>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => setPredictionStatusPanelId((prev) => (prev === item.id ? null : item.id))}
                    >
                      {tx("Статус", "Status")}
                    </button>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => setPredictionScreenshotPanelId((prev) => (prev === item.id ? null : item.id))}
                    >
                      {tx("Скрин", "Screenshot")}
                    </button>
                    <button className="btn danger" type="button" onClick={() => onDeletePrediction(item.id)}>
                      {tx("Удалить", "Delete")}
                    </button>
                  </div>

                  {predictionStatusPanelId === item.id ? (
                    <div className="admin-status-switch">
                      <button className={item.status === "pending" ? "active" : ""} type="button" onClick={() => void onUpdatePrediction(item.id, { status: "pending" })}>
                        {tx("В ожидании", "Pending")}
                      </button>
                      <button className={item.status === "won" ? "active" : ""} type="button" onClick={() => void onUpdatePrediction(item.id, { status: "won" })}>
                        {tx("Выигрыш", "Won")}
                      </button>
                      <button className={item.status === "lost" ? "active" : ""} type="button" onClick={() => void onUpdatePrediction(item.id, { status: "lost" })}>
                        {tx("Проигрыш", "Lost")}
                      </button>
                      <button className={item.status === "refund" ? "active" : ""} type="button" onClick={() => void onUpdatePrediction(item.id, { status: "refund" })}>
                        {tx("Возврат", "Refund")}
                      </button>
                    </div>
                  ) : null}

                  {predictionScreenshotPanelId === item.id ? (
                    <div className="admin-shot-panel">
                      {item.result_screenshot ? (
                        <div className="admin-image-preview compact">
                          <img src={item.result_screenshot} alt={tx("Скрин результата", "Result screenshot")} loading="lazy" />
                        </div>
                      ) : (
                        <p className="muted">{tx("Скрин пока не загружен", "No screenshot uploaded yet")}</p>
                      )}
                      <div className="admin-shot-actions-row">
                        <label className="btn ghost admin-file-btn">
                          {uploadingPredictionId === item.id ? tx("Загрузка...", "Uploading...") : item.result_screenshot ? tx("Заменить", "Replace") : tx("Загрузить", "Upload")}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0];
                              if (!file) return;
                              void onUploadPredictionScreenshot(item.id, file);
                              e.currentTarget.value = "";
                            }}
                            disabled={uploadingPredictionId === item.id}
                          />
                        </label>
                        <button className="btn ghost" type="button" disabled={!item.result_screenshot} onClick={() => void onClearPredictionScreenshot(item.id)}>
                          {tx("Удалить", "Delete")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "users" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <span className="admin-count-chip">{visibleUsers.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={usersQuery} onChange={(e) => setUsersQuery(e.target.value)} placeholder={tx("Поиск: имя, username, telegram id", "Search: name, username, telegram id")} />
                <select value={usersRoleFilter} onChange={(e) => setUsersRoleFilter(e.target.value)}>
                  <option value="all">{tx("Все роли", "All roles")}</option>
                  <option value="user">{tx("Пользователь", "User")}</option>
                  <option value="admin">{tx("Администратор", "Admin")}</option>
                </select>
                <select value={usersTariffFilter} onChange={(e) => setUsersTariffFilter(e.target.value as "all" | "free" | "premium" | "vip")}>
                  <option value="all">{tx("Все тарифы", "All plans")}</option>
                  <option value="free">{tx("Бесплатный", "Free")}</option>
                  <option value="premium">{tx("Премиум", "Premium")}</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visibleUsers.map((user) => {
                const latestSub = latestSubscriptionByUser.get(user.id);
                return (
                  <article key={user.id} className="prediction-card admin-item admin-card-compact">
                    <div className="prediction-top admin-card-title-row">
                      <strong>{user.first_name || tx("Без имени", "No name")}</strong>
                      <span className={user.role === "admin" ? "badge success" : "badge"}>{user.role === "admin" ? tx("админ", "admin") : tx("user", "user")}</span>
                    </div>
                    <p className="muted admin-card-sub">@{user.username || "-"} • tg: {user.telegram_id}</p>
                    <div className="admin-meta-row">
                      <span>{tx("Тариф", "Plan")}: {accessLabel(user.tariff, language)}</span>
                      <span>{tx("Доступ до", "Access until")}: {formatDateTime(user.subscription_ends_at, isRu)}</span>
                    </div>
                    <p className="muted">
                      {tx("Рефералы", "Referrals")}: {user.referrals_invited ?? 0}/{user.referrals_activated ?? 0} • {tx("Бонус", "Bonus")}: {user.referral_bonus_days ?? 0}
                    </p>

                    <div className="admin-quick-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() =>
                          void onSubAction(
                            () => api.adminGrantSubscription({ user_id: user.id, tariff_code: "premium", duration_days: 30 }),
                            tx("Премиум выдан", "Premium granted"),
                            tx("Не удалось выдать Премиум", "Failed to grant Premium")
                          )
                        }
                      >
                        {tx("Premium", "Premium")}
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() =>
                          void onSubAction(
                            () => api.adminGrantSubscription({ user_id: user.id, tariff_code: "vip", duration_days: 30 }),
                            tx("VIP выдан", "VIP granted"),
                            tx("Не удалось выдать VIP", "Failed to grant VIP")
                          )
                        }
                      >
                        VIP
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        disabled={!latestSub}
                        onClick={() =>
                          latestSub
                            ? void onSubAction(
                                () => api.adminExtendSubscription(latestSub.id, 30),
                                tx("Подписка продлена +30", "Subscription extended +30"),
                                tx("Не удалось продлить", "Failed to extend")
                              )
                            : undefined
                        }
                      >
                        {tx("+30 дней", "+30 days")}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => void onDirectMessageUser(user)}>
                        {tx("Сообщение", "Message")}
                      </button>
                    </div>

                    <div className="admin-quick-actions">
                      {user.role === "admin" ? (
                        <button className="btn" type="button" onClick={() => void onUpdateRole(user.id, "user")}>
                          {tx("Снять админку", "Revoke admin")}
                        </button>
                      ) : (
                        <button className="btn" type="button" onClick={() => void onUpdateRole(user.id, "admin")}>
                          {tx("Выдать админку", "Grant admin")}
                        </button>
                      )}
                      <button
                        className="btn danger"
                        type="button"
                        disabled={!latestSub}
                        onClick={() =>
                          latestSub
                            ? void onSubAction(
                                () => api.adminCancelSubscription(latestSub.id),
                                tx("Подписка отменена", "Subscription canceled"),
                                tx("Не удалось отменить", "Failed to cancel")
                              )
                            : undefined
                        }
                      >
                        {tx("Отменить подписку", "Cancel subscription")}
                      </button>
                      <button className="btn danger" type="button" onClick={() => void onDeleteUser(user.id)}>
                        {tx("Удалить", "Delete")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "subscriptions" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <button className="btn" type="button" onClick={() => setShowGrantSubscriptionSheet(true)}>
                  {tx("Выдать подписку", "Grant subscription")}
                </button>
                <span className="admin-count-chip">{visibleSubscriptions.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={subQuery} onChange={(e) => setSubQuery(e.target.value)} placeholder={tx("Поиск: пользователь, telegram id", "Search: user, telegram id")} />
                <select value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value)}>
                  <option value="all">{tx("Все статусы", "All statuses")}</option>
                  <option value="active">{tx("Активна", "Active")}</option>
                  <option value="expired">{tx("Истекла", "Expired")}</option>
                  <option value="canceled">{tx("Отменена", "Canceled")}</option>
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visibleSubscriptions.map((sub) => (
                <article key={sub.id} className="prediction-card admin-item admin-card-compact">
                  <div className="prediction-top admin-card-title-row">
                    <strong>@{sub.username || sub.telegram_id}</strong>
                    <span className={`access-pill ${sub.tariff_code}`}>{accessLabel(sub.tariff_code, language)}</span>
                  </div>
                  <p className="muted admin-card-sub">{statusLabel(sub.status, language)} • {tx("до", "until")} {formatDateTime(sub.ends_at, isRu)}</p>
                  <div className="admin-quick-actions">
                    <button className="btn ghost" type="button" onClick={() => void onSubAction(() => api.adminExtendSubscription(sub.id, 7), tx("+7 дней", "+7 days"), tx("Не удалось продлить", "Failed to extend"))}>
                      +7
                    </button>
                    <button className="btn ghost" type="button" onClick={() => void onSubAction(() => api.adminExtendSubscription(sub.id, 30), tx("+30 дней", "+30 days"), tx("Не удалось продлить", "Failed to extend"))}>
                      +30
                    </button>
                    <button className="btn" type="button" onClick={() => void onSubAction(() => api.adminChangeSubscriptionTariff(sub.id, { tariff_code: "premium" }), tx("Тариф -> Премиум", "Tariff -> Premium"), tx("Не удалось сменить тариф", "Failed to switch tariff"))}>
                      {tx("На Premium", "To Premium")}
                    </button>
                    <button className="btn" type="button" onClick={() => void onSubAction(() => api.adminChangeSubscriptionTariff(sub.id, { tariff_code: "vip" }), tx("Тариф -> VIP", "Tariff -> VIP"), tx("Не удалось сменить тариф", "Failed to switch tariff"))}>
                      VIP
                    </button>
                    <button className="btn danger" type="button" onClick={() => void onSubAction(() => api.adminCancelSubscription(sub.id), tx("Подписка отменена", "Subscription canceled"), tx("Не удалось отменить", "Failed to cancel"))}>
                      {tx("Отменить", "Cancel")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "payments" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <span className="admin-count-chip">{visiblePayments.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={paymentQuery} onChange={(e) => setPaymentQuery(e.target.value)} placeholder={tx("Поиск: пользователь, order id", "Search: user, order id")} />
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                  <option value="all">{tx("Все статусы", "All statuses")}</option>
                  <option value="pending">{tx("В ожидании", "Pending")}</option>
                  <option value="pending_manual_review">{tx("На проверке", "Manual review")}</option>
                  <option value="requires_clarification">{tx("Нужно уточнение", "Needs clarification")}</option>
                  <option value="succeeded">{tx("Подтвержден", "Approved")}</option>
                  <option value="failed">{tx("Отклонен", "Rejected")}</option>
                  <option value="canceled">{tx("Отменен", "Canceled")}</option>
                </select>
                <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                  <option value="all">{tx("Все методы", "All methods")}</option>
                  {paymentMethods.map((method) => (
                    <option key={method.code} value={method.code}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visiblePayments.map((payment) => {
                const proof = (payment.manual_proof || "").trim();
                return (
                  <article key={payment.id} className="prediction-card admin-item admin-card-compact">
                    <div className="prediction-top admin-card-title-row">
                      <strong>@{payment.username || payment.telegram_id}</strong>
                      <span className={`badge ${payment.status}`}>{statusLabel(payment.status, language)}</span>
                    </div>
                    <div className="admin-meta-row">
                      <span>{accessLabel(payment.access_level, language)}</span>
                      <span>{payment.duration_days} {tx("дней", "days")}</span>
                      <span>{payment.amount_rub} RUB</span>
                    </div>
                    <p className="muted admin-card-sub">{tx("Метод", "Method")}: {payment.method_name || payment.method_code || "-"} • {formatDateTime(payment.created_at, isRu)}</p>
                    {payment.manual_note ? <p className="stacked">{tx("Комментарий", "Comment")}: {toShortText(payment.manual_note, 140)}</p> : null}
                    {payment.review_comment ? <p className="stacked">{tx("Комментарий админа", "Admin comment")}: {toShortText(payment.review_comment, 140)}</p> : null}
                    {proof ? (
                      <div className="admin-proof-block">
                        <a href={proof} target="_blank" rel="noreferrer" className="admin-proof-link">
                          {tx("Открыть подтверждение", "Open proof")}
                        </a>
                        {proofLooksLikeImage(proof) ? <img src={proof} alt={tx("Подтверждение платежа", "Payment proof")} loading="lazy" className="admin-proof-image" /> : null}
                      </div>
                    ) : null}

                    <div className="admin-quick-actions three">
                      <button className="btn" type="button" onClick={() => void onPaymentStatus(payment.id, "succeeded")}>
                        {tx("Подтвердить", "Approve")}
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                          const comment = window.prompt(tx("Что нужно уточнить у пользователя?", "What should be clarified with user?")) || "";
                          if (!comment.trim()) return;
                          void onPaymentStatus(payment.id, "requires_clarification", comment.trim());
                        }}
                      >
                        {tx("Уточнить", "Clarify")}
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => {
                          const reason = window.prompt(tx("Причина отклонения", "Rejection reason")) || "";
                          void onPaymentStatus(payment.id, "failed", reason.trim() || undefined);
                        }}
                      >
                        {tx("Отклонить", "Reject")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "payment_methods" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <button className="btn" type="button" onClick={openMethodCreate}>
                  {tx("Добавить метод", "Add method")}
                </button>
                <span className="admin-count-chip">{visiblePaymentMethods.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={methodQuery} onChange={(e) => setMethodQuery(e.target.value)} placeholder={tx("Поиск: код, название", "Search: code, name")} />
                <select value={methodStatusFilter} onChange={(e) => setMethodStatusFilter(e.target.value as MethodFilter)}>
                  <option value="all">{tx("Все", "All")}</option>
                  <option value="active">{tx("Активные", "Active")}</option>
                  <option value="inactive">{tx("Неактивные", "Inactive")}</option>
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visiblePaymentMethods.map((method) => (
                <article key={method.code} className="prediction-card admin-item admin-card-compact">
                  <div className="prediction-top admin-card-title-row">
                    <strong>{method.name}</strong>
                    <span className={`badge ${method.is_active ? "success" : "failed"}`}>{method.is_active ? tx("Активен", "Active") : tx("Неактивен", "Inactive")}</span>
                  </div>
                  <p className="muted admin-card-sub">{method.code} • {method.method_type === "manual" ? tx("Ручной", "Manual") : tx("Авто", "Auto")}</p>
                  {method.card_number ? <p className="muted">{tx("Карта", "Card")}: {method.card_number}</p> : null}
                  {method.recipient_name ? <p className="muted">{tx("Получатель", "Recipient")}: {method.recipient_name}</p> : null}
                  {method.instructions ? <p className="stacked">{toShortText(method.instructions, 150)}</p> : null}
                  <div className="admin-quick-actions">
                    <button className="btn ghost" type="button" onClick={() => openMethodEdit(method)}>
                      {tx("Редактировать", "Edit")}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() =>
                        void onSubAction(
                          () => api.adminUpdatePaymentMethod(method.code, { is_active: !method.is_active }),
                          method.is_active ? tx("Метод отключен", "Method disabled") : tx("Метод включен", "Method enabled"),
                          tx("Не удалось обновить метод", "Failed to update method")
                        )
                      }
                    >
                      {method.is_active ? tx("Отключить", "Disable") : tx("Включить", "Enable")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "news" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <button className="btn" type="button" onClick={openNewsCreate}>
                  {tx("Добавить новость", "Add news")}
                </button>
                <span className="admin-count-chip">{visibleNews.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={newsQuery} onChange={(e) => setNewsQuery(e.target.value)} placeholder={tx("Поиск по новостям", "Search news")} />
                <select value={newsStatusFilter} onChange={(e) => setNewsStatusFilter(e.target.value as NewsFilter)}>
                  <option value="all">{tx("Все", "All")}</option>
                  <option value="published">{tx("Опубликованные", "Published")}</option>
                  <option value="draft">{tx("Черновики", "Drafts")}</option>
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visibleNews.map((item) => {
                const parsed = extractNewsPreviewAndBody(item.body || "");
                return (
                  <article key={item.id} className="prediction-card admin-item admin-card-compact">
                    <div className="prediction-top admin-card-title-row">
                      <strong>{item.title}</strong>
                      <span className={`badge ${item.is_published ? "success" : "pending"}`}>{item.is_published ? tx("Опубликовано", "Published") : tx("Черновик", "Draft")}</span>
                    </div>
                    <p className="muted admin-card-sub">{formatDateTime(item.published_at, isRu)}</p>
                    <p className="stacked">{toShortText(parsed.preview || item.body, 180)}</p>
                    <div className="admin-quick-actions">
                      <button className="btn ghost" type="button" onClick={() => openNewsEdit(item)}>
                        {tx("Редактировать", "Edit")}
                      </button>
                      <button className="btn" type="button" onClick={() => void onToggleNews(item)}>
                        {item.is_published ? tx("Снять", "Unpublish") : tx("Опубликовать", "Publish")}
                      </button>
                      <button className="btn danger" type="button" onClick={() => void onDeleteNews(item.id)}>
                        {tx("Удалить", "Delete")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "promocodes" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <button className="btn" type="button" onClick={openPromoCreate}>
                  {tx("Создать промокод", "Create promo code")}
                </button>
                <span className="admin-count-chip">{visiblePromos.length}</span>
              </div>
              <div className="admin-control-grid">
                <input value={promoQuery} onChange={(e) => setPromoQuery(e.target.value)} placeholder={tx("Поиск: код или название", "Search: code or title")} />
                <select value={promoStatusFilter} onChange={(e) => setPromoStatusFilter(e.target.value as PromoFilter)}>
                  <option value="all">{tx("Все", "All")}</option>
                  <option value="active">{tx("Активные", "Active")}</option>
                  <option value="inactive">{tx("Неактивные", "Inactive")}</option>
                </select>
              </div>
            </div>

            <div className="admin-list admin-list-compact">
              {visiblePromos.map((promo) => (
                <article key={promo.id} className="prediction-card admin-item admin-card-compact">
                  <div className="prediction-top admin-card-title-row">
                    <strong>{promo.code}</strong>
                    <span className={`badge ${promo.is_active ? "success" : "lost"}`}>{promo.is_active ? tx("Активен", "Active") : tx("Отключен", "Inactive")}</span>
                  </div>
                  <p className="muted admin-card-sub">{promo.title}</p>
                  <div className="admin-meta-row">
                    <span>{promo.kind}</span>
                    <span>{tx("значение", "value")}: {promo.value}</span>
                    <span>{tx("действует до", "valid until")}: {promo.expires_at ? formatDateTime(promo.expires_at, isRu) : tx("без срока", "no limit")}</span>
                  </div>
                  <p className="muted">{tx("Активации", "Activations")}: {promo.activations}{promo.max_activations ? `/${promo.max_activations}` : ""}</p>
                  <div className="admin-quick-actions">
                    <button className="btn ghost" type="button" onClick={() => openPromoEdit(promo)}>
                      {tx("Редактировать", "Edit")}
                    </button>
                    <button className="btn" type="button" onClick={() => void onTogglePromo(promo)}>
                      {promo.is_active ? tx("Деактивировать", "Deactivate") : tx("Активировать", "Activate")}
                    </button>
                    <button className="btn danger" type="button" onClick={() => void onDeletePromo(promo.id)}>
                      {tx("Удалить", "Delete")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "broadcasts" ? (
          <div className="admin-panel">
            <div className="admin-control-bar">
              <div className="admin-control-top">
                <span className="admin-count-chip">{campaignPreviewCount ?? "-"}</span>
              </div>
              <div className="admin-control-grid">
                <select value={campaignSegment} onChange={(e) => setCampaignSegment(e.target.value)}>
                  <option value="all">{tx("Все пользователи", "All users")}</option>
                  <option value="free">{tx("Только free", "Free only")}</option>
                  <option value="premium">{tx("Только Premium", "Premium only")}</option>
                  <option value="vip">{tx("Только VIP", "VIP only")}</option>
                  <option value="active_subscription">{tx("С активной подпиской", "Active subscription")}</option>
                  <option value="admin">{tx("Только админы", "Admins only")}</option>
                  <option value="notifications_enabled">{tx("Только с уведомлениями", "Notifications enabled")}</option>
                </select>
                <select value={campaignAccess} onChange={(e) => setCampaignAccess(e.target.value)}>
                  <option value="all">{tx("Любой доступ", "Any access")}</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            <div className="admin-form admin-broadcast-form admin-broadcast-compact">
              <input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder={tx("Заголовок рассылки", "Campaign title")} />
              <textarea value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} rows={4} placeholder={tx("Текст сообщения", "Message text")} />

              <label className="switch-row" style={{ padding: "0 4px" }}>
                <span>{tx("Только с включенными уведомлениями", "Notifications enabled only")}</span>
                <input type="checkbox" checked={campaignNotifOnly} onChange={(e) => setCampaignNotifOnly(e.target.checked)} />
              </label>

              <details className="admin-collapsible inline">
                <summary>{tx("Кнопка в сообщении (опционально)", "Message button (optional)")}</summary>
                <div className="admin-grid-2">
                  <input value={campaignButtonText} onChange={(e) => setCampaignButtonText(e.target.value)} placeholder={tx("Текст кнопки", "Button text")} />
                  <input value={campaignButtonUrl} onChange={(e) => setCampaignButtonUrl(e.target.value)} placeholder={tx("Ссылка кнопки https://...", "Button URL https://...")} />
                </div>
              </details>

              <div className="admin-quick-actions three">
                <button className="btn ghost" type="button" onClick={() => void onCampaignPreview()}>
                  {tx("Превью аудитории", "Audience preview")}
                </button>
                <button className="btn" type="button" onClick={() => void onCampaignSend()}>
                  {tx("Отправить рассылку", "Send campaign")}
                </button>
              </div>

              {campaignPreviewCount !== null ? <p className="muted">{tx("Получателей", "Recipients")}: {campaignPreviewCount}</p> : null}
              {campaignPreviewPayload ? (
                <div className="card-lite">
                  <p className="stacked"><b>{tx("Предпросмотр", "Preview")}</b></p>
                  <p className="stacked"><b>{campaignPreviewPayload.title || tx("Без заголовка", "No title")}</b></p>
                  <p className="stacked">{campaignPreviewPayload.message || ""}</p>
                  {campaignPreviewPayload.button_text && campaignPreviewPayload.button_url ? (
                    <p className="stacked">{tx("Кнопка", "Button")}: <b>{campaignPreviewPayload.button_text}</b> ({campaignPreviewPayload.button_url})</p>
                  ) : (
                    <p className="stacked muted">{tx("Без кнопки", "No button")}</p>
                  )}
                </div>
              ) : null}
              {deliveryStats ? (
                <p className="muted">
                  {tx("Доставка", "Delivery")}: {tx("всего", "total")} {deliveryStats.total} • {tx("отправлено", "sent")} {deliveryStats.sent} • {tx("ошибок", "failed")} {deliveryStats.failed} • {tx("в очереди", "queued")} {deliveryStats.queued}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "events" ? (
          <div className="admin-panel">
            <div className="metrics-grid">
              <article>
                <span>{tx("Пользователи", "Users")}</span>
                <strong>{stats?.users_total ?? 0}</strong>
              </article>
              <article>
                <span>{tx("Активные подписки", "Active subscriptions")}</span>
                <strong>{stats?.active_subscriptions ?? 0}</strong>
              </article>
              <article>
                <span>{tx("Прогнозов", "Predictions")}</span>
                <strong>{stats?.predictions_total ?? 0}</strong>
              </article>
              <article>
                <span>{tx("Точность / ROI", "Hit rate / ROI")}</span>
                <strong>{stats?.hit_rate ?? 0}% / {stats?.roi ?? 0}%</strong>
              </article>
            </div>
            <div className="admin-grid-3">
              <div className="card-lite">{tx("Бесплатный", "Free")}: {stats?.users_by_access?.free ?? 0}</div>
              <div className="card-lite">{tx("Премиум", "Premium")}: {stats?.users_by_access?.premium ?? 0}</div>
              <div className="card-lite">VIP: {stats?.users_by_access?.vip ?? 0}</div>
            </div>
            <div className="admin-grid-4">
              <div className="card-lite">{tx("В ожидании", "Pending")}: {stats?.predictions_by_status?.pending ?? 0}</div>
              <div className="card-lite">{tx("Выигрыш", "Won")}: {stats?.predictions_by_status?.won ?? 0}</div>
              <div className="card-lite">{tx("Проигрыш", "Lost")}: {stats?.predictions_by_status?.lost ?? 0}</div>
              <div className="card-lite">{tx("Возврат", "Refund")}: {stats?.predictions_by_status?.refund ?? 0}</div>
            </div>
            <ul className="event-list">
              {(stats?.events_placeholder || []).map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <AdminSheet
        open={predictionSheetMode !== "closed"}
        title={predictionSheetMode === "create" ? tx("Новый прогноз", "New prediction") : tx("Редактирование прогноза", "Edit prediction")}
        onClose={closePredictionSheet}
      >
        <form className="admin-sheet-form" onSubmit={onSavePredictionDraft}>
          <section className="admin-editor-section">
            <h4>{tx("Секция 1. Событие", "Section 1. Event")}</h4>
            <div className="admin-grid-2">
              <input value={predictionDraft.match_name} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, match_name: e.target.value }))} placeholder={tx("Матч", "Match")} required />
              <input value={predictionDraft.league} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, league: e.target.value }))} placeholder={tx("Лига", "League")} />
            </div>
            <div className="admin-grid-2">
              <input value={predictionDraft.sport_type} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, sport_type: e.target.value }))} placeholder={tx("Вид спорта", "Sport type")} />
              <input type="datetime-local" value={predictionDraft.event_start_at} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, event_start_at: e.target.value }))} required />
            </div>
          </section>

          <section className="admin-editor-section">
            <h4>{tx("Секция 2. Публикация", "Section 2. Publication")}</h4>
            <input value={predictionDraft.title} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder={tx("Заголовок (опционально)", "Title (optional)")} />
            <div className="admin-grid-3">
              <select value={predictionDraft.access_level} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, access_level: e.target.value as "free" | "premium" | "vip" }))}>
                <option value="free">{tx("Бесплатный", "Free")}</option>
                <option value="premium">{tx("Премиум", "Premium")}</option>
                <option value="vip">VIP</option>
              </select>
              <input type="number" min="1.01" step="0.01" value={predictionDraft.odds} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, odds: e.target.value }))} placeholder="1.80" />
              <select value={predictionDraft.risk_level} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, risk_level: e.target.value as "low" | "medium" | "high" }))}>
                <option value="low">{tx("Риск: низкий", "Risk: low")}</option>
                <option value="medium">{tx("Риск: средний", "Risk: medium")}</option>
                <option value="high">{tx("Риск: высокий", "Risk: high")}</option>
              </select>
            </div>
            <div className="admin-grid-2">
              <input value={predictionDraft.signal_type} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, signal_type: e.target.value }))} placeholder={tx("Тип сигнала", "Signal type")} required />
              <select value={predictionDraft.mode} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, mode: e.target.value as "prematch" | "live" }))}>
                <option value="prematch">{tx("Прематч", "Prematch")}</option>
                <option value="live">{tx("Лайв", "Live")}</option>
              </select>
            </div>
            <div className="admin-chip-toggle-row">
              <label className={predictionDraft.tag_pick ? "admin-chip-toggle active" : "admin-chip-toggle"}>
                <input type="checkbox" checked={predictionDraft.tag_pick} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, tag_pick: e.target.checked }))} />
                {tx("Выбор дня", "Pick of the day")}
              </label>
              <label className={predictionDraft.tag_strong ? "admin-chip-toggle active" : "admin-chip-toggle"}>
                <input type="checkbox" checked={predictionDraft.tag_strong} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, tag_strong: e.target.checked }))} />
                {tx("Strong setup", "Strong setup")}
              </label>
              <label className={predictionDraft.tag_hot ? "admin-chip-toggle active" : "admin-chip-toggle"}>
                <input type="checkbox" checked={predictionDraft.tag_hot} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, tag_hot: e.target.checked }))} />
                {tx("Hot pick", "Hot pick")}
              </label>
            </div>
          </section>

          <section className="admin-editor-section">
            <h4>{tx("Секция 3. Статус и результат", "Section 3. Status and result")}</h4>
            <div className="admin-status-switch">
              <button className={predictionDraft.status === "pending" ? "active" : ""} type="button" onClick={() => setPredictionDraft((prev) => ({ ...prev, status: "pending" }))}>
                {tx("В ожидании", "Pending")}
              </button>
              <button className={predictionDraft.status === "won" ? "active" : ""} type="button" onClick={() => setPredictionDraft((prev) => ({ ...prev, status: "won" }))}>
                {tx("Выигрыш", "Won")}
              </button>
              <button className={predictionDraft.status === "lost" ? "active" : ""} type="button" onClick={() => setPredictionDraft((prev) => ({ ...prev, status: "lost" }))}>
                {tx("Проигрыш", "Lost")}
              </button>
              <button className={predictionDraft.status === "refund" ? "active" : ""} type="button" onClick={() => setPredictionDraft((prev) => ({ ...prev, status: "refund" }))}>
                {tx("Возврат", "Refund")}
              </button>
            </div>
          </section>

          <section className="admin-editor-section">
            <h4>{tx("Секция 4. Разбор", "Section 4. Breakdown")}</h4>
            <textarea value={predictionDraft.brief} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, brief: e.target.value }))} rows={3} placeholder={tx("Краткий текст", "Brief text")} />
            <textarea value={predictionDraft.breakdown} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, breakdown: e.target.value }))} rows={4} placeholder={tx("Полный разбор", "Full breakdown")} />
            <textarea value={predictionDraft.comments} onChange={(e) => setPredictionDraft((prev) => ({ ...prev, comments: e.target.value }))} rows={3} placeholder={tx("Комментарии", "Comments")} />
          </section>

          <section className="admin-editor-section">
            <h4>{tx("Секция 5. Скрин", "Section 5. Screenshot")}</h4>
            {predictionDraft.result_screenshot ? (
              <div className="admin-image-preview compact">
                <img src={predictionDraft.result_screenshot} alt={tx("Скрин результата", "Result screenshot")} loading="lazy" />
              </div>
            ) : (
              <p className="muted">{tx("Скрин не добавлен", "No screenshot attached")}</p>
            )}
            <div className="admin-shot-actions-row">
              <label className="btn ghost admin-file-btn">
                {predictionDraft.result_screenshot ? tx("Заменить", "Replace") : tx("Загрузить", "Upload")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (!file) return;
                    void onPredictionDraftScreenshotPick(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <button className="btn ghost" type="button" disabled={!predictionDraft.result_screenshot} onClick={() => setPredictionDraft((prev) => ({ ...prev, result_screenshot: null }))}>
                {tx("Удалить", "Delete")}
              </button>
            </div>
          </section>

          <div className="admin-sheet-footer">
            <button className="btn ghost" type="button" onClick={closePredictionSheet}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit" disabled={predictionSaving}>
              {predictionSaving ? tx("Сохраняем...", "Saving...") : tx("Сохранить", "Save")}
            </button>
          </div>
        </form>
      </AdminSheet>

      <AdminSheet
        open={newsSheetMode !== "closed"}
        title={newsSheetMode === "create" ? tx("Новая новость", "New news") : tx("Редактирование новости", "Edit news")}
        onClose={closeNewsSheet}
      >
        <form className="admin-sheet-form" onSubmit={onSaveNewsDraft}>
          <section className="admin-editor-section">
            <h4>{tx("Новость", "News")}</h4>
            <input value={newsDraft.title} onChange={(e) => setNewsDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder={tx("Заголовок", "Title")} required />
            <textarea value={newsDraft.preview} onChange={(e) => setNewsDraft((prev) => ({ ...prev, preview: e.target.value }))} rows={3} placeholder={tx("Preview", "Preview")} />
            <textarea value={newsDraft.body} onChange={(e) => setNewsDraft((prev) => ({ ...prev, body: e.target.value }))} rows={8} placeholder={tx("Текст", "Text")} required />
            <input value={newsDraft.category} onChange={(e) => setNewsDraft((prev) => ({ ...prev, category: e.target.value }))} placeholder={tx("Категория", "Category")} />
            <label className="switch-row" style={{ padding: "0 4px" }}>
              <span>{tx("Опубликовать", "Publish")}</span>
              <input type="checkbox" checked={newsDraft.is_published} onChange={(e) => setNewsDraft((prev) => ({ ...prev, is_published: e.target.checked }))} />
            </label>
          </section>
          <div className="admin-sheet-footer">
            <button className="btn ghost" type="button" onClick={closeNewsSheet}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit" disabled={newsSaving}>
              {newsSaving ? tx("Сохраняем...", "Saving...") : tx("Сохранить", "Save")}
            </button>
          </div>
        </form>
      </AdminSheet>

      <AdminSheet
        open={promoSheetMode !== "closed"}
        title={promoSheetMode === "create" ? tx("Новый промокод", "New promo code") : tx("Редактирование промокода", "Edit promo code")}
        onClose={closePromoSheet}
      >
        <form className="admin-sheet-form" onSubmit={onSavePromoDraft}>
          <section className="admin-editor-section">
            <h4>{tx("Параметры промокода", "Promo code settings")}</h4>
            <input value={promoDraft.code} onChange={(e) => setPromoDraft((prev) => ({ ...prev, code: e.target.value }))} placeholder={tx("Код", "Code")} disabled={promoSheetMode === "edit"} required />
            <input value={promoDraft.title} onChange={(e) => setPromoDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder={tx("Название", "Title")} required />
            <textarea value={promoDraft.description} onChange={(e) => setPromoDraft((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder={tx("Описание", "Description")} />
            <div className="admin-grid-2">
              <select value={promoDraft.kind} onChange={(e) => setPromoDraft((prev) => ({ ...prev, kind: e.target.value as PromoDraft["kind"] }))}>
                <option value="percent_discount">{tx("Скидка в процентах", "Percent discount")}</option>
                <option value="fixed_discount">{tx("Фиксированная скидка", "Fixed discount")}</option>
                <option value="extra_days">{tx("Бонусные дни", "Bonus days")}</option>
                <option value="free_access">{tx("Бесплатный доступ", "Free access")}</option>
              </select>
              <input value={promoDraft.value} onChange={(e) => setPromoDraft((prev) => ({ ...prev, value: e.target.value }))} type="number" min="0" placeholder={tx("Значение", "Value")} />
            </div>
            <div className="admin-grid-2">
              <select value={promoDraft.tariff_code} onChange={(e) => setPromoDraft((prev) => ({ ...prev, tariff_code: e.target.value as PromoDraft["tariff_code"] }))}>
                <option value="">{tx("Любой тариф", "Any plan")}</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
              <input value={promoDraft.max_activations} onChange={(e) => setPromoDraft((prev) => ({ ...prev, max_activations: e.target.value }))} type="number" min="1" placeholder={tx("Лимит активаций", "Activation limit")} />
            </div>
            <input value={promoDraft.expires_at} onChange={(e) => setPromoDraft((prev) => ({ ...prev, expires_at: e.target.value }))} type="datetime-local" placeholder={tx("Срок действия", "Expiration")} />
            <label className="switch-row" style={{ padding: "0 4px" }}>
              <span>{tx("Активен", "Active")}</span>
              <input type="checkbox" checked={promoDraft.is_active} onChange={(e) => setPromoDraft((prev) => ({ ...prev, is_active: e.target.checked }))} />
            </label>
          </section>
          <div className="admin-sheet-footer">
            <button className="btn ghost" type="button" onClick={closePromoSheet}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit" disabled={promoSaving}>
              {promoSaving ? tx("Сохраняем...", "Saving...") : tx("Сохранить", "Save")}
            </button>
          </div>
        </form>
      </AdminSheet>

      <AdminSheet
        open={methodSheetMode !== "closed"}
        title={methodSheetMode === "create" ? tx("Новый способ оплаты", "New payment method") : tx("Редактирование способа оплаты", "Edit payment method")}
        onClose={closeMethodSheet}
      >
        <form className="admin-sheet-form" onSubmit={onSaveMethodDraft}>
          <section className="admin-editor-section">
            <h4>{tx("Параметры способа оплаты", "Payment method settings")}</h4>
            <div className="admin-grid-2">
              <input value={methodDraft.code} onChange={(e) => setMethodDraft((prev) => ({ ...prev, code: e.target.value }))} placeholder={tx("Код", "Code")} disabled={methodSheetMode === "edit"} required />
              <input value={methodDraft.name} onChange={(e) => setMethodDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder={tx("Название", "Name")} required />
            </div>
            <div className="admin-grid-3">
              <select value={methodDraft.method_type} onChange={(e) => setMethodDraft((prev) => ({ ...prev, method_type: e.target.value as "auto" | "manual" }))}>
                <option value="manual">{tx("Ручной", "Manual")}</option>
                <option value="auto">{tx("Авто", "Auto")}</option>
              </select>
              <input value={methodDraft.sort_order} onChange={(e) => setMethodDraft((prev) => ({ ...prev, sort_order: e.target.value }))} type="number" placeholder={tx("Порядок", "Sort order")} />
              <label className="switch-row" style={{ padding: "0 4px" }}>
                <span>{tx("Активен", "Active")}</span>
                <input type="checkbox" checked={methodDraft.is_active} onChange={(e) => setMethodDraft((prev) => ({ ...prev, is_active: e.target.checked }))} />
              </label>
            </div>
            <input value={methodDraft.card_number} onChange={(e) => setMethodDraft((prev) => ({ ...prev, card_number: e.target.value }))} placeholder={tx("Номер карты", "Card number")} />
            <input value={methodDraft.recipient_name} onChange={(e) => setMethodDraft((prev) => ({ ...prev, recipient_name: e.target.value }))} placeholder={tx("Получатель", "Recipient")} />
            <input value={methodDraft.payment_details} onChange={(e) => setMethodDraft((prev) => ({ ...prev, payment_details: e.target.value }))} placeholder={tx("Реквизиты", "Payment details")} />
            <textarea value={methodDraft.instructions} onChange={(e) => setMethodDraft((prev) => ({ ...prev, instructions: e.target.value }))} rows={4} placeholder={tx("Инструкция для пользователя", "User instructions")} />
          </section>
          <div className="admin-sheet-footer">
            <button className="btn ghost" type="button" onClick={closeMethodSheet}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit" disabled={methodSaving}>
              {methodSaving ? tx("Сохраняем...", "Saving...") : tx("Сохранить", "Save")}
            </button>
          </div>
        </form>
      </AdminSheet>

      <AdminSheet open={showGrantSubscriptionSheet} title={tx("Выдать подписку вручную", "Grant subscription manually")} onClose={() => setShowGrantSubscriptionSheet(false)}>
        <form className="admin-sheet-form" onSubmit={onGrantSubscription}>
          <section className="admin-editor-section">
            <h4>{tx("Параметры подписки", "Subscription settings")}</h4>
            <div className="admin-grid-2">
              <input name="user_id" placeholder="user_id" />
              <input name="telegram_id" placeholder="telegram_id" />
            </div>
            <div className="admin-grid-2">
              <select name="tariff_code" defaultValue="premium">
                <option value="free">{tx("Бесплатный", "Free")}</option>
                <option value="premium">{tx("Премиум", "Premium")}</option>
                <option value="vip">VIP</option>
              </select>
              <input name="duration_days" type="number" min="1" defaultValue="30" />
            </div>
          </section>
          <div className="admin-sheet-footer">
            <button className="btn ghost" type="button" onClick={() => setShowGrantSubscriptionSheet(false)}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit">
              {tx("Выдать", "Grant")}
            </button>
          </div>
        </form>
      </AdminSheet>
    </Layout>
  );
}

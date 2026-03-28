import { FormEvent, useEffect, useMemo, useState } from "react";

import { useLanguage } from "../app/language";
import { Layout } from "../components/Layout";
import {
  api,
  type AdminPayment,
  type AdminPromoCode,
  type PaymentMethod,
  type AdminStats,
  type AdminSubscription,
  type AdminUser,
  type NewsPost,
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
  if (value === "succeeded") return language === "ru" ? "Успешный" : "Succeeded";
  if (value === "failed") return language === "ru" ? "Ошибка" : "Failed";
  if (value === "canceled") return language === "ru" ? "Отменен" : "Canceled";
  if (value === "active") return language === "ru" ? "Активна" : "Active";
  if (value === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (value === "pending_manual_review") return language === "ru" ? "Ожидает подтверждения" : "Pending manual review";
  if (value === "requires_clarification") return language === "ru" ? "Ожидает уточнения" : "Needs clarification";
  return language === "ru" ? "В ожидании" : "Pending";
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [usersQuery, setUsersQuery] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");
  const [subQuery, setSubQuery] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [paymentQuery, setPaymentQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [editingPredictionId, setEditingPredictionId] = useState<string | null>(null);
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
    const role = usersRoleFilter === "all" ? undefined : usersRoleFilter;
    const subStatus = subStatusFilter === "all" ? undefined : subStatusFilter;
    const payStatus = paymentStatusFilter === "all" ? undefined : paymentStatusFilter;
    const [p, u, s, pay, paymentMethodList, n, promos, st] = await Promise.all([
      api.adminPredictions(),
      api.adminUsers({ q: usersQuery || undefined, role }),
      api.adminSubscriptions({ q: subQuery || undefined, status: subStatus }),
      api.adminPayments({ user_query: paymentQuery || undefined, status: payStatus }),
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

  useEffect(() => {
    if (!isAdmin) return;
    void loadAll();
  }, [usersQuery, usersRoleFilter, subQuery, subStatusFilter, paymentQuery, paymentStatusFilter]);

  const visiblePredictions = useMemo(() => {
    const q = predQuery.trim().toLowerCase();
    if (!q) return predictions;
    return predictions.filter((item) => {
      const base = `${item.match_name} ${item.title} ${item.league || ""} ${item.signal_type}`.toLowerCase();
      return base.includes(q);
    });
  }, [predictions, predQuery]);

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

  const onCreatePrediction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    notifyInfo("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const matchName = String(formData.get("match_name") || "").trim();
    const signalType = String(formData.get("signal_type") || "").trim();
    try {
      await api.adminCreatePrediction({
        title: String(formData.get("title") || `${matchName} • ${signalType}`).trim(),
        match_name: matchName,
        league: String(formData.get("league") || "").trim() || null,
        sport_type: String(formData.get("sport_type") || "football"),
        event_start_at: formData.get("event_start_at"),
        signal_type: signalType,
        odds: Number(formData.get("odds")),
        short_description: String(formData.get("short_description") || "").trim() || null,
        risk_level: String(formData.get("risk_level") || "medium"),
        access_level: String(formData.get("access_level") || "free"),
        mode: String(formData.get("mode") || "prematch"),
        status: String(formData.get("status") || "pending").replace("win", "won").replace("lose", "lost"),
        publish_now: true,
      });
      notifySuccess(tx("Прогноз создан", "Prediction created"));
      form.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось создать прогноз", "Failed to create prediction")));
    } finally {
      setLoading(false);
    }
  };

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

  const onUpdateRole = async (userId: string, role: "user" | "admin") => {
    try {
      await api.adminUpdateUserRole(userId, role);
      notifySuccess(
        role === "admin"
          ? tx("Права администратора выданы", "Admin permissions granted")
          : tx("Права администратора сняты", "Admin permissions revoked")
      );
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

  const onGrantSubscription = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await api.adminGrantSubscription({
        user_id: String(formData.get("user_id") || "").trim() || undefined,
        telegram_id: String(formData.get("telegram_id") || "").trim()
          ? Number(formData.get("telegram_id"))
          : undefined,
        tariff_code: String(formData.get("tariff_code") || "free") as "free" | "premium" | "vip",
        duration_days: Number(formData.get("duration_days") || 30),
      });
      notifySuccess(tx("Подписка выдана", "Subscription granted"));
      form.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось выдать подписку", "Failed to grant subscription")));
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

  const onCreatePaymentMethod = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.adminCreatePaymentMethod({
        code: String(fd.get("code") || "").trim(),
        name: String(fd.get("name") || "").trim(),
        method_type: String(fd.get("method_type") || "manual") as "auto" | "manual",
        is_active: fd.get("is_active") === "on",
        sort_order: Number(fd.get("sort_order") || 100),
        card_number: String(fd.get("card_number") || "").trim() || null,
        recipient_name: String(fd.get("recipient_name") || "").trim() || null,
        payment_details: String(fd.get("payment_details") || "").trim() || null,
        instructions: String(fd.get("instructions") || "").trim() || null,
      });
      notifySuccess(tx("Метод оплаты добавлен", "Payment method created"));
      e.currentTarget.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось создать метод оплаты", "Failed to create payment method")));
    }
  };

  const onPatchPaymentMethod = async (code: string, payload: Partial<PaymentMethod>) => {
    try {
      await api.adminUpdatePaymentMethod(code, payload);
      notifySuccess(tx("Метод оплаты обновлен", "Payment method updated"));
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось обновить метод оплаты", "Failed to update payment method")));
    }
  };

  const onCreateNews = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.adminCreateNews({
        title: String(fd.get("title") || "").trim(),
        body: String(fd.get("body") || "").trim(),
        category: String(fd.get("category") || "news").trim(),
        is_published: fd.get("is_published") === "on",
      });
      notifySuccess(tx("Новость добавлена", "News post created"));
      e.currentTarget.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось добавить новость", "Failed to create news post")));
    }
  };

  const onToggleNews = async (item: NewsPost) => {
    try {
      await api.adminUpdateNews(item.id, { is_published: !item.is_published });
      notifySuccess(
        item.is_published
          ? tx("Новость снята с публикации", "News post unpublished")
          : tx("Новость опубликована", "News post published")
      );
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

  const onCreatePromo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const kind = String(fd.get("kind") || "percent_discount") as "percent_discount" | "fixed_discount" | "extra_days" | "free_access";
    const tariffCodeValue = String(fd.get("tariff_code") || "").trim();
    const expiresAtValue = String(fd.get("expires_at") || "").trim();
    try {
      await api.adminCreatePromoCode({
        code: String(fd.get("code") || "").trim(),
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim() || undefined,
        kind,
        value: Number(fd.get("value") || 0),
        tariff_code: (tariffCodeValue || undefined) as "free" | "premium" | "vip" | undefined,
        max_activations: String(fd.get("max_activations") || "").trim() ? Number(fd.get("max_activations")) : undefined,
        expires_at: expiresAtValue ? new Date(expiresAtValue).toISOString() : undefined,
        is_active: fd.get("is_active") === "on",
      });
      notifySuccess(tx("Промокод добавлен", "Promo code created"));
      e.currentTarget.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, tx("Не удалось создать промокод", "Failed to create promo code")));
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

  const onDirectMessageUser = async (user: AdminUser) => {
    const text = window.prompt(
      tx(`Сообщение для @${user.username || user.telegram_id}:`, `Message for @${user.username || user.telegram_id}:`)
    );
    if (!text || !text.trim()) return;

    const buttonTextRaw = window.prompt(
      tx("Текст кнопки (опционально). Оставьте пустым, если кнопка не нужна:", "Button text (optional). Leave empty for no button:")
    ) || "";
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
      notifyError(tx("Заполните заголовок и текст рассылки", "Fill in campaign title and message"));
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
      <section className="card pb-admin-shell">
        <div className="section-head">
          <h2>{tx("Админка управления", "Admin control panel")}</h2>
          <span className="muted">{tx("Ручное управление контентом и доступом", "Manual content and access operations")}</span>
        </div>

        <div className="admin-tabs-wrap">
          <div className="admin-tabs">
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
            <h3>{tx("Прогнозы", "Predictions")}</h3>
            <form className="admin-form" onSubmit={onCreatePrediction}>
              <input name="title" placeholder={tx("Заголовок (необязательно)", "Title (optional)")} />
              <input name="match_name" placeholder={tx("Матч", "Match")} required />
              <input name="league" placeholder={tx("Лига", "League")} required />
              <input name="sport_type" placeholder={tx("Вид спорта", "Sport type")} defaultValue="football" required />
              <input name="event_start_at" type="datetime-local" required />
              <input name="signal_type" placeholder={tx("Тип сигнала", "Signal type")} required />
              <input name="odds" type="number" min="1.01" step="0.01" defaultValue="1.80" required />
              <div className="admin-grid-3">
                <select name="risk_level" defaultValue="medium">
                  <option value="low">{tx("Риск: низкий", "Risk: low")}</option>
                  <option value="medium">{tx("Риск: средний", "Risk: medium")}</option>
                  <option value="high">{tx("Риск: высокий", "Risk: high")}</option>
                </select>
                <select name="access_level" defaultValue="free">
                  <option value="free">{tx("Доступ: Бесплатный", "Access: Free")}</option>
                  <option value="premium">{tx("Доступ: Премиум", "Access: Premium")}</option>
                  <option value="vip">{tx("Доступ: VIP", "Access: VIP")}</option>
                </select>
                <select name="mode" defaultValue="prematch">
                  <option value="prematch">{tx("Формат: Прематч", "Mode: Prematch")}</option>
                  <option value="live">{tx("Формат: Лайв", "Mode: Live")}</option>
                </select>
              </div>
              <select name="status" defaultValue="pending">
                <option value="pending">{tx("Статус: в ожидании", "Status: pending")}</option>
                <option value="win">{tx("Статус: выигрыш", "Status: won")}</option>
                <option value="lose">{tx("Статус: проигрыш", "Status: lost")}</option>
                <option value="refund">{tx("Статус: возврат", "Status: refund")}</option>
              </select>
              <textarea name="short_description" placeholder={tx("Краткое описание", "Short description")} rows={3} />
              <button className="btn" type="submit">
                {tx("Добавить прогноз", "Create prediction")}
              </button>
            </form>

            <input value={predQuery} onChange={(e) => setPredQuery(e.target.value)} placeholder={tx("Поиск по матчу / сигналу", "Search by match / signal")} />
            <div className="admin-list">
              {visiblePredictions.slice(0, 80).map((item) => (
                <article key={item.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{item.match_name}</strong>
                    <span className={`access-pill ${item.access_level}`}>{accessLabel(item.access_level, language)}</span>
                  </div>
                  <p className="muted">{item.signal_type} • {tx("кф", "odds")} {item.odds} • {item.mode === "live" ? tx("Лайв", "Live") : tx("Прематч", "Prematch")}</p>
                  <div className="admin-grid-3">
                    <select defaultValue={item.status} onChange={(e) => onUpdatePrediction(item.id, { status: e.target.value })}>
                      <option value="pending">{tx("В ожидании", "Pending")}</option>
                      <option value="won">{tx("Выигрыш", "Won")}</option>
                      <option value="lost">{tx("Проигрыш", "Lost")}</option>
                      <option value="refund">{tx("Возврат", "Refund")}</option>
                    </select>
                    <select defaultValue={item.access_level} onChange={(e) => onUpdatePrediction(item.id, { access_level: e.target.value })}>
                      <option value="free">{tx("Бесплатный", "Free")}</option>
                      <option value="premium">{tx("Премиум", "Premium")}</option>
                      <option value="vip">VIP</option>
                    </select>
                    <input type="number" step="0.01" min="1.01" defaultValue={item.odds} onBlur={(e) => onUpdatePrediction(item.id, { odds: Number(e.target.value) })} />
                  </div>
                  <div className="cta-row">
                    <button className="btn ghost" type="button" onClick={() => setEditingPredictionId(item.id)}>
                      {tx("Редактировать", "Edit")}
                    </button>
                    <button className="btn danger" type="button" onClick={() => onDeletePrediction(item.id)}>
                      {tx("Удалить", "Delete")}
                    </button>
                  </div>
                  {editingPredictionId === item.id ? (
                    <form
                      className="admin-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        void onUpdatePrediction(item.id, {
                          title: String(fd.get("title") || ""),
                          league: String(fd.get("league") || ""),
                          short_description: String(fd.get("short_description") || ""),
                        });
                        setEditingPredictionId(null);
                      }}
                    >
                      <input name="title" defaultValue={item.title} placeholder={tx("Заголовок", "Title")} />
                      <input name="league" defaultValue={item.league || ""} placeholder={tx("Лига", "League")} />
                      <textarea name="short_description" defaultValue={item.short_description || ""} rows={3} />
                      <button className="btn" type="submit">
                        {tx("Сохранить изменения", "Save changes")}
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "users" ? (
          <div className="admin-panel">
            <h3>{tx("Пользователи", "Users")}</h3>
            <div className="filter-row">
              <input value={usersQuery} onChange={(e) => setUsersQuery(e.target.value)} placeholder={tx("Поиск по telegram_id / username", "Search by telegram_id / username")} />
              <select value={usersRoleFilter} onChange={(e) => setUsersRoleFilter(e.target.value)}>
                <option value="all">{tx("Все роли", "All roles")}</option>
                <option value="user">{tx("Пользователь", "User")}</option>
                <option value="admin">{tx("Администратор", "Admin")}</option>
              </select>
            </div>
            <div className="admin-list">
              {users.map((user) => {
                const latestSub = latestSubscriptionByUser.get(user.id);
                return (
                  <article key={user.id} className="prediction-card admin-item">
                    <div className="prediction-top">
                      <strong>{user.first_name || tx("Без имени", "No name")}</strong>
                      <span className={user.role === "admin" ? "badge success" : "badge"}>{user.role === "admin" ? tx("администратор", "admin") : tx("пользователь", "user")}</span>
                    </div>
                    <p className="muted">@{user.username || "-"} • tg: {user.telegram_id}</p>
                    <p className="muted">{tx("Тариф", "Tariff")}: {accessLabel(user.tariff, language)} • {tx("до", "until")}: {user.subscription_ends_at || "—"}</p>
                    <p className="muted">
                      {tx("Рефкод", "Referral code")}: {user.referral_code || "—"} • {tx("приглашено", "invited")}: {user.referrals_invited ?? 0} • {tx("активировано", "activated")}: {user.referrals_activated ?? 0} • {tx("бонусных дней", "bonus days")}: {user.referral_bonus_days ?? 0}
                    </p>
                    <div className="cta-row wrap">
                      {user.role === "admin" ? (
                        <button className="btn ghost" onClick={() => onUpdateRole(user.id, "user")}>{tx("Снять админку", "Revoke admin")}</button>
                      ) : (
                        <button className="btn" onClick={() => onUpdateRole(user.id, "admin")}>{tx("Выдать админку", "Grant admin")}</button>
                      )}
                      <button
                        className="btn ghost"
                        onClick={() =>
                          onSubAction(
                            () => api.adminGrantSubscription({ user_id: user.id, tariff_code: "premium", duration_days: 30 }),
                            tx("Премиум выдан на 30 дней", "Premium granted for 30 days"),
                            tx("Не удалось выдать Премиум", "Failed to grant Premium")
                          )
                        }
                      >
                        {tx("Выдать Премиум", "Grant Premium")}
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() =>
                          onSubAction(
                            () => api.adminGrantSubscription({ user_id: user.id, tariff_code: "vip", duration_days: 30 }),
                            tx("VIP выдан на 30 дней", "VIP granted for 30 days"),
                            tx("Не удалось выдать VIP", "Failed to grant VIP")
                          )
                        }
                      >
                        {tx("Выдать VIP", "Grant VIP")}
                      </button>
                      {latestSub ? (
                        <>
                          <button className="btn" onClick={() => onSubAction(() => api.adminExtendSubscription(latestSub.id, 30), tx("Подписка продлена на 30 дней", "Subscription extended by 30 days"), tx("Не удалось продлить", "Failed to extend"))}>{tx("Продлить +30", "Extend +30")}</button>
                          <button className="btn" onClick={() => onSubAction(() => api.adminChangeSubscriptionTariff(latestSub.id, { tariff_code: "free" }), tx("Тариф переведен на бесплатный", "Tariff switched to Free"), tx("Не удалось сменить тариф", "Failed to switch tariff"))}>{tx("На бесплатный", "Switch to Free")}</button>
                          <button className="btn danger" onClick={() => onSubAction(() => api.adminCancelSubscription(latestSub.id), tx("Подписка отменена", "Subscription canceled"), tx("Не удалось отменить", "Failed to cancel"))}>{tx("Отменить подписку", "Cancel subscription")}</button>
                        </>
                      ) : null}
                      <button className="btn danger" onClick={() => onDeleteUser(user.id)}>{tx("Удалить", "Delete")}</button>
                      <button className="btn" onClick={() => onDirectMessageUser(user)}>{tx("Сообщение", "Message")}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "subscriptions" ? (
          <div className="admin-panel">
            <h3>{tx("Подписки", "Subscriptions")}</h3>
            <form className="admin-form" onSubmit={onGrantSubscription}>
              <div className="admin-grid-2">
                <input name="user_id" placeholder={tx("user_id (или оставьте пустым)", "user_id (or leave empty)")} />
                <input name="telegram_id" placeholder="telegram_id" />
              </div>
              <div className="admin-grid-3">
                <select name="tariff_code" defaultValue="premium">
                  <option value="free">{tx("Бесплатный", "Free")}</option>
                  <option value="premium">{tx("Премиум", "Premium")}</option>
                  <option value="vip">VIP</option>
                </select>
                <input name="duration_days" type="number" min="1" defaultValue="30" />
                <button className="btn" type="submit">{tx("Выдать подписку", "Grant subscription")}</button>
              </div>
            </form>

            <div className="filter-row">
              <input value={subQuery} onChange={(e) => setSubQuery(e.target.value)} placeholder={tx("Поиск по пользователю", "Search by user")} />
              <select value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value)}>
                <option value="all">{tx("Все статусы", "All statuses")}</option>
                <option value="active">{tx("Активна", "Active")}</option>
                <option value="expired">{tx("Истекла", "Expired")}</option>
                <option value="canceled">{tx("Отменена", "Canceled")}</option>
              </select>
            </div>

            <div className="admin-list">
              {subscriptions.map((sub) => (
                <article key={sub.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>@{sub.username || sub.telegram_id}</strong>
                    <span className={`access-pill ${sub.tariff_code}`}>{accessLabel(sub.tariff_code, language)}</span>
                  </div>
                  <p className="muted">{statusLabel(sub.status, language)} • {tx("до", "until")} {new Date(sub.ends_at).toLocaleDateString(isRu ? "ru-RU" : "en-US")}</p>
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onSubAction(() => api.adminExtendSubscription(sub.id, 7), tx("Подписка продлена на 7 дней", "Subscription extended by 7 days"), tx("Не удалось продлить", "Failed to extend"))}>{tx("+7 дней", "+7 days")}</button>
                    <button className="btn ghost" onClick={() => onSubAction(() => api.adminExtendSubscription(sub.id, 30), tx("Подписка продлена на 30 дней", "Subscription extended by 30 days"), tx("Не удалось продлить", "Failed to extend"))}>{tx("+30 дней", "+30 days")}</button>
                    <button className="btn" onClick={() => onSubAction(() => api.adminChangeSubscriptionTariff(sub.id, { tariff_code: "premium" }), tx("Тариф обновлен", "Tariff updated"), tx("Не удалось сменить тариф", "Failed to switch tariff"))}>{tx("На Премиум", "Switch to Premium")}</button>
                    <button className="btn" onClick={() => onSubAction(() => api.adminChangeSubscriptionTariff(sub.id, { tariff_code: "vip" }), tx("Тариф обновлен", "Tariff updated"), tx("Не удалось сменить тариф", "Failed to switch tariff"))}>{tx("На VIP", "Switch to VIP")}</button>
                    <button className="btn danger" onClick={() => onSubAction(() => api.adminCancelSubscription(sub.id), tx("Подписка отменена", "Subscription canceled"), tx("Не удалось отменить подписку", "Failed to cancel subscription"))}>{tx("Отменить", "Cancel")}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "payments" ? (
          <div className="admin-panel">
            <h3>{tx("Платежи", "Payments")}</h3>
            <div className="filter-row">
              <input value={paymentQuery} onChange={(e) => setPaymentQuery(e.target.value)} placeholder={tx("Поиск по пользователю", "Search by user")} />
              <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                <option value="all">{tx("Все статусы", "All statuses")}</option>
                <option value="pending">{tx("В ожидании", "Pending")}</option>
                <option value="pending_manual_review">{tx("Ожидает подтверждения", "Pending review")}</option>
                <option value="requires_clarification">{tx("Ожидает уточнения", "Needs clarification")}</option>
                <option value="succeeded">{tx("Успешный", "Succeeded")}</option>
                <option value="failed">{tx("Ошибка", "Failed")}</option>
                <option value="canceled">{tx("Отменен", "Canceled")}</option>
              </select>
            </div>
            <div className="admin-list">
              {payments.map((payment) => (
                <article key={payment.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{payment.amount_rub} RUB • {accessLabel(payment.access_level, language)} • {payment.duration_days} {tx("дн", "d")}</strong>
                    <span className={`badge ${payment.status}`}>{statusLabel(payment.status, language)}</span>
                  </div>
                  <p className="muted">@{payment.username || "-"} • tg: {payment.telegram_id}</p>
                  <p className="muted">{tx("Метод", "Method")}: {payment.method_name || payment.method_code || "-"}</p>
                  <p className="muted">order: {payment.provider_order_id}</p>
                  {payment.manual_note ? <p className="muted">{tx("Комментарий", "Comment")}: {payment.manual_note}</p> : null}
                  {payment.manual_proof ? <p className="muted">{tx("Подтверждение", "Proof")}: {payment.manual_proof}</p> : null}
                  {payment.review_comment ? <p className="muted">{tx("Комментарий админа", "Admin comment")}: {payment.review_comment}</p> : null}
                  <div className="admin-grid-2">
                    <button className="btn" onClick={() => onPaymentStatus(payment.id, "succeeded")}>{tx("Пометить успешным", "Mark succeeded")}</button>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        const comment = window.prompt(tx("Что нужно уточнить у пользователя?", "What should be clarified with user?")) || "";
                        void onPaymentStatus(payment.id, "requires_clarification", comment);
                      }}
                    >
                      {tx("Запросить уточнение", "Request clarification")}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => {
                        const comment = window.prompt(tx("Причина отклонения", "Rejection reason")) || "";
                        void onPaymentStatus(payment.id, "failed", comment);
                      }}
                    >
                      {tx("Отклонить", "Reject")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "payment_methods" ? (
          <div className="admin-panel">
            <h3>{tx("Способы оплаты", "Payment methods")}</h3>
            <form className="admin-form" onSubmit={onCreatePaymentMethod}>
              <div className="admin-grid-3">
                <input name="code" placeholder={tx("Код метода", "Method code")} required />
                <input name="name" placeholder={tx("Название", "Name")} required />
                <select name="method_type" defaultValue="manual">
                  <option value="auto">{tx("Авто", "Auto")}</option>
                  <option value="manual">{tx("Ручной", "Manual")}</option>
                </select>
              </div>
              <div className="admin-grid-3">
                <input name="sort_order" type="number" defaultValue="100" placeholder={tx("Порядок", "Sort order")} />
                <input name="card_number" placeholder={tx("Номер карты", "Card number")} />
                <input name="recipient_name" placeholder={tx("Получатель", "Recipient")} />
              </div>
              <input name="payment_details" placeholder={tx("Реквизиты / детали", "Payment details")} />
              <textarea name="instructions" rows={2} placeholder={tx("Инструкция для пользователя", "User instructions")} />
              <label className="switch-row" style={{ padding: "0 4px" }}>
                <span>{tx("Активен", "Active")}</span>
                <input name="is_active" type="checkbox" defaultChecked />
              </label>
              <button className="btn" type="submit">{tx("Добавить метод", "Create method")}</button>
            </form>

            <div className="admin-list">
              {paymentMethods.map((method) => (
                <article key={method.code} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{method.name}</strong>
                    <span className={`badge ${method.is_active ? "success" : "failed"}`}>{method.is_active ? tx("Активен", "Active") : tx("Выключен", "Inactive")}</span>
                  </div>
                  <p className="muted">
                    code: {method.code} • {method.method_type === "auto" ? tx("Авто", "Auto") : tx("Ручной", "Manual")}
                  </p>
                  {method.instructions ? <p className="muted">{method.instructions}</p> : null}
                  {method.card_number ? <p className="muted">{tx("Карта", "Card")}: {method.card_number}</p> : null}
                  {method.recipient_name ? <p className="muted">{tx("Получатель", "Recipient")}: {method.recipient_name}</p> : null}
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onPatchPaymentMethod(method.code, { is_active: !method.is_active })}>
                      {method.is_active ? tx("Выключить", "Disable") : tx("Включить", "Enable")}
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        const details = window.prompt(tx("Новые реквизиты", "New payment details"), method.payment_details || "") || "";
                        const instructions = window.prompt(tx("Новая инструкция", "New instructions"), method.instructions || "") || "";
                        void onPatchPaymentMethod(method.code, { payment_details: details, instructions });
                      }}
                    >
                      {tx("Обновить реквизиты", "Update details")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "news" ? (
          <div className="admin-panel">
            <h3>{tx("Новости PIT BET", "PIT BET News")}</h3>
            <form className="admin-form" onSubmit={onCreateNews}>
              <input name="title" placeholder={tx("Заголовок", "Title")} required />
              <textarea name="body" placeholder={tx("Текст новости", "News text")} rows={4} required />
              <div className="admin-grid-3">
                <input name="category" placeholder={tx("Категория", "Category")} defaultValue="news" />
                <label className="switch-row" style={{ padding: "0 4px" }}>
                  <span>{tx("Опубликовать сразу", "Publish immediately")}</span>
                  <input name="is_published" type="checkbox" defaultChecked />
                </label>
                <button className="btn" type="submit">
                  {tx("Добавить новость", "Create news")}
                </button>
              </div>
            </form>

            <div className="admin-list">
              {news.map((item) => (
                <article key={item.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{item.title}</strong>
                    <span className={`badge ${item.is_published ? "success" : "pending"}`}>{item.is_published ? tx("Опубликовано", "Published") : tx("Черновик", "Draft")}</span>
                  </div>
                  <p className="muted">{tx("Категория", "Category")}: {item.category} • {item.published_at ? new Date(item.published_at).toLocaleString(isRu ? "ru-RU" : "en-US") : tx("без даты публикации", "no publish date")}</p>
                  <p className="stacked">{item.body}</p>
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onToggleNews(item)}>
                      {item.is_published ? tx("Снять с публикации", "Unpublish") : tx("Опубликовать", "Publish")}
                    </button>
                    <button className="btn danger" onClick={() => onDeleteNews(item.id)}>
                      {tx("Удалить", "Delete")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "promocodes" ? (
          <div className="admin-panel">
            <h3>{tx("Промокоды", "Promo codes")}</h3>
            <form className="admin-form" onSubmit={onCreatePromo}>
              <input name="code" placeholder={tx("Код (например PIT20)", "Code (e.g. PIT20)")} required />
              <input name="title" placeholder={tx("Название для админки", "Admin title")} required />
              <textarea name="description" placeholder={tx("Комментарий", "Comment")} rows={2} />
              <div className="admin-grid-3">
                <select name="kind" defaultValue="percent_discount">
                  <option value="percent_discount">{tx("Скидка в процентах", "Percent discount")}</option>
                  <option value="fixed_discount">{tx("Фиксированная скидка", "Fixed discount")}</option>
                  <option value="extra_days">{tx("Бонусные дни", "Bonus days")}</option>
                  <option value="free_access">{tx("Бесплатный доступ", "Free access")}</option>
                </select>
                <input name="value" type="number" min="0" defaultValue="20" placeholder={tx("Значение", "Value")} required />
                <select name="tariff_code" defaultValue="premium">
                  <option value="">{tx("Любой тариф", "Any tariff")}</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="admin-grid-3">
                <input name="max_activations" type="number" min="1" placeholder={tx("Лимит активаций", "Activation limit")} />
                <input name="expires_at" type="datetime-local" placeholder={tx("Срок действия", "Expires at")} />
                <label className="switch-row" style={{ padding: "0 4px" }}>
                  <span>{tx("Активен", "Active")}</span>
                  <input name="is_active" type="checkbox" defaultChecked />
                </label>
              </div>
              <button className="btn" type="submit">
                {tx("Создать промокод", "Create promo code")}
              </button>
            </form>

            <div className="admin-list">
              {promoCodes.map((promo) => (
                <article key={promo.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{promo.code}</strong>
                    <span className={`badge ${promo.is_active ? "success" : "lost"}`}>{promo.is_active ? tx("Активен", "Active") : tx("Отключен", "Disabled")}</span>
                  </div>
                  <p className="muted">
                    {promo.title} • {tx("тип", "kind")}: {promo.kind} • {tx("значение", "value")}: {promo.value}
                  </p>
                  <p className="muted">
                    {tx("Тариф", "Tariff")}: {promo.tariff_code ? accessLabel(promo.tariff_code, language) : tx("любой", "any")} • {tx("активации", "activations")}: {promo.activations}
                    {promo.max_activations ? `/${promo.max_activations}` : ""}
                  </p>
                  <p className="muted">
                    {tx("Действует до", "Valid until")}: {promo.expires_at ? new Date(promo.expires_at).toLocaleString(isRu ? "ru-RU" : "en-US") : tx("без ограничения", "no limit")}
                  </p>
                  <div className="admin-grid-3">
                    <input
                      type="number"
                      min="0"
                      defaultValue={promo.value}
                      onBlur={(e) => {
                        const nextValue = Number(e.target.value);
                        if (!Number.isFinite(nextValue) || nextValue < 0 || nextValue === promo.value) return;
                        void api
                          .adminUpdatePromoCode(promo.id, { value: nextValue })
                          .then(async () => {
                            notifySuccess(tx("Значение промокода обновлено", "Promo code value updated"));
                            await loadAll();
                          })
                          .catch((err) => notifyError(textError(err, tx("Не удалось обновить значение", "Failed to update value"))));
                      }}
                    />
                    <select
                      defaultValue={promo.kind}
                      onChange={(e) => {
                        const nextKind = e.target.value as "percent_discount" | "fixed_discount" | "extra_days" | "free_access";
                        if (nextKind === promo.kind) return;
                        void api
                          .adminUpdatePromoCode(promo.id, { kind: nextKind })
                          .then(async () => {
                            notifySuccess(tx("Тип промокода обновлен", "Promo code type updated"));
                            await loadAll();
                          })
                          .catch((err) => notifyError(textError(err, tx("Не удалось обновить тип", "Failed to update type"))));
                      }}
                    >
                      <option value="percent_discount">{tx("% скидка", "% discount")}</option>
                      <option value="fixed_discount">{tx("фикс. скидка", "fixed discount")}</option>
                      <option value="extra_days">{tx("бонусные дни", "bonus days")}</option>
                      <option value="free_access">{tx("бесплатный доступ", "free access")}</option>
                    </select>
                    <input
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(promo.expires_at)}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        void api
                          .adminUpdatePromoCode(promo.id, { expires_at: value ? new Date(value).toISOString() : undefined })
                          .then(async () => {
                            notifySuccess(tx("Срок действия обновлен", "Expiration updated"));
                            await loadAll();
                          })
                          .catch((err) => notifyError(textError(err, tx("Не удалось обновить срок", "Failed to update expiration"))));
                      }}
                    />
                  </div>
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onTogglePromo(promo)}>
                      {promo.is_active ? tx("Отключить", "Disable") : tx("Активировать", "Enable")}
                    </button>
                    <button className="btn danger" onClick={() => onDeletePromo(promo.id)}>
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
            <h3>{tx("Рассылки", "Campaigns")}</h3>
            <p className="muted">{tx("Массовые и сегментные уведомления пользователям.", "Mass and segmented user notifications.")}</p>
            <div className="admin-form">
              <input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder={tx("Заголовок рассылки", "Campaign title")} />
              <textarea value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} rows={4} placeholder={tx("Текст сообщения", "Message text")} />
              <div className="admin-grid-2">
                <input value={campaignButtonText} onChange={(e) => setCampaignButtonText(e.target.value)} placeholder={tx("Текст кнопки (опционально)", "Button text (optional)")} />
                <input value={campaignButtonUrl} onChange={(e) => setCampaignButtonUrl(e.target.value)} placeholder={tx("Ссылка кнопки https://...", "Button URL https://...")} />
              </div>
              <div className="admin-grid-3">
                <select value={campaignSegment} onChange={(e) => setCampaignSegment(e.target.value)}>
                  <option value="all">{tx("Все пользователи", "All users")}</option>
                  <option value="free">{tx("Только бесплатные", "Free only")}</option>
                  <option value="premium">{tx("Только Премиум", "Premium only")}</option>
                  <option value="vip">{tx("Только VIP", "VIP only")}</option>
                  <option value="active_subscription">{tx("С активной подпиской", "With active subscription")}</option>
                  <option value="admin">{tx("Только админы", "Admins only")}</option>
                  <option value="notifications_enabled">{tx("Только с включенными уведомлениями", "Notifications enabled only")}</option>
                </select>
                <select value={campaignAccess} onChange={(e) => setCampaignAccess(e.target.value)}>
                  <option value="all">{tx("Любой доступ", "Any access")}</option>
                  <option value="free">Free</option>
                  <option value="premium">{tx("Премиум+", "Premium+")}</option>
                  <option value="vip">VIP</option>
                </select>
                <label className="switch-row" style={{ padding: "0 4px" }}>
                  <span>{tx("Только с включенными уведомлениями", "Notifications enabled only")}</span>
                  <input type="checkbox" checked={campaignNotifOnly} onChange={(e) => setCampaignNotifOnly(e.target.checked)} />
                </label>
              </div>
              <div className="cta-row">
                <button className="btn ghost" onClick={onCampaignPreview}>{tx("Превью аудитории", "Audience preview")}</button>
                <button className="btn" onClick={onCampaignSend}>{tx("Отправить рассылку", "Send campaign")}</button>
              </div>
              {campaignPreviewCount !== null ? <p className="muted">{tx("Оценка получателей", "Estimated recipients")}: {campaignPreviewCount}</p> : null}
              {campaignPreviewPayload ? (
                <div className="card-lite">
                  <p className="stacked"><b>{tx("Предпросмотр сообщения", "Message preview")}</b></p>
                  <p className="stacked"><b>{campaignPreviewPayload.title || tx("Без заголовка", "No title")}</b></p>
                  <p className="stacked">{campaignPreviewPayload.message || ""}</p>
                  {campaignPreviewPayload.button_text && campaignPreviewPayload.button_url ? (
                    <p className="stacked">
                      {tx("Кнопка", "Button")}: <b>{campaignPreviewPayload.button_text}</b> ({campaignPreviewPayload.button_url})
                    </p>
                  ) : (
                    <p className="stacked muted">{tx("Без кнопки", "No button")}</p>
                  )}
                </div>
              ) : null}
              {deliveryStats ? (
                <p className="muted">
                  {tx("Доставка (последние 500)", "Delivery (last 500)")}: {tx("всего", "total")} {deliveryStats.total} • {tx("отправлено", "sent")} {deliveryStats.sent} • {tx("ошибок", "failed")} {deliveryStats.failed} • {tx("в очереди", "queued")} {deliveryStats.queued}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "events" ? (
          <div className="admin-panel">
            <h3>{tx("События и агрегаты", "Events and aggregates")}</h3>
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
    </Layout>
  );
}

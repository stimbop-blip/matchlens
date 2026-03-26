import { FormEvent, useEffect, useMemo, useState } from "react";

import { Layout } from "../components/Layout";
import {
  api,
  type AdminPayment,
  type AdminPromoCode,
  type AdminStats,
  type AdminSubscription,
  type AdminUser,
  type NewsPost,
  type Prediction,
} from "../services/api";

type TabKey = "predictions" | "users" | "subscriptions" | "payments" | "news" | "promocodes" | "broadcasts" | "events";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "predictions", label: "Прогнозы" },
  { key: "users", label: "Пользователи" },
  { key: "subscriptions", label: "Подписки" },
  { key: "payments", label: "Платежи" },
  { key: "news", label: "Новости" },
  { key: "promocodes", label: "Промокоды" },
  { key: "broadcasts", label: "Рассылки" },
  { key: "events", label: "Статистика" },
];

function textError(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function accessLabel(value: string): string {
  if (value === "premium") return "Премиум";
  if (value === "vip") return "VIP";
  return "Бесплатный";
}

function statusLabel(value: string): string {
  if (value === "won") return "Выигрыш";
  if (value === "lost") return "Проигрыш";
  if (value === "refund") return "Возврат";
  if (value === "succeeded") return "Успешный";
  if (value === "failed") return "Ошибка";
  if (value === "canceled") return "Отменен";
  if (value === "active") return "Активна";
  if (value === "expired") return "Истекла";
  return "В ожидании";
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminPage() {
  const [tab, setTab] = useState<TabKey>("predictions");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
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
    const [p, u, s, pay, n, promos, st] = await Promise.all([
      api.adminPredictions(),
      api.adminUsers({ q: usersQuery || undefined, role }),
      api.adminSubscriptions({ q: subQuery || undefined, status: subStatus }),
      api.adminPayments({ user_query: paymentQuery || undefined, status: payStatus }),
      api.adminNews(),
      api.adminPromoCodes(),
      api.adminStats(),
    ]);
    setPredictions(p);
    setUsers(u);
    setSubscriptions(s);
    setPayments(pay);
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
      notifySuccess("Прогноз создан");
      form.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось создать прогноз"));
    } finally {
      setLoading(false);
    }
  };

  const onUpdatePrediction = async (id: string, payload: Record<string, unknown>) => {
    try {
      await api.adminUpdatePrediction(id, payload);
      notifySuccess("Прогноз обновлен");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Ошибка обновления прогноза"));
    }
  };

  const onDeletePrediction = async (id: string) => {
    if (!window.confirm("Удалить прогноз из ленты?")) return;
    try {
      await api.adminDeletePrediction(id);
      notifySuccess("Прогноз удален");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Ошибка удаления прогноза"));
    }
  };

  const onUpdateRole = async (userId: string, role: "user" | "admin") => {
    try {
      await api.adminUpdateUserRole(userId, role);
      notifySuccess(role === "admin" ? "Права администратора выданы" : "Права администратора сняты");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось изменить роль"));
    }
  };

  const onDeleteUser = async (userId: string) => {
    if (!window.confirm("Удалить пользователя? Действие необратимо.")) return;
    try {
      await api.adminDeleteUser(userId);
      notifySuccess("Пользователь удален");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Удаление пользователя недоступно"));
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
      notifySuccess("Подписка выдана");
      form.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось выдать подписку"));
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

  const onPaymentStatus = async (paymentId: string, status: "pending" | "succeeded" | "failed" | "canceled") => {
    try {
      await api.adminUpdatePaymentStatus(paymentId, status);
      notifySuccess("Статус платежа обновлен");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось обновить платеж"));
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
      notifySuccess("Новость добавлена");
      e.currentTarget.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось добавить новость"));
    }
  };

  const onToggleNews = async (item: NewsPost) => {
    try {
      await api.adminUpdateNews(item.id, { is_published: !item.is_published });
      notifySuccess(item.is_published ? "Новость снята с публикации" : "Новость опубликована");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось обновить новость"));
    }
  };

  const onDeleteNews = async (newsId: string) => {
    if (!window.confirm("Удалить новость?")) return;
    try {
      await api.adminDeleteNews(newsId);
      notifySuccess("Новость удалена");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось удалить новость"));
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
      notifySuccess("Промокод добавлен");
      e.currentTarget.reset();
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось создать промокод"));
    }
  };

  const onTogglePromo = async (item: AdminPromoCode) => {
    try {
      await api.adminUpdatePromoCode(item.id, { is_active: !item.is_active });
      notifySuccess(item.is_active ? "Промокод отключен" : "Промокод активирован");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось обновить промокод"));
    }
  };

  const onDeletePromo = async (id: string) => {
    if (!window.confirm("Удалить промокод?")) return;
    try {
      await api.adminDeletePromoCode(id);
      notifySuccess("Промокод удален");
      await loadAll();
    } catch (e) {
      notifyError(textError(e, "Не удалось удалить промокод"));
    }
  };

  const onDirectMessageUser = async (user: AdminUser) => {
    const text = window.prompt(`Сообщение для @${user.username || user.telegram_id}:`);
    if (!text || !text.trim()) return;

    const buttonTextRaw = window.prompt("Текст кнопки (опционально). Оставьте пустым, если кнопка не нужна:") || "";
    const buttonText = buttonTextRaw.trim();
    let buttonUrl: string | undefined;
    if (buttonText) {
      const buttonUrlRaw = window.prompt("Ссылка кнопки (https://...):") || "";
      if (!buttonUrlRaw.trim()) {
        notifyError("Чтобы отправить кнопку, укажите ссылку");
        return;
      }
      buttonUrl = buttonUrlRaw.trim();
    }

    try {
      const result = await api.adminDirectSend({
        title: "Сообщение от PIT BET",
        message: text.trim(),
        user_id: user.id,
        button_text: buttonText || undefined,
        button_url: buttonUrl,
      });
      if (result.queued > 0) {
        notifySuccess("Личное сообщение поставлено в очередь");
      } else {
        notifyError("Не удалось поставить сообщение в очередь");
      }
    } catch (e) {
      notifyError(textError(e, "Ошибка отправки личного сообщения"));
    }
  };

  const onCampaignPreview = async () => {
    const buttonText = campaignButtonText.trim();
    const buttonUrl = campaignButtonUrl.trim();
    if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
      notifyError("Для кнопки укажите и текст, и ссылку");
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
      notifyInfo(`Найдено получателей: ${preview.count}`);
    } catch (e) {
      notifyError(textError(e, "Не удалось сделать превью рассылки"));
    }
  };

  const onCampaignSend = async () => {
    if (!campaignTitle.trim() || !campaignMessage.trim()) {
      notifyError("Заполните заголовок и текст рассылки");
      return;
    }
    const buttonText = campaignButtonText.trim();
    const buttonUrl = campaignButtonUrl.trim();
    if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
      notifyError("Для кнопки укажите и текст, и ссылку");
      return;
    }
    if (!window.confirm("Подтвердить массовую рассылку?")) return;
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
      notifySuccess(`Рассылка поставлена в очередь: ${result.queued}`);
      setCampaignTitle("");
      setCampaignMessage("");
      setCampaignButtonText("");
      setCampaignButtonUrl("");
      setCampaignPreviewCount(null);
      setCampaignPreviewPayload(null);
    } catch (e) {
      notifyError(textError(e, "Не удалось запустить рассылку"));
    }
  };

  if (isAdmin === false) {
    return (
      <Layout>
        <section className="card">
          <h2>Админка</h2>
          <p className="empty-state">Доступ открыт только администраторам.</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Админка управления</h2>
          <span className="muted">Ручное управление контентом и доступом</span>
        </div>

        <div className="admin-tabs">
          {TABS.map((item) => (
            <button key={item.key} className={tab === item.key ? "tab active" : "tab"} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        {message ? <p className={`notice admin-toast ${messageTone}`}>{message}</p> : null}
        {loading ? <p className="muted">Обновляем данные...</p> : null}

        {tab === "predictions" ? (
          <div className="admin-panel">
            <h3>Прогнозы</h3>
            <form className="admin-form" onSubmit={onCreatePrediction}>
              <input name="title" placeholder="Заголовок (необязательно)" />
              <input name="match_name" placeholder="Матч" required />
              <input name="league" placeholder="Лига" required />
              <input name="sport_type" placeholder="Вид спорта" defaultValue="football" required />
              <input name="event_start_at" type="datetime-local" required />
              <input name="signal_type" placeholder="Тип сигнала" required />
              <input name="odds" type="number" min="1.01" step="0.01" defaultValue="1.80" required />
              <div className="admin-grid-3">
                <select name="risk_level" defaultValue="medium">
                  <option value="low">Риск: низкий</option>
                  <option value="medium">Риск: средний</option>
                  <option value="high">Риск: высокий</option>
                </select>
                <select name="access_level" defaultValue="free">
                  <option value="free">Доступ: Бесплатный</option>
                  <option value="premium">Доступ: Премиум</option>
                  <option value="vip">Доступ: VIP</option>
                </select>
                <select name="mode" defaultValue="prematch">
                  <option value="prematch">Формат: Прематч</option>
                  <option value="live">Формат: Лайв</option>
                </select>
              </div>
              <select name="status" defaultValue="pending">
                <option value="pending">Статус: в ожидании</option>
                <option value="win">Статус: выигрыш</option>
                <option value="lose">Статус: проигрыш</option>
                <option value="refund">Статус: возврат</option>
              </select>
              <textarea name="short_description" placeholder="Краткое описание" rows={3} />
              <button className="btn" type="submit">
                Добавить прогноз
              </button>
            </form>

            <input value={predQuery} onChange={(e) => setPredQuery(e.target.value)} placeholder="Поиск по матчу / сигналу" />
            <div className="admin-list">
              {visiblePredictions.slice(0, 80).map((item) => (
                <article key={item.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{item.match_name}</strong>
                    <span className={`access-pill ${item.access_level}`}>{accessLabel(item.access_level)}</span>
                  </div>
                  <p className="muted">{item.signal_type} • кф {item.odds} • {item.mode === "live" ? "Лайв" : "Прематч"}</p>
                  <div className="admin-grid-3">
                    <select defaultValue={item.status} onChange={(e) => onUpdatePrediction(item.id, { status: e.target.value })}>
                      <option value="pending">В ожидании</option>
                      <option value="won">Выигрыш</option>
                      <option value="lost">Проигрыш</option>
                      <option value="refund">Возврат</option>
                    </select>
                    <select defaultValue={item.access_level} onChange={(e) => onUpdatePrediction(item.id, { access_level: e.target.value })}>
                      <option value="free">Бесплатный</option>
                      <option value="premium">Премиум</option>
                      <option value="vip">VIP</option>
                    </select>
                    <input type="number" step="0.01" min="1.01" defaultValue={item.odds} onBlur={(e) => onUpdatePrediction(item.id, { odds: Number(e.target.value) })} />
                  </div>
                  <div className="cta-row">
                    <button className="btn ghost" type="button" onClick={() => setEditingPredictionId(item.id)}>
                      Редактировать
                    </button>
                    <button className="btn danger" type="button" onClick={() => onDeletePrediction(item.id)}>
                      Удалить
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
                      <input name="title" defaultValue={item.title} placeholder="Заголовок" />
                      <input name="league" defaultValue={item.league || ""} placeholder="Лига" />
                      <textarea name="short_description" defaultValue={item.short_description || ""} rows={3} />
                      <button className="btn" type="submit">
                        Сохранить изменения
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
            <h3>Пользователи</h3>
            <div className="filter-row">
              <input value={usersQuery} onChange={(e) => setUsersQuery(e.target.value)} placeholder="Поиск по telegram_id / username" />
              <select value={usersRoleFilter} onChange={(e) => setUsersRoleFilter(e.target.value)}>
                <option value="all">Все роли</option>
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="admin-list">
              {users.map((user) => {
                const latestSub = latestSubscriptionByUser.get(user.id);
                return (
                  <article key={user.id} className="prediction-card admin-item">
                    <div className="prediction-top">
                      <strong>{user.first_name || "Без имени"}</strong>
                      <span className={user.role === "admin" ? "badge success" : "badge"}>{user.role === "admin" ? "администратор" : "пользователь"}</span>
                    </div>
                    <p className="muted">@{user.username || "-"} • tg: {user.telegram_id}</p>
                    <p className="muted">Тариф: {accessLabel(user.tariff)} • до: {user.subscription_ends_at || "—"}</p>
                    <p className="muted">
                      Рефкод: {user.referral_code || "—"} • приглашено: {user.referrals_invited ?? 0} • активировано: {user.referrals_activated ?? 0} • бонусных дней: {user.referral_bonus_days ?? 0}
                    </p>
                    <div className="cta-row wrap">
                      {user.role === "admin" ? (
                        <button className="btn ghost" onClick={() => onUpdateRole(user.id, "user")}>Снять админку</button>
                      ) : (
                        <button className="btn" onClick={() => onUpdateRole(user.id, "admin")}>Выдать админку</button>
                      )}
                      <button
                        className="btn ghost"
                        onClick={() =>
                          onSubAction(
                            () => api.adminGrantSubscription({ user_id: user.id, tariff_code: "premium", duration_days: 30 }),
                            "Премиум выдан на 30 дней",
                            "Не удалось выдать Премиум"
                          )
                        }
                      >
                        Выдать Премиум
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() =>
                          onSubAction(
                            () => api.adminGrantSubscription({ user_id: user.id, tariff_code: "vip", duration_days: 30 }),
                            "VIP выдан на 30 дней",
                            "Не удалось выдать VIP"
                          )
                        }
                      >
                        Выдать VIP
                      </button>
                      {latestSub ? (
                        <>
                          <button className="btn" onClick={() => onSubAction(() => api.adminExtendSubscription(latestSub.id, 30), "Подписка продлена на 30 дней", "Не удалось продлить")}>Продлить +30</button>
                          <button className="btn" onClick={() => onSubAction(() => api.adminChangeSubscriptionTariff(latestSub.id, { tariff_code: "free" }), "Тариф переведен на бесплатный", "Не удалось сменить тариф")}>На бесплатный</button>
                          <button className="btn danger" onClick={() => onSubAction(() => api.adminCancelSubscription(latestSub.id), "Подписка отменена", "Не удалось отменить")}>Отменить подписку</button>
                        </>
                      ) : null}
                      <button className="btn danger" onClick={() => onDeleteUser(user.id)}>Удалить</button>
                      <button className="btn" onClick={() => onDirectMessageUser(user)}>Сообщение</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "subscriptions" ? (
          <div className="admin-panel">
            <h3>Подписки</h3>
            <form className="admin-form" onSubmit={onGrantSubscription}>
              <div className="admin-grid-2">
                <input name="user_id" placeholder="user_id (или оставьте пустым)" />
                <input name="telegram_id" placeholder="telegram_id" />
              </div>
              <div className="admin-grid-3">
                <select name="tariff_code" defaultValue="premium">
                  <option value="free">Бесплатный</option>
                  <option value="premium">Премиум</option>
                  <option value="vip">VIP</option>
                </select>
                <input name="duration_days" type="number" min="1" defaultValue="30" />
                <button className="btn" type="submit">Выдать подписку</button>
              </div>
            </form>

            <div className="filter-row">
              <input value={subQuery} onChange={(e) => setSubQuery(e.target.value)} placeholder="Поиск по пользователю" />
              <select value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value)}>
                <option value="all">Все статусы</option>
                <option value="active">Активна</option>
                <option value="expired">Истекла</option>
                <option value="canceled">Отменена</option>
              </select>
            </div>

            <div className="admin-list">
              {subscriptions.map((sub) => (
                <article key={sub.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>@{sub.username || sub.telegram_id}</strong>
                    <span className={`access-pill ${sub.tariff_code}`}>{accessLabel(sub.tariff_code)}</span>
                  </div>
                  <p className="muted">{statusLabel(sub.status)} • до {new Date(sub.ends_at).toLocaleDateString("ru-RU")}</p>
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onSubAction(() => api.adminExtendSubscription(sub.id, 7), "Подписка продлена на 7 дней", "Не удалось продлить")}>+7 дней</button>
                    <button className="btn ghost" onClick={() => onSubAction(() => api.adminExtendSubscription(sub.id, 30), "Подписка продлена на 30 дней", "Не удалось продлить")}>+30 дней</button>
                    <button className="btn" onClick={() => onSubAction(() => api.adminChangeSubscriptionTariff(sub.id, { tariff_code: "premium" }), "Тариф обновлен", "Не удалось сменить тариф")}>На Премиум</button>
                    <button className="btn" onClick={() => onSubAction(() => api.adminChangeSubscriptionTariff(sub.id, { tariff_code: "vip" }), "Тариф обновлен", "Не удалось сменить тариф")}>На VIP</button>
                    <button className="btn danger" onClick={() => onSubAction(() => api.adminCancelSubscription(sub.id), "Подписка отменена", "Не удалось отменить подписку")}>Отменить</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "payments" ? (
          <div className="admin-panel">
            <h3>Платежи</h3>
            <div className="filter-row">
              <input value={paymentQuery} onChange={(e) => setPaymentQuery(e.target.value)} placeholder="Поиск по пользователю" />
              <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                <option value="all">Все статусы</option>
                <option value="pending">В ожидании</option>
                <option value="succeeded">Успешный</option>
                <option value="failed">Ошибка</option>
                <option value="canceled">Отменен</option>
              </select>
            </div>
            <div className="admin-list">
              {payments.map((payment) => (
                <article key={payment.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{payment.amount_rub} RUB • {accessLabel(payment.tariff_code)}</strong>
                    <span className={`badge ${payment.status}`}>{statusLabel(payment.status)}</span>
                  </div>
                  <p className="muted">@{payment.username || "-"} • tg: {payment.telegram_id}</p>
                  <p className="muted">order: {payment.provider_order_id}</p>
                  <div className="admin-grid-2">
                    <button className="btn" onClick={() => onPaymentStatus(payment.id, "succeeded")}>Пометить успешным</button>
                    <button className="btn danger" onClick={() => onPaymentStatus(payment.id, "failed")}>Пометить ошибкой</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "news" ? (
          <div className="admin-panel">
            <h3>Новости PIT BET</h3>
            <form className="admin-form" onSubmit={onCreateNews}>
              <input name="title" placeholder="Заголовок" required />
              <textarea name="body" placeholder="Текст новости" rows={4} required />
              <div className="admin-grid-3">
                <input name="category" placeholder="Категория" defaultValue="news" />
                <label className="switch-row" style={{ padding: "0 4px" }}>
                  <span>Опубликовать сразу</span>
                  <input name="is_published" type="checkbox" defaultChecked />
                </label>
                <button className="btn" type="submit">
                  Добавить новость
                </button>
              </div>
            </form>

            <div className="admin-list">
              {news.map((item) => (
                <article key={item.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{item.title}</strong>
                    <span className={`badge ${item.is_published ? "success" : "pending"}`}>{item.is_published ? "Опубликовано" : "Черновик"}</span>
                  </div>
                  <p className="muted">Категория: {item.category} • {item.published_at ? new Date(item.published_at).toLocaleString("ru-RU") : "без даты публикации"}</p>
                  <p className="stacked">{item.body}</p>
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onToggleNews(item)}>
                      {item.is_published ? "Снять с публикации" : "Опубликовать"}
                    </button>
                    <button className="btn danger" onClick={() => onDeleteNews(item.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "promocodes" ? (
          <div className="admin-panel">
            <h3>Промокоды</h3>
            <form className="admin-form" onSubmit={onCreatePromo}>
              <input name="code" placeholder="Код (например PIT20)" required />
              <input name="title" placeholder="Название для админки" required />
              <textarea name="description" placeholder="Комментарий" rows={2} />
              <div className="admin-grid-3">
                <select name="kind" defaultValue="percent_discount">
                  <option value="percent_discount">Скидка в процентах</option>
                  <option value="fixed_discount">Фиксированная скидка</option>
                  <option value="extra_days">Бонусные дни</option>
                  <option value="free_access">Бесплатный доступ</option>
                </select>
                <input name="value" type="number" min="0" defaultValue="20" placeholder="Значение" required />
                <select name="tariff_code" defaultValue="premium">
                  <option value="">Любой тариф</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="admin-grid-3">
                <input name="max_activations" type="number" min="1" placeholder="Лимит активаций" />
                <input name="expires_at" type="datetime-local" placeholder="Срок действия" />
                <label className="switch-row" style={{ padding: "0 4px" }}>
                  <span>Активен</span>
                  <input name="is_active" type="checkbox" defaultChecked />
                </label>
              </div>
              <button className="btn" type="submit">
                Создать промокод
              </button>
            </form>

            <div className="admin-list">
              {promoCodes.map((promo) => (
                <article key={promo.id} className="prediction-card admin-item">
                  <div className="prediction-top">
                    <strong>{promo.code}</strong>
                    <span className={`badge ${promo.is_active ? "success" : "lost"}`}>{promo.is_active ? "Активен" : "Отключен"}</span>
                  </div>
                  <p className="muted">
                    {promo.title} • тип: {promo.kind} • значение: {promo.value}
                  </p>
                  <p className="muted">
                    Тариф: {promo.tariff_code ? accessLabel(promo.tariff_code) : "любой"} • активации: {promo.activations}
                    {promo.max_activations ? `/${promo.max_activations}` : ""}
                  </p>
                  <p className="muted">
                    Действует до: {promo.expires_at ? new Date(promo.expires_at).toLocaleString("ru-RU") : "без ограничения"}
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
                            notifySuccess("Значение промокода обновлено");
                            await loadAll();
                          })
                          .catch((err) => notifyError(textError(err, "Не удалось обновить значение")));
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
                            notifySuccess("Тип промокода обновлен");
                            await loadAll();
                          })
                          .catch((err) => notifyError(textError(err, "Не удалось обновить тип")));
                      }}
                    >
                      <option value="percent_discount">% скидка</option>
                      <option value="fixed_discount">фикс. скидка</option>
                      <option value="extra_days">бонусные дни</option>
                      <option value="free_access">бесплатный доступ</option>
                    </select>
                    <input
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(promo.expires_at)}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        void api
                          .adminUpdatePromoCode(promo.id, { expires_at: value ? new Date(value).toISOString() : undefined })
                          .then(async () => {
                            notifySuccess("Срок действия обновлен");
                            await loadAll();
                          })
                          .catch((err) => notifyError(textError(err, "Не удалось обновить срок")));
                      }}
                    />
                  </div>
                  <div className="cta-row wrap">
                    <button className="btn ghost" onClick={() => onTogglePromo(promo)}>
                      {promo.is_active ? "Отключить" : "Активировать"}
                    </button>
                    <button className="btn danger" onClick={() => onDeletePromo(promo.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "broadcasts" ? (
          <div className="admin-panel">
            <h3>Рассылки</h3>
            <p className="muted">Массовые и сегментные уведомления пользователям.</p>
            <div className="admin-form">
              <input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder="Заголовок рассылки" />
              <textarea value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} rows={4} placeholder="Текст сообщения" />
              <div className="admin-grid-2">
                <input value={campaignButtonText} onChange={(e) => setCampaignButtonText(e.target.value)} placeholder="Текст кнопки (опционально)" />
                <input value={campaignButtonUrl} onChange={(e) => setCampaignButtonUrl(e.target.value)} placeholder="Ссылка кнопки https://..." />
              </div>
              <div className="admin-grid-3">
                <select value={campaignSegment} onChange={(e) => setCampaignSegment(e.target.value)}>
                  <option value="all">Все пользователи</option>
                  <option value="free">Только бесплатные</option>
                  <option value="premium">Только Премиум</option>
                  <option value="vip">Только VIP</option>
                  <option value="active_subscription">С активной подпиской</option>
                  <option value="admin">Только админы</option>
                  <option value="notifications_enabled">Только с включенными уведомлениями</option>
                </select>
                <select value={campaignAccess} onChange={(e) => setCampaignAccess(e.target.value)}>
                  <option value="all">Любой доступ</option>
                  <option value="free">Free</option>
                  <option value="premium">Премиум+</option>
                  <option value="vip">VIP</option>
                </select>
                <label className="switch-row" style={{ padding: "0 4px" }}>
                  <span>Только с включенными уведомлениями</span>
                  <input type="checkbox" checked={campaignNotifOnly} onChange={(e) => setCampaignNotifOnly(e.target.checked)} />
                </label>
              </div>
              <div className="cta-row">
                <button className="btn ghost" onClick={onCampaignPreview}>Превью аудитории</button>
                <button className="btn" onClick={onCampaignSend}>Отправить рассылку</button>
              </div>
              {campaignPreviewCount !== null ? <p className="muted">Оценка получателей: {campaignPreviewCount}</p> : null}
              {campaignPreviewPayload ? (
                <div className="card-lite">
                  <p className="stacked"><b>Предпросмотр сообщения</b></p>
                  <p className="stacked"><b>{campaignPreviewPayload.title || "Без заголовка"}</b></p>
                  <p className="stacked">{campaignPreviewPayload.message || ""}</p>
                  {campaignPreviewPayload.button_text && campaignPreviewPayload.button_url ? (
                    <p className="stacked">
                      Кнопка: <b>{campaignPreviewPayload.button_text}</b> ({campaignPreviewPayload.button_url})
                    </p>
                  ) : (
                    <p className="stacked muted">Без кнопки</p>
                  )}
                </div>
              ) : null}
              {deliveryStats ? (
                <p className="muted">
                  Доставка (последние 500): всего {deliveryStats.total} • отправлено {deliveryStats.sent} • ошибок {deliveryStats.failed} • в очереди {deliveryStats.queued}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "events" ? (
          <div className="admin-panel">
            <h3>События и агрегаты</h3>
            <div className="metrics-grid">
              <article>
                <span>Пользователи</span>
                <strong>{stats?.users_total ?? 0}</strong>
              </article>
              <article>
                <span>Активные подписки</span>
                <strong>{stats?.active_subscriptions ?? 0}</strong>
              </article>
              <article>
                <span>Прогнозов</span>
                <strong>{stats?.predictions_total ?? 0}</strong>
              </article>
              <article>
                <span>Точность / ROI</span>
                <strong>{stats?.hit_rate ?? 0}% / {stats?.roi ?? 0}%</strong>
              </article>
            </div>
            <div className="admin-grid-3">
              <div className="card-lite">Бесплатный: {stats?.users_by_access?.free ?? 0}</div>
              <div className="card-lite">Премиум: {stats?.users_by_access?.premium ?? 0}</div>
              <div className="card-lite">VIP: {stats?.users_by_access?.vip ?? 0}</div>
            </div>
            <div className="admin-grid-4">
              <div className="card-lite">В ожидании: {stats?.predictions_by_status?.pending ?? 0}</div>
              <div className="card-lite">Выигрыш: {stats?.predictions_by_status?.won ?? 0}</div>
              <div className="card-lite">Проигрыш: {stats?.predictions_by_status?.lost ?? 0}</div>
              <div className="card-lite">Возврат: {stats?.predictions_by_status?.refund ?? 0}</div>
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

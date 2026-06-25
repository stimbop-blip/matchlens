import { type FormEvent, useMemo, useState } from "react";

import { api } from "../../services/api";
import { BottomSheet } from "./BottomSheet";
import { accessLabel, formatDateTime, statusLabel, textError, type AdminSubscription, type Language } from "./shared";

type SubscriptionsTabProps = {
  language: Language;
  subscriptions: AdminSubscription[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function SubscriptionsTab({ language, subscriptions, onReload, onNotify }: SubscriptionsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showGrant, setShowGrant] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;
      if (!q) return true;
      const base = `${sub.username || ""} ${sub.telegram_id} ${sub.tariff_code}`.toLowerCase();
      return base.includes(q);
    });
  }, [subscriptions, query, statusFilter]);

  const onSubAction = async (action: () => Promise<unknown>, success: string, fail: string) => {
    try {
      await action();
      onNotify(success, "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, fail), "error");
    }
  };

  const onGrant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminGrantSubscription({
        user_id: String(formData.get("user_id") || "").trim() || undefined,
        telegram_id: String(formData.get("telegram_id") || "").trim() ? Number(formData.get("telegram_id")) : undefined,
        tariff_code: String(formData.get("tariff_code") || "free") as "free" | "premium" | "vip",
        duration_days: Number(formData.get("duration_days") || 30),
      });
      onNotify(tx("Подписка выдана", "Subscription granted"), "success");
      setShowGrant(false);
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось выдать подписку", "Failed to grant subscription")), "error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <button className="btn" type="button" onClick={() => setShowGrant(true)}>
            {tx("Выдать подписку", "Grant subscription")}
          </button>
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск: пользователь, telegram id", "Search: user, telegram id")} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{tx("Все статусы", "All statuses")}</option>
            <option value="active">{tx("Активна", "Active")}</option>
            <option value="expired">{tx("Истекла", "Expired")}</option>
            <option value="canceled">{tx("Отменена", "Canceled")}</option>
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((sub) => (
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

      <BottomSheet open={showGrant} title={tx("Выдать подписку вручную", "Grant subscription manually")} onClose={() => setShowGrant(false)}>
        <form className="admin-sheet-form" onSubmit={onGrant}>
          <section className="admin-editor-section">
            <h4 className="admin-section-title">
              <span className="emoji">🎁</span>
              {tx("Параметры подписки", "Subscription settings")}
            </h4>
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
            <button className="btn ghost" type="button" onClick={() => setShowGrant(false)}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit">
              {tx("Выдать", "Grant")}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}

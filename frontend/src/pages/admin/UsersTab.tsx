import { useMemo, useState } from "react";

import { api } from "../../services/api";
import {
  accessLabel,
  formatDateTime,
  textError,
  type AdminSubscription,
  type AdminUser,
  type Language,
} from "./shared";

type UsersTabProps = {
  language: Language;
  users: AdminUser[];
  subscriptions: AdminSubscription[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function UsersTab({ language, users, subscriptions, onReload, onNotify }: UsersTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tariffFilter, setTariffFilter] = useState<"all" | "free" | "premium" | "vip">("all");

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (tariffFilter !== "all" && user.tariff !== tariffFilter) return false;
      if (!q) return true;
      const base = `${user.first_name || ""} ${user.username || ""} ${user.telegram_id}`.toLowerCase();
      return base.includes(q);
    });
  }, [users, query, roleFilter, tariffFilter]);

  const onSubAction = async (action: () => Promise<unknown>, success: string, fail: string) => {
    try {
      await action();
      onNotify(success, "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, fail), "error");
    }
  };

  const onUpdateRole = async (userId: string, role: "user" | "support" | "admin") => {
    try {
      await api.adminUpdateUserRole(userId, role);
      if (role === "admin") onNotify(tx("Права администратора выданы", "Admin permissions granted"), "success");
      else if (role === "support") onNotify(tx("Роль техподдержки выдана", "Support role granted"), "success");
      else onNotify(tx("Роль обновлена", "Role updated"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось изменить роль", "Failed to update role")), "error");
    }
  };

  const onDeleteUser = async (userId: string) => {
    if (!window.confirm(tx("Удалить пользователя? Действие необратимо.", "Delete user? This action is irreversible."))) return;
    try {
      await api.adminDeleteUser(userId);
      onNotify(tx("Пользователь удален", "User deleted"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Удаление пользователя недоступно", "User deletion is unavailable")), "error");
    }
  };

  const onDirectMessage = async (user: AdminUser) => {
    const text = window.prompt(tx(`Сообщение для @${user.username || user.telegram_id}:`, `Message for @${user.username || user.telegram_id}:`));
    if (!text || !text.trim()) return;

    const buttonTextRaw = window.prompt(tx("Текст кнопки (опционально):", "Button text (optional):")) || "";
    const buttonText = buttonTextRaw.trim();
    let buttonUrl: string | undefined;
    if (buttonText) {
      const buttonUrlRaw = window.prompt(tx("Ссылка кнопки (https://...):", "Button URL (https://...):")) || "";
      if (!buttonUrlRaw.trim()) {
        onNotify(tx("Чтобы отправить кнопку, укажите ссылку", "Provide a URL to send a button"), "error");
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
        onNotify(tx("Личное сообщение поставлено в очередь", "Direct message queued"), "success");
      } else {
        onNotify(tx("Не удалось поставить сообщение в очередь", "Failed to queue direct message"), "error");
      }
    } catch (e) {
      onNotify(textError(e, tx("Ошибка отправки личного сообщения", "Failed to send direct message")), "error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск: имя, username, telegram id", "Search: name, username, telegram id")} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">{tx("Все роли", "All roles")}</option>
            <option value="user">{tx("Пользователь", "User")}</option>
            <option value="support">{tx("Техподдержка", "Support")}</option>
            <option value="admin">{tx("Администратор", "Admin")}</option>
          </select>
          <select value={tariffFilter} onChange={(e) => setTariffFilter(e.target.value as "all" | "free" | "premium" | "vip")}>
            <option value="all">{tx("Все тарифы", "All plans")}</option>
            <option value="free">{tx("Бесплатный", "Free")}</option>
            <option value="premium">{tx("Премиум", "Premium")}</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((user) => {
          const latestSub = latestSubscriptionByUser.get(user.id);
          return (
            <article key={user.id} className="prediction-card admin-item admin-card-compact">
              <div className="prediction-top admin-card-title-row">
                <strong>{user.first_name || tx("Без имени", "No name")}</strong>
                <span className={user.role === "admin" ? "badge success" : user.role === "support" ? "badge warning" : "badge"}>
                  {user.role === "admin" ? tx("админ", "admin") : user.role === "support" ? tx("поддержка", "support") : tx("user", "user")}
                </span>
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
                      tx("Не удалось выдать Премиум", "Failed to grant Premium"),
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
                      tx("Не удалось выдать VIP", "Failed to grant VIP"),
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
                          tx("Не удалось продлить", "Failed to extend"),
                        )
                      : undefined
                  }
                >
                  {tx("+30 дней", "+30 days")}
                </button>
                <button className="btn ghost" type="button" onClick={() => void onDirectMessage(user)}>
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

                {user.role === "support" ? (
                  <button className="btn ghost" type="button" onClick={() => void onUpdateRole(user.id, "user")}>
                    {tx("Снять поддержку", "Revoke support")}
                  </button>
                ) : (
                  <button className="btn ghost" type="button" onClick={() => void onUpdateRole(user.id, "support")}>
                    {tx("Выдать поддержку", "Grant support")}
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
                          tx("Не удалось отменить", "Failed to cancel"),
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
  );
}

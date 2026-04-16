import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
import { AppShellSection, SectionHeader } from "../components/ui";
import { api, type NotificationHistoryItem, type NotificationSettings } from "../services/api";

type SettingsKey = keyof NotificationSettings;

const CATEGORY_KEYS: SettingsKey[] = [
  "notify_free",
  "notify_premium",
  "notify_vip",
  "notify_results",
  "notify_news",
  "notify_report_daily",
  "notify_report_weekly",
  "notify_report_monthly",
];

function countEnabledCategories(settings: NotificationSettings | null): number {
  if (!settings) return 0;
  return CATEGORY_KEYS.reduce((total, key) => total + (settings[key] ? 1 : 0), 0);
}

export function NotificationsPage() {
  const { t, language } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<SettingsKey | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const enabledCount = useMemo(() => countEnabledCategories(settings), [settings]);

  const lockReason = (key: SettingsKey): string | null => {
    if (key === "notify_premium" && subscription.tariff === "free") return t("profile.notifications.lockPremium");
    if (key === "notify_vip" && subscription.tariff !== "vip") return t("profile.notifications.lockVip");
    if (["notify_report_daily", "notify_report_weekly", "notify_report_monthly"].includes(key) && subscription.tariff === "free") {
      return t("profile.notifications.lockPremium");
    }
    return null;
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return t("common.noDate");
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadSettings = async () => {
    setLoading(true);
    const [settingsRes, subscriptionRes, historyRes] = await Promise.allSettled([api.myNotificationSettings(), api.mySubscription(), api.myNotifications(30)]);
    setSettings(settingsRes.status === "fulfilled" ? settingsRes.value : null);
    setSubscriptionRaw(subscriptionRes.status === "fulfilled" ? subscriptionRes.value : null);
    setHistory(historyRes.status === "fulfilled" ? historyRes.value : []);
    setLoading(false);
  };

  const refreshHistory = async () => {
    setHistoryLoading(true);
    try {
      const rows = await api.myNotifications(30);
      setHistory(rows);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const updateSetting = async (key: SettingsKey, nextValue: boolean) => {
    if (!settings) return;
    if (lockReason(key)) return;

    const previous = settings;
    setNotice(null);
    setSavingKey(key);
    setSettings({ ...settings, [key]: nextValue });

    try {
      const updated = await api.updateMyNotificationSettings({ [key]: nextValue });
      setSettings(updated);
      setNotice({ type: "success", text: t("profile.notifications.saved") });
    } catch {
      setSettings(previous);
      setNotice({ type: "error", text: t("profile.notifications.failed") });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="pb-premium-panel pb-reveal">
          <AIScanningLoader />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className="pb-live-pill">{settings?.notifications_enabled ? "ON" : "OFF"}</span>
        </div>
        <h2>{t("profile.notifications.title")}</h2>
        <p>{t("profile.notifications.subtitle")}</p>
        <div className="pb-hero-mini-info">
          <span>
            {t("common.status.active")}: <b>{settings?.notifications_enabled ? t("common.status.active") : t("common.status.inactive")}</b>
          </span>
            <span>
            {t("menu.account.notifications.categories", { enabled: enabledCount, total: 8 })}
            </span>
          </div>
        </section>

      <AppShellSection>
        <SectionHeader title={t("profile.notifications.title")} subtitle={t("menu.account.notifications.subtitle")} />

        {!settings ? (
          <>
            <p className="muted">{t("profile.notifications.empty")}</p>
            <button type="button" className="btn" onClick={() => void loadSettings()}>
              {t("common.retry")}
            </button>
          </>
        ) : (
          <div className="pb-notify-card">
            <label className="pb-notify-row">
              <span className="pb-notify-copy">
                <strong>{t("profile.notifications.enable")}</strong>
                <small>{t("menu.account.notifications.subtitle")}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                disabled={savingKey !== null}
                onChange={(event) => {
                  void updateSetting("notifications_enabled", event.currentTarget.checked);
                }}
              />
            </label>

            {[
              { key: "notify_free" as const, label: t("profile.notifications.free") },
              { key: "notify_premium" as const, label: t("profile.notifications.premium") },
              { key: "notify_vip" as const, label: t("profile.notifications.vip") },
              { key: "notify_results" as const, label: t("profile.notifications.results") },
              { key: "notify_news" as const, label: t("profile.notifications.news") },
              { key: "notify_report_daily" as const, label: t("profile.notifications.reportDaily") },
              { key: "notify_report_weekly" as const, label: t("profile.notifications.reportWeekly") },
              { key: "notify_report_monthly" as const, label: t("profile.notifications.reportMonthly") },
            ].map((item) => {
              const lockedText = lockReason(item.key);
              const disabled = Boolean(lockedText) || savingKey !== null;
              return (
                <label key={item.key} className={disabled ? "pb-notify-row disabled" : "pb-notify-row"}>
                  <span className="pb-notify-copy">
                    <strong>{item.label}</strong>
                    {lockedText ? <small>{lockedText}</small> : null}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[item.key])}
                    disabled={disabled}
                    onChange={(event) => {
                      void updateSetting(item.key, event.currentTarget.checked);
                    }}
                  />
                </label>
              );
            })}
          </div>
        )}

        {notice ? <p className={`notice ${notice.type}`}>{notice.text}</p> : null}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("profile.notifications.historyTitle")} subtitle={t("profile.notifications.historySubtitle")} />
        <div className="pb-notify-history-head">
          <small className="muted">{t("profile.notifications.historyCount", { count: history.length })}</small>
          <button type="button" className="btn ghost" disabled={historyLoading} onClick={() => void refreshHistory()}>
            {historyLoading ? t("common.loading") : t("common.retry")}
          </button>
        </div>
        {history.length === 0 ? (
          <p className="muted">{t("profile.notifications.historyEmpty")}</p>
        ) : (
          <div className="pb-notify-history-list">
            {history.map((item) => (
              <article key={item.id} className="pb-notify-history-item">
                <div className="pb-notify-history-meta">
                  <strong>{item.title}</strong>
                  <span>{formatDateTime(item.sent_at || item.created_at)}</span>
                </div>
                <p>{item.message}</p>
                <div className="pb-notify-history-foot">
                  <span className={item.status === "sent" ? "badge success" : item.status === "queued" ? "badge info" : "badge warning"}>
                    {item.status === "sent"
                      ? t("profile.notifications.historySent")
                      : item.status === "queued"
                        ? t("profile.notifications.historyQueued")
                        : t("profile.notifications.historyFailed")}
                  </span>
                  {item.button_text && item.button_url ? (
                    <a className="btn ghost" href={item.button_url} target="_blank" rel="noreferrer">
                      {item.button_text}
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

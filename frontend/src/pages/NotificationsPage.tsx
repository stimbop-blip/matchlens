import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, RocketLoader, SectionHeader } from "../components/ui";
import { api, type NotificationSettings } from "../services/api";

type SettingsKey = keyof NotificationSettings;

const CATEGORY_KEYS: SettingsKey[] = ["notify_free", "notify_premium", "notify_vip", "notify_results", "notify_news"];

function countEnabledCategories(settings: NotificationSettings | null): number {
  if (!settings) return 0;
  return CATEGORY_KEYS.reduce((total, key) => total + (settings[key] ? 1 : 0), 0);
}

export function NotificationsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SettingsKey | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const enabledCount = useMemo(() => countEnabledCategories(settings), [settings]);

  const lockReason = (key: SettingsKey): string | null => {
    if (key === "notify_premium" && subscription.tariff === "free") return t("profile.notifications.lockPremium");
    if (key === "notify_vip" && subscription.tariff !== "vip") return t("profile.notifications.lockVip");
    return null;
  };

  const loadSettings = async () => {
    setLoading(true);
    const [settingsRes, subscriptionRes] = await Promise.allSettled([api.myNotificationSettings(), api.mySubscription()]);
    setSettings(settingsRes.status === "fulfilled" ? settingsRes.value : null);
    setSubscriptionRaw(subscriptionRes.status === "fulfilled" ? subscriptionRes.value : null);
    setLoading(false);
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
          <RocketLoader title={t("common.loading")} subtitle={t("profile.notifications.subtitle")} />
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
            {t("menu.account.notifications.categories", { enabled: enabledCount, total: 5 })}
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

      <AppDisclaimer />
    </Layout>
  );
}

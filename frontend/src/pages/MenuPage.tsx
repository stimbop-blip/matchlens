import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ActivityBand, AppShellSection, MoreFeatureCard, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

export function MenuPage() {
  const { t } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([api.me(), api.myNotificationSettings(), api.myReferral(), api.mySubscription()]);
      if (!alive) return;

      const [meRes, notifyRes, refRes, subRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const supportConfigured = !SUPPORT_URL.includes("your_support");
  const isAdmin = Boolean(me?.is_admin || me?.role === "admin");
  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const accessValue = subscription.tariff === "vip" ? t("common.vip") : subscription.tariff === "premium" ? t("common.premium") : t("common.free");
  const statusValue =
    subscription.status === "active"
      ? t("common.status.active")
      : subscription.status === "expired"
        ? t("common.status.expired")
        : subscription.status === "canceled"
          ? t("common.status.canceled")
          : t("common.status.unknown");

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          {isAdmin ? <span className="pb-live-pill">{t("layout.role.admin")}</span> : null}
        </div>
        <h2>{t("menu.heroTitle")}</h2>
        <p>{t("menu.heroSubtitle")}</p>
        <ActivityBand
          items={[
            { label: t("menu.metric.notifications"), value: notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive") },
            { label: t("menu.metric.referral"), value: `${referral?.invited ?? 0}/${referral?.activated ?? 0}`, tone: "accent" },
            { label: t("menu.metric.access"), value: subscription.tariff === "vip" ? t("common.vip") : subscription.tariff === "premium" ? t("common.premium") : t("common.free") },
          ]}
        />
      </section>

      <AppShellSection>
        <SectionHeader title={t("menu.title")} subtitle={t("menu.subtitle")} />

        <div className="pb-more-layout">
          <section className="pb-more-zone">
            <h3 className="pb-more-zone-title">{t("menu.section.account")}</h3>
            <div className="pb-more-feature-grid">
              <MoreFeatureCard
                to="/tariffs"
                title={t("hub.item.tariffs.title")}
                subtitle={t("hub.item.tariffs.desc")}
                metrics={[
                  { label: t("menu.metric.access"), value: accessValue },
                  { label: t("profile.snapshot.status"), value: statusValue },
                ]}
              />
              <MoreFeatureCard
                to="/profile#referral"
                title={t("hub.item.referrals.title")}
                subtitle={t("hub.item.referrals.desc")}
                metrics={[
                  { label: t("profile.referral.invited"), value: referral?.invited ?? 0 },
                  { label: t("profile.referral.activated"), value: referral?.activated ?? 0 },
                ]}
              />
            </div>
            <SettingsSection title={t("menu.section.account.settings")}>
              <SettingsRow
                icon="NT"
                title={t("hub.item.notifications.title")}
                subtitle={t("hub.item.notifications.desc")}
                value={notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive")}
                to="/profile#notifications"
              />
              <SettingsRow icon="PR" title={t("hub.item.profile.title")} subtitle={t("hub.item.profile.desc")} to="/profile" />
            </SettingsSection>
          </section>

          <section className="pb-more-zone">
            <h3 className="pb-more-zone-title">{t("menu.section.service")}</h3>
            <div className="pb-more-feature-grid single">
              <MoreFeatureCard
                to="/news"
                title={t("hub.item.news.title")}
                subtitle={t("hub.item.news.desc")}
                metrics={[
                  { label: t("menu.metric.notifications"), value: notify?.notify_news ? t("common.status.active") : t("common.status.inactive") },
                  { label: t("menu.metric.referral"), value: `${referral?.invited ?? 0}/${referral?.activated ?? 0}` },
                ]}
              />
            </div>
            <SettingsSection title={t("menu.section.service.tools")}>
              <SettingsRow icon="LN" title={t("hub.item.language.title")} subtitle={t("hub.item.language.desc")} to="/menu/language" />
              <SettingsRow icon="TH" title={t("hub.item.theme.title")} subtitle={t("hub.item.theme.desc")} to="/menu/theme" />
              {isAdmin ? <SettingsRow icon="AD" title={t("hub.item.admin.title")} subtitle={t("hub.item.admin.desc")} to="/admin" /> : null}
            </SettingsSection>
          </section>

          <section className="pb-more-zone">
            <h3 className="pb-more-zone-title">{t("menu.section.info")}</h3>
            <SettingsSection title={t("menu.section.info.links")}>
              <SettingsRow
                icon="SP"
                title={t("hub.item.support.title")}
                subtitle={supportConfigured ? t("hub.item.support.desc") : t("hub.support.notSet")}
                href={supportConfigured ? SUPPORT_URL : undefined}
                disabled={!supportConfigured}
              />
              <SettingsRow icon="RL" title={t("hub.item.rules.title")} subtitle={t("hub.item.rules.desc")} to="/menu/rules" />
              <SettingsRow icon="RG" title={t("hub.item.responsible.title")} subtitle={t("hub.item.responsible.desc")} to="/menu/responsible" />
            </SettingsSection>
          </section>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

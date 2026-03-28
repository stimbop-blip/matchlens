import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ActivityBand, AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

export function MenuPage() {
  const { t } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([api.me(), api.myNotificationSettings(), api.myReferral()]);
      if (!alive) return;

      const [meRes, notifyRes, refRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const supportConfigured = !SUPPORT_URL.includes("your_support");

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          {me?.is_admin || me?.role === "admin" ? <span className="pb-live-pill">{t("layout.role.admin")}</span> : null}
        </div>
        <h2>{t("menu.heroTitle")}</h2>
        <p>{t("menu.heroSubtitle")}</p>
        <ActivityBand
          items={[
            { label: t("menu.metric.notifications"), value: notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive") },
            { label: t("menu.metric.referral"), value: `${referral?.invited ?? 0}/${referral?.activated ?? 0}`, tone: "accent" },
            { label: t("menu.metric.access"), value: me?.is_admin || me?.role === "admin" ? t("layout.role.admin") : t("common.status.active") },
          ]}
        />
      </section>

      <AppShellSection>
        <SectionHeader title={t("menu.title")} subtitle={t("menu.subtitle")} />

        <SettingsSection title={t("menu.section.main")}>
          <SettingsRow icon="NW" title={t("hub.item.news.title")} subtitle={t("hub.item.news.desc")} to="/news" />
          <SettingsRow icon="MB" title={t("hub.item.tariffs.title")} subtitle={t("hub.item.tariffs.desc")} to="/tariffs" />
          <SettingsRow icon="RF" title={t("hub.item.referrals.title")} subtitle={t("hub.item.referrals.desc")} value={`${referral?.invited ?? 0}/${referral?.activated ?? 0}`} to="/profile#referral" />
          <SettingsRow
            icon="NT"
            title={t("hub.item.notifications.title")}
            subtitle={t("hub.item.notifications.desc")}
            value={notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive")}
            to="/profile#notifications"
          />
        </SettingsSection>

        <SettingsSection title={t("menu.section.preferences")}>
          <SettingsRow icon="LG" title={t("hub.item.language.title")} subtitle={t("hub.item.language.desc")} to="/menu/language" />
          <SettingsRow icon="TH" title={t("hub.item.theme.title")} subtitle={t("hub.item.theme.desc")} to="/menu/theme" />
          <SettingsRow
            icon="SP"
            title={t("hub.item.support.title")}
            subtitle={supportConfigured ? t("hub.item.support.desc") : t("hub.support.notSet")}
            href={supportConfigured ? SUPPORT_URL : undefined}
            disabled={!supportConfigured}
          />
        </SettingsSection>

        <SettingsSection title={t("menu.section.info")}>
          <SettingsRow icon="RL" title={t("hub.item.rules.title")} subtitle={t("hub.item.rules.desc")} to="/menu/rules" />
          <SettingsRow icon="RP" title={t("hub.item.responsible.title")} subtitle={t("hub.item.responsible.desc")} to="/menu/responsible" />
          {me?.is_admin || me?.role === "admin" ? <SettingsRow icon="AD" title={t("hub.item.admin.title")} subtitle={t("hub.item.admin.desc")} to="/admin" /> : null}
        </SettingsSection>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

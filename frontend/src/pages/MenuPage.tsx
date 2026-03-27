import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, MarketPulse, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string) {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

export function MenuPage() {
  const { t } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [subRaw, setSubRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([api.me(), api.myNotificationSettings(), api.mySubscription(), api.myReferral()]);
      if (!alive) return;

      const [meRes, notifyRes, subRes, refRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setSubRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subRaw);
  const supportConfigured = !SUPPORT_URL.includes("your_support");

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">{t("menu.hero.eyebrow")}</span>
          <AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />
        </div>

        <h2>{t("menu.hero.title")}</h2>
        <p>{t("menu.hero.subtitle")}</p>
        <MarketPulse label={t("layout.subtitle.hub")} values={[64, 60, 57, 54, 51, 49, 46, 43, 45, 41]} tag={t("layout.title.hub")} />
      </section>

      <AppShellSection>
        <SectionHeader title={t("menu.section.quick")} />
        <div className="pb-command-board">
          <SettingsRow icon="SG" title={t("hub.item.signals.title")} subtitle={t("hub.item.signals.desc")} to="/feed" />
          <SettingsRow icon="PF" title={t("hub.item.stats.title")} subtitle={t("hub.item.stats.desc")} to="/stats" />
          <SettingsRow icon="AC" title={t("hub.item.profile.title")} subtitle={t("hub.item.profile.desc")} to="/profile" />
          <SettingsRow icon="MB" title={t("hub.item.tariffs.title")} subtitle={t("hub.item.tariffs.desc")} to="/tariffs" />
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("menu.section.service")} />

        <SettingsSection title={t("hub.section.service")}> 
          <SettingsRow icon="NW" title={t("hub.item.news.title")} subtitle={t("hub.item.news.desc")} to="/news" />
          <SettingsRow icon="RF" title={t("hub.item.referrals.title")} subtitle={t("hub.item.referrals.desc")} value={`${referral?.invited ?? 0}/${referral?.activated ?? 0}`} to="/profile#referral" />
          <SettingsRow
            icon="NT"
            title={t("hub.item.notifications.title")}
            subtitle={t("hub.item.notifications.desc")}
            value={notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive")}
            to="/profile#notifications"
          />
          <SettingsRow icon="LG" title={t("hub.item.language.title")} subtitle={t("hub.item.language.desc")} to="/menu/language" />
          <SettingsRow icon="TH" title={t("hub.item.theme.title")} subtitle={t("hub.item.theme.desc")} to="/menu/theme" />
          <SettingsRow
            icon="SP"
            title={t("hub.item.support.title")}
            subtitle={supportConfigured ? t("hub.item.support.desc") : t("hub.support.notSet")}
            href={supportConfigured ? SUPPORT_URL : undefined}
            disabled={!supportConfigured}
          />
          <SettingsRow icon="RL" title={t("hub.item.rules.title")} subtitle={t("hub.item.rules.desc")} to="/menu/rules" />
          <SettingsRow icon="RP" title={t("hub.item.responsible.title")} subtitle={t("hub.item.responsible.desc")} to="/menu/responsible" />
          {me?.is_admin || me?.role === "admin" ? <SettingsRow icon="AD" title={t("hub.item.admin.title")} subtitle={t("hub.item.admin.desc")} to="/admin" /> : null}
        </SettingsSection>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { useTheme } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string) {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

export function MenuPage() {
  const { t, language } = useI18n();
  const { theme } = useTheme();

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [subRaw, setSubRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([api.me(), api.myNotificationSettings(), api.mySubscription(), api.myReferral()]);
      if (!alive) return;
      const [meRes, notifyRes, subRes, referralRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setSubRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setReferral(referralRes.status === "fulfilled" ? referralRes.value : null);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subRaw);

  const supportConfigured = !SUPPORT_URL.includes("your_support");
  const languageValue = language === "ru" ? t("language.ru") : t("language.en");
  const themeValue = theme === "light" ? t("menu.light") : t("menu.dark");
  const notificationsValue = notify?.notifications_enabled ? t("menu.state.active") : t("menu.state.off");
  const subscriptionValue = subRaw ? tariffLabel(sub.tariff, t) : t("menu.loading");
  const referralValue = `${referral?.invited ?? 0}/${referral?.activated ?? 0}`;

  return (
    <Layout>
      <HeroCard
        eyebrow={t("menu.hero.eyebrow")}
        title={t("menu.hero.title")}
        description={t("menu.hero.subtitle")}
        right={<AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />}
      />

      <AppShellSection>
        <SectionHeader title={t("layout.title.menu")} subtitle={t("layout.subtitle.hub")} />

        <SettingsSection title={t("menu.section.settings")}>
          <SettingsRow icon="🌐" title={t("menu.language")} value={languageValue} to="/menu/language" />
          <SettingsRow icon="🌓" title={t("menu.theme")} value={themeValue} to="/menu/theme" />
          <SettingsRow icon="🔔" title={t("menu.notifications")} value={notificationsValue} to="/profile#notifications" />
        </SettingsSection>

        <SettingsSection title={t("menu.section.account")}>
          <SettingsRow icon="💎" title={t("menu.subscription")} value={subscriptionValue} to="/profile#subscription" />
          <SettingsRow icon="👥" title={t("menu.referral")} subtitle={t("profile.ref.subtitle")} value={referralValue} to="/profile#referral" />
          <SettingsRow icon="🎟" title={t("menu.promo")} to="/profile#promo" />
        </SettingsSection>

        <SettingsSection title={t("menu.section.service")}>
          <SettingsRow icon="📰" title={t("menu.news")} to="/news" />
          <SettingsRow
            icon="🛟"
            title={t("menu.support")}
            value={supportConfigured ? undefined : t("menu.notConfigured")}
            href={supportConfigured ? SUPPORT_URL : undefined}
            disabled={!supportConfigured}
          />
          <SettingsRow icon="📘" title={t("menu.rules")} to="/menu/rules" />
          <SettingsRow icon="⚖️" title={t("menu.responsible")} to="/menu/responsible" />
          <SettingsRow icon="💳" title={t("menu.tariffs")} to="/tariffs" />
        </SettingsSection>

        {me?.is_admin || me?.role === "admin" ? (
          <SettingsSection title={t("menu.section.admin")}>
            <SettingsRow icon="🛠" title={t("menu.admin")} to="/admin" />
          </SettingsSection>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

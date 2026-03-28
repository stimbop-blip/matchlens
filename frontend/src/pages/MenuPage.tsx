import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ActivityBand, AppShellSection, SectionHeader } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

type ServiceEntry = {
  id: string;
  titleKey: string;
  descKey: string;
  to?: string;
  href?: string;
  adminOnly?: boolean;
  disabled?: boolean;
};

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

  const services: ServiceEntry[] = [
    { id: "tariffs", titleKey: "hub.item.tariffs.title", descKey: "hub.item.tariffs.desc", to: "/tariffs" },
    { id: "news", titleKey: "hub.item.news.title", descKey: "hub.item.news.desc", to: "/news" },
    { id: "referrals", titleKey: "hub.item.referrals.title", descKey: "hub.item.referrals.desc", to: "/profile#referral" },
    { id: "notifications", titleKey: "hub.item.notifications.title", descKey: "hub.item.notifications.desc", to: "/profile#notifications" },
    { id: "language", titleKey: "hub.item.language.title", descKey: "hub.item.language.desc", to: "/menu/language" },
    { id: "theme", titleKey: "hub.item.theme.title", descKey: "hub.item.theme.desc", to: "/menu/theme" },
    {
      id: "support",
      titleKey: "hub.item.support.title",
      descKey: supportConfigured ? "hub.item.support.desc" : "hub.support.notSet",
      href: supportConfigured ? SUPPORT_URL : undefined,
      disabled: !supportConfigured,
    },
    { id: "rules", titleKey: "hub.item.rules.title", descKey: "hub.item.rules.desc", to: "/menu/rules" },
    { id: "responsible", titleKey: "hub.item.responsible.title", descKey: "hub.item.responsible.desc", to: "/menu/responsible" },
    { id: "admin", titleKey: "hub.item.admin.title", descKey: "hub.item.admin.desc", to: "/admin", adminOnly: true },
  ];

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

        <div className="pb-service-grid">
          {services
            .filter((entry) => !entry.adminOnly || isAdmin)
            .map((entry) => {
              const body = (
                <>
                  <strong>{t(entry.titleKey)}</strong>
                  <p>{t(entry.descKey)}</p>
                </>
              );

              if (entry.disabled) {
                return (
                  <div key={entry.id} className="pb-service-card disabled">
                    {body}
                  </div>
                );
              }

              if (entry.href) {
                return (
                  <a key={entry.id} className="pb-service-card" href={entry.href} target="_blank" rel="noreferrer">
                    {body}
                  </a>
                );
              }

              return (
                <Link key={entry.id} className="pb-service-card" to={entry.to || "/menu"}>
                  {body}
                </Link>
              );
            })}
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

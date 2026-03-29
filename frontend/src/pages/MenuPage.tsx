import { useEffect, useMemo, useState } from "react";

import { LEGAL_TEXTS } from "../app/legal";
import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  MoreFeatureCard,
  MoreHeroCard,
  MoreSection,
  MoreSettingsRow,
  MoreStaffRow,
  NewsPreviewMiniList,
  ServiceStatusPill,
} from "../components/ui";
import {
  api,
  type Me,
  type NewsPost,
  type NotificationSettings,
  type ReferralStats,
  type SupportDialogStatus,
} from "../services/api";

function formatDate(value: string | null, language: "ru" | "en", fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  });
}

function dateMs(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function subscriptionStatusLabel(status: string, t: (key: string) => string): string {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

function iconPath(kind: MoreIconKind): string {
  if (kind === "tariffs") return "M12 3.4 19.5 12 12 20.6 4.5 12 12 3.4Zm0 2.6L7.1 12l4.9 5.6 4.9-5.6L12 6Z";
  if (kind === "referrals") return "M8.1 11a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm7.8 0a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2ZM3.5 18.4c.4-2.2 2.4-3.7 4.6-3.7s4.2 1.5 4.6 3.7H3.5Zm7.8 0c.4-2 2.2-3.3 4.6-3.3 2.2 0 4 1.3 4.6 3.3h-9.2Z";
  if (kind === "notifications") return "M12 4.1a4.7 4.7 0 0 0-4.7 4.7v2.3c0 .8-.3 1.5-.9 2.1l-1.2 1.2h13.6l-1.2-1.2a3 3 0 0 1-.9-2.1V8.8A4.7 4.7 0 0 0 12 4.1Zm-2 12.7h4a2 2 0 0 1-4 0Z";
  if (kind === "news") return "M4.2 5.2h15.6v13.6H4.2V5.2Zm2.2 2.2v2.3h11.2V7.4H6.4Zm0 4.1v5.1h4.1v-5.1H6.4Zm5.9 0v1.5h5.3v-1.5h-5.3Zm0 2.4v1.5h5.3v-1.5h-5.3Z";
  if (kind === "support") return "M12 4.1a8 8 0 0 0-8 8v1.2A2.7 2.7 0 0 0 6.7 16h.9v-4.5h-1A5.4 5.4 0 0 1 12 6.1a5.4 5.4 0 0 1 5.4 5.4h-1V16h-4.5v2.2h2.6A2.5 2.5 0 0 0 17 15.7a2.7 2.7 0 0 0 2.9-2.7v-.9a8 8 0 0 0-8-8Z";
  if (kind === "language") return "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm5.9 7.5h-2.7a13.5 13.5 0 0 0-1-4 6.2 6.2 0 0 1 3.7 4Zm-5.9-5c.8 1 1.5 2.7 1.8 5H10c.3-2.3 1-4 2-5Zm-2 12.8a13.5 13.5 0 0 1-1.8-5h3.7a13.5 13.5 0 0 1-1.9 5Zm4.2-5h3.8a6.2 6.2 0 0 1-3.8 5 13.4 13.4 0 0 0 0-5Zm0-2.8a13.4 13.4 0 0 0 0-5 6.2 6.2 0 0 1 3.8 5h-3.8Zm-8-.1a6.2 6.2 0 0 1 3.7-4 13.5 13.5 0 0 0-1 4H6.2Zm0 2.8H9a13.5 13.5 0 0 0 1 5 6.2 6.2 0 0 1-3.8-5Z";
  if (kind === "theme") return "M14.6 4.2a8.1 8.1 0 1 0 5.2 12.6 7.1 7.1 0 1 1-5.2-12.6Z";
  if (kind === "rules") return "M12 3.5 5 6.2V12c0 4 3 6.8 7 8.5 4-1.7 7-4.5 7-8.5V6.2L12 3.5Zm-1.1 11.8-2.5-2.4 1.4-1.4 1.1 1 3.3-3.3 1.4 1.4-4.7 4.7Z";
  if (kind === "responsible") return "M12 4.3c2.2-1.8 5.4-1.6 7.4 0.4a5.2 5.2 0 0 1 0 7.4L12 19.5 4.6 12a5.2 5.2 0 0 1 0-7.4 5.2 5.2 0 0 1 7.4-0.4Zm-4 8.2h2l1-2.2 1.3 3.1h1.6l1.1-2.3H16";
  if (kind === "payment") return "M4.9 6.2h14.2a1 1 0 0 1 1 1v9.6a1 1 0 0 1-1 1H4.9a1 1 0 0 1-1-1V7.2a1 1 0 0 1 1-1Zm.9 2.1v1.7h12.4V8.3H5.8Zm0 3.4v3.8h5.9v-3.8H5.8Zm7 0v1.2h4.4v-1.2h-4.4Z";
  if (kind === "admin") return "M5 7.1h14v2.2H5V7.1Zm2.5 3.8h9v2.2h-9v-2.2Zm-1.4 3.8h11.8v2.2H6.1v-2.2Z";
  return "M4.1 6.1h15.8v8.7H6.8l-2.7 2.7V6.1Zm4.4 3.3h7.1v1.8H8.5V9.4Z";
}

type MoreIconKind =
  | "tariffs"
  | "referrals"
  | "notifications"
  | "news"
  | "support"
  | "language"
  | "theme"
  | "rules"
  | "responsible"
  | "payment"
  | "admin"
  | "inbox";

function MoreIcon({ kind }: { kind: MoreIconKind }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={iconPath(kind)} />
    </svg>
  );
}

export function MenuPage() {
  const { t, language } = useI18n();
  const legalCopy = LEGAL_TEXTS[language === "en" ? "en" : "ru"];

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [newsReady, setNewsReady] = useState(false);
  const [supportDialogStatus, setSupportDialogStatus] = useState<SupportDialogStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([
        api.me(),
        api.myNotificationSettings(),
        api.myReferral(),
        api.mySubscription(),
        api.news(),
        api.mySupportDialog(),
      ]);
      if (!alive) return;

      const [meRes, notifyRes, refRes, subRes, newsRes, supportRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);

      setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
      setNewsReady(true);
      setSupportDialogStatus(supportRes.status === "fulfilled" ? supportRes.value.dialog?.status ?? null : null);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = Boolean(me?.role === "admin" || me?.is_admin);
  const isSupport = Boolean(me?.role === "support" || me?.is_support);
  const isStaff = isAdmin || isSupport;

  const subscription = resolveSubscriptionSnapshot(subscriptionRaw);
  const accessValue = subscription.tariff === "vip" ? t("common.vip") : subscription.tariff === "premium" ? t("common.premium") : t("common.free");
  const accessUntil = formatDate(subscription.ends_at, language, t("common.noDate"));
  const statusValue = subscriptionStatusLabel(subscription.status, t);
  const notificationsStatus = notify?.notifications_enabled ? t("common.status.active") : t("common.status.inactive");

  const languageValue = (me?.language || language) === "en" ? t("language.en") : t("language.ru");
  const themeValue = (me?.theme || "dark") === "light" ? t("theme.light") : t("theme.dark");
  const categoryEnabledCount = [notify?.notify_free, notify?.notify_premium, notify?.notify_vip, notify?.notify_results, notify?.notify_news].filter(Boolean).length;

  const publishedNews = useMemo(() => news.filter((item) => item.is_published), [news]);

  const latestNews = useMemo(
    () => [...publishedNews].sort((a, b) => dateMs(b.published_at) - dateMs(a.published_at)).slice(0, 3),
    [publishedNews]
  );

  const newsPreviewItems = latestNews.map((item) => {
    const category = item.category?.trim() || t("layout.title.news");
    const published = formatDate(item.published_at, language, t("common.noDate"));
    return {
      id: item.id,
      title: item.title,
      meta: `${category} • ${published}`,
    };
  });

  const newsOverflow =
    publishedNews.length > latestNews.length ? t("menu.services.news.more", { count: publishedNews.length - latestNews.length }) : undefined;

  const supportStatus = (() => {
    if (supportDialogStatus && supportDialogStatus !== "closed") {
      return { label: t("menu.services.support.status.active"), tone: "success" as const };
    }
    if (supportDialogStatus === "closed") {
      return { label: t("menu.services.support.status.closed"), tone: "warning" as const };
    }
    return { label: t("menu.services.support.status.available"), tone: "accent" as const };
  })();

  const tariffValueText =
    subscription.tariff === "vip"
      ? t("menu.account.tariff.value.vip")
      : subscription.tariff === "premium"
        ? t("menu.account.tariff.value.premium")
        : t("menu.account.tariff.value.free");

  const heroThirdMetric = isStaff
    ? {
        label: t("menu.hero.metric.staff"),
        value: isAdmin ? t("layout.role.admin") : t("layout.role.support"),
        tone: "accent" as const,
      }
    : {
        label: t("menu.hero.metric.bonus"),
        value: `${referral?.bonus_days ?? 0} ${t("common.daysShort")}`,
        tone: (referral?.bonus_days ?? 0) > 0 ? ("success" as const) : ("default" as const),
      };

  return (
    <Layout>
      <MoreHeroCard
        eyebrow="PIT BET"
        title={t("menu.heroTitle")}
        subtitle={t("menu.heroSubtitle")}
        accessLevel={subscription.tariff}
        accessLabel={accessValue}
        roleLabel={isStaff ? (isAdmin ? t("layout.role.admin") : t("layout.role.support")) : undefined}
        summary={[
          {
            label: t("menu.hero.metric.notifications"),
            value: notificationsStatus,
            tone: notify?.notifications_enabled ? "success" : "warning",
          },
          {
            label: t("menu.hero.metric.access"),
            value: accessValue,
            tone: "accent",
          },
          heroThirdMetric,
        ]}
      />

      <MoreSection title={t("menu.section.account")} subtitle={t("menu.section.account.subtitle")} className="pb-more-delay-1">
        <div className="pb-more-account-grid">
          <MoreFeatureCard
            to="/tariffs"
            icon={<MoreIcon kind="tariffs" />}
            title={t("hub.item.tariffs.title")}
            subtitle={t("menu.account.tariff.subtitle")}
            badge={<ServiceStatusPill label={statusValue} tone={subscription.status === "active" ? "success" : "default"} />}
            metrics={[
              { label: t("menu.metric.access"), value: accessValue },
              { label: t("menu.account.tariff.status"), value: statusValue },
              { label: t("menu.account.tariff.until"), value: accessUntil },
            ]}
            ctaLabel={t("menu.account.tariff.cta")}
            tone="accent"
            wide
          >
            <p className="pb-more-card-note">{tariffValueText}</p>
          </MoreFeatureCard>

          <div className="pb-more-account-secondary">
            <MoreFeatureCard
              to="/profile#referral"
              icon={<MoreIcon kind="referrals" />}
              title={t("hub.item.referrals.title")}
              subtitle={t("menu.account.referrals.subtitle")}
              metrics={[
                { label: t("profile.referral.invited"), value: referral?.invited ?? 0 },
                { label: t("profile.referral.activated"), value: referral?.activated ?? 0 },
                { label: t("profile.referral.bonus"), value: `${referral?.bonus_days ?? 0} ${t("common.daysShort")}` },
              ]}
              ctaLabel={t("menu.account.referrals.cta")}
              tone="warm"
            />

            <MoreFeatureCard
              to="/profile#notifications"
              icon={<MoreIcon kind="notifications" />}
              title={t("hub.item.notifications.title")}
              subtitle={t("menu.account.notifications.subtitle")}
              metrics={[
                { label: t("menu.metric.notifications"), value: notificationsStatus },
                {
                  label: t("hub.item.notifications.desc"),
                  value: t("menu.account.notifications.categories", { enabled: categoryEnabledCount, total: 5 }),
                },
              ]}
              ctaLabel={t("menu.account.notifications.cta")}
              tone="cool"
            />
          </div>
        </div>
      </MoreSection>

      <MoreSection title={t("menu.section.service")} subtitle={t("menu.section.service.subtitle")} className="pb-more-delay-2">
        <div className="pb-more-services-grid">
          <MoreFeatureCard
            to="/news"
            icon={<MoreIcon kind="news" />}
            title={t("hub.item.news.title")}
            subtitle={t("menu.services.news.subtitle")}
            ctaLabel={t("menu.services.news.cta")}
            tone="cool"
            wide
          >
            <NewsPreviewMiniList
              items={newsPreviewItems}
              emptyLabel={newsReady ? t("menu.services.news.empty") : t("common.loading")}
              overflowLabel={newsOverflow}
            />
          </MoreFeatureCard>

          <MoreFeatureCard
            to="/support"
            icon={<MoreIcon kind="support" />}
            title={legalCopy.moreLinks.supportTitle}
            subtitle={legalCopy.moreLinks.supportSubtitle}
            badge={<ServiceStatusPill label={supportStatus.label} tone={supportStatus.tone} />}
            ctaLabel={t("menu.services.support.cta")}
          />
        </div>

        <div className="pb-more-rows">
          <MoreSettingsRow
            icon={<MoreIcon kind="language" />}
            title={t("hub.item.language.title")}
            subtitle={t("hub.item.language.desc")}
            value={languageValue || t("menu.settings.language.valueFallback")}
            to="/menu/language"
          />
          <MoreSettingsRow
            icon={<MoreIcon kind="theme" />}
            title={t("hub.item.theme.title")}
            subtitle={t("hub.item.theme.desc")}
            value={themeValue || t("menu.settings.theme.valueFallback")}
            to="/menu/theme"
          />
        </div>
      </MoreSection>

      <MoreSection title={t("menu.section.info")} subtitle={t("menu.section.info.subtitle")} className="pb-more-delay-3">
        <div className="pb-more-rows">
          <MoreSettingsRow
            icon={<MoreIcon kind="rules" />}
            title={legalCopy.moreLinks.rulesTitle}
            subtitle={legalCopy.moreLinks.rulesSubtitle}
            to="/menu/rules"
          />
          <MoreSettingsRow
            icon={<MoreIcon kind="responsible" />}
            title={legalCopy.moreLinks.responsibleTitle}
            subtitle={legalCopy.moreLinks.responsibleSubtitle}
            to="/menu/responsible"
          />
          <MoreSettingsRow
            icon={<MoreIcon kind="payment" />}
            title={legalCopy.moreLinks.paymentTitle}
            subtitle={legalCopy.moreLinks.paymentSubtitle}
            to="/menu/payment-refund"
          />
        </div>
      </MoreSection>

      {isStaff ? (
        <MoreSection title={t("menu.section.staff")} subtitle={t("menu.section.staff.subtitle")} className="pb-more-delay-4">
          <div className="pb-more-rows staff">
            {isAdmin ? (
              <MoreStaffRow
                icon={<MoreIcon kind="admin" />}
                title={t("hub.item.admin.title")}
                subtitle={t("menu.staff.adminDesc")}
                to="/admin"
              />
            ) : null}
            <MoreStaffRow
              icon={<MoreIcon kind="inbox" />}
              title={t("menu.support.inboxTitle")}
              subtitle={t("menu.staff.inboxDesc")}
              to="/support/inbox"
            />
          </div>
        </MoreSection>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}

import { useEffect, useState } from "react";

import { useLanguage, useTheme } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

function tariffLabel(code: string | null | undefined) {
  if (code === "vip") return "VIP";
  if (code === "premium") return "Premium";
  return "Free";
}

export function MenuPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isRu = language === "ru";

  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.me(), api.myNotificationSettings(), api.mySubscription(), api.myReferral()])
      .then(([meData, notifyData, subData, referralData]) => {
        if (!alive) return;
        setMe(meData);
        setNotify(notifyData);
        setSub(subData);
        setReferral(referralData);
      })
      .catch(() => {
        if (!alive) return;
        setMe(null);
        setNotify(null);
        setSub(null);
        setReferral(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const supportConfigured = !SUPPORT_URL.includes("your_support");
  const languageValue = language === "ru" ? (isRu ? "Русский" : "Russian") : "English";
  const themeValue = theme === "light" ? (isRu ? "Светлая" : "Light") : isRu ? "Тёмная" : "Dark";
  const notificationsValue = notify?.notifications_enabled
    ? isRu
      ? "Включены"
      : "Enabled"
    : isRu
      ? "Выключены"
      : "Disabled";
  const subscriptionValue = sub
    ? `${tariffLabel(sub.tariff)}`
    : isRu
      ? "Загрузка"
      : "Loading";
  const bonusValue = isRu ? `${referral?.bonus_days ?? 0} дн.` : `${referral?.bonus_days ?? 0} days`;
  const referralProgressValue = isRu
    ? `${referral?.invited ?? 0} / ${referral?.activated ?? 0}`
    : `${referral?.invited ?? 0} / ${referral?.activated ?? 0}`;

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Меню" : "Menu"}
          subtitle={
            isRu
              ? "Настройки, сервисные разделы и управление продуктом"
              : "Settings, service sections, and product control"
          }
        />

        <SettingsSection title={isRu ? "Настройки" : "Settings"}>
          <SettingsRow icon="🌐" title={isRu ? "Язык" : "Language"} value={languageValue} to="/menu/language" />
          <SettingsRow icon="🌓" title={isRu ? "Тема" : "Theme"} value={themeValue} to="/menu/theme" />
          <SettingsRow
            icon="🔔"
            title={isRu ? "Уведомления" : "Notifications"}
            value={notificationsValue}
            to="/profile#notifications"
          />
        </SettingsSection>

        <SettingsSection title={isRu ? "Аккаунт" : "Account"}>
          <SettingsRow
            icon="💎"
            title={isRu ? "Моя подписка" : "My subscription"}
            value={subscriptionValue}
            to="/profile#subscription"
          />
          <SettingsRow
            icon="👥"
            title={isRu ? "Реферальная программа" : "Referral program"}
            subtitle={isRu ? "Приглашено / активировано" : "Invited / activated"}
            value={referralProgressValue}
            to="/profile#referral"
          />
          <SettingsRow icon="🎟" title={isRu ? "Промокоды" : "Promo codes"} to="/profile#promo" />
          <SettingsRow
            icon="🎁"
            title={isRu ? "Мои бонусы" : "My bonuses"}
            value={bonusValue}
            to="/profile#referral"
          />
        </SettingsSection>

        <SettingsSection title={isRu ? "Сервис" : "Service"}>
          <SettingsRow icon="📰" title={isRu ? "Новости PIT BET" : "PIT BET news"} to="/news" />
          <SettingsRow
            icon="🛟"
            title={isRu ? "Поддержка" : "Support"}
            value={supportConfigured ? undefined : isRu ? "Не настроено" : "Not configured"}
            href={supportConfigured ? SUPPORT_URL : undefined}
            disabled={!supportConfigured}
          />
          <SettingsRow icon="📘" title={isRu ? "Правила использования" : "Rules of use"} to="/menu/rules" />
          <SettingsRow icon="⚖️" title={isRu ? "Ответственная игра" : "Responsible play"} to="/menu/responsible" />
        </SettingsSection>

        <div className="service-spotlight">
          <strong>{isRu ? "PIT BET Service" : "PIT BET Service"}</strong>
          <p>
            {isRu
              ? "Актуальные новости, поддержка и правила использования доступны в одном месте."
              : "News updates, support, and product rules are available in one place."}
          </p>
        </div>

        {me?.is_admin || me?.role === "admin" ? (
          <SettingsSection title={isRu ? "Для admin" : "For admin"}>
            <SettingsRow icon="🛠" title={isRu ? "Админка" : "Admin panel"} to="/admin" />
          </SettingsSection>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}

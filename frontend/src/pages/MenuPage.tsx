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

function statusLabel(status: string | null | undefined, language: "ru" | "en") {
  if (status === "active") return language === "ru" ? "Активна" : "Active";
  if (status === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (status === "canceled") return language === "ru" ? "Отменена" : "Canceled";
  return language === "ru" ? "Не активна" : "Inactive";
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
  const themeValue = theme === "light" ? (isRu ? "Светлая" : "Light") : isRu ? "Темная" : "Dark";
  const notificationsValue = notify?.notifications_enabled
    ? isRu
      ? "Включены"
      : "Enabled"
    : isRu
      ? "Выключены"
      : "Disabled";
  const subscriptionValue = sub
    ? `${tariffLabel(sub.tariff)} · ${statusLabel(sub.status, language)}`
    : isRu
      ? "Загрузка"
      : "Loading";

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Меню" : "Menu"}
          subtitle={isRu ? "Настройки, аккаунт и сервис PIT BET" : "Settings, account, and PIT BET service"}
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
            title={isRu ? "Реферальная ссылка" : "Referral link"}
            value={referral?.referral_code || "—"}
            to="/profile#referral"
          />
          <SettingsRow icon="🎟" title={isRu ? "Промокоды" : "Promo codes"} to="/profile#promo" />
          <SettingsRow
            icon="🎁"
            title={isRu ? "Мои бонусы" : "My bonuses"}
            value={`${referral?.bonus_days ?? 0}`}
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

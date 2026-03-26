import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { useLanguage } from "../app/language";
import { api, type Me, type NotificationSettings, type ReferralStats } from "../services/api";

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || "https://t.me/your_support";

type MenuRowProps = {
  icon: string;
  label: string;
  value?: string;
  to?: string;
  href?: string;
  disabled?: boolean;
};

function MenuRow({ icon, label, value, to, href, disabled = false }: MenuRowProps) {
  const content = (
    <>
      <div className="menu-row-main">
        <span className="menu-row-icon">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="menu-row-side">
        {value ? <span className="menu-row-value">{value}</span> : null}
        <span className="menu-row-chevron">›</span>
      </div>
    </>
  );

  if (disabled) {
    return <div className="menu-row disabled">{content}</div>;
  }

  if (href) {
    return (
      <a className="menu-row" href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className="menu-row" to={to || "/menu"}>
      {content}
    </Link>
  );
}

function tariffLabel(code: string | null | undefined, language: "ru" | "en") {
  if (code === "vip") return "VIP";
  if (code === "premium") return "Premium";
  return language === "ru" ? "Free" : "Free";
}

function statusLabel(status: string | null | undefined, language: "ru" | "en") {
  if (status === "active") return language === "ru" ? "Активна" : "Active";
  if (status === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (status === "canceled") return language === "ru" ? "Отменена" : "Canceled";
  return language === "ru" ? "Не активна" : "Inactive";
}

export function MenuPage() {
  const { language } = useLanguage();
  const [me, setMe] = useState<Me | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    Promise.all([api.me(), api.myNotificationSettings(), api.mySubscription(), api.myReferral()])
      .then(([meData, notifyData, subData, referralData]) => {
        setMe(meData);
        setNotify(notifyData);
        setSub(subData);
        setReferral(referralData);
      })
      .catch(() => {
        setMe(null);
        setNotify(null);
        setSub(null);
        setReferral(null);
      });
  }, []);

  const isRu = language === "ru";
  const supportConfigured = !SUPPORT_URL.includes("your_support");
  const subscriptionValue = sub
    ? `${tariffLabel(sub.tariff, language)} • ${statusLabel(sub.status, language)}`
    : isRu
      ? "Проверяем"
      : "Loading";

  return (
    <Layout>
      <section className="menu-screen">
        <div className="section-head menu-title-row">
          <h2>{isRu ? "Меню" : "Menu"}</h2>
          <span className="muted">PIT BET</span>
        </div>

        <section className="menu-block">
          <h3>{isRu ? "Настройки" : "Settings"}</h3>
          <div className="menu-list">
            <MenuRow icon="🌐" label={isRu ? "Язык" : "Language"} value={isRu ? (language === "ru" ? "Русский" : "English") : language === "ru" ? "Russian" : "English"} to="/menu/language" />
            <MenuRow icon="🌓" label={isRu ? "Тема" : "Theme"} value={isRu ? "Auto (Telegram)" : "Auto (Telegram)"} disabled />
            <MenuRow icon="🔔" label={isRu ? "Уведомления" : "Notifications"} value={notify?.notifications_enabled ? (isRu ? "Включены" : "Enabled") : isRu ? "Отключены" : "Off"} to="/profile#notifications" />
          </div>
        </section>

        <section className="menu-block">
          <h3>{isRu ? "Аккаунт" : "Account"}</h3>
          <div className="menu-list">
            <MenuRow icon="💎" label={isRu ? "Моя подписка" : "My subscription"} value={subscriptionValue} to="/profile" />
            <MenuRow icon="👥" label={isRu ? "Реферальная ссылка" : "Referral link"} value={referral?.referral_code || "—"} to="/profile#referral" />
            <MenuRow icon="🎟️" label={isRu ? "Промокоды" : "Promo codes"} to="/profile#promo" />
            <MenuRow icon="🎁" label={isRu ? "Мои бонусы" : "My bonuses"} value={`${referral?.bonus_days ?? 0}`} to="/profile#referral" />
          </div>
        </section>

        <section className="menu-block">
          <h3>{isRu ? "Сервис" : "Service"}</h3>
          <div className="menu-list">
            <MenuRow icon="📰" label={isRu ? "Новости PIT BET" : "PIT BET News"} to="/news" />
            <MenuRow icon="🛟" label={isRu ? "Поддержка" : "Support"} value={supportConfigured ? undefined : isRu ? "Не настроено" : "Not set"} href={supportConfigured ? SUPPORT_URL : undefined} disabled={!supportConfigured} />
            <MenuRow icon="📘" label={isRu ? "Правила использования" : "Rules of use"} to="/menu/rules" />
            <MenuRow icon="⚖️" label={isRu ? "Ответственная игра" : "Responsible play"} to="/menu/responsible" />
          </div>
        </section>

        {me?.is_admin || me?.role === "admin" ? (
          <section className="menu-block">
            <h3>{isRu ? "Для admin" : "For admin"}</h3>
            <div className="menu-list">
              <MenuRow icon="🛠" label={isRu ? "Админка" : "Admin panel"} to="/admin" />
            </div>
          </section>
        ) : null}
      </section>

      <AppDisclaimer />
    </Layout>
  );
}

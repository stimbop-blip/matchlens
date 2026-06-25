import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { Layout } from "../components/Layout";
import { api } from "../services/api";
import { triggerHaptic } from "../services/telegram";
import { AdsTab } from "./admin/AdsTab";
import { CampaignsTab } from "./admin/CampaignsTab";
import { Dashboard } from "./admin/Dashboard";
import { NewsTab } from "./admin/NewsTab";
import { PaymentMethodsTab } from "./admin/PaymentMethodsTab";
import { PaymentsTab } from "./admin/PaymentsTab";
import { PredictionsTab } from "./admin/PredictionsTab";
import { PromoTab } from "./admin/PromoTab";
import { StatsTab } from "./admin/StatsTab";
import { SubscriptionsTab } from "./admin/SubscriptionsTab";
import { UsersTab } from "./admin/UsersTab";
import { type TabKey } from "./admin/shared";
import { useAdminData } from "./admin/useAdminData";

const TABS: Array<{ key: TabKey; ru: string; en: string; emoji: string }> = [
  { key: "predictions", ru: "Прогнозы", en: "Predictions", emoji: "🎯" },
  { key: "users", ru: "Пользователи", en: "Users", emoji: "👥" },
  { key: "subscriptions", ru: "Подписки", en: "Subscriptions", emoji: "🎟" },
  { key: "payments", ru: "Платежи", en: "Payments", emoji: "💳" },
  { key: "payment_methods", ru: "Способы оплаты", en: "Payment methods", emoji: "🏦" },
  { key: "news", ru: "Новости", en: "News", emoji: "📰" },
  { key: "ads", ru: "Реклама", en: "Ads", emoji: "🎁" },
  { key: "promocodes", ru: "Промокоды", en: "Promo codes", emoji: "🏷" },
  { key: "broadcasts", ru: "Рассылки", en: "Campaigns", emoji: "📣" },
  { key: "events", ru: "Статистика", en: "Stats", emoji: "📊" },
];

export function AdminPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [tab, setTab] = useState<TabKey>("predictions");
  const [operatorRole, setOperatorRole] = useState<"admin" | "support" | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [autoCreateToken, setAutoCreateToken] = useState(0);

  const isAdmin = operatorRole === "admin";

  const { state, loading, refreshAll, loadAll } = useAdminData(isAdmin);

  const notify = (text: string, tone: "success" | "error" | "info") => {
    setMessageTone(tone);
    setMessage(text);
    if (tone !== "error") {
      window.setTimeout(() => {
        setMessage((current) => (current === text ? "" : current));
      }, 3500);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setRoleChecked(false);
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        if (me.role === "admin") {
          setOperatorRole("admin");
          setTab("predictions");
        } else {
          setOperatorRole(null);
        }
      })
      .catch(() => {
        if (!cancelled) setOperatorRole(null);
      })
      .finally(() => {
        if (!cancelled) setRoleChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!roleChecked) {
    return (
      <Layout>
        <section className="pb-premium-panel pb-reveal">
          <p className="muted">{tx("Проверяем доступ...", "Checking access...")}</p>
        </section>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <section className="pb-premium-panel pb-reveal">
          <h2>{tx("Админка", "Admin")}</h2>
          <p className="empty-state">{tx("Доступ открыт только администраторам PIT BET.", "Access is available to PIT BET admins only.")}</p>
        </section>
      </Layout>
    );
  }

  const onAddPredictionFromDashboard = () => {
    setTab("predictions");
    setAutoCreateToken((n) => n + 1);
  };

  return (
    <Layout>
      <div className="pb-screen pb-screen-admin">
        <section className="pb-premium-panel pb-admin-shell pb-admin-mobile pb-admin-v4">
          <div className="section-head">
            <h2>{tx("Админка PIT BET", "PIT BET admin panel")}</h2>
            <span className="muted">{tx("Управление прогнозами, пользователями и платежами", "Manage predictions, users, and payments")}</span>
            <span className="admin-role-chip">{isAdmin ? tx("Роль: админ", "Role: admin") : tx("Роль: техподдержка", "Role: support")}</span>
          </div>

          <Dashboard
            language={language}
            stats={state.stats}
            usersCount={state.users.length}
            predictions={state.predictions}
            payments={state.payments}
            news={state.news}
            promoCodes={state.promoCodes}
            onAddPrediction={onAddPredictionFromDashboard}
          />
        </section>

        {/* Spacer: занимает место, которое займёт зафиксированная полоса табов,
            чтобы контент под ней не «прыгал» и не закрывался. */}
        <div className="admin-tabs-spacer" aria-hidden="true" />

        {/* Полоса табов зафиксирована сверху вьюпорта. Раньше был position: sticky
            внутри панели с backdrop-filter — в WebView Telegram он «ездил» и дрожал
            при скролле. Fixed надёжно фиксирует полосу в любом WebView. */}
        <div className="admin-tabs-wrap admin-tabs-mobile admin-tabs-fixed">
          <div className="admin-tabs" role="tablist" aria-label={tx("Разделы админки", "Admin sections")}>
            {TABS.map((item) => (
              <button
                type="button"
                key={item.key}
                role="tab"
                aria-selected={tab === item.key}
                className={tab === item.key ? "tab active" : "tab"}
                onClick={() => {
                  triggerHaptic("selection");
                  setTab(item.key);
                }}
              >
                <span className="tab-emoji" aria-hidden="true">{item.emoji}</span>
                {isRu ? item.ru : item.en}
              </button>
            ))}
          </div>
        </div>

        <section className="pb-premium-panel pb-admin-shell pb-admin-mobile pb-admin-v4">
          {message ? <p className={`notice admin-toast ${messageTone}`}>{message}</p> : null}
          {loading ? <p className="muted">{tx("Обновляем данные...", "Refreshing data...")}</p> : null}

          {tab === "predictions" ? (
            <PredictionsTab
              language={language}
              predictions={state.predictions}
              loading={loading}
              onRefresh={() => void refreshAll()}
              onReload={() => void loadAll()}
              onNotify={notify}
              autoCreateSignal={autoCreateToken}
            />
          ) : null}

          {tab === "users" ? (
            <UsersTab language={language} users={state.users} subscriptions={state.subscriptions} onReload={() => void loadAll()} onNotify={notify} />
          ) : null}

          {tab === "subscriptions" ? (
            <SubscriptionsTab language={language} subscriptions={state.subscriptions} onReload={() => void loadAll()} onNotify={notify} />
          ) : null}

          {tab === "payments" ? (
            <PaymentsTab
              language={language}
              payments={state.payments}
              paymentMethods={state.paymentMethods}
              onReload={() => void loadAll()}
              onNotify={notify}
            />
          ) : null}

          {tab === "payment_methods" ? (
            <PaymentMethodsTab language={language} paymentMethods={state.paymentMethods} onReload={() => void loadAll()} onNotify={notify} />
          ) : null}

          {tab === "news" ? <NewsTab language={language} news={state.news} onReload={() => void loadAll()} onNotify={notify} /> : null}

          {tab === "ads" ? <AdsTab language={language} ads={state.ads} onReload={() => void loadAll()} onNotify={notify} /> : null}

          {tab === "promocodes" ? (
            <PromoTab language={language} promoCodes={state.promoCodes} onReload={() => void loadAll()} onNotify={notify} />
          ) : null}

          {tab === "broadcasts" ? (
            <CampaignsTab language={language} deliveryStats={state.deliveryStats} onReload={() => void loadAll()} onNotify={notify} />
          ) : null}

          {tab === "events" ? <StatsTab language={language} stats={state.stats} /> : null}
        </section>
      </div>
    </Layout>
  );
}

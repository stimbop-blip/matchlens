import { createContext, useContext, useMemo, useState } from "react";

type Lang = "ru" | "en";
type Dict = Record<string, string>;

const ru: Dict = {
  "nav.home": "Главная",
  "nav.signals": "Сигналы",
  "nav.tariffs": "Тарифы",
  "nav.profile": "Профиль",
  "nav.admin": "Админ",
  "common.refresh": "Обновить",
  "common.loading3d": "Загрузка 3D...",
  "common.loadingSignal": "Загрузка сигнала...",
  "common.loadingChart": "Загрузка графика...",

  "home.welcome": "С возвращением",
  "home.subtitle": "Премиальная аналитика матчей с реальным преимуществом",
  "home.liveModel": "Живая модель",
  "home.roiBoosted": "ROI усилен",
  "home.latestSignals": "Последние сигналы",
  "home.highConfidence": "Ставки с высокой уверенностью",

  "tariffs.eyebrow": "Подписка",
  "tariffs.title": "Выберите план преимущества",
  "tariffs.daysAccess": "дней доступа",
  "tariffs.bestChoice": "Лучший выбор",
  "tariffs.activateNow": "Активировать",
  "tariffs.processing": "Обработка...",

  "profile.title": "Профиль",
  "profile.member": "Участник PIT BET",
  "profile.adminAccess": "Доступ администратора",
  "profile.premiumMember": "Премиум участник",
  "profile.accessLevel": "Уровень доступа",
  "profile.premiumActive": "Премиум активен",
  "profile.statistics": "Статистика",
  "profile.referrals": "Рефералы",
  "profile.settings": "Настройки",
  "profile.roiAnalytics": "3D ROI аналитика",
  "profile.live": "Live",
  "profile.themeMode": "Тема",

  "admin.eyebrow": "Админ",
  "admin.title": "Центр управления",
  "admin.roiTrend": "Тренд ROI платформы",
  "signals.eyebrow": "Сигналы",
  "signals.title": "Рыночные возможности",
  "signals.pullToRefresh": "Потяните для обновления",
  "signals.releaseToRefresh": "Отпустите для обновления",
  "signals.filterSport": "Вид спорта",
  "signals.filterStatus": "Статус",
  "sport.all": "Все",
  "sport.football": "Футбол",
  "sport.tennis": "Теннис",
  "sport.basketball": "Баскетбол",
  "status.all": "Все",
  "status.new": "Новые",
  "status.live": "Live",
  "status.won": "Выигрыш",
  "status.lost": "Проигрыш",
  "signal.market": "Маркет",
  "signal.pick": "Выбор",
  "signal.odds": "Коэфф.",
  "signal.confidence": "Уверенность",
  "signal.tapToFlip": "Нажмите, чтобы перевернуть",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.signals": "Signals",
  "nav.tariffs": "Tariffs",
  "nav.profile": "Profile",
  "nav.admin": "Admin",
  "common.refresh": "Refresh",
  "common.loading3d": "Loading 3D...",
  "common.loadingSignal": "Loading signal...",
  "common.loadingChart": "Loading chart...",

  "home.welcome": "Welcome back",
  "home.subtitle": "Premium match intelligence with real-time edge",
  "home.liveModel": "Live model",
  "home.roiBoosted": "ROI boosted",
  "home.latestSignals": "Latest signals",
  "home.highConfidence": "High confidence picks",

  "tariffs.eyebrow": "Membership",
  "tariffs.title": "Choose your edge plan",
  "tariffs.daysAccess": "days access",
  "tariffs.bestChoice": "Best choice",
  "tariffs.activateNow": "Activate now",
  "tariffs.processing": "Processing...",

  "profile.title": "Profile",
  "profile.member": "PIT BET Member",
  "profile.adminAccess": "Admin access",
  "profile.premiumMember": "Premium member",
  "profile.accessLevel": "Access level",
  "profile.premiumActive": "Premium active",
  "profile.statistics": "Statistics",
  "profile.referrals": "Referrals",
  "profile.settings": "Settings",
  "profile.roiAnalytics": "3D ROI analytics",
  "profile.live": "Live",
  "profile.themeMode": "Theme mode",

  "admin.eyebrow": "Admin",
  "admin.title": "Control Center",
  "admin.roiTrend": "Platform ROI trend",
  "signals.eyebrow": "Signals",
  "signals.title": "Market opportunities",
  "signals.pullToRefresh": "Pull to refresh",
  "signals.releaseToRefresh": "Release to refresh",
  "signals.filterSport": "Sport",
  "signals.filterStatus": "Status",
  "sport.all": "All",
  "sport.football": "Football",
  "sport.tennis": "Tennis",
  "sport.basketball": "Basketball",
  "status.all": "All",
  "status.new": "New",
  "status.live": "Live",
  "status.won": "Won",
  "status.lost": "Lost",
  "signal.market": "Market",
  "signal.pick": "Pick",
  "signal.odds": "Odds",
  "signal.confidence": "Confidence",
  "signal.tapToFlip": "Tap to flip",
};

const dictionaries: Record<Lang, Dict> = { ru, en };

type I18nCtx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string) => dictionaries[lang][key] ?? key,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

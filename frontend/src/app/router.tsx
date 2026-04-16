import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { clearConsentCache, isConsentAccepted, readConsentCache, writeConsentCache } from "./consent";
import { StartupLoader } from "../components/StartupLoader";
import { api, type UserConsent } from "../services/api";

const Home = lazy(() => import("./Home").then((module) => ({ default: module.Home })));
const Signals = lazy(() => import("./Signals").then((module) => ({ default: module.Signals })));
const Profile = lazy(() => import("./Profile").then((module) => ({ default: module.Profile })));
const Tariffs = lazy(() => import("./Tariffs").then((module) => ({ default: module.Tariffs })));
const Admin = lazy(() => import("./Admin").then((module) => ({ default: module.Admin })));

const GatePage = lazy(() => import("../pages/GatePage").then((module) => ({ default: module.GatePage })));
const LanguagePage = lazy(() => import("../pages/LanguagePage").then((module) => ({ default: module.LanguagePage })));
const MenuPage = lazy(() => import("../pages/MenuPage").then((module) => ({ default: module.MenuPage })));
const NewsDetailsPage = lazy(() => import("../pages/NewsDetailsPage").then((module) => ({ default: module.NewsDetailsPage })));
const NewsPage = lazy(() => import("../pages/NewsPage").then((module) => ({ default: module.NewsPage })));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const PaymentRefundPage = lazy(() => import("../pages/PaymentRefundPage").then((module) => ({ default: module.PaymentRefundPage })));
const PredictionDetailsPage = lazy(() => import("../pages/PredictionDetailsPage").then((module) => ({ default: module.PredictionDetailsPage })));
const ResponsiblePage = lazy(() => import("../pages/ResponsiblePage").then((module) => ({ default: module.ResponsiblePage })));
const RulesPage = lazy(() => import("../pages/RulesPage").then((module) => ({ default: module.RulesPage })));
const StatsPage = lazy(() => import("../pages/StatsPage").then((module) => ({ default: module.StatsPage })));
const SupportInboxPage = lazy(() => import("../pages/SupportInboxPage").then((module) => ({ default: module.SupportInboxPage })));
const SupportPage = lazy(() => import("../pages/SupportPage").then((module) => ({ default: module.SupportPage })));
const ThemePage = lazy(() => import("../pages/ThemePage").then((module) => ({ default: module.ThemePage })));

const CONSENT_SYNC_COOLDOWN_MS = 10000;

export function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [consent, setConsent] = useState<UserConsent | null>(() => readConsentCache());
  const [checking, setChecking] = useState(true);
  const [remoteVerified, setRemoteVerified] = useState(false);
  const consentSyncRef = useRef({ inFlight: false, lastSyncAt: 0 });

  const resolveOpenTarget = useCallback((value: string | null): string | null => {
    if (!value) return null;
    const normalized = value.trim().replace(/^\/+/, "").toLowerCase();
    if (!normalized) return null;
    if (normalized === "support" || normalized === "support/chat") return "/support";
    if (normalized === "feed" || normalized === "signals") return "/feed";
    if (normalized === "profile") return "/profile";
    if (normalized === "notifications" || normalized === "profile/notifications") return "/profile/notifications";
    if (normalized === "tariffs") return "/tariffs";
    if (normalized === "stats") return "/stats";
    if (normalized === "news") return "/news";
    if (normalized === "menu") return "/menu";
    if (normalized === "admin") return "/admin";
    return null;
  }, []);

  const syncConsent = useCallback(async (force = false) => {
    const now = Date.now();
    if (consentSyncRef.current.inFlight) return;
    if (!force && now - consentSyncRef.current.lastSyncAt < CONSENT_SYNC_COOLDOWN_MS) return;

    consentSyncRef.current.inFlight = true;
    consentSyncRef.current.lastSyncAt = now;
    try {
      const remote = await api.myConsent();
      setConsent(remote);
      writeConsentCache(remote);
      setRemoteVerified(true);
      if (!isConsentAccepted(remote)) {
        clearConsentCache();
      }
    } catch {
      setConsent((prev) => prev ?? readConsentCache());
    } finally {
      consentSyncRef.current.inFlight = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void syncConsent(true);
  }, [syncConsent]);

  useEffect(() => {
    if (checking) return;
    void syncConsent();
  }, [location.pathname, checking, syncConsent]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void syncConsent();
    }, 45000);
    return () => {
      window.clearInterval(timer);
    };
  }, [syncConsent]);

  const consentAccepted = useMemo(() => isConsentAccepted(consent), [consent]);
  const canEnterApp = useMemo(() => consentAccepted && (!checking || remoteVerified), [checking, consentAccepted, remoteVerified]);
  const showReturningLoader = useMemo(() => !canEnterApp && checking && consentAccepted, [canEnterApp, checking, consentAccepted]);

  useEffect(() => {
    if (!canEnterApp) return;

    const params = new URLSearchParams(location.search);
    const openValue = params.get("open") || params.get("startapp");
    const target = resolveOpenTarget(openValue);
    if (!target) return;

    if (location.pathname !== target) {
      navigate(target, { replace: true });
      return;
    }

    if (params.has("open") || params.has("startapp")) {
      params.delete("open");
      params.delete("startapp");
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true },
      );
    }
  }, [canEnterApp, location.pathname, location.search, navigate, resolveOpenTarget]);

  const handleAccepted = (value: UserConsent) => {
    setConsent(value);
    writeConsentCache(value);
    setRemoteVerified(true);
  };

  if (!canEnterApp) {
    if (showReturningLoader) {
      return <StartupLoader />;
    }

    return (
      <Suspense fallback={<StartupLoader />}>
        <Routes>
          <Route path="/gate" element={<GatePage consent={consent} checkingRemote={checking && !consentAccepted} onAccepted={handleAccepted} />} />
          <Route path="/menu/rules" element={<RulesPage standalone />} />
          <Route path="/menu/responsible" element={<ResponsiblePage standalone />} />
          <Route path="/menu/payment-refund" element={<PaymentRefundPage standalone />} />
          <Route path="*" element={<Navigate to="/gate" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<StartupLoader />}>
      <Routes>
        <Route path="/gate" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Signals />} />
        <Route path="/feed/:predictionId" element={<PredictionDetailsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/tariffs" element={<Tariffs />} />
        <Route path="/profile/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/language" element={<LanguagePage />} />
        <Route path="/menu/theme" element={<ThemePage />} />
        <Route path="/menu/rules" element={<RulesPage />} />
        <Route path="/menu/responsible" element={<ResponsiblePage />} />
        <Route path="/menu/payment-refund" element={<PaymentRefundPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:newsId" element={<NewsDetailsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/inbox" element={<SupportInboxPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

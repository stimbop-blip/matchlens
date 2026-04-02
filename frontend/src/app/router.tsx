import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { clearConsentCache, isConsentAccepted, readConsentCache, writeConsentCache } from "./consent";
import { Admin } from "./Admin";
import { Home } from "./Home";
import { Profile } from "./Profile";
import { Signals } from "./Signals";
import { Tariffs } from "./Tariffs";
import { api, type UserConsent } from "../services/api";
import { GatePage } from "../pages/GatePage";
import { LanguagePage } from "../pages/LanguagePage";
import { MenuPage } from "../pages/MenuPage";
import { NewsDetailsPage } from "../pages/NewsDetailsPage";
import { NewsPage } from "../pages/NewsPage";
import { PaymentRefundPage } from "../pages/PaymentRefundPage";
import { PredictionDetailsPage } from "../pages/PredictionDetailsPage";
import { ResponsiblePage } from "../pages/ResponsiblePage";
import { RulesPage } from "../pages/RulesPage";
import { StatsPage } from "../pages/StatsPage";
import { SupportInboxPage } from "../pages/SupportInboxPage";
import { SupportPage } from "../pages/SupportPage";
import { ThemePage } from "../pages/ThemePage";

export function AppRouter() {
  const location = useLocation();
  const [consent, setConsent] = useState<UserConsent | null>(() => readConsentCache());
  const [checking, setChecking] = useState(true);
  const [remoteVerified, setRemoteVerified] = useState(false);

  const syncConsent = useCallback(async () => {
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
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void syncConsent();
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

  const canEnterApp = useMemo(() => remoteVerified && isConsentAccepted(consent), [remoteVerified, consent]);

  const handleAccepted = (value: UserConsent) => {
    setConsent(value);
    writeConsentCache(value);
    setRemoteVerified(true);
  };

  if (!canEnterApp) {
    return (
      <Routes>
        <Route path="/gate" element={<GatePage consent={consent} checkingRemote={checking && !remoteVerified} onAccepted={handleAccepted} />} />
        <Route path="/menu/rules" element={<RulesPage standalone />} />
        <Route path="/menu/responsible" element={<ResponsiblePage standalone />} />
        <Route path="/menu/payment-refund" element={<PaymentRefundPage standalone />} />
        <Route path="*" element={<Navigate to="/gate" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/gate" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Home />} />
      <Route path="/feed" element={<Signals />} />
      <Route path="/feed/:predictionId" element={<PredictionDetailsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/tariffs" element={<Tariffs />} />
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
  );
}

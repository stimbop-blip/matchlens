import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPage } from "../pages/AdminPage";
import { FeedPage } from "../pages/FeedPage";
import { HomePage } from "../pages/HomePage";
import { LanguagePage } from "../pages/LanguagePage";
import { MenuPage } from "../pages/MenuPage";
import { NewsPage } from "../pages/NewsPage";
import { PredictionDetailsPage } from "../pages/PredictionDetailsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ResponsiblePage } from "../pages/ResponsiblePage";
import { RulesPage } from "../pages/RulesPage";
import { StatsPage } from "../pages/StatsPage";
import { TariffsPage } from "../pages/TariffsPage";
import { ThemePage } from "../pages/ThemePage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/feed/:predictionId" element={<PredictionDetailsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/tariffs" element={<TariffsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/menu/language" element={<LanguagePage />} />
      <Route path="/menu/theme" element={<ThemePage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/menu/rules" element={<RulesPage />} />
      <Route path="/menu/responsible" element={<ResponsiblePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

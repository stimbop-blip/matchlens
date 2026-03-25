import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPage } from "../pages/AdminPage";
import { FeedPage } from "../pages/FeedPage";
import { HomePage } from "../pages/HomePage";
import { ProfilePage } from "../pages/ProfilePage";
import { StatsPage } from "../pages/StatsPage";
import { TariffsPage } from "../pages/TariffsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/tariffs" element={<TariffsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

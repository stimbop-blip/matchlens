import { Suspense, lazy } from "react";

import { useQuery } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "../lib/api";

const Home = lazy(() => import("./Home").then((m) => ({ default: m.Home })));
const Signals = lazy(() => import("./Signals").then((m) => ({ default: m.Signals })));
const Tariffs = lazy(() => import("./Tariffs").then((m) => ({ default: m.Tariffs })));
const Profile = lazy(() => import("./Profile").then((m) => ({ default: m.Profile })));
const Admin = lazy(() => import("./Admin").then((m) => ({ default: m.Admin })));

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", "guard-admin"],
    queryFn: api.getProfile,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
        Checking admin access...
      </div>
    );
  }

  if (isError || !data || data.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<div className="glass rounded-2xl p-4 text-sm text-[var(--text-secondary)]">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/tariffs" element={<Tariffs />} />
        <Route path="/profile/*" element={<Profile />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

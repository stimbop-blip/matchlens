import { useQuery } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "../lib/api";
import { Admin } from "./Admin";
import { Home } from "./Home";
import { Profile } from "./Profile";
import { Signals } from "./Signals";
import { Tariffs } from "./Tariffs";

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
  );
}

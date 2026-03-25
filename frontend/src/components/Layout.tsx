import { Link } from "react-router-dom";
import { type PropsWithChildren, useEffect, useState } from "react";

import { api } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

export function Layout({ children }: PropsWithChildren) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [initDataMissing, setInitDataMissing] = useState(false);
  const [meRequestState, setMeRequestState] = useState<"idle" | "calling" | "success" | "failed">("idle");

  const hostname = window.location.hostname;
  const origin = window.location.origin;
  const search = new URLSearchParams(window.location.search);
  const isDebugVisible = hostname.includes("matchlens.vercel.app") || search.get("debug") === "1";
  const telegramAvailable = Boolean(window.Telegram);
  const webAppAvailable = Boolean(window.Telegram?.WebApp);
  const initData = window.Telegram?.WebApp?.initData || "";
  const initDataAvailable = Boolean(initData);
  const initDataLength = initData.length;

  useEffect(() => {
    let alive = true;

    const loadMe = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive) return;

      if (!initData) {
        setInitDataMissing(true);
        setIsAdmin(false);
        setMeRequestState("idle");
        console.log("[debug] telegram available", Boolean(window.Telegram));
        console.log("[debug] webapp available", Boolean(window.Telegram?.WebApp));
        console.log("[debug] initData received", false);
        console.log("[debug] early return before /users/me");
        console.warn("[telegram-auth] Telegram initData not received before /users/me");
        return;
      }

      setInitDataMissing(false);
      setMeRequestState("calling");
      console.log("[debug] telegram available", Boolean(window.Telegram));
      console.log("[debug] webapp available", Boolean(window.Telegram?.WebApp));
      console.log("[debug] initData received", true);
      console.log("[debug] calling /users/me");
      api
        .me()
        .then((me) => {
          if (!alive) return;
          setMeRequestState("success");
          console.log("[debug] request success", "/users/me");
          setIsAdmin(Boolean(me.is_admin || me.role === "admin"));
        })
        .catch(() => {
          if (!alive) return;
          setMeRequestState("failed");
          console.log("[debug] request failed", "/users/me");
          setIsAdmin(false);
        });
    };

    void loadMe();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>MatchLens</h1>
        {initDataMissing ? <p className="muted">Telegram initData не получен</p> : null}
        {isDebugVisible ? (
          <div className="muted" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4 }}>
            <div><b>DEBUG</b></div>
            <div>origin: {origin}</div>
            <div>hostname: {hostname}</div>
            <div>VITE_API_URL: {import.meta.env.VITE_API_URL || "(empty)"}</div>
            <div>telegram available: {telegramAvailable ? "yes" : "no"}</div>
            <div>webapp available: {webAppAvailable ? "yes" : "no"}</div>
            <div>initData received: {initDataAvailable ? "yes" : "no"}</div>
            <div>initData length: {initDataLength}</div>
            <div>calling /users/me: {meRequestState === "calling" || meRequestState === "success" || meRequestState === "failed" ? "yes" : "no"}</div>
            <div>request state: {meRequestState}</div>
            {initDataMissing ? <div>early return: yes (initData missing)</div> : null}
          </div>
        ) : null}
      </header>

      <main className="content">{children}</main>

      <nav className={`tabbar ${isAdmin ? "tabbar-admin" : ""}`}>
        <Link to="/">Главная</Link>
        <Link to="/feed">Лента</Link>
        <Link to="/stats">Статистика</Link>
        <Link to="/tariffs">Тарифы</Link>
        <Link to="/profile">Профиль</Link>
        {isAdmin ? <Link to="/admin">Админка</Link> : null}
      </nav>
    </div>
  );
}

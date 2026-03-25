import { Link } from "react-router-dom";
import { type PropsWithChildren, useEffect, useState } from "react";

import { api } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

export function Layout({ children }: PropsWithChildren) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadMe = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive) return;

      if (!initData) {
        setIsAdmin(false);
        return;
      }

      api
        .me()
        .then((me) => {
          if (!alive) return;
          setIsAdmin(Boolean(me.is_admin || me.role === "admin"));
        })
        .catch(() => {
          if (!alive) return;
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

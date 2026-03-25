import { Link } from "react-router-dom";
import type { PropsWithChildren } from "react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>MatchLens</h1>
      </header>

      <main className="content">{children}</main>

      <nav className="tabbar">
        <Link to="/">Главная</Link>
        <Link to="/feed">Лента</Link>
        <Link to="/stats">Статистика</Link>
        <Link to="/tariffs">Тарифы</Link>
        <Link to="/profile">Профиль</Link>
      </nav>
    </div>
  );
}

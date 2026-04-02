import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { detectTelegramTheme, type AppTheme } from "./telegram";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "pitbet_theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const TELEGRAM_THEME_COLORS: Record<AppTheme, { background: string; surface: string }> = {
  dark: {
    background: "#0f1621",
    surface: "#18222d",
  },
  light: {
    background: "#f0f2f5",
    surface: "#ffffff",
  },
};

function resolveInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return detectTelegramTheme();
}

function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;

  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  const colors = TELEGRAM_THEME_COLORS[theme];
  webApp.setBackgroundColor?.(colors.background);
  webApp.setHeaderColor?.(colors.surface);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(resolveInitialTheme);

  const setTheme = (next: AppTheme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return () => undefined;

    type TelegramEventBridge = {
      onEvent?: (event: string, cb: () => void) => void;
      offEvent?: (event: string, cb: () => void) => void;
    };

    const webApp = window.Telegram?.WebApp as TelegramEventBridge | undefined;
    if (!webApp?.onEvent || !webApp?.offEvent) return () => undefined;

    const onThemeChanged = () => {
      const next = detectTelegramTheme();
      setThemeState((prev) => (prev === next ? prev : next));
      localStorage.setItem(STORAGE_KEY, next);
    };

    webApp.onEvent("themeChanged", onThemeChanged);
    return () => {
      webApp.offEvent?.("themeChanged", onThemeChanged);
    };
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}

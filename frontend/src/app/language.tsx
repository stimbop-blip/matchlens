import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { api, type UserPreferences } from "../services/api";
import { applyAppTheme, type AppTheme } from "../services/telegram";

export type AppLanguage = "ru" | "en";

const LANGUAGE_STORAGE_KEY = "pitbet_language";
const THEME_STORAGE_KEY = "pitbet_theme";

type LanguageContextValue = {
  language: AppLanguage;
  theme: AppTheme;
  setLanguage: (next: AppLanguage) => void;
  setTheme: (next: AppTheme) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  return value === "en" ? "en" : "ru";
}

function normalizeTheme(value: string | null | undefined): AppTheme {
  return value === "light" ? "light" : "dark";
}

function getStoredLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return "ru";
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved === "ru" || saved === "en") return saved;
  return null;
}

function getStoredTheme(): AppTheme | null {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return null;
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>(() => getStoredLanguage() ?? "ru");
  const [theme, setThemeState] = useState<AppTheme>(() => getStoredTheme() ?? "dark");

  useEffect(() => {
    applyAppTheme(theme);
  }, [theme]);

  useEffect(() => {
    let alive = true;

    const syncPreferences = async () => {
      const storedLanguage = getStoredLanguage();
      const storedTheme = getStoredTheme();

      try {
        const remote = await api.myPreferences();
        if (!alive) return;

        const remoteLanguage = normalizeLanguage(remote.language);
        const remoteTheme = normalizeTheme(remote.theme);

        const nextLanguage = storedLanguage ?? remoteLanguage;
        const nextTheme = storedTheme ?? remoteTheme;

        setLanguageState(nextLanguage);
        setThemeState(nextTheme);

        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

        const patch: Partial<UserPreferences> = {};
        if (storedLanguage && storedLanguage !== remoteLanguage) patch.language = storedLanguage;
        if (storedTheme && storedTheme !== remoteTheme) patch.theme = storedTheme;
        if (Object.keys(patch).length > 0) {
          void api.updateMyPreferences(patch).catch(() => undefined);
        }
      } catch {
        if (!alive) return;
        if (storedLanguage) setLanguageState(storedLanguage);
        if (storedTheme) setThemeState(storedTheme);
      }
    };

    void syncPreferences();

    return () => {
      alive = false;
    };
  }, []);

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    void api.updateMyPreferences({ language: next }).catch(() => undefined);
  };

  const setTheme = (next: AppTheme) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    void api.updateMyPreferences({ theme: next }).catch(() => undefined);
  };

  const value = useMemo(() => ({ language, theme, setLanguage, setTheme }), [language, theme]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}

export function useTheme() {
  const ctx = useLanguage();
  return { theme: ctx.theme, setTheme: ctx.setTheme };
}

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryClient } from "../lib/query-client";
import { getTelegramTheme, onTelegramThemeChange } from "../lib/telegram";
import { ThemeProvider, useAppTheme } from "../lib/theme";
import { I18nProvider } from "../lib/i18n";

function TelegramThemeSync({ children }: { children: React.ReactNode }) {
  const { setTheme } = useAppTheme();

  useEffect(() => {
    setTheme(getTelegramTheme());

    const off = onTelegramThemeChange((nextTheme) => {
      setTheme(nextTheme);
    });

    return off;
  }, [setTheme]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <TelegramThemeSync>{children}</TelegramThemeSync>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

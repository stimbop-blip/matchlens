import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { LanguageProvider } from "./app/language";
import { AppRouter } from "./app/router";
import { initTelegramWebApp } from "./services/telegram";
import "./styles/globals.css";

async function bootstrap() {
  await initTelegramWebApp();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <LanguageProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </LanguageProvider>
  );
}

void bootstrap();

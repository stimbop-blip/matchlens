import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import { LanguageProvider } from "./app/language";
import { initTelegramWebApp } from "./services/telegram";
import "./styles/globals.css";

async function bootstrap() {
  await initTelegramWebApp();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

void bootstrap();

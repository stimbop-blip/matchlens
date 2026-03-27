import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";

type HubLauncherProps = {
  onOpen: () => void;
  hidden?: boolean;
};

function HubGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" />
    </svg>
  );
}

export function HubLauncher({ onOpen, hidden = false }: HubLauncherProps) {
  const { t } = useI18n();

  return (
    <div className={hidden ? "pb-command-dock hidden" : "pb-command-dock"}>
      <Link className="pb-command-quick" to="/feed" aria-label={t("dock.feed")}>
        <span>{t("dock.feed")}</span>
      </Link>

      <button type="button" className="pb-command-main" onClick={onOpen} aria-label={t("dock.open")}>
        <span className="pb-command-main-icon">
          <HubGlyph />
        </span>
        <span className="pb-command-main-label">{t("dock.open")}</span>
      </button>

      <Link className="pb-command-quick" to="/stats" aria-label={t("dock.stats")}>
        <span>{t("dock.stats")}</span>
      </Link>
    </div>
  );
}

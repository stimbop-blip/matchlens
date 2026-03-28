export type SportKind =
  | "football"
  | "hockey"
  | "tennis"
  | "table_tennis"
  | "basketball"
  | "volleyball"
  | "esports"
  | "darts"
  | "mma"
  | "baseball"
  | "generic";

export type SportLanguage = "ru" | "en";

function normalizeSportType(input: string | null | undefined): string {
  return (input || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9а-я\s+-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SPORT_RULES: Array<{ kind: SportKind; checks: RegExp[] }> = [
  {
    kind: "table_tennis",
    checks: [/table\s*tennis/, /настольн\w*\s+теннис/, /ping\s*pong/, /пинг\s*понг/],
  },
  {
    kind: "football",
    checks: [/\bfootball\b/, /\bsoccer\b/, /\bfutbol\b/, /футбол/, /футзал/],
  },
  {
    kind: "hockey",
    checks: [/\bhockey\b/, /хокке/, /\bnhl\b/],
  },
  {
    kind: "tennis",
    checks: [/\btennis\b/, /теннис/, /\batp\b/, /\bwta\b/],
  },
  {
    kind: "basketball",
    checks: [/\bbasketball\b/, /баскетбол/, /\bnba\b/, /\beuroleague\b/],
  },
  {
    kind: "volleyball",
    checks: [/\bvolleyball\b/, /волейбол/],
  },
  {
    kind: "esports",
    checks: [
      /\besports?\b/,
      /e\s*sports?/,
      /киберспорт/,
      /\bdota\b/,
      /counter\s*strike/,
      /\bcs2?\b/,
      /\bvalorant\b/,
      /league\s*of\s*legends/,
      /\blol\b/,
    ],
  },
  {
    kind: "darts",
    checks: [/\bdarts\b/, /дартс/],
  },
  {
    kind: "mma",
    checks: [/\bmma\b/, /\bufc\b/, /единоборств/, /бо[йе]в/, /\bboxing\b/, /\bkickboxing\b/, /бокс/],
  },
  {
    kind: "baseball",
    checks: [/\bbaseball\b/, /бейсбол/, /\bmlb\b/],
  },
];

const SPORT_LABELS: Record<SportKind, Record<SportLanguage, string>> = {
  football: { ru: "Футбол", en: "Football" },
  hockey: { ru: "Хоккей", en: "Hockey" },
  tennis: { ru: "Теннис", en: "Tennis" },
  table_tennis: { ru: "Настольный теннис", en: "Table Tennis" },
  basketball: { ru: "Баскетбол", en: "Basketball" },
  volleyball: { ru: "Волейбол", en: "Volleyball" },
  esports: { ru: "Киберспорт", en: "Esports" },
  darts: { ru: "Дартс", en: "Darts" },
  mma: { ru: "Единоборства", en: "MMA" },
  baseball: { ru: "Бейсбол", en: "Baseball" },
  generic: { ru: "Спорт", en: "Sport" },
};

export function resolveSportKind(input: string | null | undefined): SportKind {
  const value = normalizeSportType(input);
  if (!value) return "generic";

  for (const rule of SPORT_RULES) {
    if (rule.checks.some((check) => check.test(value))) {
      return rule.kind;
    }
  }

  return "generic";
}

export function sportLabel(kind: SportKind, language: SportLanguage): string {
  return SPORT_LABELS[kind][language];
}

export function resolveSportLabel(input: string | null | undefined, language: SportLanguage): string {
  const kind = resolveSportKind(input);
  return sportLabel(kind, language);
}

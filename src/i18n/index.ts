// Server-rendered UI strings for the gallery and not-found pages.
// Locale packs live in ./locales/<code>.json; English is the fallback for anything missing.
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import nl from "./locales/nl.json";
import sv from "./locales/sv.json";
import da from "./locales/da.json";
import nb from "./locales/nb.json";
import fi from "./locales/fi.json";
import pl from "./locales/pl.json";
import cs from "./locales/cs.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import zh from "./locales/zh.json";
import id from "./locales/id.json";

export interface Messages {
  /** Language name in its own language. */
  name: string;
  /** Plural forms keyed by Intl.PluralRules category; `other` is required. */
  photoCount: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
  copyLink: string;
  openPhoto: string;
  photoAlt: string;
  viewer: string;
  close: string;
  previous: string;
  next: string;
  notFoundTitle: string;
  notFoundBody: string;
  makeNew: string;
}

export const LOCALES = {
  en,
  es,
  fr,
  de,
  it,
  pt,
  nl,
  sv,
  da,
  nb,
  fi,
  pl,
  cs,
  tr,
  ru,
  uk,
  ja,
  ko,
  zh,
  id,
} satisfies Record<string, Messages>;

export type Locale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return Object.prototype.hasOwnProperty.call(LOCALES, value);
}

/**
 * Pick the best supported locale from an Accept-Language header.
 * Matches on the primary language subtag ("fr-CA" -> "fr"), honours q-values,
 * and falls back to English.
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .slice(0, 20)
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const q = qParam ? Number(qParam.slice(2)) : 1;
      return { lang: tag.trim().toLowerCase().split("-")[0] ?? "", q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((entry) => entry.q > 0 && entry.lang !== "")
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { lang } of ranked) {
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

type Key = Exclude<keyof Messages, "name" | "photoCount">;

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Look up a message and substitute `{name}` placeholders. Output is plain text, not HTML. */
export function t(locale: Locale, key: Key, vars: Record<string, string | number> = {}): string {
  return fill(LOCALES[locale][key], vars);
}

/** "3 photos" in the given locale, using that locale's plural rules. */
export function photoCount(locale: Locale, count: number): string {
  const forms: Messages["photoCount"] = LOCALES[locale].photoCount;
  const category = new Intl.PluralRules(locale).select(count);
  return fill(forms[category] ?? forms.other, { count });
}

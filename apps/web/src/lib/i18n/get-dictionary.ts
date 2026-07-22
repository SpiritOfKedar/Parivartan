import { defaultLocale, type Locale } from "./config";
import { en, type Messages } from "./messages";
import { mr } from "./mr";

const dictionaries: Record<Locale, Messages> = { en, mr };

export function getDictionary(locale: Locale = defaultLocale): Messages {
  return dictionaries[locale] ?? en;
}

export function getToolCopy(
  locale: Locale,
  toolId: string,
): { name: string; description: string } {
  const dict = getDictionary(locale);
  return (
    dict.tools[toolId] ?? {
      name: toolId,
      description: locale === "mr" ? "तुमची फाइल रूपांतरित करा." : "Convert your file.",
    }
  );
}

export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export type { Messages };
export { en, mr };

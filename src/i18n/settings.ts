import type { InitOptions } from "i18next";

/** English message text is the translation key, including "." and "...". */
export const i18nInitOptions: InitOptions = {
  keySeparator: false,
  nsSeparator: false,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
  react: {
    useSuspense: false,
  },
};

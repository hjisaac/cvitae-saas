"use client";

import { createInstance, type i18n as I18nInstance } from "i18next";
import { useMemo } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import type { Messages } from "./get-messages";
import { i18nInitOptions } from "./settings";
import type { AppLocale } from "./routing";

interface I18nProviderProps {
  locale: AppLocale;
  messages: Messages;
  children: React.ReactNode;
}

function createI18nInstance(locale: AppLocale, messages: Messages): I18nInstance {
  const instance = createInstance();

  instance.use(initReactI18next).init({
    ...i18nInitOptions,
    initImmediate: false,
    lng: locale,
    resources: {
      [locale]: {
        translation: messages,
      },
    },
  });

  return instance;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const i18n = useMemo(() => createI18nInstance(locale, messages), [locale, messages]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

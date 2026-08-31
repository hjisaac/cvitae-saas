"use client";

import { useTranslation } from "react-i18next";
import type { AppLocale } from "./routing";

export function useLocale(): AppLocale {
  const { i18n } = useTranslation();
  return i18n.language as AppLocale;
}

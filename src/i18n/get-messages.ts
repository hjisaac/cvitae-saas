import type { AppLocale } from "./routing";

export type Messages = Record<string, string>;

export async function getMessages(locale: AppLocale): Promise<Messages> {
  if (locale === "fr") {
    return (await import("../../messages/fr.json")).default as Messages;
  }

  return (await import("../../messages/en.json")).default as Messages;
}

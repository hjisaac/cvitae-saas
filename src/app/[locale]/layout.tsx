import type { Metadata } from "next";
import "../globals.css";
import { notFound } from "next/navigation";
import { I18nProvider } from "../../i18n/I18nProvider";
import { getMessages } from "../../i18n/get-messages";
import { isAppLocale, locales } from "../../i18n/routing";
import Providers from "../../lib/Providers";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "CVitae Tailor",
  description: "AI-Powered LaTeX CV Generator",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body className="antialiased">
        <I18nProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}

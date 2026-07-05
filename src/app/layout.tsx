import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVitae - Magic Resumes",
  description: "The zero-friction CV builder powered by Gemini and WebAssembly LaTeX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

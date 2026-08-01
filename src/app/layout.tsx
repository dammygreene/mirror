import type { Metadata } from "next";
import { fraunces, spaceGrotesk } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirror - Vana Cup",
  description: "Generate an AI persona card from your ChatGPT or Claude history.",
  icons: {
    icon: [{ url: "/LOGO.png", type: "image/png" }],
    shortcut: [{ url: "/LOGO.png", type: "image/png" }],
    apple: [{ url: "/LOGO.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import localFont from "next/font/local";

export const fraunces = localFont({
  src: [
    {
      path: "../../public/fonts/Fraunces144pt-SemiBold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Fraunces144pt-Italic.woff",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-fraunces",
  fallback: ["Georgia", "serif"],
});

export const spaceGrotesk = localFont({
  src: "../../public/fonts/SpaceGrotesk.ttf",
  display: "swap",
  variable: "--font-space-grotesk",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

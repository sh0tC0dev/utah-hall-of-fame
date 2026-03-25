import type { Metadata } from "next";
import {
  Playfair_Display,
  Libre_Baskerville,
  Cormorant_Garamond,
  IM_Fell_English,
} from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-baskerville",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-fell",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Utah Trapshooting Hall of Fame",
  description:
    "Dedicated to preserving the legacy of those who built, championed, and elevated the sport of trapshooting in the great state of Utah.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${baskerville.variable} ${cormorant.variable} ${fell.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

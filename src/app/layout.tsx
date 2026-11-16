import type { Metadata, Viewport } from "next";
import { Inter, Caveat, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { monaSans } from "@/fonts/monaSans";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-script",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://venuy.vercel.app"),
  title: "Venusai Yalamanchili | Software Engineer & Freelance Developer",
  description:
    "Venusai Yalamanchili is a software engineer who builds full-stack products, AI/LLM features and real-time systems. Open to freelance projects.",
  keywords: [
    "Venusai Yalamanchili",
    "software engineer",
    "freelance developer",
    "full-stack developer",
    "AI engineer",
    "Next.js developer",
    "India",
  ],
  openGraph: {
    title: "Venusai Yalamanchili | Software Engineer",
    description:
      "Full-stack, AI and real-time systems. Open to freelance work. Let's build something.",
    url: "https://venuy.vercel.app",
    siteName: "Venusai Yalamanchili",
    type: "website",
    images: [{ url: "/me/hero.jpg", width: 1086, height: 1448, alt: "Venusai Yalamanchili" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@__venusai",
  },
};

export const viewport: Viewport = {
  themeColor: "#282c20",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${caveat.variable} ${serif.variable} ${monaSans.variable}`}
    >
      <body className="bg-olive font-sans text-cream antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

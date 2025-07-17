import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

const Fira = Fira_Sans({
  subsets: ["cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Yalamanchili Venusai",
  description:
    "Portfolio of Yalamanchili Venusai for software development and engineering roles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={Fira.className}>{children}</body>
    </html>
  );
}

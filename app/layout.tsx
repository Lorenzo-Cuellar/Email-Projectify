import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Email Projectify",
  description: "AI-powered email organization for project-driven work."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

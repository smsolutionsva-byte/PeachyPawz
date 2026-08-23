import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeachyPawz — A clearer story for every paw",
  description: "Evidence-backed longitudinal pet health intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

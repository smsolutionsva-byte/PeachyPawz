import type { Metadata, Viewport } from "next";
import PwaRegistrar from "@/components/PwaRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeachyPawz — A clearer story for every paw",
  description: "Evidence-backed longitudinal pet health intelligence.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/peachy-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/peachy-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/peachy-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "PeachyPawz",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4a261",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}

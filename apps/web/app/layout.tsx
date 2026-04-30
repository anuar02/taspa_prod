import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NotificationTray } from "@/components/layout/NotificationTray";
import { SocketBridge } from "@/components/layout/SocketBridge";

export const metadata: Metadata = {
  title: "TASPA",
  description: "Әр сурет — бір тарих",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "TASPA",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <body>
        <SocketBridge />
        <NotificationTray />
        {children}
      </body>
    </html>
  );
}

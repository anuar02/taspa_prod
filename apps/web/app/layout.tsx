import type { Metadata } from "next";
import "./globals.css";
import { NotificationTray } from "@/components/layout/NotificationTray";
import { SocketBridge } from "@/components/layout/SocketBridge";

export const metadata: Metadata = {
  title: "TASPA",
  description: "Әр сурет — бір тарих"
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

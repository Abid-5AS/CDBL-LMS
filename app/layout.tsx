import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutProvider } from "./LayoutProvider";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/errors";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationProvider as RealtimeNotificationProvider } from "@/lib/contexts/notification-context";
import { ToastContainer } from "@/components/notifications";
import { HydrationWarningSuppress } from "@/components/HydrationWarningSuppress";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { InstallPrompt } from "@/components/offline/InstallPrompt";

export const metadata: Metadata = {
  title: "CDBL LMS - Leave Management System",
  description:
    "Central Depository Bangladesh Limited - Leave Management System",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/cdbl-lms.png",
    apple: "/brand/cdbl-lms.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        {/* Suppress benign hydration warnings from browser extensions and animations */}
        <HydrationWarningSuppress />
        {/* Skip Navigation for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary level="page">
            <NotificationProvider maxNotifications={3}>
              <RealtimeNotificationProvider>
                <LayoutProvider>
                  <main id="main-content">{children}</main>
                  <OfflineIndicator />
                  <InstallPrompt />
                </LayoutProvider>
                {/* Toast notification container */}
                <ToastContainer position="top-right" maxWidth="md:max-w-sm" />
              </RealtimeNotificationProvider>
            </NotificationProvider>
          </ErrorBoundary>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

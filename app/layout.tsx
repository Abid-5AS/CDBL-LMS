import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutProvider } from "./LayoutProvider";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/errors";
import { NotificationProvider } from "@/context/NotificationContext";
import { ToastContainer } from "@/components/notifications";
import { HydrationWarningSuppress } from "@/components/HydrationWarningSuppress";

export const metadata: Metadata = {
  title: "CDBL LMS - Leave Management System",
  description:
    "Central Depository Bangladesh Limited - Leave Management System",
  icons: {
    icon: "/brand/cdbl-lms.png",
    apple: "/brand/cdbl-lms.png",
  },
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
              <LayoutProvider>
                <main id="main-content">{children}</main>
              </LayoutProvider>
              {/* Toast notification container */}
              <ToastContainer position="top-right" maxWidth="md:max-w-sm" />
            </NotificationProvider>
          </ErrorBoundary>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

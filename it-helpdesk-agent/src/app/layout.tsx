import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AdminModeProvider } from "@/contexts/admin-mode-context";
import { AuthProvider } from "@/lib/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT Helpdesk Agent",
  description: "Your intelligent IT support assistant powered by Lyzr AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=switzer@1,2&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AdminModeProvider>
              <AuthGuard>{children}</AuthGuard>
              <Toaster />
            </AdminModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

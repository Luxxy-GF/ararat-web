import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/context/theme";
import SwrProvider from "@/components/context/swr";
import AuthenticationProvider from "@/components/context/authentication";
import Router from "./router";
import { ServerConfigurationProvider } from "@/components/context/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hye Ararat",
  description: "Take your infrastructure to its peak",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <SwrProvider>
          <ThemeProvider>
            <ServerConfigurationProvider>
              <AuthenticationProvider>
                <Router>{children}</Router>
              </AuthenticationProvider>
            </ServerConfigurationProvider>
          </ThemeProvider>
        </SwrProvider>
      </body>
    </html>
  );
}

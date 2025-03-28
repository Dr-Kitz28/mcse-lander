
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoader from '../components/PageLoader';
import ContactHelp from '../components/ContactHelp';
import BackgroundVideo from '../components/BackgroundVideo';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MCSE",
  description: "Math Club Stock Exchange | Aeon 2025",
  icons: {
    icon: [
      {
        url: "/favicon.svg", // /public path
        href: "/favicon.svg", // /public path
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col relative">
          <PageLoader />
          <BackgroundVideo />
          <Navbar />
          <main className="flex-grow z-10">
            {children}
          </main>
          <Footer />
          <ContactHelp />
          <Analytics />
          <SpeedInsights />
        </div>
      </body>

    </html>
  );
}

import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { GSAPProvider } from "@/components/providers/GSAPProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rdev.cloud"),
  title: {
    default: "RDEV | Kinetic Library",
    template: "%s | RDEV"
  },
  description: "A digital portfolio exploring kinetic typography, motion design, and accessible web development.",
  keywords: ["Next.js", "React", "Portfolio", "Web Development", "Kinetic Typography", "Accessibility"],
  authors: [{ name: "Rifki Oktapratama" }],
  openGraph: {
    title: "RDEV | Kinetic Library",
    description: "A digital portfolio exploring kinetic typography and motion.",
    url: "https://rdev.cloud",
    siteName: "RDEV",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RDEV | Kinetic Library",
    description: "A digital portfolio exploring kinetic typography and motion.",
    creator: "@rdev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground cursor-crosshair`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GSAPProvider>
            <CustomCursor />
            <Header />
            {children}
            <Footer />
          </GSAPProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}

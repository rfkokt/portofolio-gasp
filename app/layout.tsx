import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { GSAPProvider } from "@/components/providers/GSAPProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AETHER | Kinetic Library",
  description: "A digital portfolio exploring kinetic typography and motion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-[#050505] text-white cursor-crosshair`}
      >
        <GSAPProvider>
          <Header />
          {children}
          <Footer />
        </GSAPProvider>
      </body>
    </html>
  );
}

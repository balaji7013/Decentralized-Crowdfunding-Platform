import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CrowdfundingProvider } from "@/context/CrowdfundingContext";
import Navigation from "@/components/Navigation";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Decentralized Crowdfunding Platform",
  description: "A blockchain-based crowdfunding platform for innovative projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CrowdfundingProvider>
          <Navigation />
          <main>{children}</main>
          <Toaster position="top-right" />
        </CrowdfundingProvider>
      </body>
    </html>
  );
} 
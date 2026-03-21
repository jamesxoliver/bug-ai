import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "Bug — Find the bugs in your thinking",
  description:
    "You're not broken. You're running buggy code. Bug identifies cognitive distortions and collapses them through logical falsification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JARVE — Custom Web Apps & Internal Tools",
  description: "Custom web apps and internal tools for growing businesses. Fixed price. Launched in weeks.",
  metadataBase: new URL("https://jarve.com.au"),
  openGraph: {
    title: "JARVE — Custom Web Apps & Internal Tools",
    description: "Custom web apps and internal tools for growing businesses. Fixed price. Launched in weeks.",
    url: "https://jarve.com.au",
    siteName: "Jarve",
    images: [
      {
        url: "/api/og?title=JARVE&description=Custom%20web%20apps%20and%20internal%20tools%20for%20growing%20businesses&v=2",
        width: 1200,
        height: 630,
        alt: "Jarve - Custom Web Apps & Internal Tools",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JARVE — Custom Web Apps & Internal Tools",
    description: "Custom web apps and internal tools for growing businesses. Fixed price. Launched in weeks.",
    images: ["/api/og?title=JARVE&description=Custom%20web%20apps%20and%20internal%20tools%20for%20growing%20businesses&v=2"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

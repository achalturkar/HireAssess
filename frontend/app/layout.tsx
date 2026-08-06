import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/src/auth/AuthProvider";
import { ThemeProvider } from "@/src/lib/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hireassess.brainhuntventures.com"),

  title: {
    default: "HireAssess | Online Assessment Platform",
    template: "%s | HireAssess",
  },

  description:
    "HireAssess is a modern online assessment platform that helps companies create assessments, invite candidates, evaluate skills, and generate detailed reports.",

  keywords: [
    "HireAssess",
    "Assessment Platform",
    "Online Assessment",
    "Hiring Assessment",
    "Behavioural Assessment",
    "Psychometric Test",
    "Skill Assessment",
    "Candidate Evaluation",
    "Recruitment Software",
    "Hiring Platform",
    "Campus Recruitment",
    "Logical Assessment",
    "Employee Assessment",
  ],

  authors: [
    {
      name: "HireAssess",
    },
  ],

  creator: "HireAssess",

  publisher: "HireAssess",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "HireAssess | Online Assessment Platform",
    description:
      "Create online assessments, invite candidates, analyze results, and hire smarter with HireAssess.",
    url: "https://hireassess.brainhuntventures.com",
    siteName: "HireAssess",
    locale: "en_US",
    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HireAssess",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "HireAssess | Online Assessment Platform",
    description:
      "Online assessment platform for companies to evaluate candidates efficiently.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
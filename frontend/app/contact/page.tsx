import type { Metadata } from "next";
import ContactClient from "@/src/components/layout/contactClient";

export const metadata: Metadata = {
  title: "Contact Us | HireAssess",
  description:
    "Get in touch with HireAssess for product demos, support, enterprise solutions, and partnership opportunities.",
  keywords: [
    "HireAssess Contact",
    "Assessment Platform Support",
    "Recruitment Software Contact",
    "Customer Support",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact HireAssess",
    description:
      "Contact HireAssess for demos, support, and enterprise solutions.",
    url: "https://hireassess.brainhuntventures.com/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
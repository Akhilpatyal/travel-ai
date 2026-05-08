import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelAI — Smart Travel Planning Engine",
  description: "Plan your dream trips with AI-powered itineraries, personalized recommendations, and real-time updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

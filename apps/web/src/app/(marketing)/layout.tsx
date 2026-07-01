import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PerformanceObservatory } from "@/components/marketing/DevTools/PerformanceObservatory";
import { HackathonDashboard } from "@/components/marketing/DevTools/HackathonDashboard";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "NeuralFlow AI - Observe. Automate. Scale.",
  description: "NeuralFlow transforms complex operations into self-optimizing AI workflows with real-time observability.",
  alternates: {
    canonical: "https://neuralflow.ai",
  },
  openGraph: {
    title: "NeuralFlow AI - The Operating System For Autonomous Business",
    description: "Real-time AI architecture observability, multi-region routing, and automated scaling.",
    url: "https://neuralflow.ai",
    siteName: "NeuralFlow AI",
    images: [
      {
        url: "https://neuralflow.ai/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuralFlow AI",
    description: "The Operating System For Autonomous Business.",
    creator: "@neuralflow",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`marketing-root dark scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <style>{`
        .marketing-root {
          --color-background: #0f171d;
          --color-foreground: #F1F6F4;
          --color-primary: #FFC801;
          --color-primary-foreground: #0f171d;
          --color-secondary: #FF9932;
          --color-secondary-foreground: #0f171d;
          --color-card: #14232c;
          --color-card-foreground: #F1F6F4;
          --color-muted: rgba(217, 232, 226, 0.4);
          --color-muted-foreground: #8a9fa8;
          --color-border: #1d3340;
          --font-sans: var(--font-inter);
          --font-mono: var(--font-jetbrains-mono);
          --easing-micro: cubic-bezier(0, 0, 0.2, 1);
          --easing-layout: cubic-bezier(0.4, 0, 0.2, 1);
          --timing-micro: 200ms;
          --timing-layout: 400ms;
          background-color: var(--color-background);
          color: var(--color-foreground);
          font-family: var(--font-sans);
          min-height: 100vh;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .marketing-root h1, .marketing-root h2, .marketing-root h3, .marketing-root h4, .marketing-root h5, .marketing-root h6, .marketing-root pre, .marketing-root code {
          font-family: var(--font-mono);
        }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "NeuralFlow AI",
        "operatingSystem": "Web",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "29",
          "highPrice": "299",
          "priceCurrency": "USD"
        }
      })}} />

      <PerformanceObservatory />
      <HackathonDashboard />
      
      {children}
    </div>
  );
}

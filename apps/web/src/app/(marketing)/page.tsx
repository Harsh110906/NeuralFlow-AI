import { Hero } from "@/components/marketing/Hero/Hero";
import { TrustedBy } from "@/components/marketing/Social/TrustedBy";
import { Testimonials } from "@/components/marketing/Social/Testimonials";
import { DeveloperAPI } from "@/components/marketing/Developer/DeveloperAPI";
import { BentoShowcase } from "@/components/marketing/Features/BentoShowcase";
import { PricingEngine } from "@/components/marketing/Pricing/PricingEngine";
import { PerformanceReport } from "@/components/marketing/SEO/PerformanceReport";
import { FAQ } from "@/components/marketing/Social/FAQ";
import { Newsletter } from "@/components/marketing/Social/Newsletter";

export default function MarketingPage() {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main Navigation">
          <div className="font-bold text-xl tracking-tighter flex items-center gap-2 font-mono text-white">
            <img src="/svgs/cube-16-solid.svg" className="w-5 h-5 invert" />
            NeuralFlow <span className="text-primary font-light">AI</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-bold text-[var(--color-muted-foreground)] font-mono">
            <a href="#features" className="hover:text-primary transition-micro">Platform</a>
            <a href="#api" className="hover:text-primary transition-micro">Developers</a>
            <a href="#observatory" className="hover:text-primary transition-micro">Observatory</a>
            <a href="#pricing" className="hover:text-primary transition-micro">Pricing</a>
          </div>
          <a href="#pricing" className="px-5 py-2 bg-white text-black font-bold rounded text-xs font-mono hover:bg-primary hover:text-black transition-micro shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Deploy Now
          </a>
        </nav>
      </header>

      <main className="flex flex-col min-h-screen">
        <Hero />
        <TrustedBy />
        <BentoShowcase />
        <div id="api"><DeveloperAPI /></div>
        <PerformanceReport />
        <Testimonials />
        <PricingEngine />
        <FAQ />
        <Newsletter />
      </main>

      <footer className="bg-[var(--color-card)] pt-24 pb-12 border-t border-[var(--color-border)] relative overflow-hidden text-[var(--color-muted-foreground)] text-sm font-mono">
        <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="font-bold text-2xl text-white mb-4 tracking-tighter flex items-center gap-2">
              <img src="/svgs/cube-16-solid.svg" className="w-6 h-6 invert" /> NeuralFlow
            </div>
            <p className="text-[var(--color-muted-foreground)] font-sans max-w-sm mb-6">
              The operating system for autonomous business. We provide the neural logic and edge nodes required to run workflows at enterprise scale.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-[10px]">Product</h4>
            <div className="flex flex-col gap-3">
              <a href="#" className="hover:text-primary transition-micro">Orchestration</a>
              <a href="#" className="hover:text-primary transition-micro">Knowledge Graph</a>
              <a href="#" className="hover:text-primary transition-micro">Observability</a>
              <a href="#" className="hover:text-primary transition-micro">Pricing</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-[10px]">Company</h4>
            <div className="flex flex-col gap-3">
              <a href="#" className="hover:text-primary transition-micro">About Us</a>
              <a href="#" className="hover:text-primary transition-micro">Careers</a>
              <a href="#" className="hover:text-primary transition-micro">System Status</a>
              <a href="#" className="hover:text-primary transition-micro">Privacy Policy</a>
            </div>
          </div>
        </div>
        
        {/* Massive Footer Typography */}
        <div className="w-full overflow-hidden flex justify-center opacity-[0.15] pointer-events-none select-none my-8">
          <h2 className="text-[14vw] font-bold text-white leading-none tracking-tighter" style={{ fontFamily: 'var(--font-sans)' }}>
            neuralflow
          </h2>
        </div>
        
        <div className="container mx-auto px-4 text-center mt-8 pt-8 border-t border-[var(--color-border)]/50">
          <p>© {new Date().getFullYear()} NeuralFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

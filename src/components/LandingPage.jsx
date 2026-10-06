import NavigationBar from '@/components/navigation-menu-4'
import { HeroScrollAnimation } from '@/components/hero-scroll-animation'
import { WhatIsArchie } from '@/components/WhatIsArchie'
import { WhatDoesArchieDo } from '@/components/WhatDoesArchieDo'
import { PricingSection } from '@/components/PricingSection'
import { Footer7 } from '@/components/footer-7'
import { AnimatedCarousel } from '@/components/logo-carousel'

import { Gemini } from '@/components/gemini'
import { OpenAI } from '@/components/GPT'
import { Grok } from '@/components/grok'
import { ClaudeAI } from '@/components/cloude'
import { DeepSeek } from '@/components/deepsek'
import { Qwen } from '@/components/qwen'
import { n8n as N8n } from '@/components/n8n'
import { PostgreSQL } from '@/components/postgre'
import { React } from '@/components/react'
import { Analytics } from "@vercel/analytics/react"

// Logos from the user's created components
const partnerLogos = [
  <React key="react" />,
  <ClaudeAI key="claude" />,
  <OpenAI key="openai" />,
  <DeepSeek key="deepseek" />,
  <Gemini key="gemini" />,
  <N8n key="N8n" />,
  <Qwen key="qwen" />,
  <Grok key="grok" />,
  <PostgreSQL key="postgresql" />
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-foreground font-sans">
      <NavigationBar />

      <main className="pt-16" id="inicio">
        <h1 className="text-white bg-[#0d0d0d] h-[1px]"></h1>
        <Analytics />
        <HeroScrollAnimation />

        <div id="que-es" className="scroll-mt-20">
          <WhatIsArchie />
        </div>

        <div id="que-hace" className="scroll-mt-20">
          <WhatDoesArchieDo />
        </div>

        <AnimatedCarousel
          title="Potenciado por"
          logos={partnerLogos}
          autoPlay={true}
          autoPlayInterval={2000}
          itemsPerViewMobile={3}
          itemsPerViewDesktop={5}
          logoContainerWidth="w-32 md:w-40"
          logoContainerHeight="h-16 md:h-20"
          logoImageWidth="w-full"
          logoImageHeight="h-8 md:h-10"
          padding="py-10 lg:py-20"
        />

        <div id="pricing" className="scroll-mt-20">
          <PricingSection />
        </div>
      </main>

      <Footer7 />
    </div>
  )
}

import './App.css'
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

import { Routes, Route } from 'react-router-dom';
import { AuthPage } from '@/components/AuthPage';
import { ChatPage } from '@/components/ChatPage';
import { ResetPasswordPage } from '@/components/ResetPasswordPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-foreground font-sans">
      <NavigationBar />

      {/* 
        The space for the navbar is handled by the sticky top-16 in HeroScrollAnimation 
        or by adding pt-16 if the element is in normal flow. 
        Since the NavigationBar is sticky top-0, we can add pt-16 to main.
      */}
      <main className="pt-16" id="inicio">
        <h1 className="text-white bg-[#0d0d0d] h-[1px]"></h1>
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

import React, { useState } from 'react';
import { PricingComponent, type PriceTier, type BillingCycle } from './pricing-card';

const archiePlans: [PriceTier, PriceTier, PriceTier] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para empezar y probar Archie. Ideal para pruebas rápidas y uso ocasional.',
    priceMonthly: 0,
    priceAnnually: 0,
    isPopular: false,
    buttonLabel: 'Empezar Gratis',
    features: [
      { name: '15–20 respuestas al día', isIncluded: true },
      { name: 'Explicaciones simples', isIncluded: true },
      { name: 'Chat estándar', isIncluded: true },
      { name: 'Modo Tutor (Paso a paso)', isIncluded: false },
    ],
  },
  {
    id: 'student',
    name: 'Estudiante',
    description: 'Para aprender de verdad. ~$159 MXN/mes. Ideal para autodidactas.',
    priceMonthly: 9,
    priceAnnually: 7, // discounted monthly equivalent
    isPopular: true,
    buttonLabel: 'Elegir Estudiante',
    features: [
      { name: '60–80 respuestas al día', isIncluded: true },
      { name: 'Explicaciones más detalladas', isIncluded: true },
      { name: 'Mejor adaptación al nivel', isIncluded: true },
      { name: 'Modo tutor (explicaciones paso a paso)', isIncluded: true },
      { name: 'Historial ampliado y Prioridad media', isIncluded: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Rendimiento sin límites. ~$329 MXN/mes. Para uso intensivo.',
    priceMonthly: 19,
    priceAnnually: 15, // discounted monthly equivalent
    isPopular: false,
    buttonLabel: 'Hazte Pro',
    features: [
      { name: '150–300+ respuestas al día', isIncluded: true },
      { name: 'Explicaciones profundas (nivel experto)', isIncluded: true },
      { name: 'Generación de ejercicios personalizados', isIncluded: true },
      { name: 'Modo tutor avanzado y Contexto largo', isIncluded: true },
      { name: 'Prioridad alta y Guardado de chats', isIncluded: true },
    ],
  },
];

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  const handleCycleChange = (newCycle: BillingCycle) => {
    setCycle(newCycle);
  };

  const handlePlanSelect = (planId: string, currentCycle: BillingCycle) => {
    console.log(`Plan seleccionado: ${planId} (${currentCycle})`);
  };

  return (
    <section id="pricing" className="bg-[#0d0d0d] relative overflow-hidden pb-32">
      {/* Background aesthetic glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <PricingComponent
        plans={archiePlans}
        billingCycle={cycle}
        onCycleChange={handleCycleChange}
        onPlanSelect={handlePlanSelect}
      />
    </section>
  );
}

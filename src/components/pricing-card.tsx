import * as React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/card";
import { Check, X } from "lucide-react";

// --- 1. Typescript Interfaces (API) ---

export type BillingCycle = 'monthly' | 'annually';

export interface Feature {
  name: string;
  isIncluded: boolean;
  tooltip?: string;
}

export interface PriceTier {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnually: number;
  isPopular: boolean;
  buttonLabel: string;
  features: Feature[];
}

export interface PricingComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  plans: [PriceTier, PriceTier, PriceTier];
  billingCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  onPlanSelect: (planId: string, cycle: BillingCycle) => void;
}

// --- 2. Utility Components ---

const FeatureItem: React.FC<{ feature: Feature }> = ({ feature }) => {
  const Icon = feature.isIncluded ? Check : X;
  const iconColor = feature.isIncluded ? "text-blue-500" : "text-muted-foreground/50";

  return (
    <li className="flex items-start space-x-3 py-2">
      <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconColor)} aria-hidden="true" />
      <span className={cn("text-sm", feature.isIncluded ? "text-white" : "text-muted-foreground")}>
        {feature.name}
      </span>
    </li>
  );
};

// --- 3. Main Component: PricingComponent ---

export const PricingComponent: React.FC<PricingComponentProps> = ({
  plans,
  billingCycle,
  onCycleChange,
  onPlanSelect,
  className,
  ...props
}) => {
  if (plans.length !== 3) {
    console.error("PricingComponent requires exactly 3 pricing tiers.");
    return null;
  }

  const annualDiscountPercent = 20;

  const CycleToggle = (
    <div className="flex justify-center mb-16 mt-6">
      <ToggleGroup
        type="single"
        value={billingCycle}
        onValueChange={(value) => {
          if (value && (value === 'monthly' || value === 'annually')) {
            onCycleChange(value);
          }
        }}
        aria-label="Select billing cycle"
        className="border border-white/10 rounded-full p-1 bg-black/40 backdrop-blur-sm"
      >
        <ToggleGroupItem
          value="monthly"
          aria-label="Monthly Billing"
          className="px-6 py-2 text-sm font-medium rounded-full data-[state=on]:bg-blue-600 data-[state=on]:text-white text-white/70 transition-all duration-300"
        >
          Mensual
        </ToggleGroupItem>
        <ToggleGroupItem
          value="annually"
          aria-label="Annual Billing"
          className="px-6 py-2 text-sm font-medium rounded-full data-[state=on]:bg-blue-600 data-[state=on]:text-white text-white/70 transition-all duration-300 relative"
        >
          Anual
          <span className="absolute -top-3 -right-2 text-[10px] font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            Ahorra {annualDiscountPercent}%
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  const allFeatures = Array.from(new Set(plans.flatMap(p => p.features.map(f => f.name))));
  
  const PricingCards = (
    <div className="grid gap-8 md:grid-cols-3 lg:gap-8 relative z-10">
      {plans.map((plan) => {
        const isFeatured = plan.isPopular;
        const currentPrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnually;
        const priceSuffix = billingCycle === 'monthly' ? '/mes' : '/año';

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col transition-all duration-500 border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative group",
              isFeatured ? "scale-105 shadow-[0_0_40px_-15px_rgba(59,130,246,0.5)] border-blue-500/50" : "hover:border-white/20"
            )}
          >
            {isFeatured && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
            )}
            
            <CardHeader className="p-8 pb-6 relative z-10">
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                {isFeatured && (
                  <span className="text-xs font-semibold px-3 py-1 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30">
                    Más Popular
                  </span>
                )}
              </div>
              <CardDescription className="text-sm text-white/60 h-10">{plan.description}</CardDescription>
              <div className="mt-4">
                <p className="text-5xl font-extrabold text-white">
                  ${currentPrice}
                  <span className="text-lg font-normal text-white/50 ml-1">USD{priceSuffix}</span>
                </p>
                {billingCycle === 'annually' && (
                    <p className="text-sm text-white/40 mt-2">
                        Billed annually (${plan.priceAnnually * 12})
                    </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-8 pt-0 relative z-10">
              <div className="h-px w-full bg-white/10 mb-6" />
              <ul className="list-none space-y-4">
                {plan.features.map((feature) => (
                  <FeatureItem key={feature.name} feature={feature} />
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0 relative z-10 mt-auto">
              <Button
                onClick={() => onPlanSelect(plan.id, billingCycle)}
                className={cn(
                  "w-full transition-all duration-300 h-12 text-base font-semibold",
                  isFeatured
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {plan.buttonLabel}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className={cn("w-full py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative", className)} {...props}>
      <header className="text-center mb-10 relative z-10">
        <h2 className="text-md font-semibold tracking-widest text-blue-500 uppercase mb-4">
          Precios
        </h2>
        <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Elige el plan ideal para tu aprendizaje
        </h3>
        <p className="mt-6 text-xl text-white/60 max-w-2xl mx-auto font-light">
          Desde curiosos hasta power users. Desbloquea tu potencial al ritmo que necesitas.
        </p>
      </header>
      
      {CycleToggle}
      
      <section aria-labelledby="pricing-plans">
        {PricingCards}
      </section>
    </div>
  );
};

import { Bot, Brain, Rocket } from "lucide-react";
import { GlowCard } from "./spotlight-card";
import { motion } from "framer-motion";

export function WhatIsArchie() {
  return (
    <section id="que-es" className="py-32 px-6 md:px-12 lg:px-24 bg-[#0d0d0d] relative overflow-hidden">
      {/* Background glow for aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-md font-semibold tracking-widest text-blue-500 uppercase mb-4">¿Qué es Archie?</h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-8">
            Tu Tutor Inteligente
          </h3>
          <p className="text-xl text-white/70 leading-relaxed font-light">
            Archie es una chatbot web impulsado por inteligencia artificial, diseñado para ser tu
            compañero de aprendizaje definitivo en matemáticas, programación y lógica. No es solo un chatbot, es un tutor personal de nueva generación.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <GlowCard customSize glowColor="blue" className="group">
            <div className="relative z-10">
              <div className="relative w-16 h-16 mb-8 group-hover:scale-110 transition-all duration-500">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-400/40 transition-all duration-500"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Bot className="w-8 h-8 text-blue-400 group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] transition-all duration-500" />
                </div>
              </div>
              <h4 className="text-2xl font-semibold text-white mb-4 tracking-tight">Tutor Inteligente</h4>
              <p className="text-white/60 leading-relaxed font-light text-lg">
                Guiado por los modelos más avanzados de IA, Archie comprende tus dudas complejas y te proporciona explicaciones claras y precisas.
              </p>
            </div>
          </GlowCard>

          <GlowCard customSize glowColor="purple" className="group">
            <div className="relative z-10">
              <div className="relative w-16 h-16 mb-8 group-hover:scale-110 transition-all duration-500">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-400/40 transition-all duration-500"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Brain className="w-8 h-8 text-blue-400 group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] transition-all duration-500" />
                </div>
              </div>
              <h4 className="text-2xl font-semibold text-white mb-4 tracking-tight">Totalmente Adaptativo</h4>
              <p className="text-white/60 leading-relaxed font-light text-lg">
                Ajusta su forma de enseñanza a tu nivel, desde principiante hasta experto, adaptándose a tu propio ritmo para evitar la frustración.
              </p>
            </div>
          </GlowCard>

          <GlowCard customSize glowColor="blue" className="group">
            <div className="relative z-10">
              <div className="relative w-16 h-16 mb-8 group-hover:scale-110 transition-all duration-500">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-400/40 transition-all duration-500"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Rocket className="w-8 h-8 text-blue-400 group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] transition-all duration-500" />
                </div>
              </div>
              <h4 className="text-2xl font-semibold text-white mb-4 tracking-tight">Aprendizaje Real</h4>
              <p className="text-white/60 leading-relaxed font-light text-lg">
                Archie no solo te da las respuestas; te guía paso a paso, proponiendo ejemplos para que comprendas la lógica detrás de cada problema.
              </p>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </section>
  );
}

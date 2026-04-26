import React from "react";
import { BentoGrid, type BentoItem } from "@/components/bento-grid";
import { motion } from "framer-motion";
import {
    BookOpen,
    Lightbulb,
    MessageCircle,
    TrendingUp,
} from "lucide-react";

const archieFeatures: BentoItem[] = [
    {
        title: "Explicaciones Paso a Paso",
        description:
            "Archie no solo responde, te guía como un profesor real, simplificando conceptos complejos hasta que los entiendas por completo.",
        icon: <BookOpen className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />,
        status: "Core",
        tags: ["Educación", "Claridad"],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: "Adaptación al Nivel",
        description: "Detecta tu nivel automáticamente y ajusta su lenguaje y profundidad para evitar la frustración.",
        icon: <TrendingUp className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />,
        status: "Inteligente",
        tags: ["Adaptativo", "Personalizado"],
    },
    {
        title: "Enseñanza Interactiva",
        description: "Aprende interactuando. Archie enseña mientras resuelve dudas, asegurando una retención real del conocimiento.",
        icon: <MessageCircle className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />,
        tags: ["Interactivo", "Feedback"],
    },
    {
        title: "Resolución de Problemas",
        description: "Te propone ejemplos prácticos y te ayuda a resolver tareas, guiándote siempre hacia la lógica detrás de cada problema.",
        icon: <Lightbulb className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />,
        status: "Práctico",
        tags: ["Lógica", "Ejercicios"],
        colSpan: 2,
    },
];

export function WhatDoesArchieDo() {
    return (
        <section id="que-hace" className="py-24 px-6 md:px-12 lg:px-24 bg-[#0d0d0d] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-md font-semibold tracking-widest text-blue-500 uppercase mb-4">
                        ¿Qué hace Archie?
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                        Más que respuestas, verdadero aprendizaje
                    </h3>
                    <p className="text-xl text-white/60 leading-relaxed font-light">
                        Una experiencia interactiva diseñada para enseñarte a razonar, resolver y dominar cualquier tema de tecnología o matemáticas.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    <BentoGrid items={archieFeatures} />
                </motion.div>
            </div>
        </section>
    );
}

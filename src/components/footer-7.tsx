import React from "react";
import { FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import archieLogoImg from "@/assets/Archie texto logo blanco.png";

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Producto",
    links: [
      { name: "¿Qué es Archie?", href: "#que-es" },
      { name: "¿Qué hace?", href: "#que-hace" },
      { name: "Precios", href: "#pricing" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { name: "Ayuda", href: "#" },
      { name: "Privacidad", href: "#" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaInstagram className="w-5 h-5" />, href: "https://www.instagram.com/edu_rivass07/", label: "Instagram" },
  { icon: <FaFacebook className="w-5 h-5" />, href: "https://www.facebook.com/tecnmcampusuruapan", label: "Facebook" },
  { icon: <FaLinkedin className="w-5 h-5" />, href: "https://www.linkedin.com/in/juan-eduardo-rojas-rivas-8ab109386 ", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Términos y Condiciones", href: "#" },
  { name: "Política de Privacidad", href: "#" },
];

export const Footer7 = ({
  logo = {
    url: "/",
    src: archieLogoImg,
    alt: "Archie Logo",
    title: "Archie",
  },
  sections = defaultSections,
  description = "Tu tutor inteligente. Aprende matemáticas y programación con explicaciones claras, paso a paso, a tu propio ritmo.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2026 Archie AI. Todos los derechos reservados.",
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  return (
    <section className="py-20 bg-[#0d0d0d] text-white/80 border-t border-white/5 relative z-10">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start max-w-sm">
            {/* Logo */}
            <div className="flex items-center gap-2 lg:justify-start">
              <a href={logo.url} className="flex items-center gap-3">
                <img src={logo.src} alt={logo.alt} className="h-10 w-auto" />
              </a>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-light">
              {description}
            </p>
            <ul className="flex items-center space-x-6 text-white/50">
              {socialLinks.map((social, idx) => (
                <li key={idx} className="font-medium hover:text-blue-400 transition-colors">
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-full gap-10 md:grid-cols-2 lg:gap-20 max-w-lg lg:ml-auto">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-6 text-sm font-semibold tracking-widest text-blue-500 uppercase">{section.title}</h3>
                <ul className="space-y-4 text-sm text-white/60 font-light">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-blue-400 transition-colors"
                    >
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/5 pt-8 text-xs font-light text-white/40 md:flex-row md:items-center md:text-left">
          <p className="order-2 md:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-4 sm:flex-row md:order-2 md:gap-6">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-white transition-colors">
                <a href={link.href}> {link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

import React from "react";
import { motion } from "framer-motion";
import BlurText from "../components/BlurText";
import { useAuth } from "../context/AuthContext";

export default function HeroSection({ onOpenAuth, onViewWorkspace }) {
  const { user } = useAuth();
  const containerVariants = {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.14 },
    },
  };

  const itemVariants = {
    initial: { filter: "blur(12px)", opacity: 0, y: 24 },
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, ease: "easeOut" },
    },
  };

  const STATS = [
    {
      icon: (
        <svg className="w-6 h-6 stroke-white fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      value: "12.5 Sec",
      label: "Average Agent Latency",
    },
    {
      icon: (
        <svg className="w-6 h-6 stroke-white fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      value: "Real-Time",
      label: "DuckDuckGo Fact Verification",
    },
    {
      icon: (
        <svg className="w-6 h-6 stroke-white fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
      ),
      value: "2 Agents",
      label: "Orchestrated Pipeline",
    },
  ];

  const TECH = ["FastAPI", "Celery", "Redis", "PostgreSQL", "Gemini Core", "Prometheus"];

  return (
    <section
      id="home"
      className="relative w-screen min-h-screen bg-transparent flex flex-col z-10"
    >
      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center pt-36 pb-12 px-4"
      >
        {/* Live Badge */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 rounded-full p-1 pr-4 text-sm text-white/90 liquid-glass select-none mb-6"
        >
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-body font-medium tracking-wide">
            Multi-Agent Autonomous Core — Live
          </span>
        </motion.div>

        {/* Headline */}
        <div>
          <BlurText
            text="Deconstruct Complex Problems."
            className="text-5xl md:text-6xl lg:text-[5rem] font-heading italic text-white leading-[0.9] max-w-4xl justify-center tracking-[-3px]"
          />
          <BlurText
            text="Verified by AI Agents."
            className="text-5xl md:text-6xl lg:text-[5rem] font-heading italic text-white/60 leading-[0.9] max-w-4xl justify-center tracking-[-3px] mt-1"
          />
        </div>

        {/* Subheading — from README */}
        <motion.p
          variants={itemVariants}
          className="mt-7 text-sm md:text-base text-white/70 max-w-lg font-body font-light leading-relaxed"
        >
          Submit any open-ended problem. A pipeline of specialized agents — Case Manager,
          Investigators, and Verifier — collaborates to break it down, crawl the web, and return
          hallucination-scored intelligence in seconds.
        </motion.p>

        {/* Single CTA — centered */}
        <motion.div variants={itemVariants} className="mt-9 flex justify-center">
          <button
            onClick={() => {
              if (user) {
                if (onViewWorkspace) onViewWorkspace();
              } else {
                onOpenAuth();
              }
            }}
            className="flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white liquid-glass-strong hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            {user ? "Deploy Agent Pipeline" : "Begin Investigation"}
          </button>
        </motion.div>

        {/* Stats Row — 3 cards, properly spaced from CTA */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-stretch justify-center gap-5 mt-14"
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-start text-left p-5 w-[190px] rounded-[1.25rem] liquid-glass hover:scale-[1.03] transition-transform duration-300"
            >
              {s.icon}
              <h4 className="text-3xl font-heading italic text-white tracking-[-1px] leading-none mt-5">
                {s.value}
              </h4>
              <p className="text-xs text-white/55 font-body font-light mt-2 leading-snug">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer Tech Strip — properly separated */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-3 pb-10 pt-2 border-t border-white/[0.06]"
      >
        <p className="text-[10px] font-body font-medium text-white/40 uppercase tracking-[0.18em] select-none">
          Powered by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 select-none">
          {TECH.map((t, i) => (
            <React.Fragment key={t}>
              <span className="text-lg md:text-xl font-heading italic text-white/80">{t}</span>
              {i < TECH.length - 1 && (
                <span className="text-white/25 text-xs">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
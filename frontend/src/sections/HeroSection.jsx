import React from "react";
import { motion } from "framer-motion";
import FadingVideo from "../components/FadingVideo";
import BlurText from "../components/BlurText";

export default function HeroSection() {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    initial: { filter: "blur(10px)", opacity: 0, y: 20 },
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section id="home" className="relative w-screen h-screen bg-black overflow-hidden flex flex-col justify-between z-10">
      {/* Background Video Layer */}
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
        style={{ width: "120%", height: "120%" }}
      />

      {/* Main Content Layout */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center pt-28 px-4"
      >
        {/* Animated Badge */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 rounded-full p-1 pr-3 text-sm text-white/90 liquid-glass select-none"
        >
          <span className="bg-white text-black px-3 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider">
            Active
          </span>
          <span>Multi-Agent Autonomous Core is Live</span>
        </motion.div>

        {/* Word-by-word Animate Blur Title */}
        <div className="mt-6">
          <BlurText
            text="Deconstruct Complex Problems Across the Digital Universe"
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-4xl justify-center tracking-[-4px]"
          />
        </div>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-sm md:text-base text-white/80 max-w-xl font-body font-light leading-relaxed"
        >
          Input any problem. Our Case Manager Agent automatically breaks it down into testable hypotheses, 
          spawns autonomous Research Agents to crawl the web, and outputs live-verified intelligence in seconds.
        </motion.p>

        {/* Actions / CTAs */}
        <motion.div variants={itemVariants} className="flex items-center gap-6 mt-8">
          <button className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white liquid-glass-strong hover:scale-105 transition-transform">
            Start Investigation
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </button>
          <button className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm py-2 px-3 group">
            <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <polygon points="6 4 20 12 6 20 6 4"></polygon>
            </svg>
            Watch Demo
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="flex items-stretch gap-6 mt-10">
          {/* Stat 1 */}
          <div className="flex flex-col items-start text-left p-5 w-[220px] rounded-[1.25rem] liquid-glass">
            {/* Clock SVG */}
            <svg className="w-7 h-7 stroke-white fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h4 className="text-4xl font-heading italic text-white tracking-[-1px] leading-none mt-6">
              12.5 Sec
            </h4>
            <p className="text-xs text-white/60 font-body font-light mt-2">
              Average Investigation Speed
            </p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-start text-left p-5 w-[220px] rounded-[1.25rem] liquid-glass">
            {/* Shield SVG */}
            <svg className="w-7 h-7 stroke-white fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h4 className="text-4xl font-heading italic text-white tracking-[-1px] leading-none mt-6">
              100%
            </h4>
            <p className="text-xs text-white/60 font-body font-light mt-2">
              Automated Evidence Verification Rate
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Partners section */}
      <motion.div
        variants={itemVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="relative z-10 flex flex-col items-center gap-4 pb-8"
      >
        <div className="rounded-full px-4 py-1 text-[11px] font-medium text-white/70 liquid-glass select-none">
          Powered by state-of-the-art AI infrastructure and protocols
        </div>
        <div className="flex items-center justify-center gap-12 md:gap-16 text-2xl md:text-3xl font-heading italic text-white/90 select-none mt-2">
          <span>FastAPI</span>
          <span>·</span>
          <span>Celery</span>
          <span>·</span>
          <span>Redis</span>
          <span>·</span>
          <span>PostgreSQL</span>
          <span>·</span>
          <span>Gemini Core</span>
        </div>
      </motion.div>
    </section>
  );
}
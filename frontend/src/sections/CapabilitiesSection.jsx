import React from "react";
import FadingVideo from "../components/FadingVideo";

export default function CapabilitiesSection() {
  const cards = [
    {
      title: "Deconstruct",
      body: "The Case Manager reads your initial problem statement and logically decomposes it into testable hypotheses for investigator agents to research.",
      icon: (
        // Code/Brackets outline SVG
        <svg className="w-6 h-6 fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      tags: ["Hypothesis Builder", "Logical Breakdown", "Structured JSON", "Case Manager"],
    },
    {
      title: "Research",
      body: "Spawns autonomous investigators to query search engines, extract snippet summaries, and verify live web data without requiring third-party API keys.",
      icon: (
        // Globe/Search outline SVG
        <svg className="w-6 h-6 fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
      tags: ["Live Web Crawl", "DDG Integration", "Telemetry Sync", "Real-Time Facts"],
    },
    {
      title: "Synthesize",
      body: "Weighs supporting versus contrary evidence, resolves logic conflicts, and generates a structured verdict ('verified' or 'disproved') for every case.",
      icon: (
        // Lightbulb outline SVG
        <svg className="w-6 h-6 fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 21h6M9 17h6M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74A7 7 0 0 0 12 2z"></path>
        </svg>
      ),
      tags: ["Evidence Grouping", "Conflict Checks", "Structured Verdict", "JSON Reports"],
    },
  ];

  return (
    <section id="capabilities" className="relative w-screen min-h-screen bg-black overflow-hidden flex flex-col justify-between">
      {/* Background Video Layer */}
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Foreground Content */}
      <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen justify-between">
        {/* Header section */}
        <div className="mb-auto">
          <p className="text-sm font-body text-white/80 mb-4 tracking-wider uppercase">
            // Core Engine
          </p>
          <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6.5rem] leading-[0.9] tracking-[-3px]">
            Investigation
            <br />
            evolved
          </h2>
        </div>

        {/* Cards Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300"
            >
              {/* Card Header Top */}
              <div className="flex items-start justify-between gap-4">
                {/* Left Nested Icon Box */}
                <div className="w-11 h-11 rounded-[0.75rem] liquid-glass flex items-center justify-center">
                  {card.icon}
                </div>

                {/* Right Tags pill container */}
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {card.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="rounded-full px-2.5 py-0.5 text-[10px] text-white/90 font-body border border-white/10 bg-white/5 whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card content spacer */}
              <div className="flex-1" />

              {/* Card Bottom Body */}
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm text-white/80 font-body font-light leading-snug max-w-[32ch]">
                  {card.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
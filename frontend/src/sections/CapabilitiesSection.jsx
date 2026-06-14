import React from "react";

export default function CapabilitiesSection() {
  const cards = [
    {
      title: "Deconstruct",
      body: "The Case Manager Agent decomposes your initial problem statement into structured, testable hypotheses using dynamic JSON templates.",
      icon: (
        // Code/Brackets outline SVG
        <svg className="w-6 h-6 fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      tags: ["Hypothesis Builder", "Logical Decomposition", "Structured JSON", "Case Manager"],
    },
    {
      title: "Research",
      body: "The Research Agent formulates optimized search queries and crawls DuckDuckGo to retrieve real-time facts and snippet evidence without API keys.",
      icon: (
        // Globe/Search outline SVG
        <svg className="w-6 h-6 fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
      tags: ["DuckDuckGo Search", "Web Querying", "Evidence Fetching", "Research Agent"],
    },
    {
      title: "Synthesize",
      body: "Categorizes evidence into supporting or contrary arguments, compiles final analysis conclusions, and marks the final verdict status.",
      icon: (
        // Lightbulb outline SVG
        <svg className="w-6 h-6 fill-none stroke-white" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 21h6M9 17h6M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74A7 7 0 0 0 12 2z"></path>
        </svg>
      ),
      tags: ["Evidence Sorting", "Conflict Evaluation", "Structured Verdict", "Case Updates"],
    },
  ];

  return (
    <section id="capabilities" className="relative w-screen min-h-screen bg-transparent flex flex-col justify-between">

      {/* Foreground Content */}
      <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen justify-between">
        {/* Header section */}
        <div className="mb-auto">

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
import React from "react";
import FadingVideo from "../components/FadingVideo";

export default function CapabilitiesSection() {
  const cards = [
    {
      title: "AI Scenery",
      body: "AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.",
      icon: (
        // Image outline SVG
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" />
        </svg>
      ),
      tags: ["Natural Context", "Photo Realism", "Infinite Settings", "Eco-Vibe"],
    },
    {
      title: "Batch Production",
      body: "Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.",
      icon: (
        // Movie outline SVG
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
        </svg>
      ),
      tags: ["Scale Fast", "Visual Consistency", "Time Saver", "Ready to Post"],
    },
    {
      title: "Smart Lighting",
      body: "Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.",
      icon: (
        // Lightbulb outline SVG
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
        </svg>
      ),
      tags: ["Ray Tracing", "Physical Shadows", "Studio Quality", "Sunlight Sync"],
    },
  ];

  return (
    <section id="capabilities" className="relative w-screen min-h-screen bg-black overflow-hidden flex flex-col justify-between">
      {/* Background Video Layer */}
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{}}
      />

      {/* Foreground Content */}
      <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen justify-between">
        {/* Header section */}
        <div className="mb-auto">
          <p className="text-sm font-body text-white/80 mb-4 tracking-wider uppercase">
            // Capabilities
          </p>
          <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6.5rem] leading-[0.9] tracking-[-3px]">
            Production
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
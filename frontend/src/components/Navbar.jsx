import React from "react";

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-0 right-0 px-8 lg:px-16 z-50 flex items-center justify-between">
      {/* Left: 48x48 liquid-glass circle with lowercase "a" */}
      <div className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white text-3xl font-heading italic">
        a
      </div>

      {/* Center: liquid-glass pill with links (desktop only) */}
      <div className="hidden md:flex items-center gap-1.5 px-1.5 py-1.5 rounded-full liquid-glass">
        <a href="#home" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
          Home
        </a>
        <a href="#voyages" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
          Voyages
        </a>
        <a href="#worlds" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
          Worlds
        </a>
        <a href="#innovation" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
          Innovation
        </a>
        <a href="#plan" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
          Plan Launch
        </a>

        {/* Action Button */}
        <button className="flex items-center gap-1 bg-white text-black px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/90 transition-colors whitespace-nowrap">
          Claim a Spot
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </button>
      </div>

      {/* Right: Spacer to keep layout balanced */}
      <div className="w-12 h-12 invisible" />
    </nav>
  );
}
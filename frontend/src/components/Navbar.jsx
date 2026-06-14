import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Innovation", href: "#innovation" },
  { label: "Plan Launch", href: "#plan" },
];

// SVG Icons
const GithubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const RepoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3h18v18H3z" rx="2" />
    <path d="M9 9l3 3-3 3M13 15h3" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-4 left-0 right-0 px-5 lg:px-12 z-50 flex items-center justify-between transition-all duration-300`}
      >
        {/* Left: Logo */}
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); handleNavClick("#home"); }}
          className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center text-white text-3xl font-heading italic select-none hover:scale-105 transition-transform"
          aria-label="Go to home"
        >
          a
        </a>

        {/* Center: Nav pill (desktop) */}
        <div className="hidden md:flex items-center gap-0.5 px-1.5 py-1.5 rounded-full liquid-glass">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); handleNavClick(href); }}
              className="px-3.5 py-2 text-sm font-medium text-white/85 font-body hover:text-white hover:bg-white/8 rounded-full transition-all duration-200"
            >
              {label}
            </a>
          ))}

          {/* Claim a Spot CTA */}
          <a
            href="https://github.com/Edge-Explorer/AgentBond-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white text-black px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/90 active:scale-95 transition-all whitespace-nowrap ml-1"
          >
            Claim a Spot
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>

        {/* Right: Social icon buttons + mobile menu trigger */}
        <div className="flex items-center gap-2">
          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/karan-shelar-779381343/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Karan Shelar on LinkedIn"
            className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-white/85 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <LinkedinIcon />
          </a>

          {/* GitHub Profile */}
          <a
            href="https://github.com/Edge-Explorer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Edge-Explorer on GitHub"
            className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-white/85 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <GithubIcon />
          </a>

          {/* GitHub Repo */}
          <a
            href="https://github.com/Edge-Explorer/AgentBond-AI"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AgentBond-AI Repository"
            className="hidden sm:flex w-10 h-10 rounded-full liquid-glass items-center justify-center text-white/85 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <RepoIcon />
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle mobile menu"
            className="md:hidden w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-white/85 hover:text-white transition-all"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-20 left-4 right-4 z-40 rounded-[1.5rem] liquid-glass p-4 flex flex-col gap-1 md:hidden"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); handleNavClick(href); }}
                className="px-4 py-3 rounded-xl text-sm font-medium text-white/90 font-body hover:bg-white/8 hover:text-white transition-all"
              >
                {label}
              </a>
            ))}

            <div className="h-px bg-white/10 my-2" />

            <a
              href="https://www.linkedin.com/in/karan-shelar-779381343/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90 hover:bg-white/8 hover:text-white transition-all"
            >
              <LinkedinIcon /> LinkedIn — Karan Shelar
            </a>
            <a
              href="https://github.com/Edge-Explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90 hover:bg-white/8 hover:text-white transition-all"
            >
              <GithubIcon /> GitHub — Edge-Explorer
            </a>
            <a
              href="https://github.com/Edge-Explorer/AgentBond-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90 hover:bg-white/8 hover:text-white transition-all"
            >
              <RepoIcon /> AgentBond-AI Repo
            </a>

            <div className="h-px bg-white/10 my-2" />

            <a
              href="https://github.com/Edge-Explorer/AgentBond-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 text-sm font-semibold rounded-full hover:bg-white/90 transition-all"
            >
              Claim a Spot ↗
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
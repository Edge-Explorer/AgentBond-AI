import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Capabilities", href: "#capabilities" },
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

// Inline neural magnifying glass — transparent bg, blends with page
const AgentBondLogo = ({ className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {/* Icon: transparent neural magnifying glass */}
    <svg
      width="36" height="36" viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 drop-shadow-[0_0_8px_rgba(124,92,252,0.5)]"
    >
      {/* Subtle violet glow */}
      <ellipse cx="55" cy="52" rx="46" ry="44" fill="#7C5CFC" fillOpacity="0.12"/>
      {/* Outer soft ring */}
      <circle cx="54" cy="52" r="36" fill="none" stroke="#7C5CFC" strokeWidth="6" strokeOpacity="0.15"/>
      {/* Rim — glass edge */}
      <circle cx="54" cy="52" r="33" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.35"/>
      {/* Lens fill — frosted glass */}
      <circle cx="54" cy="52" r="31" fill="white" fillOpacity="0.05"/>
      {/* Highlight flare */}
      <ellipse cx="42" cy="41" rx="9" ry="5" fill="white" fillOpacity="0.08" transform="rotate(-30 42 41)"/>
      {/* Center node */}
      <circle cx="54" cy="52" r="4" fill="white" opacity="0.95"/>
      <circle cx="54" cy="52" r="7" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.3"/>
      {/* Satellite nodes */}
      <circle cx="40" cy="40" r="2.8" fill="#7C5CFC" opacity="0.95"/>
      <circle cx="69" cy="40" r="2.8" fill="#4FC3F7" opacity="0.95"/>
      <circle cx="37" cy="55" r="2.2" fill="white" opacity="0.55"/>
      <circle cx="72" cy="58" r="2.2" fill="white" opacity="0.55"/>
      <circle cx="54" cy="33" r="2.2" fill="white" opacity="0.5"/>
      <circle cx="51" cy="67" r="1.8" fill="#7C5CFC" opacity="0.7"/>
      {/* Neural edges */}
      <line x1="54" y1="52" x2="40" y2="40" stroke="white" strokeWidth="0.8" strokeOpacity="0.4"/>
      <line x1="54" y1="52" x2="69" y2="40" stroke="#4FC3F7" strokeWidth="0.8" strokeOpacity="0.5"/>
      <line x1="54" y1="52" x2="37" y2="55" stroke="white" strokeWidth="0.7" strokeOpacity="0.3"/>
      <line x1="54" y1="52" x2="72" y2="58" stroke="white" strokeWidth="0.7" strokeOpacity="0.3"/>
      <line x1="54" y1="52" x2="54" y2="33" stroke="white" strokeWidth="0.7" strokeOpacity="0.28"/>
      <line x1="54" y1="52" x2="51" y2="67" stroke="#7C5CFC" strokeWidth="0.7" strokeOpacity="0.4"/>
      <line x1="40" y1="40" x2="54" y2="33" stroke="white" strokeWidth="0.5" strokeOpacity="0.2"/>
      <line x1="69" y1="40" x2="54" y2="33" stroke="#4FC3F7" strokeWidth="0.5" strokeOpacity="0.25"/>
      {/* Handle */}
      <line x1="80" y1="78" x2="100" y2="98" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeOpacity="0.6"/>
      <line x1="79" y1="77" x2="99" y2="97" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35"/>
    </svg>

    {/* Wordmark */}
    <div className="hidden sm:block select-none">
      <span className="text-white font-heading italic text-[1.15rem] tracking-tight leading-none"
        style={{ textShadow: "0 0 20px rgba(124,92,252,0.4)" }}>
        AgentBond
      </span>
    </div>
  </div>
);

export default function Navbar({ onOpenAuth, currentView, onViewChange }) {
  const { user, logout } = useAuth();
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

  const links = [
    { label: "Home", href: "#home", view: "landing" },
    { label: "Capabilities", href: "#capabilities", view: "landing" },
    ...(user ? [{ label: "Workspace", href: "#workspace", view: "workspace" }] : []),
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-4 left-0 right-0 px-5 lg:px-10 z-50"
      >
        {/* 3-column grid: [Logo] [Nav Pill centered] [Icons] */}
        <div className="grid grid-cols-3 items-center w-full">

          {/* ── COL 1: Logo ── */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              if (onViewChange) {
                onViewChange("landing", "#home");
              } else {
                handleNavClick("#home");
              }
            }}
            className="justify-self-start hover:opacity-85 transition-opacity duration-200"
            aria-label="AgentBond AI — Go to home"
          >
            <AgentBondLogo />
          </a>


          {/* ── COL 2: Nav pill — guaranteed screen center ── */}
          <div className="hidden md:flex justify-center">
            <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-full liquid-glass">
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onViewChange) {
                      onViewChange(item.view, item.href);
                    } else {
                      handleNavClick(item.href);
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium font-body rounded-full transition-all duration-200 ${
                    currentView === item.view
                      ? "text-white bg-white/[0.08]"
                      : "text-white/80 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {item.label}
                </a>
              ))}

              {/* Separator */}
              <span className="w-px h-4 bg-white/15 mx-1" />

              {/* CTA inside nav pill */}
              {user ? (
                <div className="flex items-center gap-2 pl-1 pr-2">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-6 h-6 rounded-full border border-white/20"
                  />
                  <span className="text-xs font-semibold text-white max-w-[72px] truncate">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-[11px] text-white/40 hover:text-white/80 transition-colors ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 bg-white text-black px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/92 active:scale-95 transition-all whitespace-nowrap"
                >
                  Begin Investigation
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* ── COL 3: Social icons + Mobile hamburger ── */}
          <div className="hidden md:flex items-center justify-self-end gap-3">
            <a
              href="https://www.linkedin.com/in/karan-shelar-779381343/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full liquid-glass-strong hover:scale-105 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer"
              title="LinkedIn Profile"
            >
              <LinkedinIcon />
            </a>
            <a
              href="https://github.com/Edge-Explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full liquid-glass-strong hover:scale-105 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer"
              title="Github Profile"
            >
              <GithubIcon />
            </a>
            <a
              href="https://github.com/Edge-Explorer/AgentBond-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full liquid-glass-strong hover:scale-105 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer"
              title="Repository"
            >
              <RepoIcon />
            </a>
          </div>

          {/* ── Mobile Menu toggle button ── */}
          <div className="col-start-3 justify-self-end md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Menu Drawer ── */}
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
            {/* Brand header inside mobile menu */}
            <div className="px-2 py-1 mb-1">
              <AgentBondLogo />
            </div>

            <div className="h-px bg-white/10 mb-1" />

            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  if (onViewChange) {
                    onViewChange(item.view, item.href);
                  } else {
                    handleNavClick(item.href);
                  }
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium font-body transition-all ${
                  currentView === item.view
                    ? "text-white bg-white/[0.08]"
                    : "text-white/90 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}

            <div className="h-px bg-white/10 my-2" />

            <a
              href="https://www.linkedin.com/in/karan-shelar-779381343/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <LinkedinIcon /> LinkedIn — Karan Shelar
            </a>
            <a
              href="https://github.com/Edge-Explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <GithubIcon /> GitHub — Edge-Explorer
            </a>
            <a
              href="https://github.com/Edge-Explorer/AgentBond-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/90 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <RepoIcon /> AgentBond-AI Repo
            </a>

            <div className="h-px bg-white/10 my-2" />

            {user ? (
              <div className="flex flex-col gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 px-2 py-1">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-white/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-white/50">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-2 text-sm font-semibold rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onOpenAuth(); setMenuOpen(false); }}
                className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 text-sm font-semibold rounded-full hover:bg-white/90 transition-all"
              >
                Begin Investigation 🔍
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
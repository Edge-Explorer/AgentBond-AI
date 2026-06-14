import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./sections/HeroSection";
import CapabilitiesSection from "./sections/CapabilitiesSection";
import WorkspaceSection from "./sections/WorkspaceSection";
import FadingVideo from "./components/FadingVideo";
import { AuthProvider } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";

function MainAppContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [view, setView] = useState("landing"); // 'landing' | 'workspace'

  return (
    <div className="relative w-screen bg-black text-white selection:bg-white selection:text-black min-h-screen">
      {/* Shared Background Video Layer */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top"
          style={{ width: "120%", height: "120%" }}
        />
      </div>

      {/* Shared Navigation Header */}
      {view === "landing" && (
        <Navbar
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentView={view}
          onViewChange={(newView, hash) => {
            setView(newView);
            if (newView === "landing" && hash) {
              setTimeout(() => {
                const el = document.querySelector(hash);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }
          }}
        />
      )}

      {/* View router */}
      {view === "landing" ? (
        <>
          {/* Hero Section (Section 1) */}
          <HeroSection
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onViewWorkspace={() => setView("workspace")}
          />

          {/* Capabilities Section (Section 2) */}
          <CapabilitiesSection />
        </>
      ) : (
        /* Workspace / Chat Section */
        <WorkspaceSection onBackToLanding={() => setView("landing")} />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
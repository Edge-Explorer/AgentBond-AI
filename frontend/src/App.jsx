import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./sections/HeroSection";
import CapabilitiesSection from "./sections/CapabilitiesSection";

export default function App() {
  return (
    <div className="relative w-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Shared Navigation Header */}
      <Navbar />

      {/* Hero Section (Section 1) */}
      <HeroSection />

      {/* Capabilities Section (Section 2) */}
      <CapabilitiesSection />
    </div>
  );
}
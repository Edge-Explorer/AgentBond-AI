import React, { useEffect, useRef } from "react";

export default function FadingVideo({ src, className, style }) {
  const videoRef = useRef(null);
  const rafIdRef = useRef(null);
  const fadingOutRef = useRef(false);

  const FADE_MS = 500;
  const FADE_OUT_LEAD = 0.55; // seconds (fade starts 0.55s before video ends)

  const fadeTo = (targetOpacity, durationMs) => {
    const video = videoRef.current;
    if (!video) return;

    // Cancel any active animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Read current opacity from the inline style of the video element
    const currentOpacityStr = video.style.opacity;
    const startOpacity = currentOpacityStr ? parseFloat(currentOpacityStr) : 0;
    const opacityDiff = targetOpacity - startOpacity;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Set interpolated opacity
      video.style.opacity = (startOpacity + opacityDiff * progress).toString();

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize state
    video.style.opacity = "0";
    fadingOutRef.current = false;

    const handleLoadedData = () => {
      video.style.opacity = "0";
      video.play().catch((err) => console.log("Video play interrupted:", err));
      fadeTo(1, FADE_MS);
    };

    const handleTimeUpdate = () => {
      const duration = video.duration;
      const currentTime = video.currentTime;

      if (duration && !fadingOutRef.current) {
        const timeLeft = duration - currentTime;
        // If we are within the lead window, initiate fade out
        if (timeLeft <= FADE_OUT_LEAD && timeLeft > 0) {
          fadingOutRef.current = true;
          fadeTo(0, FADE_MS);
        }
      }
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      // Wait 100ms, reset to start, then play and fade back in
      setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        video.play()
          .then(() => {
            fadingOutRef.current = false;
            fadeTo(1, FADE_MS);
          })
          .catch((err) => console.log("Video loop playback failed:", err));
      }, 100);
    };

    // Attach custom event listeners
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    // Trigger loadeddata logic manually if browser already has it cached
    if (video.readyState >= 2) {
      handleLoadedData();
    }

    // Clean up animation frames and listeners on unmount
    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ ...style, transition: "none" }}
      muted
      playsInline
      autoPlay
      preload="auto"
    />
  );
}
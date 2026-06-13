import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function BlurText({ text, className }) {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Unobserve after triggering once to lock the animation
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 } // Triggers on 10% visibility
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const words = text.split(" ");

  return (
    <p
      ref={containerRef}
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        rowGap: "0.1em",
      }}
    >
      {words.map((word, i) => {
        return (
          <motion.span
            key={i}
            initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
            animate={
              isInView
                ? {
                    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                    opacity: [0, 0.5, 1],
                    y: [50, -5, 0],
                  }
                : {}
            }
            transition={{
              duration: 0.7, // stepDuration 0.35s * 2
              times: [0, 0.5, 1],
              ease: "easeOut",
              delay: (i * 100) / 1000, // Stagger: 100ms per word
            }}
            style={{
              display: "inline-block",
              marginRight: "0.28em", // Letter spacing eats NBSP, this preserves spacing
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </p>
  );
}
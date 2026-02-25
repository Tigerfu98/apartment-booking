"use client";

import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80",
    alt: "Golden Gate Bridge at sunset",
  },
  {
    src: "https://images.unsplash.com/photo-1617859047452-8510bcf207fd?auto=format&fit=crop&w=1920&q=80",
    alt: "San Francisco skyline and bay panoramic view",
  },
  {
    src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1920&q=80",
    alt: "Modern bedroom with panoramic city views",
  },
  {
    src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80",
    alt: "Modern apartment building exterior at dusk",
  },
  {
    src: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=1920&q=80",
    alt: "Rooftop pool and lounge area",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 1000);
    },
    [current, isTransitioning]
  );

  // Auto-advance every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Carousel images */}
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === current ? 1 : 0 }}
          aria-hidden={index !== current}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="h-full w-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent z-[1]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <p className="text-sm md:text-base font-medium tracking-[0.3em] uppercase text-white/80 mb-4 text-shadow-subtle">
          San Francisco
        </p>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 tracking-tight text-shadow-hero">
          Casa STFU
        </h1>
        <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed text-shadow-subtle max-w-xl mx-auto">
          Check availability and request your stay at Tiger &amp;
          Sarah&apos;s apartment in the heart of SF.
        </p>
        <a
          href="#calendar"
          className="inline-block mt-10 px-10 py-3.5 bg-white/95 text-warm-gray-800 text-sm font-semibold tracking-wide uppercase rounded-lg shadow-lg hover:bg-white hover:scale-105 transition-all duration-200"
        >
          Check Availability
        </a>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === current
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

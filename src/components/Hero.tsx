export default function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />

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
    </section>
  );
}

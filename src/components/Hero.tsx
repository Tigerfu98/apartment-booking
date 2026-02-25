export default function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 tracking-tight">
          Stay in San Francisco
        </h1>
        <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed">
          Welcome! Check availability and request your stay at Tiger&apos;s
          apartment in the heart of SF.
        </p>
        <a
          href="#calendar"
          className="inline-block mt-8 px-8 py-3 bg-white/95 text-warm-gray-800 text-sm font-medium tracking-wide uppercase rounded hover:bg-white transition-colors"
        >
          Check Availability
        </a>
      </div>
    </section>
  );
}

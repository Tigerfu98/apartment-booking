import Hero from "@/components/Hero";
import BookingSection from "@/components/BookingSection";
import Location from "@/components/Location";
import AreaGuide from "@/components/AreaGuide";

export default function Home() {
  return (
    <>
      {/* Fixed full-page background */}
      <div className="fixed inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <main>
        <Hero />
        <BookingSection />
        <Location />
        <AreaGuide />

        <footer className="glass-card-dark py-8 text-center text-xs text-white/70">
          <p>&copy; {new Date().getFullYear()} Casa STFU</p>
        </footer>
      </main>
    </>
  );
}

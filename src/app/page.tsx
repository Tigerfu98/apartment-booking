import Hero from "@/components/Hero";
import BookingSection from "@/components/BookingSection";
import Location from "@/components/Location";
import AreaGuide from "@/components/AreaGuide";

export default function Home() {
  return (
    <main>
      <Hero />
      <BookingSection />
      <Location />
      <AreaGuide />

      <footer className="py-8 text-center text-xs text-warm-gray-400">
        <p>&copy; {new Date().getFullYear()} Tiger&apos;s SF Apartment</p>
      </footer>
    </main>
  );
}

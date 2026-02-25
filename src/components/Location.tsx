export default function Location() {
  const address = "1550 Mission St, Apartment 1903, San Francisco, CA 94103";
  const mapsQuery = encodeURIComponent("1550 Mission St, San Francisco, CA 94103");

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-light text-center text-warm-gray-800 mb-2">
          Location
        </h2>
        <p className="text-center text-warm-gray-500 mb-10 font-light">
          {address}
        </p>

        <div className="rounded-2xl overflow-hidden shadow-sm border border-warm-gray-200">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${mapsQuery}`}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Apartment location"
          />
        </div>

        <p className="text-center mt-4">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-blue hover:text-slate-blue-dark transition-colors underline underline-offset-2"
          >
            Open in Google Maps
          </a>
        </p>
      </div>
    </section>
  );
}

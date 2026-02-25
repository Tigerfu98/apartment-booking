const categories = [
  {
    title: "Restaurants",
    icon: "🍽️",
    items: [
      { name: "Tartine Manufactory", note: "Bakery & California cuisine" },
      { name: "Nopa", note: "Organic wood-fired dishes, great brunch" },
      { name: "Burma Superstar", note: "Burmese classics, try the tea leaf salad" },
      { name: "La Taqueria", note: "Legendary Mission burritos" },
    ],
  },
  {
    title: "Coffee",
    icon: "☕",
    items: [
      { name: "Blue Bottle Coffee", note: "Hayes Valley original" },
      { name: "Sightglass Coffee", note: "SoMa roastery with great space" },
      { name: "Ritual Coffee Roasters", note: "Mission District staple" },
      { name: "Philz Coffee", note: "Custom blends, try the Mint Mojito" },
    ],
  },
  {
    title: "Parks & Walks",
    icon: "🌿",
    items: [
      { name: "Golden Gate Park", note: "Gardens, museums, bison paddock" },
      { name: "Lands End Trail", note: "Coastal views of the Golden Gate" },
      { name: "Dolores Park", note: "Sunny hangout with skyline views" },
      { name: "Presidio", note: "Forests, beaches, and historic sites" },
    ],
  },
  {
    title: "Things to Do",
    icon: "🎯",
    items: [
      { name: "Ferry Building Marketplace", note: "Artisan food & farmers market (Sat)" },
      { name: "Cable Car Ride", note: "Classic SF experience" },
      { name: "Alcatraz Island", note: "Book tickets in advance!" },
      { name: "Mission Murals Walk", note: "Balmy Alley & Clarion Alley street art" },
    ],
  },
];

export default function AreaGuide() {
  return (
    <section className="py-20 px-4 bg-warm-gray-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-light text-center text-warm-gray-800 mb-2">
          Local Area Guide
        </h2>
        <p className="text-center text-warm-gray-500 mb-12 font-light">
          Our favorite spots around the neighborhood
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-lg font-medium text-warm-gray-800 mb-4 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.title}
              </h3>
              <ul className="space-y-3">
                {category.items.map((item) => (
                  <li key={item.name}>
                    <p className="font-medium text-warm-gray-700 text-sm">
                      {item.name}
                    </p>
                    <p className="text-warm-gray-500 text-xs">{item.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

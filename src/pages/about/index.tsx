import { Link } from "react-router-dom";

// ─── Section 1 — Hero ────────────────────────────────────────────────────────
const Hero = () => (
  <section className="py-24 md:py-36" style={{ background: "hsl(30, 33%, 97%)" }}>
    <div className="container max-w-3xl text-center">
      <blockquote
        className="font-display text-3xl sm:text-4xl md:text-5xl italic leading-tight mb-10"
        style={{ color: "#fba74c" }}
      >
        "Built not from appetite. From discipline, commitment, and trust in the process."
      </blockquote>
      <p className="text-xs tracking-[0.25em] uppercase text-gray-400 font-medium">
        Quartermelon &nbsp;·&nbsp;Bengaluru, India&nbsp;·&nbsp;Est. 2026
      </p>
    </div>
  </section>
);

// ─── Section 2 — The Story ────────────────────────────────────────────────────
const chapters: { title: string; body: string }[] = [
  {
    title: "Where it started.",
    body: "A food science graduate with international research experience and a deep frustration with what the Indian wellness beverage market had settled for. Clean ingredients, honest products, real function — it existed everywhere except here.",
  },
  {
    title: "What took so long.",
    body: "The easy answer was a probiotic juice. The right answer took longer. It came from cross-referencing years of food systems research with something much older — the ingredient wisdom passed down through generations, hiding in plain sight in Indian kitchens and ancient texts.",
  },
  {
    title: "The intersection.",
    body: "Where traditional Indian ingredient wisdom meets modern cold-extraction science. Where fibre-rich ingredients once consumed at home for gut health and daily balance are reimagined as clean functional juices. Quartermelon was built at that intersection — ancient understanding, modern convenience, real function.",
  },
  {
    title: "The belief.",
    body: "Functional beverages in India treat health like homework. Quartermelon treats it like something you actually want to reach for. Ancient flavours. Cold extracted. Delivered this morning.",
  },
];

const Story = () => (
  <section className="py-20 md:py-28 bg-white">
    <div className="container max-w-2xl">
      <div className="flex flex-col gap-12">
        {chapters.map(({ title, body }) => (
          <div
            key={title}
            className="border-l-4 pl-5"
            style={{ borderColor: "#fba74c" }}
          >
            <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">
              {title}
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">{body}</p>
          </div>
        ))}
      </div>

      {/* Closing lines */}
      <div className="mt-16 text-center">
        <p
          className="font-display text-xl sm:text-2xl italic mb-4"
          style={{ color: "#fba74c" }}
        >
          "Ancient flavours. Cold extracted. Delivered this morning."
        </p>
        <p className="text-sm text-gray-400">The work has begun.</p>
      </div>
    </div>
  </section>
);

// ─── Section 3 — Founder Card ─────────────────────────────────────────────────
// ─── Section 3 — Founder Card ─────────────────────────────────────────────────
const FounderCard = () => (
  <section
    className="py-20 md:py-28"
    style={{ background: "hsl(30, 33%, 97%)" }}
  >
    <div className="container max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center text-center gap-6">
        {/* Founder Image */}
        <img
          src="/images/founder-img.jpeg"
          alt="Dhanush, Founder of Quartermelon"
          className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-white"
        />

        {/* Name & credentials */}
        <div>
          <p className="font-display text-3xl text-foreground mb-1">
            Dhanush
          </p>

          <p className="text-gray-500 text-sm mb-2">
            Founder, Quartermelon Hydrate
          </p>

          <p className="text-gray-400 text-xs italic mb-3">
            MSc Food Science · University of Padova, Italy
          </p>

          <p className="text-gray-400 text-xs">
            📍 Bengaluru, India
          </p>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section 5 — Closing CTA Strip ───────────────────────────────────────────
const ClosingCTA = () => (
  <section
    className="py-20 md:py-28 text-white text-center"
    style={{ background: "hsl(348, 72%, 52%)" }}
  >
    <div className="container max-w-2xl">
      <h2 className="font-display text-3xl sm:text-4xl mb-4">
        Try what started it all.
      </h2>
      <p className="text-white/80 text-base mb-10 max-w-md mx-auto">
        Cold-pressed juices with ingredients your grandmother knew by name.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/products"
          className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
          style={{ background: "white", color: "hsl(348, 72%, 52%)" }}
        >
          Shop Juices →
        </Link>
        <Link
          to="/bundles"
          className="inline-flex items-center justify-center rounded-full border-2 border-white text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap"
        >
          Build a Bundle →
        </Link>
      </div>
    </div>
  </section>
);

// ─── Page ────────────────────────────────────────────────────────────────────
const AboutPage = () => (
  <div className="min-h-screen" style={{ background: "hsl(30, 33%, 97%)" }}>
    {/* Minimal top nav */}
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container max-w-5xl py-4">
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-foreground transition-colors"
        >
          ← Home
        </Link>
      </div>
    </div>

    <main>
      <Hero />
      <Story />
      <FounderCard />
      <ClosingCTA />
    </main>

    {/* Footer note */}
    <footer className="py-8 bg-white border-t border-gray-100 text-center">
      <p className="text-xs text-gray-400">
        Quartermelon · Bengaluru, India · 2026
      </p>
    </footer>
  </div>
);

export default AboutPage;

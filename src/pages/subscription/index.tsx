import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, Truck, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { products, dailyJuices, wellnessShots } from "@/data/products";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SUB_BOTTLES = 30;
const ORIGINAL_PRICE = 60;
const SUB_PRICE = 50;

const INITIAL_QUANTITIES: Record<string, number> = {
  "watermelon-sabja": 0,
  "watermelon-gond": 0,
  "muskmelon-sabja": 0,
  "pineapple-sabja": 0,
  "pineapple-gond": 0,
  "turmeric-shot": 0,
  "abc-shot": 0,
};

const SUB_SLUGS = Object.keys(INITIAL_QUANTITIES);

const imageMap: Record<string, string> = {
  "watermelon-sabja": "/products/watermelon-sabja.png",
  "watermelon-gond": "/products/watermelon-gond.png",
  "muskmelon-sabja": "/products/muskmelon.png",
  "pineapple-sabja": "/products/pineapple-sabja.png",
  "pineapple-gond": "/products/pineapple-gond.png",
  "turmeric-shot": "/products/turmeric.png",
  "abc-shot": "/products/abc.png",
};

const C = {
  green: "#2d491f",
  cream: "#ece8dd",
  zoneOne: "#ffffff",
  orange: "#ef7522",
  greenMuted: "rgba(45, 73, 31, 0.7)",
  greenFaint: "rgba(45, 73, 31, 0.6)",
  greenBorder: "rgba(45, 73, 31, 0.15)",
  nodeBg: "rgba(45, 73, 31, 0.15)",
  lineMuted: "rgba(45, 73, 31, 0.2)",
  boxBg: "rgba(45, 73, 31, 0.08)",
  boxBorder: "rgba(45, 73, 31, 0.2)",
};

const PROGRESS_DOTS = 10;

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const productsRef = useRef<HTMLDivElement>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({ ...INITIAL_QUANTITIES });
  const [mobileBoxOpen, setMobileBoxOpen] = useState(false);
  const [flavourSelectKey, setFlavourSelectKey] = useState(0);

  const total = Object.values(quantities).reduce((a, b) => a + b, 0);
  const subComplete = total === SUB_BOTTLES;
  const filledDots = Math.min(PROGRESS_DOTS, Math.round((total / SUB_BOTTLES) * PROGRESS_DOTS));

  useEffect(() => {
    if (total > 0) {
      const cartItems = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([slug, quantity]) => ({
          id: slug,
          name: products.find((p) => p.slug === slug)?.name ?? slug,
          quantity,
          price: SUB_PRICE,
        }));

      localStorage.setItem(
        "quartermelon_cart",
        JSON.stringify({
          type: "subscription",
          items: cartItems,
          savedAt: Date.now(),
        })
      );
    } else {
      localStorage.removeItem("quartermelon_cart");
    }
  }, [quantities, total]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("quartermelon_cart") || "{}");
      if (raw?.switchToSub) {
        setShowProducts(true);
        setTimeout(() => {
          productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if ((location.state as { scrollToProducts?: boolean } | null)?.scrollToProducts) {
      setShowProducts(true);
      setTimeout(() => {
        const el = document.getElementById("product-grid");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 0);
    }
  }, []);

  const handleChooseFlavours = () => {
    setShowProducts(true);
    setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const setQty = (slug: string, next: number) => {
    setQuantities((prev) => ({ ...prev, [slug]: Math.max(0, next) }));
  };

  const increment = (slug: string) => {
    setQuantities((prev) => {
      const t = Object.values(prev).reduce((a, b) => a + b, 0);
      if (t >= SUB_BOTTLES) return prev;
      return { ...prev, [slug]: prev[slug] + 1 };
    });
  };

  const decrement = (slug: string) => {
    setQuantities((prev) => {
      if (prev[slug] === 0) return prev;
      return { ...prev, [slug]: prev[slug] - 1 };
    });
  };

  const startSubscribe = (slug: string) => {
    increment(slug);
  };

  const resetAll = () => {
    setQuantities({ ...INITIAL_QUANTITIES });
    localStorage.removeItem("quartermelon_cart");
  };

  const fillAllWith = (selectedSlug: string) => {
    setQuantities({
      ...Object.fromEntries(Object.keys(INITIAL_QUANTITIES).map((k) => [k, 0])),
      [selectedSlug]: SUB_BOTTLES,
    });
  };

  const removeFromBox = (slug: string) => setQty(slug, 0);

  const handleReview = () => {
    if (total !== SUB_BOTTLES) return;
    const cartItems = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([slug, qty]) => {
        const p = products.find((x) => x.slug === slug);
        return { id: slug, name: p?.name ?? slug, quantity: qty, price: SUB_PRICE };
      });
    localStorage.setItem(
      "quartermelon_cart",
      JSON.stringify({ type: "subscription", items: cartItems, savedAt: Date.now() })
    );
    window.gtag?.("event", "begin_checkout", {
      event_category: "subscription",
      value: 1500,
      currency: "INR",
    });
    navigate("/review");
  };

  const addedItems = Object.entries(quantities).filter(([, qty]) => qty > 0);

  const flavourOptions = SUB_SLUGS.map((slug) => products.find((p) => p.slug === slug)).filter(
    Boolean
  ) as (typeof products)[number][];

  const renderProductCard = (p: (typeof products)[number]) => {
    const qty = quantities[p.slug] ?? 0;
    const img = imageMap[p.slug] || p.images[0];
    const kind = p.category === "wellness-shot" ? "Wellness Shot" : "Daily Juice";
    const plusDisabled = total >= SUB_BOTTLES;

    return (
      <div key={p.slug} className="sub-card">
        <div className="sub-card-img-area">
          <img src={img} alt={p.name} className="sub-card-img" loading="lazy" />
        </div>
        <div className="sub-card-content">
          <h3 className="sub-card-name">{p.name}</h3>
          <p className="sub-card-detail">
            {p.size} | {kind}
          </p>
          <div className="sub-card-pricing">
            <span className="sub-card-old">₹{ORIGINAL_PRICE}</span>
            <span className="sub-card-new">₹{SUB_PRICE}</span>
          </div>
          {qty === 0 ? (
            <button
              type="button"
              className="sub-card-btn sub-card-btn-appear"
              onClick={() => startSubscribe(p.slug)}
              disabled={plusDisabled}
            >
              Subscribe & Save
            </button>
          ) : (
            <div className="sub-card-stepper sub-stepper-appear">
              <button
                type="button"
                className="sub-stepper-btn"
                onClick={() => decrement(p.slug)}
                disabled={qty === 0}
                aria-label="Decrease"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="sub-stepper-count">{qty}</span>
              <button
                type="button"
                className="sub-stepper-btn"
                onClick={() => increment(p.slug)}
                disabled={plusDisabled}
                aria-label="Increase"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const boxPanelInner = (
    <>
      <h2 className="sub-box-title">
        Your Subscription <span className="sub-box-count">({total} / {SUB_BOTTLES})</span>
      </h2>

      {addedItems.length === 0 ? (
        <div className="sub-box-empty">
          <p>Select flavours to build your monthly box.</p>
        </div>
      ) : (
        <div className="sub-box-items">
          {addedItems.map(([slug, qty]) => {
            const p = products.find((x) => x.slug === slug);
            if (!p) return null;
            const img = imageMap[slug] || p.images[0];
            return (
              <div key={slug} className="sub-box-item">
                <div className="sub-box-item-img-wrap">
                  <img src={img} alt={p.name} className="sub-box-item-img" />
                </div>
                <div className="sub-box-item-info">
                  <span className="sub-box-item-name">{p.name}</span>
                  <span className="sub-box-item-meta">×{qty}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromBox(slug)}
                  className="sub-box-item-remove"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="sub-box-divider" />

      <div className="sub-box-progress">
        <div className="sub-dots" aria-hidden>
          {Array.from({ length: PROGRESS_DOTS }).map((_, i) => (
            <div key={i} className={`sub-dot ${i < filledDots ? "sub-dot-filled" : ""}`} />
          ))}
        </div>
        <span className="sub-dots-label">
          {total} of {SUB_BOTTLES}
        </span>
      </div>

      <button
        type="button"
        className={`sub-box-cta ${subComplete ? "sub-box-cta-active" : ""}`}
        disabled={!subComplete}
        onClick={handleReview}
      >
        Review →
      </button>
    </>
  );

  return (
    <>
      <Navbar />

      <main className="sub-page">
        {/* ── Delivery timeline ── */}
        <section className="sub-timeline" aria-label="Subscription delivery schedule">
          <h2 className="sub-timeline-heading">How Your Subscription Works</h2>
          <div className="sub-timeline-scroll">
            <div className="sub-timeline-row">
              <div className="sub-timeline-block">
                <div className="sub-timeline-node" aria-hidden>
                  <Truck size={22} className="sub-timeline-truck" strokeWidth={2} />
                </div>
                <div className="sub-timeline-labels">
                  <span className="sub-tl-muted">Delivery 1</span>
                  <span className="sub-tl-bold">Day 1</span>
                  <span className="sub-tl-muted">10 bottles</span>
                </div>
              </div>
              <div className="sub-timeline-line" />
              <div className="sub-timeline-block">
                <div className="sub-timeline-node" aria-hidden>
                  <Truck size={22} className="sub-timeline-truck" strokeWidth={2} />
                </div>
                <div className="sub-timeline-labels">
                  <span className="sub-tl-muted">Delivery 2</span>
                  <span className="sub-tl-bold">Day 10–12</span>
                  <span className="sub-tl-muted">10 bottles</span>
                </div>
              </div>
              <div className="sub-timeline-line" />
              <div className="sub-timeline-block">
                <div className="sub-timeline-node" aria-hidden>
                  <Truck size={22} className="sub-timeline-truck" strokeWidth={2} />
                </div>
                <div className="sub-timeline-labels">
                  <span className="sub-tl-muted">Delivery 3</span>
                  <span className="sub-tl-bold">Day 20–22</span>
                  <span className="sub-tl-muted">10 bottles</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Plan Hero ── */}
        <section className="sub-hero">
          <div className="sub-hero-inner">
            <p className="sub-label">Subscription Plan</p>
            <h1 className="sub-heading">Your Monthly Wellness Ritual</h1>
            <p className="sub-sub">
              30 bottles delivered across three batches throughout the month — always fresh, always
              cold.
            </p>

            <div className="sub-details">
              <div className="sub-detail-row">
                <span className="sub-detail-label">Plan</span>
                <span className="sub-detail-value">Monthly Wellness Plan</span>
              </div>
              <div className="sub-detail-row">
                <span className="sub-detail-label">Bottles</span>
                <span className="sub-detail-value">30 / month · 180ml each</span>
              </div>
              <div className="sub-detail-row">
                <span className="sub-detail-label">Price</span>
                <span className="sub-detail-value">
                  <span className="sub-price-original">₹{ORIGINAL_PRICE}/bottle</span>{" "}
                  <span className="sub-price-new">₹{SUB_PRICE}/bottle</span>
                </span>
              </div>
              <div className="sub-detail-row">
                <span className="sub-detail-label">Delivery</span>
                <span className="sub-detail-value">3 batches across the month</span>
              </div>
            </div>

            <ul className="sub-perks">
              {[
                "3 deliveries spread across the month",
                "Mix any flavours from our full range",
                "Cancel or pause anytime",
                "Priority restock access",
              ].map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>

            <button type="button" className="sub-cta" onClick={handleChooseFlavours}>
              Choose Your Flavours
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {showProducts && (
          <div className="sub-layout" ref={productsRef} id="choose-flavours">
            <div className="sub-left">
              <div className="sub-products-header">
                <h2 className="sub-products-heading">Choose Your Flavours</h2>
                <p className="sub-products-sub">Mix and match — we deliver fresh daily.</p>
              </div>

              <div className="sub-filter-row">
                <button type="button" className="sub-filter-reset" onClick={resetAll}>
                  ↺ Reset All
                </button>
                <label className="sub-filter-select-wrap">
                  <span className="sr-only">Select a flavour to fill all 30 bottles</span>
                  <select
                    key={flavourSelectKey}
                    className="sub-filter-select"
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) {
                        fillAllWith(v);
                        setFlavourSelectKey((k) => k + 1);
                      }
                    }}
                  >
                    <option value="">Select a flavour — fill all 30 ▾</option>
                    {flavourOptions.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="sub-section-label">Daily Juice Line</div>
              <div className="sub-product-grid" id="product-grid">{dailyJuices.map(renderProductCard)}</div>

              <div className="sub-section-label" style={{ marginTop: "40px" }}>
                Wellness Shots
              </div>
              <div className="sub-product-grid">{wellnessShots.map(renderProductCard)}</div>
            </div>

            <div className="sub-right">
              <div className="sub-box">{boxPanelInner}</div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile drawer */}
      {showProducts && (
        <div className={`sub-mobile-wrap ${mobileBoxOpen ? "sub-mobile-open" : ""}`}>
          <button
            type="button"
            className="sub-mobile-bar"
            onClick={() => setMobileBoxOpen((o) => !o)}
            aria-expanded={mobileBoxOpen}
          >
            <span className="sub-mobile-bar-text">
              {total} / {SUB_BOTTLES} selected — View Box {mobileBoxOpen ? "▼" : "▲"}
            </span>
          </button>
          <div className="sub-mobile-sheet">
            <div className="sub-mobile-sheet-inner">{boxPanelInner}</div>
          </div>
        </div>
      )}

      <FooterSection />

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .sub-page {
          background-color: #ffffff;
          font-family: 'PlusJakartaSans', sans-serif;
          min-height: 100vh;
          padding-top: 80px;
        }

        /* Timeline */
        .sub-timeline {
          background-color: ${C.zoneOne};
          padding: 40px 24px 32px;
        }
        .sub-timeline-heading {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: clamp(1.1rem, 3.5vw, 1.5rem);
          font-weight: 700;
          color: ${C.green};
          text-align: center;
          margin: 0 0 28px;
        }
        .sub-timeline-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
        }
        .sub-timeline-row {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          min-width: 520px;
          margin: 0 auto;
          gap: 0;
        }
        .sub-timeline-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 0 0 auto;
        }
        .sub-timeline-node {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${C.nodeBg};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sub-timeline-truck {
          color: ${C.orange};
        }
        .sub-timeline-line {
          width: clamp(48px, 12vw, 100px);
          height: 3px;
          background: ${C.lineMuted};
          border-radius: 2px;
          margin-top: 28px;
          flex-shrink: 0;
          align-self: flex-start;
        }
        .sub-timeline-labels {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 14px;
          text-align: center;
          max-width: 120px;
        }
        .sub-tl-muted {
          font-size: 0.72rem;
          color: ${C.greenFaint};
          font-weight: 500;
        }
        .sub-tl-bold {
          font-size: 0.88rem;
          font-weight: 700;
          color: ${C.green};
        }

        @media (max-width: 768px) {
          .sub-timeline { padding: 28px 16px 24px; }
          .sub-timeline-heading {
            font-size: 1.05rem;
            margin-bottom: 20px;
          }
          .sub-timeline-node {
            width: 40px;
            height: 40px;
          }
          .sub-timeline-truck {
            width: 18px;
            height: 18px;
          }
          .sub-timeline-line {
            margin-top: 18px;
            width: clamp(28px, 10vw, 64px);
            height: 2px;
          }
          .sub-tl-muted { font-size: 0.65rem; }
          .sub-tl-bold { font-size: 0.78rem; }
          .sub-timeline-labels { margin-top: 10px; max-width: 100px; }
        }

        /* Hero */
        .sub-hero {
          background-color: #ffffff;
          padding: 72px 40px 80px;
        }
        .sub-hero-inner {
          max-width: 680px;
          margin: 0 auto;
          text-align: center;
        }
        .sub-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.green};
          margin-bottom: 16px;
        }
        .sub-heading {
          font-family: 'Gemilion', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 500;
          color: ${C.green};
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }
        .sub-sub {
          font-size: 1rem;
          color: ${C.greenMuted};
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        .sub-details {
          background: #ffffff;
          border: 1px solid ${C.greenBorder};
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 28px;
          text-align: left;
        }
        .sub-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid ${C.greenBorder};
        }
        .sub-detail-row:last-child { border-bottom: none; }
        .sub-detail-label {
          font-size: 0.82rem;
          color: ${C.greenMuted};
          font-weight: 500;
        }
        .sub-detail-value {
          font-size: 0.92rem;
          font-weight: 700;
          color: ${C.green};
        }
        .sub-price-original {
          text-decoration: line-through;
          color: #999;
          font-weight: 400;
          margin-right: 8px;
        }
        .sub-price-new {
          color: ${C.orange};
          font-weight: 800;
        }

        .sub-perks {
          list-style: none;
          padding: 0;
          margin: 0 0 36px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .sub-perks li {
          font-size: 0.9rem;
          color: ${C.green};
          font-weight: 500;
        }

        .sub-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background-color: ${C.orange};
          color: ${C.cream};
          font-family: 'PlusJakartaSans', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          padding: 18px 40px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .sub-cta:hover { opacity: 0.9; transform: translateY(-2px); }

        /* Layout + products */
        .sub-layout {
          background-color: ${C.zoneOne};
          display: grid;
          grid-template-columns: 1fr 320px;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px 100px;
          gap: 32px;
          align-items: start;
        }
        .sub-left {
          min-width: 0;
        }
        .sub-products-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .sub-products-heading {
          font-family: 'Gemilion', serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 500;
          color: ${C.green};
          margin-bottom: 8px;
        }
        .sub-products-sub {
          font-size: 0.95rem;
          color: ${C.greenFaint};
          margin: 0;
        }

        .sub-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .sub-filter-reset {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: ${C.green};
          background: transparent;
          border: 1.5px solid ${C.green};
          border-radius: 999px;
          padding: 10px 18px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .sub-filter-reset:hover {
          background: rgba(45, 73, 31, 0.06);
        }
        .sub-filter-select-wrap {
          flex: 0 1 auto;
        }
        .sub-filter-select {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: ${C.green};
          background: #ffffff;
          border: 1.5px solid ${C.green};
          border-radius: 999px;
          padding: 10px 36px 10px 18px;
          cursor: pointer;
          min-height: 42px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232d491f' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }

        .sub-section-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${C.greenMuted};
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${C.greenBorder};
        }

        .sub-product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 16px;
        }

        .sub-card {
          background-color: #ffffff;
          border: 1px solid ${C.greenBorder};
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .sub-card:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .sub-card-img-area {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 220px;
          padding: 20px;
          overflow: hidden;
        }
        .sub-card-img {
          max-height: 180px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .sub-card:hover .sub-card-img {
          transform: scale(1.04);
        }

        .sub-card-content {
          padding: 12px 16px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
          flex: 1;
        }
        .sub-card-name {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: ${C.green};
          margin: 0;
          line-height: 1.3;
        }
        .sub-card-detail {
          font-size: 0.75rem;
          color: ${C.greenFaint};
          margin: 0;
        }
        .sub-card-pricing {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 6px;
        }
        .sub-card-old {
          font-size: 0.88rem;
          color: #999;
          text-decoration: line-through;
        }
        .sub-card-new {
          font-size: 1.1rem;
          font-weight: 800;
          color: ${C.orange};
        }
        .sub-card-btn {
          width: 100%;
          padding: 14px 16px;
          margin-top: 12px;
          border: none;
          border-radius: 999px;
          background-color: ${C.orange};
          color: ${C.cream};
          font-family: 'PlusJakartaSans', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .sub-card-btn:hover:not(:disabled) { opacity: 0.88; }
        .sub-card-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .sub-card-btn-appear,
        .sub-stepper-appear {
          animation: subFadeStep 0.28s ease;
        }
        @keyframes subFadeStep {
          from { opacity: 0.55; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .sub-card-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-top: 12px;
          width: 100%;
        }
        .sub-stepper-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: ${C.green};
          color: ${C.cream};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .sub-stepper-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.04); }
        .sub-stepper-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .sub-stepper-count {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: ${C.green};
          min-width: 28px;
          text-align: center;
        }

        /* Sticky box */
        .sub-right {
          position: sticky;
          top: 96px;
        }
        .sub-box {
          max-height: 500px;
          background: ${C.boxBg};
          border: 1px solid ${C.boxBorder};
          border-radius: 20px;
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }
        .sub-box-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: ${C.green};
          margin: 0;
          font-family: 'PlusJakartaSans', sans-serif;
        }
        .sub-box-count {
          font-weight: 700;
          color: ${C.greenMuted};
        }
        .sub-box-empty {
          text-align: center;
          padding: 16px 0;
        }
        .sub-box-empty p {
          font-size: 0.88rem;
          color: ${C.greenFaint};
          margin: 0;
        }
        .sub-box-items {
          max-height: min(400px, calc(500px - 168px));
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 6px;
          scrollbar-width: thin;
          scrollbar-color: ${C.green} rgba(45, 73, 31, 0.12);
        }
        .sub-box-items::-webkit-scrollbar {
          width: 6px;
        }
        .sub-box-items::-webkit-scrollbar-track {
          background: rgba(45, 73, 31, 0.08);
          border-radius: 6px;
        }
        .sub-box-items::-webkit-scrollbar-thumb {
          background: ${C.green};
          border-radius: 6px;
        }
        .sub-box-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.55);
          border-radius: 12px;
          padding: 8px 10px;
        }
        .sub-box-item-img-wrap {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sub-box-item-img {
          max-height: 40px;
          max-width: 40px;
          object-fit: contain;
        }
        .sub-box-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .sub-box-item-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: ${C.green};
        }
        .sub-box-item-meta {
          font-size: 0.74rem;
          color: ${C.greenFaint};
        }
        .sub-box-item-remove {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(45, 73, 31, 0.1);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${C.green};
          flex-shrink: 0;
        }
        .sub-box-item-remove:hover {
          background: rgba(45, 73, 31, 0.18);
        }
        .sub-box-divider {
          height: 1px;
          background: ${C.lineMuted};
          flex-shrink: 0;
        }
        .sub-box-progress {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sub-dots {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .sub-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(45, 73, 31, 0.2);
          transition: background 0.25s, transform 0.25s;
        }
        .sub-dot-filled {
          background: ${C.green};
          transform: scale(1.08);
        }
        .sub-dots-label {
          font-size: 0.8rem;
          color: ${C.greenMuted};
          font-weight: 600;
        }
        .sub-box-cta {
          width: 100%;
          padding: 14px 16px;
          border: none;
          border-radius: 12px;
          background: rgba(45, 73, 31, 0.15);
          color: ${C.greenMuted};
          font-weight: 700;
          font-size: 0.92rem;
          cursor: not-allowed;
          font-family: 'PlusJakartaSans', sans-serif;
          transition: background 0.25s, color 0.25s;
          flex-shrink: 0;
        }
        .sub-box-cta-active {
          background: ${C.orange};
          color: ${C.cream};
          cursor: pointer;
        }
        .sub-box-cta-active:hover { opacity: 0.92; }

        /* Mobile bar + sheet */
        .sub-mobile-wrap {
          display: none;
        }

        @media (max-width: 1024px) {
          .sub-product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .sub-layout {
            grid-template-columns: 1fr;
            padding: 0 20px 24px;
          }
          .sub-right { display: none; }
          .sub-hero { padding: 56px 20px 60px; }
          .sub-details { padding: 18px 20px; }
          .sub-product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .sub-card-img-area {
            height: 160px;
            padding: 14px;
          }
          .sub-card-img { max-height: 130px; }
          .sub-card-name { font-size: 0.88rem; }
          .sub-stepper-btn { width: 36px; height: 36px; }
          .sub-stepper-count { font-size: 0.95rem; }

          .sub-page { padding-bottom: 88px; }

          .sub-mobile-wrap {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 45;
          }
          .sub-mobile-bar {
            width: 100%;
            border: none;
            border-top: 1px solid ${C.boxBorder};
            background: ${C.cream};
            padding: 14px 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
            font-family: 'PlusJakartaSans', sans-serif;
          }
          .sub-mobile-bar-text {
            font-size: 0.88rem;
            font-weight: 700;
            color: ${C.green};
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .sub-mobile-sheet {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.35s ease;
            background: ${C.cream};
            border-top: 1px solid ${C.boxBorder};
          }
          .sub-mobile-open .sub-mobile-sheet {
            max-height: 70vh;
          }
          .sub-mobile-sheet-inner {
            max-height: 50vh;
            overflow-y: auto;
            padding: 16px 18px 24px;
          }
          .sub-mobile-sheet-inner .sub-box-items {
            max-height: none;
          }
          .sub-mobile-sheet-inner .sub-box {
            max-height: none;
            border: none;
            background: transparent;
            padding: 0;
            gap: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default SubscriptionPage;

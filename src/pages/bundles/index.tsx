import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { products } from "@/data/products";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const BUNDLE_SIZE = 6;
const PRICE_PER_BOTTLE = 60;
const BUNDLE_PRICE = 300;

// ─── Product list ─────────────────────────────────────────────────────────────
const BUNDLE_PRODUCTS = [
  "watermelon-sabja",
  "watermelon-gond",
  "muskmelon-sabja",
  "pineapple-sabja",
  "pineapple-gond",
  "turmeric-shot",
  "abc-shot",
];

// ─── Image map ────────────────────────────────────────────────────────────────
const imageMap: Record<string, string> = {
  "watermelon-sabja": "/products/watermelon-sabja.png",
  "watermelon-gond": "/products/watermelon-gond.png",
  "muskmelon-sabja": "/products/muskmelon.png",
  "pineapple-sabja": "/products/pineapple-sabja.png",
  "pineapple-gond": "/products/pineapple-gond.png",
  "turmeric-shot": "/products/turmeric.png",
  "abc-shot": "/products/abc.png",
};

type ItemMap = Record<string, number>;

const initialItems: ItemMap = BUNDLE_PRODUCTS.reduce(
  (acc, slug) => ({ ...acc, [slug]: 0 }),
  {}
);

// ─── Page ────────────────────────────────────────────────────────────────────
const BundlesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<ItemMap>(initialItems);
  const [mobileBoxOpen, setMobileBoxOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("quartermelon_cart") || "{}") as {
        type?: unknown;
        items?: unknown;
        savedAt?: unknown;
        bundleSize?: unknown;
      };

      if (raw?.type !== "bundle") return;
      if (!Array.isArray(raw.items)) return;
      if (typeof raw.savedAt === "number" && Date.now() - raw.savedAt > 3600000) return;

      const restored: ItemMap = { ...initialItems };
      for (const item of raw.items as Array<{ id?: unknown; quantity?: unknown }>) {
        const id = typeof item?.id === "string" ? item.id : "";
        const qty = typeof item?.quantity === "number" ? item.quantity : 0;
        if (id in restored) restored[id] = Math.max(0, Math.floor(qty));
      }
      setItems(restored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if ((location.state as { scrollToProducts?: boolean } | null)?.scrollToProducts) {
      const el = document.getElementById("product-grid");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  const total = Object.values(items).reduce((a, b) => a + b, 0);
  const bundleFull = total >= BUNDLE_SIZE;
  const bundleDone = total === BUNDLE_SIZE;
  const runningTotal = total * PRICE_PER_BOTTLE;

  useEffect(() => {
    if (total > 0) {
      localStorage.setItem(
        "quartermelon_cart",
        JSON.stringify({
          type: "bundle",
          items: Object.entries(items)
            .filter(([, qty]) => qty > 0)
            .map(([slug, quantity]) => ({
              id: slug,
              name: products.find((p) => p.slug === slug)?.name ?? slug,
              quantity,
              price: products.find((p) => p.slug === slug)?.price ?? 60,
            })),
          savedAt: Date.now(),
        })
      );
    } else {
      localStorage.removeItem("quartermelon_cart");
    }
  }, [items, total]);

  const bundleProducts = BUNDLE_PRODUCTS.map((slug) =>
    products.find((p) => p.slug === slug)
  ).filter(Boolean) as (typeof products)[number][];

  const increment = (slug: string) => {
    if (total >= BUNDLE_SIZE) return;
    setItems((prev) => ({ ...prev, [slug]: prev[slug] + 1 }));
  };

  const decrement = (slug: string) => {
    if (items[slug] === 0) return;
    setItems((prev) => ({ ...prev, [slug]: prev[slug] - 1 }));
  };

  const removeAll = (slug: string) => {
    setItems((prev) => ({ ...prev, [slug]: 0 }));
  };

  const handleReview = () => {
    if (total !== BUNDLE_SIZE) return;
    const cartItems = Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([slug, qty]) => {
        const p = products.find((x) => x.slug === slug);
        return { id: slug, name: p?.name ?? slug, quantity: qty, price: PRICE_PER_BOTTLE };
      });
    localStorage.setItem(
      "quartermelon_cart",
      JSON.stringify({ type: "bundle", items: cartItems, savedAt: Date.now() })
    );
    window.gtag?.("event", "begin_checkout", {
      event_category: "bundle",
      value: 300,
      currency: "INR",
    });
    navigate("/review");
  };

  // Items added to box
  const addedItems = Object.entries(items).filter(([, qty]) => qty > 0);

  const boxPanelInner = (
    <>
      <h2 className="bun-box-title">Your Box ({total}/{BUNDLE_SIZE})</h2>

      {addedItems.length === 0 ? (
        <div className="bun-box-empty">
          <p>Your box is empty.</p>
          <p className="bun-box-empty-sub">Add 6 bottles to unlock ₹300 pricing.</p>
        </div>
      ) : (
        <div className="bun-box-items">
          {addedItems.map(([slug, qty]) => {
            const p = products.find((x) => x.slug === slug);
            if (!p) return null;
            const img = imageMap[slug] || p.images[0];
            return (
              <div key={slug} className="bun-box-item">
                <div className="bun-box-item-img-wrap">
                  <img src={img} alt={p.name} className="bun-box-item-img" />
                </div>
                <div className="bun-box-item-info">
                  <span className="bun-box-item-name">{p.name}</span>
                  <span className="bun-box-item-meta">×{qty} · ₹{qty * PRICE_PER_BOTTLE}</span>
                </div>
                <button
                  onClick={() => removeAll(slug)}
                  className="bun-box-item-remove"
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bun-box-divider" />

      <div className="bun-box-progress">
        <div className="bun-dots">
          {Array.from({ length: BUNDLE_SIZE }).map((_, i) => (
            <div
              key={i}
              className={`bun-dot ${i < total ? "bun-dot-filled" : ""}`}
            />
          ))}
        </div>
        <span className="bun-dots-label">{total} of {BUNDLE_SIZE}</span>
      </div>

      <div className="bun-box-total">
        <div className="bun-box-total-row">
          <span>Total</span>
          <span className="bun-box-total-price">₹{runningTotal}</span>
        </div>
        {bundleDone && (
          <p className="bun-box-total-note">Final price ₹{BUNDLE_PRICE} unlocks at checkout</p>
        )}
      </div>

      <button
        className={`bun-box-cta ${bundleDone ? "bun-box-cta-active" : ""}`}
        disabled={!bundleDone}
        onClick={handleReview}
      >
        Review Your Box
      </button>
    </>
  );

  return (
    <>
      <Navbar />

      <main className="bun-page">
        <div className="bun-layout">
          {/* ── LEFT SIDE: Header + Product Grid ── */}
          <div className="bun-left">
            {/* Header */}
            <div className="bun-header">
              <h1 className="bun-title">Make Your Own Bundle</h1>
              <p className="bun-sub">
                Your flavours, your bundle! <strong>6 bottles for ₹300.</strong>{" "}
                Discount kicks in at checkout.
              </p>
            </div>

            {/* Product Grid */}
            <div className="bun-grid" id="product-grid">
              {bundleProducts.map((product) => {
                const qty = items[product.slug] ?? 0;
                const img = imageMap[product.slug] || product.images[0];

                return (
                  <div
                    key={product.slug}
                    className={`bun-card ${qty > 0 ? "bun-card-active" : ""}`}
                  >
                    {/* Size badge */}
                    <span className="bun-badge">{product.size}</span>

                    {/* Image */}
                    <div className="bun-card-img-wrap">
                      <img
                        src={img}
                        alt={product.name}
                        className="bun-card-img"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <h3 className="bun-card-name">{product.name}</h3>
                    <p className="bun-card-tagline">{product.tagline}</p>
                    <span className="bun-card-price">₹{PRICE_PER_BOTTLE}</span>

                    {/* Button */}
                    {qty > 0 ? (
                      <div className="bun-card-stepper">
                        <button
                          onClick={() => decrement(product.slug)}
                          className="bun-stepper-btn"
                          aria-label="Decrease"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="bun-stepper-count">{qty}</span>
                        <button
                          onClick={() => increment(product.slug)}
                          disabled={bundleFull}
                          className="bun-stepper-btn bun-stepper-plus"
                          aria-label="Increase"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="bun-card-btn"
                        onClick={() => increment(product.slug)}
                        disabled={bundleFull}
                      >
                        Add to Bundle
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT SIDE: Sticky Box Panel ── */}
          <div className="bun-right">
            <div className="bun-box">{boxPanelInner}</div>
          </div>
        </div>

        {/* ── Mobile bottom drawer (expandable) ── */}
        <div className={`bun-mobile-wrap ${mobileBoxOpen ? "bun-mobile-open" : ""}`}>
          <button
            type="button"
            className="bun-mobile-bar"
            onClick={() => setMobileBoxOpen((o) => !o)}
            aria-expanded={mobileBoxOpen}
          >
            <span className="bun-mobile-bar-label">
              {total} / {BUNDLE_SIZE} selected — View Box {mobileBoxOpen ? "▼" : "▲"}
            </span>
          </button>
          <div className="bun-mobile-sheet">
            <div className="bun-mobile-sheet-inner">
              <div className="bun-box bun-box-mobile-sheet">{boxPanelInner}</div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />

      <style>{`
        .bun-page {
          background-color: #F5F0E8;
          font-family: 'PlusJakartaSans', sans-serif;
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 40px;
        }
        .bun-layout {
          display: grid;
          grid-template-columns: 65% 35%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
          gap: 32px;
          align-items: start;
        }

        /* ── LEFT ── */
        .bun-left {}
        .bun-header { margin-bottom: 32px; }
        .bun-title {
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.15;
          margin: 0 0 8px;
        }
        .bun-sub {
          font-size: 0.95rem;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
        }
        .bun-sub strong { color: #1a1a1a; }

        .bun-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* ── Card ── */
        .bun-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          transition: box-shadow 0.2s, transform 0.2s;
          border: 1.5px solid #E5E7EB;
        }
        .bun-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-2px); }
        .bun-card-active { border-color: #7BC67A; }
        .bun-card-out { opacity: 0.45; pointer-events: none; }

        .bun-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background-color: #D4F5D0;
          color: #2D6A4F;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }

        .bun-card-img-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 180px;
          overflow: hidden;
        }
        .bun-card-img {
          max-height: 160px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
        }

        .bun-card-name {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.3;
        }
        .bun-card-tagline {
          font-size: 0.8rem;
          color: #6B7280;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bun-card-price {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .bun-card-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 12px;
          background-color: #7BC67A;
          color: #1a1a1a;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 4px;
        }
        .bun-card-btn:hover { background-color: #65b864; }
        .bun-card-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .bun-card-btn-disabled {
          background-color: #D9D9D9;
          color: #888;
          cursor: not-allowed;
        }

        .bun-card-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 4px;
        }
        .bun-stepper-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #E5E7EB;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1a1a1a;
          transition: border-color 0.2s;
        }
        .bun-stepper-btn:hover { border-color: #7BC67A; }
        .bun-stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .bun-stepper-plus {
          background-color: #7BC67A;
          border-color: #7BC67A;
          color: #fff;
        }
        .bun-stepper-count {
          font-size: 1.1rem;
          font-weight: 800;
          color: #2D6A4F;
          min-width: 24px;
          text-align: center;
        }

        /* ── RIGHT: Box Panel ── */
        .bun-right {
          position: sticky;
          top: 100px;
        }
        .bun-box {
          background-color: #EAF4E8;
          border-radius: 20px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bun-box-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }

        .bun-box-empty {
          text-align: center;
          padding: 24px 0;
        }
        .bun-box-empty p {
          font-size: 0.95rem;
          color: #6B7280;
          margin: 0;
        }
        .bun-box-empty-sub {
          font-size: 0.82rem;
          color: #999;
          margin-top: 4px !important;
        }

        .bun-box-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bun-box-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.7);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .bun-box-item-img-wrap {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bun-box-item-img {
          max-height: 40px;
          max-width: 40px;
          object-fit: contain;
        }
        .bun-box-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .bun-box-item-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        .bun-box-item-meta {
          font-size: 0.75rem;
          color: #6B7280;
        }
        .bun-box-item-remove {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0,0,0,0.06);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #888;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .bun-box-item-remove:hover { background: rgba(0,0,0,0.12); }

        .bun-box-divider {
          height: 1px;
          background-color: rgba(0,0,0,0.08);
        }

        .bun-box-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bun-dots {
          display: flex;
          gap: 6px;
        }
        .bun-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #D9D9D9;
          transition: background 0.3s, transform 0.3s;
        }
        .bun-dot-filled {
          background-color: #2D6A4F;
          transform: scale(1.1);
        }
        .bun-dots-label {
          font-size: 0.82rem;
          color: #6B7280;
          font-weight: 600;
        }

        .bun-box-total {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bun-box-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        .bun-box-total-price { font-size: 1.2rem; }
        .bun-box-total-note {
          font-size: 0.78rem;
          color: #2D6A4F;
          margin: 0;
          font-weight: 600;
        }

        .bun-box-cta {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          background-color: #D9D9D9;
          color: #888;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: not-allowed;
          transition: background-color 0.3s, color 0.3s;
        }
        .bun-box-cta-active {
          background-color: #2D6A4F;
          color: #ffffff;
          cursor: pointer;
        }
        .bun-box-cta-active:hover { background-color: #245840; }

        /* ── Mobile bottom bar (expandable) ── */
        .bun-mobile-wrap { display: none; }

        @media (max-width: 768px) {
          .bun-page { padding-top: 80px; padding-bottom: 100px; }
          .bun-layout {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }
          .bun-right { display: none; }
          .bun-grid { grid-template-columns: 1fr; }
          .bun-card-img-wrap { height: 150px; }
          .bun-card-img { max-height: 130px; }

          .bun-mobile-wrap {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 40;
          }
          .bun-mobile-bar {
            width: 100%;
            border: none;
            border-top: 1px solid rgba(0,0,0,0.08);
            background: #EAF4E8;
            padding: 14px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
            font-family: 'PlusJakartaSans', sans-serif;
          }
          .bun-mobile-bar-label {
            font-size: 0.88rem;
            font-weight: 700;
            color: #2D6A4F;
          }
          .bun-mobile-sheet {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.35s ease;
            background: #EAF4E8;
            border-top: 1px solid rgba(0,0,0,0.06);
          }
          .bun-mobile-open .bun-mobile-sheet {
            max-height: 70vh;
          }
          .bun-mobile-sheet-inner {
            max-height: 50vh;
            overflow-y: auto;
            padding: 16px 20px 24px;
          }
          .bun-box-mobile-sheet {
            background: transparent;
            padding: 0;
            gap: 14px;
          }
          .bun-box-mobile-sheet .bun-box-items {
            max-height: none;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .bun-layout { grid-template-columns: 60% 40%; }
        }
      `}</style>
    </>
  );
};

export default BundlesPage;

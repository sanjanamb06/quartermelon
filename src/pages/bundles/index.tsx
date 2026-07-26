import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { products } from "@/data/products";
import {
  buildCustomBundle,
  readCart,
  writeCart,
  canAddToCart,
  clearCartAndSetMode,
  CART_KEY,
} from "@/data/bundles";
import CartConflictModal from "@/components/CartConflictModal";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/** Minimum total bottles required to proceed to review. No maximum cap. */
const MIN_BOTTLES = 5;

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// â”€â”€â”€ Product list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BUNDLE_PRODUCTS = [
  "watermelon-sabja",
  "watermelon-gond",
  "lemonade-pink",
  "lemonade-purple",
  "pineapple-sabja",
  "pineapple-gond",
  "turmeric-shot",
  "abc-shot",
];

type ItemMap = Record<string, number>;

const initialItems: ItemMap = BUNDLE_PRODUCTS.reduce(
  (acc, slug) => ({ ...acc, [slug]: 0 }),
  {}
);

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BundlesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<ItemMap>(initialItems);
  const [ctaPulse, setCtaPulse] = useState(false);
  const prevTotalRef = useRef(0);
  const [showConflict, setShowConflict] = useState(false);

  // ── Restore custom bundle items from cart on mount ──
  useEffect(() => {
    try {
      const cart = readCart();

      // Show conflict modal if cart is already committed to ASSORTED
      if (!canAddToCart(cart, "CUSTOM")) {
        setShowConflict(true);
        return;
      }

      if (!cart?.customBundle) return;

      const restored: ItemMap = { ...initialItems };
      for (const item of cart.customBundle.items) {
        if (item.slug in restored) {
          restored[item.slug] = Math.max(0, Math.floor(item.quantity));
        }
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

  const customBundleTotal = Object.values(items).reduce((a, b) => a + b, 0);
  const canProceed = customBundleTotal >= MIN_BOTTLES;
  const reviewButtonLabel = canProceed
    ? "Review Bundle →"
    : `Add ${MIN_BOTTLES - customBundleTotal} more to continue`;

  useEffect(() => {
    if (customBundleTotal === 0) {
      prevTotalRef.current = 0;
      return;
    }
    if (prevTotalRef.current < MIN_BOTTLES && customBundleTotal >= MIN_BOTTLES) {
      setCtaPulse(true);
      const t = window.setTimeout(() => setCtaPulse(false), 2400);
      prevTotalRef.current = customBundleTotal;
      return () => window.clearTimeout(t);
    }
    prevTotalRef.current = customBundleTotal;
  }, [customBundleTotal]);

  // ── Persist only the customBundle portion of the cart on every items change ──
  // Reads existing cart to preserve fixedLines set by the /packages page.
  useEffect(() => {
    try {
      const existing = readCart();
      const fixedLines = existing?.fixedLines ?? [];
      const customBundle = buildCustomBundle(
        Object.fromEntries(
          BUNDLE_PRODUCTS.map((slug) => {
            const p = products.find((x) => x.slug === slug);
            return [
              slug,
              {
                name: p?.name ?? slug,
                quantity: items[slug] ?? 0,
                price: p?.price ?? 0,
              },
            ];
          })
        )
      );

      if (fixedLines.length === 0 && customBundle === null) {
        // Nothing in cart at all ─ remove the key to keep localStorage clean
        localStorage.removeItem(CART_KEY);
      } else {
        writeCart({ mode: "CUSTOM", fixedLines, customBundle });
      }
    } catch {
      // ignore
    }
  }, [items]);

  const bundleProducts = BUNDLE_PRODUCTS.map((slug) =>
    products.find((p) => p.slug === slug)
  ).filter(Boolean) as (typeof products)[number][];

  const gridProducts = bundleProducts.filter((product) => product.slug !== "lemonade-pink");

  const increment = (slug: string) => {
    // No upper cap ─ any total is allowed
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
    if (!canProceed) return;

    // Build and persist the final custom bundle, preserving any fixedLines
    try {
      const existing = readCart();
      const fixedLines = existing?.fixedLines ?? [];
      const customBundle = buildCustomBundle(
        Object.fromEntries(
          BUNDLE_PRODUCTS.map((slug) => {
            const p = products.find((x) => x.slug === slug);
            return [
              slug,
              {
                name: p?.name ?? slug,
                quantity: items[slug] ?? 0,
                price: p?.price ?? 0,
              },
            ];
          })
        )
      );
      writeCart({ mode: "CUSTOM", fixedLines, customBundle });
    } catch {
      // ignore
    }

    window.gtag?.("event", "begin_checkout", {
      event_category: "custom_bundle",
      value: customBundleTotal,
      currency: "INR",
    });
    navigate("/review");
  };

  // Items added to box
  const addedItems = Object.entries(items).filter(([, qty]) => qty > 0);

  const boxPanelInner = (
    <>
      <h2 className="bun-box-title">Your Box ({customBundleTotal} item{customBundleTotal !== 1 ? "s" : ""})</h2>

      {addedItems.length === 0 ? (
        <div className="bun-box-empty">
          <p>Your box is empty.</p>
          <p className="bun-box-empty-sub">Add at least {MIN_BOTTLES} items to continue.</p>
        </div>
      ) : (
        <div className="bun-box-items">
          {addedItems.map(([slug, qty]) => {
            const p = products.find((x) => x.slug === slug);
            if (!p) return null;
            const img = p.images[0];
            return (
              <div key={slug} className="bun-box-item">
                <div className="bun-box-item-img-wrap">
                  <img src={img} alt={p.name} className="bun-box-item-img" />
                </div>
                <div className="bun-box-item-info">
                  <span className="bun-box-item-name">{p.name}</span>
                  <span className="bun-box-item-meta">×{qty}</span>
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

      {/* Progress bar towards minimum */}
      <div className="bun-box-progress">
        <div className="bun-progress-bar-track">
          <div
            className="bun-progress-bar-fill"
            style={{ width: `${Math.min(100, (customBundleTotal / MIN_BOTTLES) * 100)}%` }}
          />
        </div>
        <span className="bun-dots-label">
          {customBundleTotal >= MIN_BOTTLES
            ? `${customBundleTotal} items ✓`
            : `${customBundleTotal} / ${MIN_BOTTLES} items`}
        </span>
      </div>

      <button
        type="button"
        className={`bun-view-cart-btn ${canProceed ? "bun-view-cart-btn-active" : "bun-view-cart-btn-disabled"} ${ctaPulse ? "bun-view-cart-btn-pulse" : ""}`}
        disabled={!canProceed}
        onClick={handleReview}
      >
        {reviewButtonLabel}
      </button>
    </>
  );

  return (
    <>
      {showConflict && (
        <CartConflictModal
          currentMode="ASSORTED"
          onDismiss={() => { navigate("/packages"); }}
          onSwitch={() => {
            clearCartAndSetMode("CUSTOM");
            window.dispatchEvent(new Event("storage"));
            setShowConflict(false);
          }}
        />
      )}
      <Navbar />

      <main className="bun-page">
        <div className="bun-layout">
          {/* â”€â”€ LEFT SIDE: Header + Product Grid â”€â”€ */}
          <div className="bun-left">
            {/* Header */}
            <div className="bun-header">
              <h1 className="bun-title">Make Your Own Bundle</h1>
              <p className="bun-sub">
                Mix and match your favourites!{" "}
                <strong>Minimum {MIN_BOTTLES} items.</strong>
              </p>
            </div>

            {/* Persistent pricing notice */}
            <div className="bun-pricing-notice">
              Pricing for custom bundles is confirmed over WhatsApp based on your selection. Build your bundle, and we'll get back to you with the total.
            </div>

            {/* Product Grid */}
            <div className="bun-grid" id="product-grid">
              {gridProducts.map((product) => {
                const qty = items[product.slug] ?? 0;
                const img = product.images[0];

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
                          className="bun-stepper-btn"
                          aria-label="Increase"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="bun-card-btn"
                        onClick={() => increment(product.slug)}
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

        {/* Mobile sticky bar — fixed bottom CTA */}
        <div className="bun-mobile-sticky-bar" aria-label="Review bundle">
          <button
            type="button"
            className={`bun-view-cart-btn ${canProceed ? "bun-view-cart-btn-active" : "bun-view-cart-btn-disabled"} ${ctaPulse ? "bun-view-cart-btn-pulse" : ""}`}
            disabled={!canProceed}
            onClick={handleReview}
          >
            {reviewButtonLabel}
          </button>
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

        /* â”€â”€ LEFT â”€â”€ */
        .bun-left {}
        .bun-header { margin-bottom: 32px; }
        .bun-title {
          font-family: 'Gemilion', serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1.15;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .bun-sub {
          font-size: 0.95rem;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
        }
        .bun-sub strong { color: #1a1a1a; }

        .bun-pricing-notice {
          background: #ffffff;
          border: 1px solid #1E331E;
          border-radius: 0;
          color: #1E331E;
          font-size: 0.85rem;
          line-height: 1.45;
          padding: 12px 16px;
          margin-bottom: 24px;
        }

        .bun-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* â”€â”€ Card â”€â”€ */
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
          border: 1.5px solid #000000;
          border-radius: 0;
          background-color: #ffffff;
          color: #1E331E;
          font-weight: 600;
          font-size: 0.88rem;
          font-family: 'PlusJakartaSans', sans-serif;
          cursor: pointer;
          transition: background-color 0.2s, box-shadow 0.2s;
          margin-top: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .bun-card-btn:hover {
          background-color: #F5F5F5;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .bun-card-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .bun-card-stepper {
          display: flex;
          align-items: center;
          border: 1.5px solid #000000;
          border-radius: 0;
          overflow: hidden;
          margin-top: 4px;
          width: 100%;
        }
        .bun-stepper-btn {
          flex: 1;
          height: 40px;
          border: none;
          border-radius: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1E331E;
          transition: background-color 0.15s;
        }
        .bun-stepper-btn:hover:not(:disabled) { background-color: #F5F5F5; }
        .bun-stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .bun-stepper-count {
          flex: 1;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1E331E;
          border-left: 1.5px solid #000000;
          border-right: 1.5px solid #000000;
          line-height: 40px;
        }

        /* â”€â”€ RIGHT: Box Panel â”€â”€ */
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

        /* â”€â”€ Progress bar (replaces dot indicators) â”€â”€ */
        .bun-box-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bun-progress-bar-track {
          flex: 1;
          height: 8px;
          background-color: #D9D9D9;
          border-radius: 999px;
          overflow: hidden;
        }
        .bun-progress-bar-fill {
          height: 100%;
          background-color: #2D6A4F;
          border-radius: 999px;
          transition: width 0.3s ease;
        }
        .bun-dots-label {
          font-size: 0.82rem;
          color: #6B7280;
          font-weight: 600;
          white-space: nowrap;
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
        .bun-box-total-note-hint {
          font-size: 0.78rem;
          color: #888;
          margin: 0;
          font-weight: 500;
        }

        .bun-view-cart-btn {
          width: 100%;
          padding: 14px 20px;
          border: 1.5px solid #000000;
          border-radius: 0;
          font-weight: 600;
          font-size: 0.95rem;
          font-family: 'PlusJakartaSans', sans-serif;
          transition: background-color 0.2s, box-shadow 0.2s;
        }
        .bun-view-cart-btn-disabled {
          background-color: #E5E7EB;
          border-color: #D1D5DB;
          color: #9CA3AF;
          cursor: not-allowed;
        }
        .bun-view-cart-btn-active {
          background-color: #ffffff;
          border-color: #000000;
          color: #1E331E;
          cursor: pointer;
        }
        .bun-view-cart-btn-active:hover {
          background-color: #F5F5F5;
        }
        .bun-view-cart-btn-pulse {
          animation: bun-view-cart-pulse 1.2s ease-in-out 2;
        }
        @keyframes bun-view-cart-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          }
        }

        .bun-mobile-sticky-bar {
          display: none;
        }

        @media (max-width: 768px) {
          .bun-page {
            padding-top: 80px;
            padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
          }
          .bun-layout {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }
          .bun-right { display: none; }
          .bun-grid { grid-template-columns: 1fr; }
          .bun-card-img-wrap { height: 150px; }
          .bun-card-img { max-height: 130px; }

          .bun-mobile-sticky-bar {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 40;
            background-color: #F5F0E8;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.1);
            padding: 14px 20px;
            padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
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

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Minus, Plus, ChevronLeft, Snowflake, Leaf, Thermometer } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { PRESET_BUNDLES, readCart, writeCart, canAddToCart, clearCartAndSetMode } from "@/data/bundles";
import type { FixedBundleType } from "@/data/bundles";
import CartConflictModal from "@/components/CartConflictModal";

const BUNDLE_META: Record<FixedBundleType, { description: string; coverImage: string }> = {
  "all-juice": {
    description: "A refreshing assortment of our signature cold-pressed daily juices, carefully selected to give you a balanced variety of flavours and natural fibre throughout the week.",
    coverImage: "/bundles-package/all-juice.png",
  },
  "all-shots": {
    description: "Eight cold-pressed wellness shots in two signature flavours. Packed with real fruit and vegetable goodness, they're an easy way to add a healthy boost to your mornings one small shot at a time.",
    coverImage: "/bundles-package/all-shots.png",
  },
  "all-beverages": {
    description: "The complete Quartermelon experience. Our full lineup of cold-pressed juices and wellness shots everything you need for a vibrant, nourishing week.",
    coverImage: "/bundles-package/all-beverages.png",
  },
};

const INFO_ROWS = [
  { icon: Snowflake, label: "Keep Refrigerated", detail: "Best enjoyed cold, store between 2-8 degrees C" },
  { icon: Leaf, label: "No Preservatives", detail: "100% natural, cold-pressed fresh" },
  { icon: Thermometer, label: "Cold Pressed", detail: "HPP processed to retain maximum nutrients" },
];

const PackageDetailPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const bundleType = type as FixedBundleType;
  const def = PRESET_BUNDLES[bundleType];
  const meta = BUNDLE_META[bundleType];

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showConflict, setShowConflict] = useState(false);

  /** Performs the actual cart write — extracted so it can be called after conflict resolution too. */
  const doAddToCart = () => {
    try {
      const existing = readCart();
      const fixedLines = existing?.fixedLines ?? [];
      const customBundle = existing?.customBundle ?? null;
      const already = fixedLines.find((l) => l.bundleType === bundleType);
      const newLines = already
        ? fixedLines.map((l) => l.bundleType === bundleType ? { ...l, quantity: l.quantity + qty } : l)
        : [...fixedLines, { bundleType, displayName: def.displayName, quantity: qty, unitPrice: def.unitPrice }];
      writeCart({ mode: "ASSORTED", fixedLines: newLines, customBundle });
      window.dispatchEvent(new Event("storage"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch { /* ignore */ }
  };

  const handleAddToCart = () => {
    const existing = readCart();
    if (!canAddToCart(existing, "ASSORTED")) {
      setShowConflict(true);
      return;
    }
    doAddToCart();
  };

  if (!def) {
    return (
      <>
        <Navbar />
        <div className="bd-not-found">
          <p>Bundle not found.</p>
          <Link to="/packages">Back to bundles</Link>
        </div>
        <FooterSection />
      </>
    );
  }

  return (
    <>
      {showConflict && (
        <CartConflictModal
          currentMode="CUSTOM"
          onDismiss={() => setShowConflict(false)}
          onSwitch={() => {
            clearCartAndSetMode("ASSORTED");
            window.dispatchEvent(new Event("storage"));
            setShowConflict(false);
            doAddToCart();
          }}
        />
      )}
      <Navbar />
      <main className="bd-page">
        <div className="bd-breadcrumb">
          <button className="bd-back-btn" onClick={() => navigate("/packages")}>
            <ChevronLeft size={16} />
            All Bundles
          </button>
        </div>
        <div className="bd-layout">
          <div className="bd-image-col">
            <div className="bd-image-wrap">
              <img src={meta.coverImage} alt={def.displayName} className="bd-image" />
            </div>
          </div>
          <div className="bd-content-col">
            <h1 className="bd-name">{def.displayName}</h1>
            <p className="bd-price">₹{def.unitPrice}</p>
            <p className="bd-desc">{meta.description}</p>
            <div className="bd-divider" />
            <div className="bd-contents">
              <h2 className="bd-contents-heading">Includes</h2>
              <ul className="bd-contents-list">
                {def.items.map((item) => (
                  <li key={item.slug} className="bd-contents-item">
                    <span className="bd-contents-bullet" aria-hidden />
                    <span className="bd-contents-name">{item.name}</span>
                    <span className="bd-contents-qty">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bd-divider" />
            <div className="bd-qty-row">
              <span className="bd-qty-label">Quantity</span>
              <div className="bd-qty-selector" role="group" aria-label="Bundle quantity">
                <button className="bd-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" disabled={qty <= 1}>
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span className="bd-qty-count">{qty}</span>
                <button className="bd-qty-btn bd-qty-plus" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <button className={"bd-add-btn" + (added ? " bd-add-btn-success" : "")} onClick={handleAddToCart} id="bd-add-to-cart">
              {added ? "Added to Cart ✓" : "Add to Cart — ₹" + (def.unitPrice * qty)}
            </button>
            <button className="bd-review-btn" onClick={() => navigate("/review")}>
              View Cart and Checkout
            </button>
            <div className="bd-divider" />
            <div className="bd-info-rows">
              {INFO_ROWS.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="bd-info-row">
                  <div className="bd-info-icon"><Icon size={16} strokeWidth={1.5} /></div>
                  <div className="bd-info-text">
                    <span className="bd-info-label">{label}</span>
                    <span className="bd-info-detail">{detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <FooterSection />
      <style>{`
        .bd-page { background-color: #FAFAF8; font-family: 'PlusJakartaSans', sans-serif; min-height: 100vh; padding-bottom: 80px; }
        .bd-breadcrumb { max-width: 1200px; margin: 0 auto; padding: 24px 40px 0; }
        .bd-back-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: #6B7280; font-family: 'PlusJakartaSans', sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0; transition: color 0.2s; }
        .bd-back-btn:hover { color: #1a1a1a; }
        .bd-layout { max-width: 1200px; margin: 0 auto; padding: 32px 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
        .bd-image-col { position: sticky; top: 32px; }
        
        /* Enforce portrait 3:4 aspect ratio locked */
        .bd-image-wrap { border-radius: 12px; overflow: hidden; background-color: #F2EFE8; aspect-ratio: 3 / 4; animation: bdFadeIn 0.5s ease both; }
        .bd-image { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        @keyframes bdFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        
        .bd-content-col { padding-top: 8px; display: flex; flex-direction: column; gap: 0; }
        .bd-name { font-family: 'Gemilion', serif; font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 500; color: #1a1a1a; margin: 0 0 8px; line-height: 1.15; letter-spacing: -0.01em; }
        .bd-price { font-size: 1.5rem; font-weight: 800; color: #2D6A4F; margin: 0 0 16px; }
        .bd-desc { font-size: 0.92rem; color: #6B7280; line-height: 1.65; margin: 0 0 24px; }
        .bd-divider { height: 1px; background: rgba(0,0,0,0.07); margin: 24px 0; }
        .bd-contents-heading { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9CA3AF; margin: 0 0 14px; }
        .bd-contents-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .bd-contents-item { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #374151; }
        .bd-contents-bullet { width: 6px; height: 6px; border-radius: 50%; background-color: #2D6A4F; flex-shrink: 0; }
        .bd-contents-name { flex: 1; font-weight: 500; }
        .bd-contents-qty { font-weight: 700; color: #9CA3AF; font-size: 0.85rem; flex-shrink: 0; }
        .bd-qty-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .bd-qty-label { font-size: 0.88rem; font-weight: 600; color: #374151; }
        
        /* Boxy, rectangular quantity selector */
        .bd-qty-selector { display: flex; align-items: center; border: 1.5px solid #000000; border-radius: 0; overflow: hidden; }
        .bd-qty-btn { width: 40px; height: 40px; background: #ffffff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1E331E; transition: background-color 0.15s; }
        .bd-qty-btn:hover:not(:disabled) { background-color: #F5F5F5; }
        .bd-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .bd-qty-plus { background-color: #ffffff; color: #1E331E; }
        .bd-qty-plus:hover { background-color: #F5F5F5 !important; }
        .bd-qty-count { min-width: 44px; text-align: center; font-size: 0.95rem; font-weight: 700; color: #1E331E; border-left: 1.5px solid #000000; border-right: 1.5px solid #000000; line-height: 40px; }
        
        /* New Rectangular Button Style System: square corners, white bg, black border, green text */
        .bd-add-btn { width: 100%; padding: 16px; border: 1.5px solid #000000; border-radius: 0; background-color: #ffffff; color: #1E331E; font-family: 'PlusJakartaSans', sans-serif; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background-color 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .bd-add-btn:hover { background-color: #F5F5F5; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .bd-add-btn-success { background-color: #E8F5E9; color: #2E7D32; border-color: #2E7D32; }
        
        .bd-review-btn { margin-top: 12px; width: 100%; padding: 14px; border: 1.5px solid #000000; border-radius: 0; background-color: #ffffff; color: #1E331E; font-family: 'PlusJakartaSans', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s ease; }
        .bd-review-btn:hover { background-color: #F5F5F5; }
        
        .bd-info-rows { display: flex; flex-direction: column; gap: 14px; }
        .bd-info-row { display: flex; align-items: flex-start; gap: 14px; }
        .bd-info-icon { width: 36px; height: 36px; border-radius: 8px; background-color: #F0F7F4; display: flex; align-items: center; justify-content: center; color: #2D6A4F; flex-shrink: 0; }
        .bd-info-text { display: flex; flex-direction: column; gap: 1px; }
        .bd-info-label { font-size: 0.85rem; font-weight: 700; color: #1a1a1a; }
        .bd-info-detail { font-size: 0.78rem; color: #9CA3AF; }
        .bd-not-found { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; font-family: 'PlusJakartaSans', sans-serif; color: #6B7280; }
        @media (max-width: 1024px) { .bd-layout { padding: 24px 24px 0; gap: 40px; } .bd-breadcrumb { padding: 20px 24px 0; } }
        @media (max-width: 768px) { .bd-layout { grid-template-columns: 1fr; gap: 32px; padding: 20px 16px 0; } .bd-breadcrumb { padding: 16px 16px 0; } .bd-image-col { position: static; } .bd-image-wrap { aspect-ratio: 3 / 4; /* Lock to 3:4 portrait on mobile too */ border-radius: 12px; } .bd-name { font-size: 1.8rem; } }
      `}</style>
    </>
  );
};

export default PackageDetailPage;
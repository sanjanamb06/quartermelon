import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { PRESET_BUNDLES } from "@/data/bundles";
import type { FixedBundleType } from "@/data/bundles";

// Bundle catalogue metadata
const BUNDLE_ORDER: FixedBundleType[] = ["all-juice", "all-beverages", "all-shots"];

const BUNDLE_META: Record<FixedBundleType, { description: string; coverImage: string }> = {
  "all-juice": {
    description: "Four cold-pressed daily juices, packed with fibre and zero added sugar.",
    coverImage: "/bundles-package/all-juice.png",
  },
  "all-beverages": {
    description: "Our complete lineup: four juices and two shots for the full Quartermelon experience.",
    coverImage: "/bundles-package/all-beverages.png",
  },
  "all-shots": {
    description: "Eight wellness shots — two varieties, four of each — to kick-start your mornings.",
    coverImage: "/bundles-package/all-shots.png",
  },
};

const PackagesPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <main className="pkg-page">
        <header className="pkg-header">
          <p className="pkg-label">Curated Bundles</p>
          <h1 className="pkg-title">Pick Your Perfect Pack</h1>
          <p className="pkg-sub">Cold-pressed, no added sugar, delivered fresh daily.</p>
        </header>

        <section className="pkg-grid-wrap" aria-label="Bundle catalogue">
          <div className="pkg-grid">
            {BUNDLE_ORDER.map((type) => {
              const def = PRESET_BUNDLES[type];
              const meta = BUNDLE_META[type];
              return (
                <article
                  key={type}
                  className="pkg-card"
                  onClick={() => navigate(`/packages/${type}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/packages/${type}`)}
                  aria-label={`View ${def.displayName}`}
                >
                  <div className="pkg-card-image">
                    <img src={meta.coverImage} alt={def.displayName} className="pkg-card-img" loading="lazy" />
                  </div>
                  <div className="pkg-card-info">
                    <h2 className="pkg-card-name">{def.displayName}</h2>
                    <p className="pkg-card-price">₹{def.unitPrice}</p>
                    <p className="pkg-card-desc">{meta.description}</p>
                  </div>
                  <div className="pkg-card-arrow" aria-hidden>
                    <ArrowRight size={16} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pkg-fallback" aria-label="Custom builder">
          <p className="pkg-fallback-text">Want something a little more <em>you</em>?</p>
          <button className="pkg-fallback-btn" onClick={() => navigate("/bundles")} id="pkg-build-own-btn">
            Build Your Own Selection
            <ArrowRight size={16} className="pkg-fallback-icon" />
          </button>
        </section>
      </main>

      <FooterSection />

      <style>{`
        .pkg-page {
          background-color: #FAFAF8;
          font-family: 'PlusJakartaSans', sans-serif;
          min-height: 100vh;
          padding-top: 32px; /* Close to navbar */
          padding-bottom: 80px;
        }
        .pkg-header {
          text-align: center;
          padding: 32px 24px 40px;
          max-width: 600px;
          margin: 0 auto;
        }
        .pkg-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2D6A4F;
          margin: 0 0 12px;
        }
        .pkg-title {
          font-family: 'Gemilion', serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1.1;
          margin: 0 0 12px;
          letter-spacing: -0.01em;
        }
        .pkg-sub {
          font-size: 0.95rem;
          color: #6B7280;
          line-height: 1.6;
          margin: 0;
        }
        .pkg-grid-wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 40px;
        }
        .pkg-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
          max-width: 100%;
          margin: 0 auto;
        }
        .pkg-card {
          flex: 0 1 300px;
          width: 100%;
          max-width: 320px;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E8E8E8;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
        }
        .pkg-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.09);
        }
        .pkg-card:focus-visible {
          outline: 2px solid #2D6A4F;
          outline-offset: 2px;
        }
        .pkg-card-image {
          width: 100%;
          aspect-ratio: 3 / 4; /* Strict 3:4 aspect ratio */
          background-color: #F2EFE8;
          overflow: hidden;
        }
        .pkg-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.4s ease;
        }
        .pkg-card:hover .pkg-card-img {
          transform: scale(1.03);
        }
        .pkg-card-info {
          padding: 16px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .pkg-card-name {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.3;
        }
        .pkg-card-price {
          font-size: 0.92rem;
          font-weight: 600;
          color: #2D6A4F;
          margin: 0;
        }
        .pkg-card-desc {
          font-size: 0.8rem;
          color: #6B7280;
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .pkg-card-arrow {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a1a;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .pkg-card:hover .pkg-card-arrow { opacity: 1; }
        
        .pkg-fallback {
          max-width: 1280px;
          margin: 56px auto 0;
          padding: 40px 40px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .pkg-fallback-text { font-size: 0.95rem; color: #6B7280; margin: 0; }
        .pkg-fallback-text em { font-style: italic; color: #2D6A4F; font-weight: 600; }
        
        /* New Button Design System: Rectangular, White bg, Black border, Green text */
        .pkg-fallback-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1.5px solid #000000;
          color: #1E331E;
          font-family: 'PlusJakartaSans', sans-serif;
          font-weight: 600;
          font-size: 0.88rem;
          padding: 12px 24px;
          border-radius: 0; /* Square corners */
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .pkg-fallback-btn:hover {
          background-color: #F5F5F5; /* Very light grey */
        }
        .pkg-fallback-icon { flex-shrink: 0; transition: transform 0.2s; }
        .pkg-fallback-btn:hover .pkg-fallback-icon { transform: translateX(3px); }

        @media (max-width: 1024px) {
          .pkg-grid-wrap { padding: 0 24px; }
          .pkg-fallback { padding: 40px 24px 0; }
          .pkg-grid { gap: 16px; }
          .pkg-card { flex: 0 1 280px; max-width: 300px; }
        }
        @media (max-width: 640px) {
          .pkg-header { padding: 32px 20px 28px; }
          .pkg-grid-wrap { padding: 0 16px; }
          .pkg-grid { gap: 14px; }
          .pkg-card { flex: 1 1 100%; max-width: 100%; }
          .pkg-card-image { aspect-ratio: 3 / 4; /* Keep 3:4 on mobile */ }
          .pkg-fallback { margin-top: 32px; padding: 32px 16px 0; }
        }
      `}</style>
    </>
  );
};

export default PackagesPage;

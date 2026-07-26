import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "@/data/products";

// The 4 bestselling products in specified order
const BESTSELLER_SLUGS = [
  "pineapple-sabja",
  "pineapple-gond",
  "watermelon-sabja",
  "turmeric-shot",
];

const bestsellers = BESTSELLER_SLUGS.map(
  (slug) => products.find((p) => p.slug === slug)!
).filter(Boolean);

const ProblemSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bs-section">
      <div
        className={`bs-inner transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* ── Header ── */}
        <div className="bs-header">
          <p className="bs-eyebrow">Our Favourites</p>
          <h2 className="bs-title">Meet our bestsellers</h2>
        </div>

        {/* ── Cards: desktop grid / mobile carousel ── */}
        <div className="bs-track">
          {bestsellers.map((product, i) => (
            <Link
              key={product.slug}
              to={`/products/${product.slug}`}
              className="bs-card"
              style={{
                transitionDelay: `${i * 80}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
              }}
            >
              {/* Image */}
              <div className="bs-img-wrap">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="bs-img"
                  loading="lazy"
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.src.endsWith("/placeholder.svg"))
                      t.src = "/placeholder.svg";
                  }}
                />
              </div>

              {/* Info */}
              <div className="bs-info">
                <h3 className="bs-name">{product.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* ── View all CTA ── */}
        <div className="bs-cta-wrap">
          <Link to="/products" className="bs-cta">
            View all products
          </Link>
        </div>
      </div>

      <style>{`
        /* ── Section ── */
        .bs-section {
          background-color: #ffffffff;
          font-family: 'PlusJakartaSans', sans-serif;
          overflow: hidden;
        }
        .bs-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 64px 80px 56px 80px;
        }

        /* ── Header ── */
        .bs-header {
          margin-bottom: 40px;
        }
        .bs-eyebrow {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #B58B5D;
          margin: 0 0 10px;
        }
        .bs-title {
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 800;
          color: #1C1A17;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin: 0;
        }

        /* ── Card track (desktop grid) ── */
        .bs-track {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        /* ── Individual card ── */
        .bs-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease;
          border-radius: 20px;
          overflow: hidden;
          background: #ffffff;
        }
        .bs-card:hover {
          transform: translateY(-6px) !important;
        }
        .bs-card:hover .bs-img {
          transform: scale(1.05);
        }

        /* ── Image area ── */
        .bs-img-wrap {
          background: #ffffff;
          aspect-ratio: 3 / 4;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 28px 20px;
          border-radius: 16px;
        }
        .bs-img {
          max-height: 100%;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          display: block;
        }

        /* ── Card info ── */
        .bs-info {
          padding: 14px 4px 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: transparent;
        }
        .bs-name {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #1C1A17;
          margin: 0;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .bs-price {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #6B5B4E;
        }

        /* ── View all CTA ── */
        .bs-cta-wrap {
          margin-top: 36px;
          display: flex;
          justify-content: flex-start;
        }
        .bs-cta {
          font-family: 'PlusJakartaSans', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          color: #1C1A17;
          text-decoration: none;
          border-bottom: 2px solid #1C1A17;
          padding-bottom: 2px;
          letter-spacing: 0.01em;
          transition: opacity 0.2s ease, gap 0.2s ease;
        }
        .bs-cta::after {
          content: '→';
          font-size: 1rem;
          transition: transform 0.2s ease;
          display: inline-block;
        }
        .bs-cta:hover {
          opacity: 0.65;
        }
        .bs-cta:hover::after {
          transform: translateX(4px);
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .bs-inner {
            padding: 48px 0 44px;
          }
          .bs-header {
            padding: 0 24px;
            margin-bottom: 28px;
            text-align: center;
          }
          .bs-eyebrow {
            text-align: center;
          }

          /* Horizontal scroll carousel */
          .bs-track {
            display: flex;
            grid-template-columns: unset;
            gap: 16px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding: 0 24px 20px;
            /* hide scrollbar */
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .bs-track::-webkit-scrollbar {
            display: none;
          }

          /* Each card snaps, shows ~1.2 on screen */
          .bs-card {
            flex: 0 0 76vw;
            max-width: 300px;
            scroll-snap-align: start;
          }

          .bs-img-wrap {
            aspect-ratio: 3 / 4;
            padding: 20px 16px;
          }

          .bs-cta-wrap {
            padding: 0 24px;
            justify-content: center;
            margin-top: 28px;
          }
        }

        @media (max-width: 480px) {
          .bs-card {
            flex: 0 0 80vw;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .bs-inner {
            padding: 56px 40px 48px;
          }
          .bs-track {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default ProblemSection;

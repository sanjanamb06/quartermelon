import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

import type { Product } from "@/data/products";

// ─── Image Gallery ─────────────────────────────────────────────────────────
const ImageGallery = ({ product }: { product: Product }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const mainImage = product.images[currentImage];

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery-main">
        <img src={mainImage} alt={product.name} className="pdp-gallery-img" />
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {product.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              onClick={() => setCurrentImage(i)}
              className={`w-16 h-16 object-cover rounded cursor-pointer ${
                i === currentImage ? "ring-2 ring-primary" : ""
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Product Info ──────────────────────────────────────────────────────────
const ProductInfo = ({ product }: { product: (typeof products)[0] }) => (
  <div className="pdp-info">
    {/* Category + size */}
    <p className="pdp-category">
      {product.category === "daily-juice" ? "Daily Juice" : "Wellness Shot"} · {product.size}
    </p>

    {/* Name */}
    <h1 className="pdp-name">{product.name}</h1>

    {/* Tagline */}
    <p className="pdp-tagline">{product.tagline}</p>

    {/* Price */}
    <div className="pdp-price">₹{product.price}</div>

    {/* Highlights */}
    <div className="pdp-highlights">
      {product.noAddedSugar && (
        <span className="pdp-highlight">✓ No Added Sugar</span>
      )}
      {product.probiotics && (
        <span className="pdp-highlight">✓ Live Prebiotics</span>
      )}
      {product.fiber && (
        <span className="pdp-highlight"> {product.fiber} Dietary Fiber</span>
      )}
    </div>

    {/* Ingredients */}
    <div className="pdp-ingredients">
      <h2 className="pdp-ingredients-title">What's Inside</h2>
      <ul className="pdp-ingredients-list">
        {product.ingredients.map((ing) => (
          <li key={ing}>
            <span className="pdp-dot" />
            {ing}
          </li>
        ))}
      </ul>
    </div>

    {/* CTAs */}
    <div className="pdp-ctas">
      <Link to={`/bundles?flavor=${product.slug}`} className="pdp-btn-primary">
        Add to Bundle
      </Link>
    </div>
  </div>
);

// ─── You May Also Like ─────────────────────────────────────────────────────
const YouMayAlsoLike = ({ currentSlug, category }: { currentSlug: string; category: string }) => {
  const related = products
    .filter((p) => p.category === category && p.slug !== currentSlug && !p.hidden)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="pdp-related">
      <h2 className="pdp-related-title">You may also like</h2>
      <div className="pdp-related-grid">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};

// ─── Page Component ────────────────────────────────────────────────────────
const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find((p) => p.slug === slug);

  if (!product) return <Navigate to="/products" replace />;

  return (
    <>
      <Navbar />
      <main className="pdp-page">
        <div className="pdp-container">
          {/* Breadcrumb */}
          <nav className="pdp-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/products">Products</Link>
            <span>/</span>
            <span className="pdp-breadcrumb-active">{product.name}</span>
          </nav>

          {/* Main grid */}
          <div className="pdp-grid">
            <ImageGallery product={product} />
            <ProductInfo product={product} />
          </div>

          {/* You May Also Like */}
          <YouMayAlsoLike currentSlug={product.slug} category={product.category} />
        </div>
      </main>
      <FooterSection />

      <style>{`
        .pdp-page {
          background-color: #F5F0E8;
          font-family: 'PlusJakartaSans', sans-serif;
          padding-top: 112px;
          padding-bottom: 80px;
          min-height: 100vh;
        }
        .pdp-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }

        /* Breadcrumb */
        .pdp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #888;
          margin-bottom: 40px;
        }
        .pdp-breadcrumb a {
          color: #888;
          text-decoration: none;
          transition: color 0.2s;
        }
        .pdp-breadcrumb a:hover { color: #1a1a1a; }
        .pdp-breadcrumb-active {
          color: #1a1a1a;
          font-weight: 600;
        }

        /* Grid */
        .pdp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }

        /* Gallery */
        .pdp-gallery-main {
          background-color: #EDE8DE;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          min-height: 480px;
          overflow: hidden;
        }
        .pdp-gallery-img {
          max-height: 400px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
        }

        /* Info */
        .pdp-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pdp-category {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #888;
          font-weight: 700;
          margin: 0;
        }
        .pdp-name {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .pdp-tagline {
          font-size: 1rem;
          color: #555;
          line-height: 1.6;
          margin: 0;
        }
        .pdp-price {
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
        }

        .pdp-highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pdp-highlight {
          font-size: 0.82rem;
          font-weight: 600;
          color: #2D4A1E;
          background-color: rgba(45,74,30,0.08);
          border: 1px solid rgba(45,74,30,0.15);
          border-radius: 999px;
          padding: 6px 16px;
        }

        .pdp-ingredients { margin-top: 8px; }
        .pdp-ingredients-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px;
        }
        .pdp-ingredients-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pdp-ingredients-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.92rem;
          color: #333;
        }
        .pdp-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #2D4A1E;
          flex-shrink: 0;
        }

        .pdp-ctas {
          display: flex;
          margin-top: 8px;
        }
        .pdp-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #2D4A1E;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 16px 36px;
          border-radius: 999px;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .pdp-btn-primary:hover { background-color: #1e3314; }
        .pdp-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #1a1a1a;
          color: #1a1a1a;
          background: transparent;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 14px 36px;
          border-radius: 999px;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .pdp-btn-secondary:hover { background-color: rgba(0,0,0,0.04); }

        /* Related */
        .pdp-related {
          margin-top: 72px;
          padding-top: 48px;
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        .pdp-related-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 24px;
        }
        .pdp-related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 768px) {
          .pdp-container { padding: 0 20px; }
          .pdp-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .pdp-gallery-main {
            min-height: 320px;
            padding: 32px;
          }
          .pdp-gallery-img {
            max-height: 280px;
          }
          .pdp-ctas {
            flex-direction: column;
          }
          .pdp-btn-primary {
            width: 100%;
            justify-content: center;
          }
          .pdp-related-grid {
            grid-template-columns: 1fr;
          }
          .pdp-page {
            padding-top: 88px;
          }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
          .pdp-related-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
};

export default ProductDetailPage;

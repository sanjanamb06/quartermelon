import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import ProductCard from "@/components/ProductCard";
import { dailyJuices, wellnessShots } from "@/data/products";

const ProductsPage = () => {
  return (
    <>
      <Navbar />

      <main className="products-page">
        <div className="products-inner">
          {/* Page heading */}
          <div className="products-header">
            <p className="products-label">Handcrafted in Bengaluru</p>
            <h1 className="products-title">Our Lineup</h1>
            <p className="products-sub">
              Every bottle is cold-pressed fresh, packed with heritage Indian
              ingredients, and zero added sugar. Pick your daily ritual.
            </p>
          </div>

          {/* Daily Juice Line */}
          <section className="products-section">
            <div className="products-section-header">
              <h2 className="products-section-title">Daily Juice Line</h2>
              <span className="products-section-badge">180ml</span>
            </div>
            <div className="products-grid">
              {dailyJuices.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Wellness Shots */}
          <section className="products-section">
            <div className="products-section-header">
              <h2 className="products-section-title">Wellness Shots</h2>
              <span className="products-section-badge">50ml</span>
            </div>
            <div className="products-grid">
              {wellnessShots.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <FooterSection />

      <style>{`
        .products-page {
          background-color: #F5F0E8;
          padding-top: 120px;
          padding-bottom: 80px;
          font-family: 'PlusJakartaSans', sans-serif;
          min-height: 100vh;
        }
        .products-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }
        .products-header {
          text-align: center;
          max-width: 560px;
          margin: 0 auto 56px;
        }
        .products-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2D4A1E;
          margin-bottom: 12px;
        }
        .products-title {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .products-sub {
          font-size: 1rem;
          color: #555;
          line-height: 1.6;
        }
        .products-section {
          margin-bottom: 56px;
        }
        .products-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .products-section-title {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
        }
        .products-section-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #888;
          border: 1px solid #ccc;
          border-radius: 999px;
          padding: 4px 14px;
          letter-spacing: 0.05em;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .products-inner {
            padding: 0 20px;
          }
          .products-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .products-page {
            padding-top: 96px;
          }
        }
      `}</style>
    </>
  );
};

export default ProductsPage;

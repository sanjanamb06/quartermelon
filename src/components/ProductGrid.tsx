import { ShoppingCart } from "lucide-react";

interface ProductCardItem {
  id: number;
  name: string;
  subtitle: string;
  price: string;
  pack: string;
  image: string;
}

const products: ProductCardItem[] = [
  {
    id: 1,
    name: "Watermelon + Sabja",
    subtitle: "Cool, hydrating & fiber-rich",
    price: "₹60",
    pack: "180ml / daily bottle",
    image: "/products/sabja.png",
  },
  {
    id: 2,
    name: "Musk Melon + Sabja",
    subtitle: "Silky, sweet & gut-smart",
    price: "₹60",
    pack: "180ml / daily bottle",
    image: "/products/musk.png",
  },
  {
    id: 3,
    name: "Pineapple + Sabja",
    subtitle: "Tropical tang + gut fuel",
    price: "₹60",
    pack: "180ml / daily bottle",
    image: "/products/pineapple.png",
  },
  {
    id: 4,
    name: "ABC Shot",
    subtitle: "Apple, Beetroot, Carrot",
    price: "₹35",
    pack: "50ml / wellness shot",
    image: "/products/abc.png",
  },
  {
    id: 5,
    name: "Turmeric Shot",
    subtitle: "Anti-inflammatory fire",
    price: "₹35",
    pack: "50ml / wellness shot",
    image: "/products/turmeric.png",
  },
  {
    id: 6,
    name: "The Cooler",
    subtitle: "Refreshing daily coolant",
    price: "₹60",
    pack: "180ml / daily bottle",
    image: "/products/cooler.png",
  },
];

const ProductGrid = () => {
  return (
    <section className="pg-section">
      {/* Section header */}
      <div className="pg-header">
        <p className="pg-label">Our Products</p>
        <h2 className="pg-heading">Made fresh. Delivered daily.</h2>
      </div>

      {/* Grid */}
      <div className="pg-grid">
        {products.map((p) => (
          <div key={p.id} className="pg-card">
            {/* Image area */}
            <div className="pg-card-image-area">
              <img
                src={p.image}
                alt={p.name}
                className="pg-card-img"
                loading="lazy"
              />
            </div>

            {/* Content area */}
            <div className="pg-card-content">
              <h3 className="pg-card-name">{p.name}</h3>
              <p className="pg-card-subtitle">{p.subtitle}</p>
              <div className="pg-card-meta">
                <span className="pg-card-price">{p.price}</span>
                <span className="pg-card-pack">{p.pack}</span>
              </div>
            </div>

            {/* Add to cart button */}
            <button className="pg-card-btn">
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .pg-section {
          background-color: #F5F0E8;
          font-family: 'PlusJakartaSans', sans-serif;
          padding: 80px 60px;
        }
        .pg-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .pg-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2D4A1E;
          margin-bottom: 12px;
        }
        .pg-heading {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.12;
          letter-spacing: -0.02em;
        }

        .pg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pg-card {
          background-color: #FAFAF5;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease;
        }
        .pg-card:hover {
          transform: translateY(-4px);
        }

        .pg-card-image-area {
          background-color: #F0EFE6;
          height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 24px;
        }
        .pg-card-img {
          max-height: 340px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .pg-card:hover .pg-card-img {
          transform: scale(1.03);
        }

        .pg-card-content {
          padding: 20px 24px 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pg-card-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.3;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .pg-card-subtitle {
          font-size: 0.88rem;
          color: #666;
          margin: 0;
          font-weight: 400;
          line-height: 1.4;
        }
        .pg-card-meta {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-top: 6px;
        }
        .pg-card-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        .pg-card-pack {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #888;
          font-weight: 600;
        }

        .pg-card-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background-color: #2D4A1E;
          color: #ffffff;
          font-family: 'PlusJakartaSans', sans-serif;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 18px;
          border: none;
          border-radius: 0 0 20px 20px;
          cursor: pointer;
          margin-top: 20px;
          transition: background-color 0.2s ease;
        }
        .pg-card-btn:hover {
          background-color: #1e3314;
        }

        @media (max-width: 1024px) {
          .pg-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .pg-section {
            padding: 56px 20px;
          }
          .pg-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .pg-card-image-area {
            height: 280px;
          }
          .pg-card-img {
            max-height: 240px;
          }
        }
      `}</style>
    </section>
  );
};

export default ProductGrid;

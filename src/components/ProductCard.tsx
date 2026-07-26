import { Link } from "react-router-dom";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const imageSrc = product.images[0];

  return (
    <Link to={`/products/${product.slug}`} className="pc-card" style={{ textDecoration: "none" }}>
      {/* Image area */}
      <div className="pc-image-area">
        <img
          src={imageSrc}
          alt={product.name}
          className="pc-img"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith("/placeholder.svg")) {
              target.src = "/placeholder.svg";
            }
          }}
        />
      </div>

      {/* Content area */}
      <div className="pc-content">
        <h3 className="pc-name">{product.name}</h3>
        <span className="pc-size">{product.size} · {product.category === "daily-juice" ? "Daily Bottle" : "Wellness Shot"}</span>
      </div>

      <style>{`
        .pc-card {
          background-color: #F5F0E8;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease;
          cursor: pointer;
        }
        .pc-card:hover {
          transform: translateY(-4px);
        }
        .pc-image-area {
          background-color: #EDE8DE;
          height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 24px;
        }
        .pc-img {
          max-height: 320px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .pc-card:hover .pc-img {
          transform: scale(1.04);
        }
        .pc-content {
          padding: 16px 20px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;
          flex: 1;
        }
        .pc-name {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .pc-price {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 4px;
        }
        .pc-size {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #888;
          font-weight: 600;
          margin-top: 2px;
        }
        @media (max-width: 640px) {
          .pc-image-area {
            height: 280px;
          }
          .pc-img {
            max-height: 240px;
          }
        }
      `}</style>
    </Link>
  );
};

export default ProductCard;

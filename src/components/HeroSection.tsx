import { Link } from "react-router-dom";
import newHeroImage from "@/assets/new-hero-image.png";

const HeroSection = () => (
  <section className="hero-section">
    <div className="hero-container">
      <div className="hero-grid">

        {/* ─── LEFT: Text content ─── */}
        <div className="hero-text animate-fade-up">
          <h1 className="hero-heading">
            100% Natural.
            <br />
            Cold Pressed.
            <br />
            <span style={{ color: "#C5D830" }}>Daily.</span>
          </h1>

          <p className="hero-sub">
            All the fruits your mom told you to eat, delivered cold pressed to
            your door every morning. 180ml of real goodness.
          </p>

          <div className="hero-tag-wrap">
            <span className="hero-tag">Launching in Bengaluru</span>
          </div>

          <div className="hero-buttons">
            <Link to="/subscription" className="hero-btn-primary">
              Choose Your Plan
            </Link>
            <Link to="/bundles" className="hero-btn-secondary">
              Create Your Assortment
            </Link>
          </div>
        </div>

        {/* ─── RIGHT: Hero image ─── */}
        <div className="hero-visual animate-fade-up-delay-2">
          <img
            src={newHeroImage}
            alt="Quartermelon cold-pressed juice bottle, fresh and natural"
            className="hero-bottle"
          />
        </div>

      </div>
    </div>

    <style>{`
      .hero-section {
        position: relative;
        min-height: 100vh;
        box-sizing: border-box;
        overflow: hidden;
        background-color: #f1e9de;
        font-family: 'PlusJakartaSans', sans-serif;
      }
      .hero-container {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0 40px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        align-items: center;
      }
      .hero-grid {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: center;
        padding: 80px 0 48px;
        box-sizing: border-box;
      }
      .hero-text {
        display: flex;
        flex-direction: column;
        justify-content: center;
        order: 1;
      }
      .hero-heading {
        font-family: 'Gemilion', serif;
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 500;
        color: #1A1A1A;
        line-height: 1.05;
        letter-spacing: -0.01em;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      .hero-sub {
        font-size: 1.05rem;
        color: #3D3D3D;
        line-height: 1.65;
        max-width: 420px;
        margin-bottom: 20px;
        font-weight: 400;
      }
      .hero-tag-wrap {
        margin-bottom: 32px;
      }
      .hero-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: rgba(232, 115, 26, 0.12);
        color: #E8731A;
        border-radius: 999px;
        padding: 6px 16px;
        font-size: 0.875rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .hero-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .hero-btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #C5D830;
        color: #1A1A1A;
        font-family: 'PlusJakartaSans', sans-serif;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 14px 32px;
        border-radius: 999px;
        text-decoration: none;
        box-shadow: 0 4px 20px rgba(197, 216, 48, 0.35);
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .hero-btn-primary:hover { filter: brightness(1.05); transform: scale(1.02); }
      .hero-btn-secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #1A1A1A;
        color: #1A1A1A;
        background-color: transparent;
        font-family: 'PlusJakartaSans', sans-serif;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 14px 32px;
        border-radius: 999px;
        text-decoration: none;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .hero-btn-secondary:hover { background-color: rgba(0,0,0,0.05); }

      .hero-visual {
        position: relative;
        max-width: 100%;
        overflow: hidden;
        border-radius: 20px;
        margin-right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        order: 2;
      }
      .hero-bottle {
        display: block;
        width: 100%;
        max-height: 480px;
        height: auto;
        object-fit: contain;
        object-position: center;
      }

      @media (max-width: 768px) {
        .hero-section {
          height: auto;
          max-height: none;
        }
        .hero-container {
          padding: 0 20px;
          height: auto;
          max-height: none;
        }
        .hero-grid {
          grid-template-columns: 1fr;
          gap: 0;
          height: auto;
          padding: 88px 0 48px;
        }
        .hero-text {
          order: 2;
        }
        .hero-visual {
  order: 1;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  display: block;
  margin-bottom: 28px;
}
        .hero-bottle {
          width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;

        }
        .hero-heading {
          font-size: 2.4rem;
        }
        .hero-sub {
          font-size: 0.95rem;
          max-width: 100%;
        }
        .hero-buttons {
          flex-direction: column;
        }
        .hero-btn-primary,
        .hero-btn-secondary {
          width: 100%;
          justify-content: center;
        }
      }
    `}</style>
  </section>
);

export default HeroSection;

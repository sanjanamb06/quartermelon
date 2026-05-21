import { Link } from "react-router-dom";
import heroBottle from "@/assets/hero-bottle.png";

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

        {/* ─── RIGHT: Blob + Bottle ─── */}
        <div className="hero-visual animate-fade-up-delay-2">
          {/* Gradient blob */}
          <div
            aria-hidden="true"
            className="hero-blob"
            style={{
              background: `
                radial-gradient(circle at 60% 40%, rgba(232, 115, 26, 0.5), transparent 60%),
                radial-gradient(circle at 40% 60%, rgba(197, 216, 48, 0.45), transparent 55%),
                radial-gradient(circle at 70% 70%, rgba(220, 60, 60, 0.3), transparent 50%)
              `,
              filter: "blur(50px)",
              transform: "scale(1.1)",
            }}
          />
          <img
            src={heroBottle}
            alt="Quartermelon cold-pressed juice bottle, fresh and natural"
            className="hero-bottle"
          />
        </div>

      </div>
    </div>

    <style>{`
      .hero-section {
        position: relative;
        min-height: 100svh;
        overflow: hidden;
        background-color: #F5F0E8;
        font-family: 'PlusJakartaSans', sans-serif;
      }
      .hero-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 40px;
        height: 100%;
        min-height: 100svh;
        display: flex;
        align-items: center;
      }
      .hero-grid {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 64px;
        align-items: center;
        padding: 96px 0 48px;
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
        display: flex;
        align-items: center;
        justify-content: center;
        order: 2;
        min-height: 420px;
      }
      .hero-blob {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .hero-bottle {
        position: relative;
        z-index: 10;
        width: auto;
        max-height: 95vh;
        max-width: 100%;
        object-fit: contain;
        transform: rotate(4deg);
        margin-top: -8vh;
        filter: drop-shadow(0 24px 48px rgba(0,0,0,0.18));
      }

      @media (max-width: 768px) {
        .hero-container {
          padding: 0 20px;
        }
        .hero-grid {
          grid-template-columns: 1fr;
          gap: 0;
          padding: 88px 0 48px;
        }
        .hero-text {
          order: 2;
        }
        .hero-visual {
          order: 1;
          min-height: 300px;
          margin-bottom: 16px;
        }
        .hero-bottle {
          max-height: 72vw;
          transform: rotate(2deg);
          margin-top: 0;
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

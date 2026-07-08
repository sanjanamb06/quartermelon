import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.png";

const HeroSection = () => (
  <section className="hero-section">
    {/* Subtle gradient overlay to darken the left side behind text */}
    <div className="hero-overlay" />
    
    <div className="hero-container">
      <div className="hero-content animate-fade-up">
        <h1 className="hero-heading">
          100% Natural.
          <br />
          Cold Pressed.
          <br />
          <span className="hero-accent">Daily.</span>
        </h1>

        <p className="hero-description">
          All the fruits your mom told you to eat, delivered cold pressed to
          your door every morning. 180ml of real goodness.
        </p>

        <div className="hero-cta-wrap">
          <Link to="/packages" className="hero-cta-btn">
            Shop Assortments
          </Link>
        </div>
      </div>
    </div>

    <style>{`
      .hero-section {
        position: relative;
        min-height: calc(100vh - 80px); /* Occupy remaining viewport height after desktop navbar (80px) */
        width: 100%;
        display: flex;
        align-items: center;
        background-image: url(${heroImage});
        background-size: cover;
        background-position: center;
        font-family: 'PlusJakartaSans', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        /* Dark gradient overlay: left 45%, middle 25%, right 15% */
        background: linear-gradient(to right, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.25) 50%, rgba(0, 0, 0, 0.15) 100%);
        pointer-events: none;
        z-index: 1;
      }

      .hero-container {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
        padding: 0 40px;
        display: flex;
        align-items: center;
        min-height: inherit;
        box-sizing: border-box;
      }

      .hero-content {
        max-width: 520px;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: left;
        padding: 80px 0;
      }

      .hero-heading {
        font-family: 'Gemilion', serif;
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 400;
        color: #ffe3e3ff; /* High-contrast white headline */
        line-height: 1.15;
        letter-spacing: -0.01em;
        text-transform: uppercase;
        margin-bottom: 24px;
      }

      .hero-accent {
        color: #2F1523; /* Highlight 'Daily.' is also white */
      }

      .hero-description {
        font-size: clamp(1rem, 1.5vw, 1.125rem);
        color: rgba(255, 255, 255, 0.88); /* Soft white with 88% opacity */
        line-height: 1.6;
        max-width: 450px;
        margin-bottom: 36px;
        font-weight: 500;
      }

      .hero-cta-wrap {
        display: flex;
      }

      .hero-cta-btn {
        display: inline-flex;
        align-items: cente;
        justify-content: center;
        background-color: #fededeff; /* Wheat white background */
        color: #1E331E; /* Dark organic green text */
        font-family: 'PlusJakartaSans', sans-serif;
        font-weight: 600; /* Medium font weight */
        font-size: 1rem;
        padding: 16px 36px;
      
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Subtle shadow */
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* Smooth transition */
        white-space: nowrap;
      }

      .hero-cta-btn:hover {
        background-color: #FAF4E8;
        transform: translateY(-2px); /* Gentle hover lift */
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      @media (max-width: 1024px) {
        .hero-container {
          padding: 0 32px;
        }
      }

      @media (max-width: 768px) {
        /* Tablet layout */
        .hero-section {
          min-height: calc(100vh - 64px); /* Adjust for smaller navbar on tablet */
          background-position: 55% center;
        }
        .hero-container {
          padding: 0 24px;
        }
        .hero-content {
          max-width: 450px;
          padding: 100px 0 60px;
        }
        .hero-heading {
          max-width: 300px;
          line-height: 1.05;
        }
      }

      @media (max-width: 480px) {
        /* Mobile layout */
        .hero-section {
          min-height: 80vh; /* Reduced height to 80vh */
          background-position: 65% center; /* Adjust image crop */
        }
        
        .hero-overlay {
          /* Increased dark overlay opacity on mobile (55-60%) */
          background: linear-gradient(to right, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.25) 100%);
        }

        .hero-container {
          padding: 0 20px;
        }
        .hero-content {
          max-width: 320px;
          gap: 16px;
        } 
        .hero-heading {
          font-size: 2.2rem;
          margin-bottom: 16px;
        }
        .hero-description {
  max-width: 260px;
  font-size: 0.9rem;
  line-height: 1.45;
}
        .hero-cta-btn {
  width: fit-content;      /* Don't stretch full width */
  padding: 12px 22px;      /* Smaller button */
  font-size: 0.9rem;
  align-self: flex-end;    /* Move to the right (if parent is flex) */
}
      }
    `}</style>
  </section>
);

export default HeroSection;

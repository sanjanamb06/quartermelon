import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";

const FooterSection = () => {
  return (
    <>
      {/* Final CTA */}
      <section id="final-cta" className="footer-cta-section">
        <div className="footer-cta-inner">
          <h2 className="footer-cta-heading">Ready to fix your gut?</h2>
          <p className="footer-cta-sub">
          Get your daily dose of clean, gut-friendly nutrition with Quartermelon. <br />
          Now delivering in Bengaluru.
          </p>
          <div className="footer-cta-buttons">
            <Link to="/packages" className="footer-btn-primary">
              Create Your Assortment
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-bar">
        <div className="footer-bar-inner">
          <div className="footer-brand">
            <div className="footer-brand-name">
              <Link to="/">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <img
                    src="/logo_title.png"
                    alt="Quartermelon"
                    className="footer-brand-logo"
                    style={{ height: "40px", width: "auto", objectFit: "contain" }}
                  />
                  <span style={{
                    fontSize: "7px",
                    fontFamily: "PlusJakartaSans, sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.65)",
                    textAlign: "center",
                    whiteSpace: "nowrap"
                  }}>
                    All the fruits your mom told you to eat
                  </span>
                </div>
              </Link>
            </div>
            <p className="footer-brand-sub">Your daily gut health system. Made in Bengaluru.</p>
          </div>
          <div className="footer-links">
            <a
              href="https://www.instagram.com/quartermelon.in?igsh=Nmx2anVlNjJkc29i"
              className="footer-link"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Instagram size={18} />
              <span>Instagram</span>
            </a>
            <a
              href="mailto:hello@quartermelon.in"
              className="footer-link"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Mail size={18} />
              <span>hello@quartermelon.in</span>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>FSSAI License: 21226186000879 | © 2026 Quartermelon Foods Pvt. Ltd. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .footer-cta-section {
          background-color: #ef7522;
          color: #ffffff;
          padding: 80px 24px;
          text-align: center;
        }
        .footer-cta-inner {
          max-width: 560px;
          margin: 0 auto;
        }
        .footer-cta-heading {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 16px;
          line-height: 1.15;
        }
        .footer-cta-sub {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .footer-cta-buttons {
          display: flex;
          flex-direction: row;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .footer-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          color: #ef7522;
          font-family: 'PlusJakartaSans', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 14px 32px;
          border-radius: 999px;
          text-decoration: none;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        .footer-btn-primary:hover { opacity: 0.9; }
        .footer-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.4);
          color: #ffffff;
          font-family: 'PlusJakartaSans', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 14px 32px;
          border-radius: 999px;
          text-decoration: none;
          white-space: nowrap;
          transition: background-color 0.2s;
        }
        .footer-btn-secondary:hover { background-color: rgba(255,255,255,0.1); }

        .footer-bar {
          background-color: hsl(340, 20%, 15%);
          color: rgba(255,255,255,0.65);
          padding: 48px 24px 32px;
        }
        .footer-bar-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .footer-brand-name {
          display: inline-flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .footer-brand-logo {
          display: block;
          filter: brightness(0) invert(1);
        }
        .footer-brand-sub {
          font-size: 0.85rem;
          margin: 0;
        }
        .footer-links {
          display: flex;
          gap: 24px;
          font-size: 0.875rem;
        }
        .footer-link {
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: #ffffff; }
        .footer-bottom {
          max-width: 1200px;
          margin: 24px auto 0;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          text-align: center;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .footer-cta-section {
            padding: 56px 20px;
          }
          .footer-cta-buttons {
            flex-direction: column;
            align-items: stretch;
          }
          .footer-btn-primary,
          .footer-btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .footer-bar-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .footer-links {
            gap: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default FooterSection;

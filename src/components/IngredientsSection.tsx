import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const ingredients = [
  { name: "Sabja Seeds", desc: "Rich in soluble fiber. Helps you feel full, feeds good bacteria." },
  { name: "Gond Katira", desc: "Natural prebiotic gum. Cools the body, supports gut lining." },
  { name: "Live Probiotics", desc: "Billions of good bacteria in every bottle. Your microbiome's best friend." },
  { name: "Nannari Root", desc: "Traditional Indian sarsaparilla. A natural coolant with antioxidant power." },
  { name: "Gongura & Hibiscus", desc: "Tangy, probiotic-friendly, packed with Vitamin C and iron." },
];

const IngredientsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? -1 : i);

  return (
    <section
      id="ingredients"
      ref={ref}
      className="ing-section"
      style={{ fontFamily: "'PlusJakartaSans', sans-serif", overflow: "hidden" }}
    >
      <div
        className={`ing-grid transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* ── LEFT PANEL: Text + Accordion ── */}
        <div className="ing-left">
          {/* Label */}
          <p className="ing-label">What's Inside?</p>

          {/* Headline */}
          <h2 className="ing-heading">Heritage ingredients that actually work.</h2>

          {/* Accordion */}
          <div className="ing-accordion">
            {ingredients.map((ing, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={ing.name}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #D8D8E4",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isOpen ? "0 2px 12px rgba(30,56,34,0.08)" : "none",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  <button
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "15px 18px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1E3822", letterSpacing: "-0.01em" }}>
                      {ing.name}
                    </span>
                    <span
                      style={{
                        width: "26px", height: "26px", minWidth: "26px",
                        borderRadius: "50%",
                        border: "1.5px solid #1E3822",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: isOpen ? "#1E3822" : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      <span style={{ color: isOpen ? "#fff" : "#1E3822", fontSize: "1rem", lineHeight: 1, userSelect: "none" }}>
                        {isOpen ? "−" : "+"}
                      </span>
                    </span>
                  </button>
                  <div style={{ maxHeight: isOpen ? "120px" : "0px", overflow: "hidden", transition: "max-height 0.35s ease" }}>
                    <p style={{ fontSize: "0.875rem", color: "#4A5568", lineHeight: 1.5, padding: "0 18px 14px", margin: 0, fontWeight: 400 }}>
                      {ing.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <Link
            to="/products"
            className="ing-cta"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            View Our Products
          </Link>
        </div>

        {/* ── RIGHT PANEL: Image ── */}
        <div className="ing-right">
          <div className="ing-image-wrap">
            <img
              src="/images/ingredients.png"
              alt="Quartermelon ingredients"
              className="ing-image"
            />
          </div>
        </div>
      </div>

      <style>{`
        .ing-section {
          background-color: #EEEEF4;
        }
        .ing-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          min-height: 100vh;
          align-items: stretch;
        }
        .ing-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 64px;
          background-color: #ffffff;
        }
        .ing-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #698804;
          margin-bottom: 12px;
        }
        .ing-heading {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 800;
          color: #698804;
          line-height: 1.12;
          letter-spacing: -0.02em;
          margin-bottom: 32px;
          max-width: 480px;
        }
        .ing-accordion {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 28px;
        }
        .ing-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #698804;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 15px 36px;
          border-radius: 999px;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: opacity 0.2s ease, transform 0.2s ease;
          align-self: flex-start;
        }
        .ing-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background-color: #ffffff;
        }
        .ing-image-wrap {
          width: 100%;
          max-width: 560px;
          height: 620px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #D4D1E8;
          border-radius: 24px;
          overflow: hidden;
        }
        .ing-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        @media (max-width: 768px) {
          .ing-grid {
            grid-template-columns: 1fr;
            min-height: unset;
          }
          .ing-left {
            padding: 52px 24px 40px;
            order: 2;
          }
          .ing-right {
            padding: 24px;
            order: 1;
          }
          .ing-image-wrap {
            height: 280px;
            max-width: 100%;
          }
          .ing-heading {
            font-size: 1.75rem;
            max-width: 100%;
          }
          .ing-cta {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default IngredientsSection;

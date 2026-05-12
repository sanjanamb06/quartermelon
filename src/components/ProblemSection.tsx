import { useEffect, useRef, useState } from "react";

const ProblemSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="problem-section"
      style={{
        backgroundColor: "hsl(30, 33%, 97%)",
        fontFamily: "'PlusJakartaSans', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        className={`problem-grid transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* ── LEFT: Image ── */}
        <div className="problem-image-col">
          <img
            src="/images/problem-sec.png"
            alt="Fiber wellness infographic"
            className="problem-image"
          />
        </div>

        {/* ── RIGHT: Text ── */}
        <div
          className={`problem-text-col transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="problem-heading">
            Your Gut Changes Everything
          </h2>

          <div className="problem-paragraphs">
            {[
              "Poor digestion doesn't just stay in your stomach. It can affect your daily energy, skin clarity, natural immunity, mood, and mental focus.",
              "That sluggish feeling, unexpected bloating, or mid-day fatigue are often your body's signs of an unbalanced or unhealthy gut environment.",
              "Functional fiber naturally supports smooth digestion, daily regularity, optimal hydration, and overall holistic wellness—giving you the foundation to feel lighter and more vibrant.",
            ].map((text, i) => (
              <p key={i} className="problem-para">{text}</p>
            ))}
          </div>

          <a
            href="#ingredients"
            className="problem-cta"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            }}
          >
            Discover Your Daily Reset
          </a>
        </div>
      </div>

      <style>{`
        .problem-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 80px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 100px 80px;
        }
        .problem-image-col {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .problem-image {
          width: 100%;
          max-width: 520px;
          height: auto;
          object-fit: contain;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          display: block;
        }
        .problem-text-col {
          max-width: 520px;
        }
        .problem-heading {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 800;
          color: hsl(340, 20%, 15%);
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .problem-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 40px;
        }
        .problem-para {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: 1rem;
          color: hsl(340, 20%, 25%);
          line-height: 1.5;
          font-weight: 400;
          margin: 0;
        }
        .problem-cta {
          font-family: 'PlusJakartaSans', sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #FB9E71;
          color: #020000;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 16px 36px;
          border-radius: 999px;
          text-decoration: none;
          letter-spacing: 0.01em;
          box-shadow: 0 8px 30px #DD7C8E;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        @media (max-width: 768px) {
          .problem-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 56px 24px;
          }
          .problem-image-col {
            order: 1;
          }
          .problem-text-col {
            order: 2;
            max-width: 100%;
          }
          .problem-image {
            max-width: 280px;
          }
          .problem-heading {
            font-size: 2rem;
          }
          .problem-cta {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default ProblemSection;

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const steps = [
  {
    num: "01",
    title: "SUBSCRIBE",
    desc: "Pick your plan — weekly, monthly, or quarterly. Cancel or pause anytime.",
  },
  {
    num: "02",
    title: "WE DELIVER DAILY",
    desc: "Fresh bottles show up at your door in Bengaluru every morning (or alternate days — your call).",
  },
  {
    num: "03",
    title: "DRINK & THRIVE",
    desc: "One 180ml bottle every morning. Your gut starts thanking you in days.",
  },
];

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="hiw-section"
    >
      {/* Headline */}
      <div className={`hiw-headline-wrap transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="hiw-headline">
          Ridiculously simple. Three Steps to a Happier Gut.
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="hiw-grid">
        {steps.map((s, i) => (
          <div
            key={s.num}
            className={`hiw-card-wrap transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <div className="hiw-card">
              <div className="hiw-num">{s.num}</div>
              <h3 className="hiw-title">{s.title}</h3>
              <p className="hiw-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className={`hiw-cta-wrap transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <Link
          to="/subscription"
          className="hiw-cta"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
          }}
        >
          Pick a Plan
        </Link>
      </div>

      <style>{`
        .hiw-section {
          background-color: #BFD747;
          font-family: 'PlusJakartaSans', sans-serif;
          width: 100%;
          padding: 64px 80px 72px;
        }
        .hiw-headline-wrap {
          margin-bottom: 3rem;
        }
        .hiw-headline {
          font-family: 'PlusJakartaSans', sans-serif;
          color: #000000;
          font-weight: 800;
          font-size: clamp(1.75rem, 4vw, 3rem);
          letter-spacing: -0.01em;
          line-height: 1.1;
          text-align: center;
          margin: 0;
        }
        .hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .hiw-card-wrap {
          height: 100%;
        }
        .hiw-card {
          border: 1.5px solid #000000;
          border-radius: 6px;
          padding: 2rem 1.75rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .hiw-num {
          font-family: 'PlusJakartaSans', sans-serif;
          color: #000000;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .hiw-title {
          font-family: 'PlusJakartaSans', sans-serif;
          color: #000000;
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          line-height: 1.3;
          margin: 0;
        }
        .hiw-desc {
          font-family: 'PlusJakartaSans', sans-serif;
          color: #000000;
          font-size: 0.875rem;
          line-height: 1.65;
          margin: 0;
          font-weight: 400;
        }
        .hiw-cta-wrap {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
        }
        .hiw-cta {
          font-family: 'PlusJakartaSans', sans-serif;
          background-color: #000000;
          color: #BFD747;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0.9rem 2.25rem;
          border-radius: 999px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0.02em;
          transition: all 0.25s ease;
        }

        @media (max-width: 768px) {
          .hiw-section {
            padding: 52px 20px 60px;
          }
          .hiw-headline {
            font-size: 1.6rem;
            text-align: left;
          }
          .hiw-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .hiw-cta {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;

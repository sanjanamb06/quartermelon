import { Link } from "react-router-dom";

const ComparisonSection = () => {
  return (
    <section className="cmp-section">
      <div className="cmp-grid">
        {/* ── CONTENT ── */}
        <div className="cmp-left">
          {/* Eyebrow label */}
          <p className="cmp-label">What's in yours?</p>

          {/* Headline */}
          <h2 className="cmp-heading">
            No Sugar
            <br />
            Syrups: Why
            <br />
            We Press
            <br />
            Differently
          </h2>

          {/* Divider */}
          <div className="cmp-divider" />

          {/* Paragraph 1 */}
          <p className="cmp-para">
            Most packaged juices, even the ones that look healthy, are loaded
            with added sugar syrups, concentrates, and artificial preservatives.
            These spike your blood sugar, feed bad gut bacteria, and leave you
            feeling worse than before.
          </p>

          {/* Paragraph 2 */}
          <p className="cmp-para" style={{ marginBottom: "40px" }}>
            Quartermelon is different. We cold-press real fruits and vegetables to preserve their natural goodness never using concentrates, added sugar syrups, or unnecessary additives. Clean ingredients your body actually recognises.
          </p>

          {/* CTA */}
          <Link
            to="/products"
            className="cmp-cta"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85";
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(0)";
            }}
          >
            See What's Inside
          </Link>
        </div>
      </div>

      <style>{`
        .cmp-section {
          width: 100%;
          font-family: 'PlusJakartaSans', sans-serif;
          overflow: hidden;
          background-color: #F5F0E8;
        }

        .cmp-grid {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
        }

        .cmp-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 900px;
          padding: 80px 8vw;
        }

        .cmp-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #e49530;
          margin-bottom: 16px;
        }

        .cmp-heading {
          font-family: 'PlusJakartaSans', sans-serif;
          font-size: clamp(1.9rem, 3.2vw, 3rem);
          font-weight: 900;
          color: #e49530;
          line-height: 1.1;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .cmp-divider {
          width: 48px;
          height: 3px;
          background-color: #e49530;
          border-radius: 2px;
          margin-bottom: 28px;
        }

        .cmp-para {
          font-size: 0.95rem;
          color: #333333;
          line-height: 1.7;
          font-weight: 400;
          margin-bottom: 18px;
        }

        .cmp-cta {
          font-family: 'PlusJakartaSans', sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #e49530;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 16px 40px;
          border-radius: 999px;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: opacity 0.2s ease, transform 0.2s ease;
          align-self: flex-start;
        }

        @media (max-width: 768px) {
          .cmp-grid {
            min-height: unset;
          }

          .cmp-left {
            padding: 52px 24px 40px;
          }

          .cmp-heading {
            font-size: 2rem;
          }

          .cmp-cta {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default ComparisonSection;


// import { Link } from "react-router-dom";

// const ComparisonSection = () => {
//   return (
//     <section className="cmp-section">
//       <div className="cmp-grid">
//         {/* ── LEFT PANEL: Text Content ── */}
//         <div className="cmp-left">
//           {/* Eyebrow label */}
//           <p className="cmp-label">What's in yours?</p>

//           {/* Headline */}
//           <h2 className="cmp-heading">
//             No Sugar
//             <br />
//             Syrups: Why
//             <br />
//             We Press
//             <br />
//             Differently
//           </h2>

//           {/* Divider */}
//           <div className="cmp-divider" />

//           {/* Paragraph 1 */}
//           <p className="cmp-para">
//             Most packaged juices, even the ones that look healthy, are loaded
//             with added sugar syrups, concentrates, and artificial preservatives.
//             These spike your blood sugar, feed bad gut bacteria, and leave you
//             feeling worse than before.
//           </p>

//           {/* Paragraph 2 */}
//           <p className="cmp-para" style={{ marginBottom: "40px" }}>
//             That's why Quartermelon cold-presses real Apple, Beetroot & Carrot,
//             no concentrates, no syrups, no shortcuts. Just 50ml of raw,
//             living nutrition with only 22 kcal per shot. Ingredients your gut
//             actually recognises.
//           </p>

//           {/* CTA */}
//           <Link
//             to="/products"
//             className="cmp-cta"
//             onMouseEnter={(e) => {
//               (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85";
//               (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
//             }}
//             onMouseLeave={(e) => {
//               (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
//               (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
//             }}
//           >
//             See What's Inside
//           </Link>
//         </div>

//         {/* ── RIGHT PANEL: Image ── */}
//         <div className="cmp-right">
//           {/* Soft radial glow */}
//           <div className="cmp-glow" />
//           <img
//             src="/images/comparison.png"
//             alt="Quartermelon vs regular juice"
//             className="cmp-img"
//           />
//         </div>
//       </div>

//       <style>{`
//         .cmp-section {
//           width: 100%;
//           font-family: 'PlusJakartaSans', sans-serif;
//           overflow: hidden;
//           background-color: #F5F0E8;
//         }
//         .cmp-grid {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           min-height: 100vh;
//           align-items: center;
//         }
//         .cmp-left {
//           display: flex;
//           flex-direction: column;
//           justify-content: center;
//           padding: 80px 60px;
//         }
//         .cmp-label {
//           font-size: 0.68rem;
//           font-weight: 700;
//           letter-spacing: 0.18em;
//           text-transform: uppercase;
//           color: #e49530;
//           margin-bottom: 16px;
//         }
//         .cmp-heading {
//           font-family: 'PlusJakartaSans', sans-serif;
//           font-size: clamp(1.9rem, 3.2vw, 3rem);
//           font-weight: 900;
//           color: #e49530;
//           line-height: 1.1;
//           letter-spacing: -0.03em;
//           text-transform: uppercase;
//           margin-bottom: 28px;
//         }
//         .cmp-divider {
//           width: 48px;
//           height: 3px;
//           background-color: #e49530;
//           border-radius: 2px;
//           margin-bottom: 28px;
//         }
//         .cmp-para {
//           font-size: 0.95rem;
//           color: #333333;
//           line-height: 1.7;
//           font-weight: 400;
//           margin-bottom: 18px;
//         }
//         .cmp-cta {
//           font-family: 'PlusJakartaSans', sans-serif;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           background-color: #e49530;
//           color: #ffffff;
//           font-weight: 700;
//           font-size: 0.95rem;
//           padding: 16px 40px;
//           border-radius: 999px;
//           text-decoration: none;
//           letter-spacing: 0.01em;
//           transition: opacity 0.2s ease, transform 0.2s ease;
//           align-self: flex-start;
//         }
//         .cmp-right {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 60px;
//           min-height: 100vh;
//           background-color: #F5F0E8;
//           border-radius: 50px;
//           position: relative;
//           overflow: hidden;
//         }
//         .cmp-glow {
//           position: absolute;
//           inset: 0;
//           background: radial-gradient(ellipse at center, rgba(232,0,106,0.06) 0%, transparent 70%);
//           pointer-events: none;
//         }
//         .cmp-img {
//           width: auto;
//           height: 80%;
//           max-height: 640px;
//           max-width: 100%;
//           object-fit: contain;
//           display: block;
//           transform: scale(0.9);
//           transform-origin: center center;
//           position: relative;
//           z-index: 1;
//           filter: drop-shadow(0 24px 48px rgba(0,0,0,0.10));
//         }

//         @media (max-width: 768px) {
//           .cmp-grid {
//             grid-template-columns: 1fr;
//             min-height: unset;
//           }
//           .cmp-left {
//             padding: 52px 24px 40px;
//             order: 2;
//           }
//           .cmp-heading {
//             font-size: 2rem;
//           }
//           .cmp-cta {
//             width: 100%;
//             justify-content: center;
//           }
//           .cmp-right {
//             min-height: 380px;
//             padding: 32px;
//             border-radius: 0;
//             order: 1;
//           }
//           .cmp-img {
//             height: auto;
//             width: 75%;
//             max-height: 320px;
//             transform: scale(1);
//           }
//         }
//       `}</style>
//     </section>
//   );
// };

// export default ComparisonSection;

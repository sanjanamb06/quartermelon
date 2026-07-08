import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const SubscriptionPage = () => (
  <>
    <Navbar />
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'PlusJakartaSans', sans-serif",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        {/* Pause icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(45, 73, 31, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2d491f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>

        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#2d491f",
            marginBottom: "14px",
          }}
        >
          Subscriptions
        </p>

        <h1
          style={{
            fontFamily: "'Gemilion', serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 500,
            color: "#2d491f",
            lineHeight: 1.1,
            marginBottom: "20px",
            letterSpacing: "-0.01em",
          }}
        >
          Temporarily Paused
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "rgba(45, 73, 31, 0.7)",
            lineHeight: 1.65,
            marginBottom: "36px",
            maxWidth: "420px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          We're pausing new subscriptions for now while we make sure every
          order gets the freshness and care it deserves. Check back soon —
          we're not going anywhere.
        </p>

        <Link
          to="/packages"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: "#2d491f",
            color: "#ffffff",
            fontFamily: "'PlusJakartaSans', sans-serif",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "16px 36px",
            borderRadius: "999px",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Browse Our Bundles
        </Link>
      </div>
    </main>
    <FooterSection />
  </>
);

export default SubscriptionPage;

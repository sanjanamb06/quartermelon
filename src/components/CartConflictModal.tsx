import { useEffect } from "react";

interface CartConflictModalProps {
  /** Which mode the cart is currently locked to */
  currentMode: "ASSORTED" | "CUSTOM";
  /** Dismiss without changing anything */
  onDismiss: () => void;
  /** Clear the cart, switch mode, then proceed — called after user confirms */
  onSwitch: () => void;
}

const COPY: Record<"ASSORTED" | "CUSTOM", { current: string; incoming: string }> = {
  ASSORTED: {
    current: "Assorted Bundle",
    incoming: "Make Your Own Bundle",
  },
  CUSTOM: {
    current: "Make Your Own Bundle",
    incoming: "Assorted Bundle",
  },
};

const CartConflictModal = ({ currentMode, onDismiss, onSwitch }: CartConflictModalProps) => {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const copy = COPY[currentMode];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ccm-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "min(440px, calc(100vw - 32px))",
          backgroundColor: "#ffffff",
          border: "1.5px solid #000000",
          borderRadius: 0,
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            border: "1.5px solid #000000",
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E331E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Heading */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2
            id="ccm-title"
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#1A1A1A",
              fontFamily: "'PlusJakartaSans', sans-serif",
              lineHeight: 1.35,
            }}
          >
            Two different order types can't be mixed
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.88rem",
              color: "#555",
              fontFamily: "'PlusJakartaSans', sans-serif",
              lineHeight: 1.6,
            }}
          >
            Your cart already has a <strong style={{ color: "#1E331E" }}>{copy.current}</strong> order, which uses a different checkout method to <strong style={{ color: "#1E331E" }}>{copy.incoming}</strong>. Please complete one order before starting another.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Primary: keep current */}
          <button
            type="button"
            onClick={onDismiss}
            id="ccm-keep-btn"
            style={{
              width: "100%",
              padding: "13px 16px",
              border: "1.5px solid #000000",
              borderRadius: 0,
              backgroundColor: "#ffffff",
              color: "#1E331E",
              fontFamily: "'PlusJakartaSans', sans-serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              textAlign: "center",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F5F5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            Continue with current cart
          </button>

          {/* Secondary: clear & switch */}
          <button
            type="button"
            onClick={onSwitch}
            id="ccm-switch-btn"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1.5px solid rgba(0,0,0,0.25)",
              borderRadius: 0,
              backgroundColor: "#ffffff",
              color: "#888",
              fontFamily: "'PlusJakartaSans', sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              textAlign: "center",
              transition: "background-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FFF0F0";
              e.currentTarget.style.color = "#991B1B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.color = "#888";
            }}
          >
            Clear cart &amp; switch to {copy.incoming}
          </button>
        </div>
      </div>
    </>
  );
};

export default CartConflictModal;

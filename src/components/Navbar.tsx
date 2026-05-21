import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, X } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tappedLink, setTappedLink] = useState<string | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const links = [
    { label: "Products", href: "/products" },
    { label: "Plans", href: "/subscription" },
    { label: "Builder", href: "/bundles" },
    { label: "About us", href: "/about" },
    { label: "Contact us", href: "/contact" },
  ];

  const handleMobileLinkClick = (href: string) => {
    setTappedLink(href);
    setTimeout(() => setTappedLink(null), 150);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="container flex items-center justify-between h-16 md:h-20">

          {/* Mobile: hamburger */}
          <div className="flex md:hidden flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-foreground"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop Links (Left) */}
          <div className="hidden md:flex flex-1 items-center gap-6">
            {links.map((l) => (
              <div key={l.href} className="nav-link-wrap">
                <Link
                  to={l.href}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: "#1A1A1A" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#3D3D3D")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#1A1A1A")}
                >
                  {l.label}
                </Link>
                <span
                  className={`nav-link-underline ${
                    pathname === l.href ? "nav-link-underline-active" : ""
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Center Logo */}
          <div className="flex justify-center flex-1 md:flex-none">
            <Link to="/">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <img
                  src="/logo_title.png"
                  alt="Quartermelon"
                  className="navbar-center-logo"
                  style={{ width: "auto", objectFit: "contain" }}
                />
                <span style={{
                  fontSize: "7px",
                  fontFamily: "PlusJakartaSans, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#1A1A1A",
                  textAlign: "center",
                  whiteSpace: "nowrap"
                }}>
                  All the fruits your mom told you to eat
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Review button */}
          <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
            <Link
              to="/review"
              className="inline-flex items-center justify-center gap-2 md:rounded-full md:bg-[#2d491f] md:text-white md:px-6 md:py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={20} className="md:w-[18px] md:h-[18px] text-foreground md:text-white" />
              <span className="hidden md:inline">Review</span>
            </Link>
          </div>

        </div>
      </nav>

      {/* ── Mobile slide-in drawer ── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          zIndex: 70,
          backgroundColor: "#F5F0E8",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <img
                src="/logo_title.png"
                alt="Quartermelon"
                style={{ height: "40px", width: "auto", objectFit: "contain" }}
              />
              <span style={{
                fontSize: "7px",
                fontFamily: "PlusJakartaSans, sans-serif",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#1A1A1A",
                textAlign: "center",
                whiteSpace: "nowrap"
              }}>
                All the fruits your mom told you to eat
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", color: "#1A1A1A" }}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav links */}
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => handleMobileLinkClick(l.href)}
              style={{
                display: "block",
                padding: "14px 0",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#1A1A1A",
                textDecoration: "none",
                fontFamily: "'PlusJakartaSans', sans-serif",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                background: tappedLink === l.href ? "rgba(195, 217, 45, 0.3)" : "transparent",
                transition: "background 150ms ease",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Drawer CTA */}
        <div style={{ padding: "20px 24px" }}>
          <Link
            to="/review"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: "#c5d830",
              color: "#1A1A1A",
              fontFamily: "'PlusJakartaSans', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              padding: "14px 24px",
              borderRadius: "999px",
              textDecoration: "none",
            }}
          >
            <ShoppingBag size={18} />
            Review Order
          </Link>
        </div>
      </div>

      <style>{`
        .navbar-center-logo {
          height: 52px;
        }
        @media (min-width: 768px) {
          .navbar-center-logo {
            height: 40px;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;

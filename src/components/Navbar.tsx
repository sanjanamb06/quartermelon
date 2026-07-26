import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tappedLink, setTappedLink] = useState<string | null>(null);
  // Desktop dropdown state
  const [bundleDropdownOpen, setBundleDropdownOpen] = useState(false);
  // Mobile accordion state
  const [mobileBundleOpen, setMobileBundleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBundleDropdownOpen(false);
      }
    };
    if (bundleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bundleDropdownOpen]);

  const isBundleActive = pathname === "/packages" || pathname === "/bundles";

  const links = [
    { label: "Products", href: "/products" },
    { label: "Plans", href: "/subscription" },
    { label: "About us", href: "/about" },
    { label: "Contact us", href: "/contact" },
  ];

  const bundleSubLinks = [
    { label: "Curated Bundles", href: "/packages" },
    { label: "Build Your Own", href: "/bundles" },
  ];

  const handleMobileLinkClick = (href: string) => {
    setTappedLink(href);
    setTimeout(() => setTappedLink(null), 150);
    setMobileOpen(false);
    setMobileBundleOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-50 w-full bg-gradient-to-b from-[#FFFFFF] to-[#F6F6F6] border-b border-[rgba(0,0,0,0.06)] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
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
            {/* Products — first nav item */}
            <div className="nav-link-wrap">
              <Link
                to={links[0].href}
                className="text-sm font-semibold transition-colors"
                style={{ color: "#1A1A1A" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3D3D3D")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#1A1A1A")}
              >
                {links[0].label}
              </Link>
              <span
                className={`nav-link-underline ${pathname === links[0].href ? "nav-link-underline-active" : ""}`}
              />
            </div>

            {/* ── Bundles dropdown — second nav item ── */}
            <div className="nav-link-wrap nav-dropdown-wrap" ref={dropdownRef}>
              <button
                className="nav-dropdown-trigger text-sm font-semibold transition-colors"
                style={{ color: "#1A1A1A" }}
                onClick={() => setBundleDropdownOpen((o) => !o)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3D3D3D")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#1A1A1A")}
                aria-haspopup="true"
                aria-expanded={bundleDropdownOpen}
              >
                Bundles
                <ChevronDown
                  size={14}
                  className="nav-chevron"
                  style={{ transform: bundleDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <span
                className={`nav-link-underline ${isBundleActive ? "nav-link-underline-active" : ""}`}
              />

              {/* Dropdown panel */}
              {bundleDropdownOpen && (
                <div className="nav-dropdown-panel" role="menu">
                  {bundleSubLinks.map((sub) => (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      role="menuitem"
                      className="nav-dropdown-item"
                      style={{
                        background: pathname === sub.href ? "rgba(197,216,48,0.12)" : "transparent",
                        fontWeight: pathname === sub.href ? 700 : 600,
                      }}
                      onClick={() => setBundleDropdownOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {links.slice(1).map((l) => (
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
                  className={`nav-link-underline ${pathname === l.href ? "nav-link-underline-active" : ""}`}
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
                <span className="navbar-slogan">
                  All the fruits your mom told you to eat
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Review button */}
          <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
            <Link
              to="/review"
              className="inline-flex items-center justify-center gap-2  md:text-white md:px-6 md:py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              aria-label="Review order"
            ><ShoppingBag size={20} className="md:w-[18px] md:h-[18px] text-[#1A1A1A]" />
              
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <img
                src="/logo_title.png"
                alt="Quartermelon"
                className="navbar-drawer-logo"
                style={{ width: "auto", objectFit: "contain" }}
              />
              <span className="navbar-slogan">
                All the fruits your mom told you to eat
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: "#1A1A1A" }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {/* Products — first nav item */}
          <Link
            to={links[0].href}
            onClick={() => handleMobileLinkClick(links[0].href)}
            style={{
              display: "block",
              padding: "14px 0",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#1A1A1A",
              textDecoration: "none",
              fontFamily: "'PlusJakartaSans', sans-serif",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              background: tappedLink === links[0].href ? "rgba(195, 217, 45, 0.3)" : "transparent",
              transition: "background 150ms ease",
            }}
          >
            {links[0].label}
          </Link>

          {/* Mobile Bundles accordion — second nav item */}
          <div>
            <button
              type="button"
              onClick={() => setMobileBundleOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "14px 0",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#1A1A1A",
                textDecoration: "none",
                fontFamily: "'PlusJakartaSans', sans-serif",
                borderBottom: mobileBundleOpen ? "none" : "1px solid rgba(0,0,0,0.06)",
                background: "transparent",
                border: "none",
                borderBottomWidth: "1px",
                borderBottomStyle: "solid",
                borderBottomColor: mobileBundleOpen ? "transparent" : "rgba(0,0,0,0.06)",
                cursor: "pointer",
              }}
              aria-expanded={mobileBundleOpen}
            >
              <span>Bundles</span>
              <ChevronDown
                size={16}
                style={{
                  transition: "transform 0.2s ease",
                  transform: mobileBundleOpen ? "rotate(180deg)" : "rotate(0deg)",
                  color: "#1A1A1A",
                }}
              />
            </button>

            {/* Accordion sub-links */}
            <div
              style={{
                maxHeight: mobileBundleOpen ? "120px" : "0",
                overflow: "hidden",
                transition: "max-height 0.25s ease",
                borderBottom: mobileBundleOpen ? "1px solid rgba(0,0,0,0.06)" : "none",
              }}
            >
              {bundleSubLinks.map((sub) => (
                <Link
                  key={sub.href}
                  to={sub.href}
                  onClick={() => handleMobileLinkClick(sub.href)}
                  style={{
                    display: "block",
                    padding: "11px 0 11px 20px",
                    fontSize: "0.9rem",
                    fontWeight: pathname === sub.href ? 700 : 500,
                    color: pathname === sub.href ? "#2d4920" : "#555",
                    textDecoration: "none",
                    fontFamily: "'PlusJakartaSans', sans-serif",
                    background: tappedLink === sub.href ? "rgba(195, 217, 45, 0.2)" : "transparent",
                    transition: "background 150ms ease",
                    borderLeft: pathname === sub.href ? "3px solid #c3d92d" : "3px solid transparent",
                  }}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>

          {links.slice(1).map((l) => (
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
          height: 33px;
        }
        .navbar-drawer-logo {
          height: 27px;
        }
        .navbar-slogan {
          font-size: 5.5px;
          font-family: PlusJakartaSans, sans-serif;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1A1A1A;
          text-align: center;
          white-space: nowrap;
        }
        @media (min-width: 768px) {
          .navbar-center-logo {
            height: 40px;
          }
          .navbar-slogan {
            font-size: 7px;
            letter-spacing: 0.15em;
          }
        }

        /* ── Dropdown trigger button ── */
        .nav-dropdown-trigger {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: inherit;
        }
        .nav-chevron {
          transition: transform 0.2s ease;
        }

        /* ── Dropdown panel ── */
        .nav-dropdown-wrap {
          position: relative;
        }
        .nav-dropdown-panel {
          position: absolute;
          top: calc(100% + 14px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 176px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 100;
          animation: dropdown-appear 0.15s ease-out both;
        }
        @keyframes dropdown-appear {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .nav-dropdown-item {
          display: block;
          padding: 10px 14px;
          border-radius: 9px;
          font-size: 0.88rem;
          color: #1A1A1A;
          text-decoration: none;
          font-family: 'PlusJakartaSans', sans-serif;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .nav-dropdown-item:hover {
          background: rgba(197,216,48,0.15) !important;
        }
      `}</style>
    </>
  );
};

export default Navbar;

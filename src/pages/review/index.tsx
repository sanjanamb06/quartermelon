import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Minus, Plus, X, CheckCircle2, ArrowRight } from "lucide-react";
import {
  readCart,
  writeCart,
  PRESET_BUNDLES,
  CART_KEY,
} from "@/data/bundles";
import type {
  QuartermelonCart,
  FixedBundleLine,
  FixedBundleType,
} from "@/data/bundles";

// ─── Razorpay type declarations ──────────────────────────────────────────────
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: { color?: string };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "916364471003"; // Support contact
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

/** Supabase Edge Function base URL, derived from the Supabase project URL. */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string)
  .replace(/\/rest\/v1\/?$/, ""); // strip the REST path to get the project root

/** 10% discount threshold for the custom bundle. */
const CUSTOM_DISCOUNT_THRESHOLD = 999;
const CUSTOM_DISCOUNT_RATE = 0.10;

/** Promotional nudge: show card when custom subtotal is in [700, 998]. */
const PROMO_LOW = 700;
const PROMO_HIGH = CUSTOM_DISCOUNT_THRESHOLD - 1;

/** Default delivery fee before geocoding runs. */
const DEFAULT_DELIVERY_FEE = 150;

/** Minimum bottles required for a custom bundle selection. */
const MIN_CUSTOM_BOTTLES = 5;

/** Pending order expiry in milliseconds (30 minutes). */
const PENDING_ORDER_TTL_MS = 30 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
}

interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  deliveryFee: number;
  mapsLink: string | null;
  geocodeStatus: "success" | "failed" | "pending";
}

interface PendingOrder {
  internalOrderId: string;
  razorpayOrderId: string;
  qmOrderId: string;
  createdAt: number;
  cartSnapshot: string;
  addressSnapshot: string;
  deliveryFee: number;
}

const DEFAULT_GEOCODE_RESULT: GeocodeResult = {
  lat: null,
  lng: null,
  distanceKm: null,
  deliveryFee: DEFAULT_DELIVERY_FEE,
  mapsLink: null,
  geocodeStatus: "pending",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function updateFixedLineQty(
  lines: FixedBundleLine[],
  type: FixedBundleType,
  delta: number
): FixedBundleLine[] {
  const existing = lines.find((l) => l.bundleType === type);
  const cur = existing?.quantity ?? 0;
  const next = Math.max(0, cur + delta);
  if (next === 0) return lines.filter((l) => l.bundleType !== type);
  if (existing) {
    return lines.map((l) => (l.bundleType === type ? { ...l, quantity: next } : l));
  }
  const def = PRESET_BUNDLES[type];
  return [
    ...lines,
    { bundleType: type, displayName: def.displayName, quantity: next, unitPrice: def.unitPrice },
  ];
}

// ─── Helpers: load Razorpay script ───────────────────────────────────────────
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.head.appendChild(script);
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ReviewPage = () => {
  const navigate = useNavigate();

  // ── Step state ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Cart state ──
  const [cart, setCart] = useState<QuartermelonCart | null>(null);
  const [cartExpired, setCartExpired] = useState(false);
  const [cartEmpty, setCartEmpty] = useState(false);
  const [incompleteCustomBundle, setIncompleteCustomBundle] = useState(false);
  const [customBundleTotal, setCustomBundleTotal] = useState<number | null>(null);
  const [customBundleMinError, setCustomBundleMinError] = useState<number | null>(null);

  // ── UI state ──
  const [orderId, setOrderId] = useState("");
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);
  const [showRecentOrderWarning, setShowRecentOrderWarning] = useState(true);
  const [showPromoCard, setShowPromoCard] = useState(true);

  // ── Delivery form fields ──
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Geocoding result ──
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult>({ ...DEFAULT_GEOCODE_RESULT });

  // ── Pending order state ──
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  // ── Payment / submission state ──
  const [geocoding, setGeocoding] = useState(false);
  const [paying, setPaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ── Load Razorpay script on mount ──
  useEffect(() => {
    loadRazorpayScript().catch(() => {
      // Ignore preload failures — script will be retried when Pay is clicked.
    });
  }, []);

  // ── Load pending order from sessionStorage on mount ──
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qm_pending_order");
      if (raw) {
        const parsed = JSON.parse(raw) as PendingOrder;
        if (parsed.createdAt && Date.now() - parsed.createdAt < PENDING_ORDER_TTL_MS) {
          // Will be further validated against current cart when Pay is clicked.
          setPendingOrder(parsed);
        } else {
          sessionStorage.removeItem("qm_pending_order");
        }
      }
    } catch {
      sessionStorage.removeItem("qm_pending_order");
    }
  }, []);

  const loadCart = useCallback(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) {
        setCart(null);
        setCartEmpty(true);
        setIncompleteCustomBundle(false);
        setCustomBundleTotal(null);
        return;
      }

      // Check freshness using the raw savedAt before calling readCart()
      let savedAt: number | undefined;
      try {
        const parsed = JSON.parse(raw) as { savedAt?: number };
        savedAt = parsed.savedAt;
      } catch {
        // ignore
      }
      if (savedAt && Date.now() - savedAt > 3_600_000) {
        setCartExpired(true);
        setIncompleteCustomBundle(false);
        setCustomBundleTotal(null);
        return;
      }

      const loaded = readCart();

      if (!loaded) {
        // readCart returns null if expired or malformed
        if (savedAt && Date.now() - savedAt > 3_600_000) {
          setCartExpired(true);
        } else {
          setCart(null);
          setCartEmpty(true);
        }
        setIncompleteCustomBundle(false);
        setCustomBundleTotal(null);
        return;
      }

      const hasFixed = loaded.fixedLines.length > 0;
      const hasCustom =
        loaded.customBundle !== null &&
        (loaded.customBundle?.items.length ?? 0) > 0;

      if (!hasFixed && !hasCustom) {
        setCart(null);
        setCartEmpty(true);
        setIncompleteCustomBundle(false);
        setCustomBundleTotal(null);
        return;
      }

      const loadedCustomBundleTotal = loaded.customBundle
        ? loaded.customBundle.items.reduce((sum, item) => sum + item.quantity, 0)
        : null;
      const loadedIncompleteCustomBundle =
        loaded.customBundle !== null && (loadedCustomBundleTotal ?? 0) < MIN_CUSTOM_BOTTLES;

      setCart(loaded);
      setCustomBundleTotal(loadedCustomBundleTotal);
      setIncompleteCustomBundle(loadedIncompleteCustomBundle);
    } catch {
      setCart(null);
      setCartEmpty(true);
      setIncompleteCustomBundle(false);
      setCustomBundleTotal(null);
    }
  }, []);

  useEffect(() => {
    loadCart();
    window.addEventListener("storage", loadCart);
    return () => window.removeEventListener("storage", loadCart);
  }, [loadCart]);

  useEffect(() => {
    const lastOrderTime = Number(localStorage.getItem("qm_last_order_time") || 0);
    if (lastOrderTime && Date.now() - lastOrderTime < 180_000) {
      setAlreadyOrdered(true);
    }
  }, []);

  // ── Inline quantity stepper for fixed bundle lines ──
  // CRITICAL: any cart mutation invalidates geocode result and pending order.
  const adjustFixedQty = (type: FixedBundleType, delta: number) => {
    if (!cart) return;
    const newLines = updateFixedLineQty(cart.fixedLines, type, delta);
    const newCart: QuartermelonCart = { ...cart, fixedLines: newLines };

    const hasFixed = newLines.length > 0;
    const hasCustom = (newCart.customBundle?.items.length ?? 0) > 0;

    // Invalidate geocode + pending order on any cart change.
    setGeocodeResult({ ...DEFAULT_GEOCODE_RESULT });
    setPendingOrder(null);
    setCustomBundleMinError(null);
    sessionStorage.removeItem("qm_pending_order");

    if (!hasFixed && !hasCustom) {
      localStorage.removeItem(CART_KEY);
      setCart(null);
      setCartEmpty(true);
    } else {
      writeCart({ fixedLines: newLines, customBundle: newCart.customBundle });
      setCart({ ...newCart, savedAt: Date.now() });
    }
  };

  // ── Form helpers ──
  const handleFieldChange = (field: keyof FormErrors | "landmark", value: string) => {
    if (field === "name") setName(value);
    if (field === "phone") setPhone(value);
    if (field === "email") setEmail(value);
    if (field === "addressLine1") setAddressLine1(value);
    if (field === "addressLine2") setAddressLine2(value);
    if (field === "landmark") setLandmark(value);
    if (field === "pincode") setPincode(value);
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** Validate a single field on blur. */
  const validateField = (field: keyof FormErrors) => {
    let err: string | undefined;
    switch (field) {
      case "name":
        if (!name.trim()) err = "Full name is required.";
        break;
      case "phone":
        if (!/^[6-9]\d{9}$/.test(phone.trim()))
          err = "Enter a valid 10-digit Indian mobile number.";
        break;
      case "email":
        if (!email.trim()) {
          err = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          err = "Enter a valid email address.";
        }
        break;
      case "addressLine1":
        if (!addressLine1.trim()) err = "This field is required.";
        break;
      case "addressLine2":
        if (!addressLine2.trim()) err = "This field is required.";
        break;
      case "pincode":
        if (!/^\d{6}$/.test(pincode.trim())) {
          err = "Enter a valid 6-digit pincode";
        } else if (!pincode.trim().startsWith("560")) {
          err = "Sorry, we currently deliver within Bengaluru only";
        }
        break;
    }
    if (err) setErrors((prev) => ({ ...prev, [field]: err }));
  };

  /** Full form validation — returns true if all fields are valid. */
  const validateAll = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!/^[6-9]\d{9}$/.test(phone.trim()))
      errs.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    if (!addressLine1.trim()) errs.addressLine1 = "This field is required.";
    if (!addressLine2.trim()) errs.addressLine2 = "This field is required.";
    if (!/^\d{6}$/.test(pincode.trim())) {
      errs.pincode = "Enter a valid 6-digit pincode";
    } else if (!pincode.trim().startsWith("560")) {
      errs.pincode = "Sorry, we currently deliver within Bengaluru only";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Pricing calculations ──
  const fixedTotal = cart
    ? cart.fixedLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
    : 0;

  const customRawSubtotal = cart?.customBundle?.subtotal ?? 0;
  const customDiscountUnlocked = customRawSubtotal >= CUSTOM_DISCOUNT_THRESHOLD;
  const customDiscount = customDiscountUnlocked
    ? Math.round(customRawSubtotal * CUSTOM_DISCOUNT_RATE)
    : 0;
  const customEffectiveSubtotal = customRawSubtotal - customDiscount;
  /** Subtotal (items only, before delivery). */
  const subtotal = fixedTotal + customEffectiveSubtotal;
  /** Delivery fee from geocoding (or default 150 before geocoding). */
  const currentDeliveryFee = geocodeResult.deliveryFee;
  /** Final amount the customer pays, including delivery. */
  const orderTotal = subtotal + currentDeliveryFee;

  // Promo card visibility: only when custom exists and subtotal in [700, 998]
  const showPromo =
    showPromoCard &&
    !!cart?.customBundle &&
    customRawSubtotal >= PROMO_LOW &&
    customRawSubtotal <= PROMO_HIGH;

  const amountToUnlock = CUSTOM_DISCOUNT_THRESHOLD - customRawSubtotal;

  const handleConfirmOrder = () => {
    if (!cart) return;

    const currentCustomBundleTotal = cart.customBundle
      ? cart.customBundle.items.reduce((sum, item) => sum + item.quantity, 0)
      : null;
    const isIncomplete =
      cart.customBundle !== null && (currentCustomBundleTotal ?? 0) < MIN_CUSTOM_BOTTLES;

    if (isIncomplete) {
      setCustomBundleMinError(currentCustomBundleTotal ?? 0);
      return;
    }

    setCustomBundleMinError(null);
    setStep(2);
  };

  // ── Step 2: Geocode + advance to Step 3 ──
  const handleContinueToStep3 = async () => {
    if (!validateAll()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/geocode-address`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            landmark: landmark.trim() || undefined,
            pincode: pincode.trim(),
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        lat: number | null;
        lng: number | null;
        distanceKm: number | null;
        deliveryFee: number;
        mapsLink: string | null;
        geocodeStatus: "success" | "failed";
      };
      setGeocodeResult({
        lat: data.lat,
        lng: data.lng,
        distanceKm: data.distanceKm,
        deliveryFee: data.deliveryFee,
        mapsLink: data.mapsLink,
        geocodeStatus: data.geocodeStatus,
      });
    } catch {
      // Network error — never block the customer.
      setGeocodeResult({
        lat: null,
        lng: null,
        distanceKm: null,
        deliveryFee: DEFAULT_DELIVERY_FEE,
        mapsLink: null,
        geocodeStatus: "failed",
      });
    }
    setGeocoding(false);
    setStep(3);
  };

  // ── Step 3: Payment handler ──
  const handlePay = async () => {
    if (!cart) return;
    if (paying || submitted) return;

    setPaymentError(null);

    // ── 1. Honeypot check ────────────────────────────────────────────────────
    if (honeypot.trim()) return;

    // ── 2. Rate limiter ──────────────────────────────────────────────────────
    const attemptWindowMs = 600_000; // 10 minutes
    const now = Date.now();
    let attempts = { count: 0, windowStart: now };
    try {
      const parsed = JSON.parse(localStorage.getItem("qm_submit_attempts") || "{}") as {
        count?: number;
        windowStart?: number;
      };
      if (typeof parsed.count === "number" && typeof parsed.windowStart === "number") {
        attempts = { count: parsed.count, windowStart: parsed.windowStart };
      }
    } catch {
      attempts = { count: 0, windowStart: now };
    }
    if (now - attempts.windowStart > attemptWindowMs) {
      attempts = { count: 0, windowStart: now };
    }
    if (attempts.count >= 3) {
      setPaymentError("Too many attempts. Please wait a few minutes and try again.");
      return;
    }
    attempts.count += 1;
    localStorage.setItem("qm_submit_attempts", JSON.stringify(attempts));

    // ── 3. Duplicate submission guard ────────────────────────────────────────
    const lastOrderTime = Number(localStorage.getItem("qm_last_order_time") || 0);
    if (lastOrderTime && Date.now() - lastOrderTime < 180_000) {
      setPaymentError("You placed an order recently. Please wait a few minutes before trying again.");
      return;
    }

    // ── 4. Cart freshness re-check ───────────────────────────────────────────
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      setPaymentError("Your cart appears to be empty. Please go back and add items.");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { savedAt?: number };
      if (parsed.savedAt && Date.now() - parsed.savedAt > 3_600_000) {
        setCartExpired(true);
        return;
      }
    } catch {
      // ignore parse errors
    }

    setPaying(true);

    // ── 5. Check for reusable pending order ──────────────────────────────────
    const currentCartSnapshot = JSON.stringify(cart);
    const currentAddressSnapshot = JSON.stringify({
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
      email: email.trim(),
    });

    let useExistingOrder = false;
    let reuseOrderData: {
      internalOrderId: string;
      razorpayOrderId: string;
      qmOrderId: string;
      keyId: string;
      amount: number;
    } | null = null;

    if (
      pendingOrder &&
      pendingOrder.createdAt > Date.now() - PENDING_ORDER_TTL_MS &&
      pendingOrder.cartSnapshot === currentCartSnapshot &&
      pendingOrder.addressSnapshot === currentAddressSnapshot &&
      pendingOrder.deliveryFee === geocodeResult.deliveryFee
    ) {
      useExistingOrder = true;
      reuseOrderData = {
        internalOrderId: pendingOrder.internalOrderId,
        razorpayOrderId: pendingOrder.razorpayOrderId,
        qmOrderId: pendingOrder.qmOrderId,
        keyId: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
        amount: orderTotal,
      };
    }

    try {
      // ── 6. Ensure Razorpay script is loaded ─────────────────────────────
      await loadRazorpayScript();

      let internalOrderId: string;
      let razorpayOrderId: string;
      let qmOrderId: string;
      let keyId: string;

      if (useExistingOrder && reuseOrderData) {
        // Reuse existing pending order — skip create-order call entirely.
        internalOrderId = reuseOrderData.internalOrderId;
        razorpayOrderId = reuseOrderData.razorpayOrderId;
        qmOrderId = reuseOrderData.qmOrderId;
        keyId = reuseOrderData.keyId;
      } else {
        // ── 7. Call create-order edge function ──────────────────────────────
        const orderRes = await fetch(
          `${SUPABASE_URL}/functions/v1/create-order`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: name.trim(),
              phone: phone.trim(),
              addressLine1: addressLine1.trim(),
              addressLine2: addressLine2.trim(),
              landmark: landmark.trim() || undefined,
              pincode: pincode.trim(),
              orderContents: {
                fixedBundles: cart.fixedLines,
                customBundle: cart.customBundle ?? null,
              },
              lat: geocodeResult.lat,
              lng: geocodeResult.lng,
              distanceKm: geocodeResult.distanceKm,
              deliveryFee: geocodeResult.deliveryFee,
              mapsLink: geocodeResult.mapsLink,
              geocodeStatus: geocodeResult.geocodeStatus,
              subtotal,
              total: orderTotal,
            }),
          }
        );

        if (!orderRes.ok) {
          const errBody = await orderRes.json().catch(() => ({})) as { error?: string };
          throw new Error(errBody.error ?? `Order creation failed (HTTP ${orderRes.status})`);
        }

        const orderData = await orderRes.json() as {
          id: string;
          order_id: string;
          razorpay_order_id: string;
          key_id: string;
          amount: number;
        };

        internalOrderId = orderData.id;
        razorpayOrderId = orderData.razorpay_order_id;
        qmOrderId = orderData.order_id;
        keyId = orderData.key_id;

        // Store pending order in state + sessionStorage.
        const newPendingOrder: PendingOrder = {
          internalOrderId,
          razorpayOrderId,
          qmOrderId,
          createdAt: Date.now(),
          cartSnapshot: currentCartSnapshot,
          addressSnapshot: currentAddressSnapshot,
          deliveryFee: geocodeResult.deliveryFee,
        };
        setPendingOrder(newPendingOrder);
        sessionStorage.setItem("qm_pending_order", JSON.stringify(newPendingOrder));
      }

      // ── 8. Open Razorpay widget ──────────────────────────────────────────
      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Razorpay not available."));
          return;
        }

        const rzp = new window.Razorpay({
          key: keyId,
          amount: orderTotal * 100, // Razorpay expects paise
          currency: "INR",
          name: "Quartermelon",
          order_id: razorpayOrderId,
          prefill: {
            name: name.trim(),
            contact: `+91${phone.trim()}`,
            email: email.trim(),
          },
          theme: { color: "#2d4920" },
          handler: async (response: RazorpayPaymentResponse) => {
            try {
              // ── 9. Verify payment ────────────────────────────────────────
              const verifyRes = await fetch(
                `${SUPABASE_URL}/functions/v1/verify-payment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    order_id: internalOrderId,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    email: email.trim(),
                  }),
                }
              );

              if (!verifyRes.ok) {
                const vErr = await verifyRes.json().catch(() => ({})) as { error?: string };
                reject(new Error(vErr.error ?? "Payment verification failed. Please contact support."));
                return;
              }

              // ── 10. Log to Apps Script sheet ─────────────────────────────
              const fixedItemsText = cart.fixedLines
                .map((l) => `${l.displayName} ×${l.quantity}`)
                .join(", ");
              const customItemsText = cart.customBundle
                ? cart.customBundle.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")
                : "";
              const allItemsText = [fixedItemsText, customItemsText].filter(Boolean).join(" | Custom: ");

              const fullAddress = [
                addressLine1.trim(),
                addressLine2.trim(),
                landmark.trim() || null,
                pincode.trim(),
              ]
                .filter(Boolean)
                .join(",\n");

              void fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                  type: "order",
                  orderId: qmOrderId,
                  paymentId: response.razorpay_payment_id,
                  name: name.trim(),
                  phone: phone.trim(),
                  address: fullAddress,
                  pincode: pincode.trim(),
                  mapsLink: geocodeResult.mapsLink ?? "",
                  items: allItemsText,
                  subtotal,
                  deliveryFee: currentDeliveryFee,
                  total: orderTotal,
                  paymentStatus: "Paid",
                }),
              }).catch((err) => console.error("Sheet logging failed:", err));

              // Use the server-generated order ID for the confirmation screen.
              setOrderId(qmOrderId);
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => {
              // Customer closed the modal — not an error, just set paying to false.
              setPaying(false);
              // Do NOT reject — we handle dismiss by simply remaining on Step 3.
            },
          },
        });

        rzp.open();
      });

      // ── 11. Payment confirmed — transition to success state ──────────────
      window.gtag?.("event", "purchase", {
        event_category: "order",
        event_label: "mixed_bundle",
        value: orderTotal,
        currency: "INR",
      });
      localStorage.removeItem("qm_submit_attempts");
      localStorage.setItem("qm_last_order_time", String(Date.now()));
      setSubmitted(true);
      setPaying(false);

      // Clear pending order — it's completed.
      setPendingOrder(null);
      sessionStorage.removeItem("qm_pending_order");
    } catch (err: unknown) {
      setPaying(false);
      const msg = err instanceof Error ? err.message : String(err);
      setPaymentError(msg || "Something went wrong. Please try again.");
    }
  };

  // ── Support WhatsApp link ──────────────────────────────────────────────────
  const whatsappSupportHref = `https://wa.me/${WHATSAPP_NUMBER}`;

  // ── Shared input styling ───────────────────────────────────────────────────
  const inputBase =
    "w-full rounded-none border bg-[#fefefe] px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[rgba(26,26,26,0.6)] outline-none transition-colors";
  const inputNormal =
    "border-[rgba(26,26,26,0.2)] focus:border-[#2d4920] focus:ring-2 focus:ring-[rgba(197,216,48,0.2)]";
  const inputError = "border-red-400 ring-1 ring-red-400";

  // ─── Empty / expired states ───────────────────────────────────────────────
  if (cartExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fefefe", color: "#1A1A1A" }}>
        <div className="container max-w-xl text-center">
          <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: "#1A1A1A" }}>
            Session expired
          </h1>
          <p className="text-sm sm:text-base mb-6" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            Your cart session has expired for freshness. Please rebuild your order to continue.
          </p>
          <Link
            to="/packages"
            className="inline-flex items-center justify-center rounded-none px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#f5945c", color: "#1A1A1A" }}
          >
            Back to Bundles
          </Link>
        </div>
      </div>
    );
  }

  if (cartEmpty || !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fefefe", color: "#1A1A1A" }}>
        <div className="container max-w-xl text-center">
          <div
            className="w-16 h-16 rounded-none mx-auto flex items-center justify-center mb-4"
            style={{ background: "rgba(26, 26, 26, 0.08)" }}
          >
            <ShoppingBag size={30} style={{ color: "#1A1A1A" }} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: "#1A1A1A" }}>
            Your box is empty.
          </h1>
          <p className="text-sm sm:text-base mb-6" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            Add a bundle or build your own selection before reviewing.
          </p>
          <Link
            to="/packages"
            className="inline-flex items-center justify-center gap-2 rounded-none px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#c5d830", color: "#1A1A1A" }}
          >
            Choose a Bundle
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (incompleteCustomBundle) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fefefe", color: "#1A1A1A" }}>
        <div className="container max-w-xl text-center">
          <div
            className="w-16 h-16 rounded-none mx-auto flex items-center justify-center mb-4"
            style={{ background: "rgba(26, 26, 26, 0.08)" }}
          >
            <ShoppingBag size={30} style={{ color: "#1A1A1A" }} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: "#1A1A1A" }}>
            Your custom selection needs at least 5 bottles
          </h1>
          <p className="text-sm sm:text-base mb-6" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            You&apos;ve selected {customBundleTotal ?? 0} — add {MIN_CUSTOM_BOTTLES - (customBundleTotal ?? 0)} more to continue.
          </p>
          <button
            type="button"
            onClick={() => navigate("/bundles", { state: { scrollToProducts: true } })}
            className="inline-flex items-center justify-center gap-2 rounded-none px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#c5d830", color: "#1A1A1A" }}
          >
            Finish Building
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Main review page ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#fefefe", color: "#1A1A1A" }}>

      {/* ── Minimal top nav ── */}
      <div
        className="border-b backdrop-blur-sm sticky top-0 z-30"
        style={{ background: "rgba(254,254,254,0.85)", borderBottomColor: "rgba(26,26,26,0.1)" }}
      >
        <div className="container max-w-2xl py-3 flex items-center justify-between">
          {submitted ? (
            <Link
              to="/"
              className="text-sm transition-colors flex items-center gap-1"
              style={{ color: "rgba(26, 26, 26, 0.6)" }}
            >
              ← Home
            </Link>
          ) : step === 1 ? (
            <Link
              to="/packages"
              className="text-sm transition-colors flex items-center gap-1"
              style={{ color: "rgba(26, 26, 26, 0.6)" }}
            >
              ← Back to Bundles
            </Link>
          ) : step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
              style={{ color: "rgba(26, 26, 26, 0.6)" }}
            >
              ← Back to Order
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
              style={{ color: "rgba(26, 26, 26, 0.6)" }}
            >
              ← Edit Delivery Details
            </button>
          )}
        </div>
      </div>

      {/* ── Page content ── */}
      <main className="container max-w-2xl py-8 pb-12">
        {submitted ? (
          // ── Confirmation screen ──
          <div
            className="rounded-none shadow-sm p-8 text-center"
            style={{ background: "rgba(197, 216, 48, 0.15)", border: "1px solid rgba(26,26,26,0.15)" }}
          >
            <div
              className="w-20 h-20 rounded-none mx-auto flex items-center justify-center mb-5"
              style={{ background: "rgba(197, 216, 48, 0.15)" }}
            >
              <CheckCircle2 size={44} style={{ color: "#1A1A1A" }} />
            </div>
            <h2 className="font-display text-3xl mb-2" style={{ color: "#1A1A1A" }}>
              Order confirmed!
            </h2>
            <p className="text-sm mb-3" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
              Your order ID
            </p>
            <p
              className="text-lg sm:text-xl font-bold font-mono mb-3 px-4 py-2 rounded-none"
              style={{ color: "#1A1A1A", background: "rgba(197, 216, 48, 0.15)" }}
            >
              {orderId}
            </p>
            <p className="text-sm mb-2" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
              Please screenshot this for your records.
            </p>
            <p className="text-sm mb-1" style={{ color: "#1A1A1A" }}>
              Payment received! Your order will be delivered within 24–48 hours.
              For any queries, reach us on{" "}
              <a
                href={whatsappSupportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "#2d4920" }}
              >
                WhatsApp
              </a>
              .
            </p>
          </div>

        ) : step === 1 ? (
          /* ═══════════════════════════════════════════════════════════════════
             STEP 1 — Cart Review
             ═══════════════════════════════════════════════════════════════════ */
          <>
            {/* ── Recent order warning ── */}
            {alreadyOrdered && showRecentOrderWarning && (
              <div
                className="mb-6 rounded-none border px-4 py-3 flex items-start justify-between gap-3"
                style={{ borderColor: "rgba(26,26,26,0.15)", background: "rgba(254, 199, 111, 0.3)" }}
              >
                <p className="text-sm" style={{ color: "#1A1A1A" }}>
                  You placed an order recently. Please double-check before submitting again.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRecentOrderWarning(false)}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: "#1A1A1A" }}
                  aria-label="Dismiss warning"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ── Page heading ── */}
            <div className="mb-6">
              <h1 className="font-display text-3xl sm:text-4xl" style={{ color: "#1A1A1A" }}>
                Review Your Order
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
                Double-check your selection, then continue to delivery details.
              </p>
            </div>

            {/* ── Promotional nudge card (custom bundle within 700–998) ── */}
            {showPromo && (
              <div
                className="relative rounded-none p-5 mb-6 shadow-sm border-l-4"
                style={{ background: "rgba(254, 199, 111, 0.2)", borderLeftColor: "#fec76f" }}
              >
                <button
                  onClick={() => setShowPromoCard(false)}
                  aria-label="Dismiss promotion"
                  className="absolute top-3 right-3 w-7 h-7 rounded-none flex items-center justify-center transition-colors"
                  style={{ color: "#1A1A1A", background: "transparent" }}
                >
                  <X size={15} />
                </button>
                <div className="pr-6">
                  <p className="text-base font-semibold mb-1" style={{ color: "#1A1A1A" }}>
                    You're ₹{amountToUnlock} away from 10% off!
                  </p>
                  <p className="text-sm mb-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
                    Your custom selection is at{" "}
                    <span className="font-bold">₹{customRawSubtotal}</span>. Add just{" "}
                    <span className="font-bold">₹{amountToUnlock}</span> more to reach ₹{CUSTOM_DISCOUNT_THRESHOLD} and
                    unlock a 10% discount on your custom bundle.
                  </p>
                  <button
                    onClick={() => navigate("/bundles")}
                    className="inline-flex items-center gap-1.5 rounded-none text-sm font-semibold px-4 py-2 mt-2 hover:opacity-90 transition-opacity"
                    style={{ background: "#f5945c", color: "#1A1A1A" }}
                  >
                    Add More Items
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Order Summary ── */}
            <div
              className="rounded-none shadow-sm mb-6 overflow-hidden"
              style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-2.5 p-5 border-b"
                style={{ borderColor: "rgba(26,26,26,0.15)" }}
              >
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(197, 216, 48, 0.15)" }}
                >
                  <ShoppingBag size={17} style={{ color: "#2d4920" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                  Order Summary
                </p>
              </div>

              <div className="px-5 py-4 flex flex-col gap-5">

                {/* ── Fixed bundle lines ── */}
                {cart.fixedLines.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(26,26,26,0.45)" }}>
                      Ready-Made Bundles
                    </p>
                    {cart.fixedLines.map((line) => (
                      <div
                        key={line.bundleType}
                        className="flex items-center gap-3 py-2"
                      >
                        {/* Name + unit price */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                            {line.displayName}
                          </p>
                          <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>
                            ₹{line.unitPrice} each
                          </p>
                        </div>

                        {/* Inline stepper */}
                        <div className="rev-qty-selector flex-shrink-0" role="group" aria-label={`Quantity for ${line.displayName}`}>
                          <button
                            type="button"
                            onClick={() => adjustFixedQty(line.bundleType, -1)}
                            className="rev-qty-btn"
                            aria-label={`Decrease quantity for ${line.displayName}`}
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="rev-qty-count">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => adjustFixedQty(line.bundleType, +1)}
                            className="rev-qty-btn"
                            aria-label={`Increase quantity for ${line.displayName}`}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Line total */}
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: "#1A1A1A", minWidth: "56px", textAlign: "right" }}>
                          ₹{(line.unitPrice * line.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {/* Fixed subtotal row */}
                    <div
                      className="flex justify-between text-sm border-t pt-2"
                      style={{ borderColor: "rgba(26,26,26,0.08)" }}
                    >
                      <span style={{ color: "rgba(26,26,26,0.6)" }}>Bundles subtotal</span>
                      <span className="font-semibold" style={{ color: "#1A1A1A" }}>
                        ₹{fixedTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Divider between sections */}
                {cart.fixedLines.length > 0 && cart.customBundle && (
                  <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />
                )}

                {/* ── Custom bundle line ── */}
                {cart.customBundle && cart.customBundle.items.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(26,26,26,0.45)" }}>
                        Custom Selection
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/bundles")}
                        className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                        style={{ color: "#2d4920" }}
                      >
                        Edit selection
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    {/* Indented item breakdown */}
                    <div className="flex flex-col gap-2 pl-3 border-l-2" style={{ borderColor: "rgba(197,216,48,0.4)" }}>
                      {cart.customBundle.items.map((item) => (
                        <div key={item.slug} className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-none text-xs font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: "#f5945c", color: "#1A1A1A" }}
                          >
                            {item.quantity}
                          </span>
                          <span className="flex-1 text-sm" style={{ color: "#1A1A1A" }}>{item.name}</span>
                          <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Custom subtotal + optional discount */}
                    <div className="flex flex-col gap-1.5 border-t pt-2" style={{ borderColor: "rgba(26,26,26,0.08)" }}>
                      {customDiscountUnlocked ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span style={{ color: "rgba(26,26,26,0.6)" }}>Custom subtotal</span>
                            <span className="line-through text-gray-400">₹{customRawSubtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium" style={{ color: "#2d4920" }}>10% discount (≥₹{CUSTOM_DISCOUNT_THRESHOLD})</span>
                            <span className="font-semibold" style={{ color: "#2d4920" }}>−₹{customDiscount}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span style={{ color: "#1A1A1A" }}>Custom after discount</span>
                            <span style={{ color: "#1A1A1A" }}>₹{customEffectiveSubtotal.toLocaleString()}</span>
                          </div>
                          <div
                            className="mt-1 text-xs font-medium px-3 py-2 rounded-none flex items-center gap-1.5"
                            style={{ background: "rgba(254, 199, 111, 0.25)", color: "#1A1A1A", borderLeft: "4px solid #fec76f" }}
                          >
                             You're saving ₹{customDiscount} on your custom bundle!
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: "rgba(26,26,26,0.6)" }}>Custom subtotal</span>
                          <span className="font-semibold" style={{ color: "#1A1A1A" }}>
                            ₹{customRawSubtotal.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Final pricing breakdown ── */}
              <div
                className="px-5 pb-5 border-t pt-4 flex flex-col gap-2"
                style={{ borderColor: "rgba(26,26,26,0.15)" }}
              >
                {cart.fixedLines.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(26,26,26,0.6)" }}>
                      Bundles ({cart.fixedLines.reduce((s, l) => s + l.quantity, 0)} pack{cart.fixedLines.reduce((s, l) => s + l.quantity, 0) !== 1 ? "s" : ""})
                    </span>
                    <span style={{ color: "#1A1A1A" }}>₹{fixedTotal.toLocaleString()}</span>
                  </div>
                )}
                {cart.customBundle && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(26,26,26,0.6)" }}>
                      Custom selection{customDiscountUnlocked ? " (after 10% off)" : ""}
                    </span>
                    <span style={{ color: "#1A1A1A" }}>₹{customEffectiveSubtotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(26,26,26,0.6)" }}>Delivery</span>
                  <span style={{ color: "#1A1A1A" }}>
                    ₹{DEFAULT_DELIVERY_FEE}
                    <span className="text-xs ml-1" style={{ color: "rgba(26,26,26,0.45)" }}>(calculated at next step)</span>
                  </span>
                </div>
                <div
                  className="border-t pt-2 mt-1 flex justify-between items-baseline"
                  style={{ borderColor: "rgba(26,26,26,0.15)" }}
                >
                  <span className="font-bold" style={{ color: "#1A1A1A" }}>Total</span>
                  <span className="font-display text-xl font-bold" style={{ color: "#1A1A1A" }}>
                    ₹{(subtotal + DEFAULT_DELIVERY_FEE).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Confirm Order button ── */}
            <button
              id="confirm-order-btn"
              type="button"
              onClick={handleConfirmOrder}
              className="w-full flex items-center justify-center gap-3 rounded-none py-4 text-base font-semibold transition-all duration-200 hover:opacity-90 shadow-md"
              style={{ background: "#f5945c", color: "#1A1A1A" }}
            >
              Confirm Order →
            </button>
            {customBundleMinError !== null && (
              <div className="mt-4 text-sm" style={{ color: "#dc2626" }}>
                <p>
                  Your custom selection needs at least 5 bottles.
                  <br />
                  Currently {customBundleMinError} selected.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/bundles", { state: { scrollToProducts: true } })}
                  className="mt-2 text-sm font-semibold underline bg-transparent border-none cursor-pointer p-0"
                  style={{ color: "#2d4920" }}
                >
                  Edit custom selection →
                </button>
              </div>
            )}
          </>

        ) : step === 2 ? (
          /* ═══════════════════════════════════════════════════════════════════
             STEP 2 — Delivery Details
             ═══════════════════════════════════════════════════════════════════ */
          <>
            {/* ── Compact summary bar ── */}
            <div
              className="rounded-none px-4 py-3 mb-6 flex items-center justify-between"
              style={{ background: "rgba(197, 216, 48, 0.12)", border: "1px solid rgba(26,26,26,0.1)" }}
            >
              <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                Order: ₹{subtotal.toLocaleString()} + delivery
              </span>
              <ShoppingBag size={16} style={{ color: "#2d4920" }} />
            </div>

            {/* ── Page heading ── */}
            <div className="mb-6">
              <h1 className="font-display text-3xl sm:text-4xl" style={{ color: "#1A1A1A" }}>
                Delivery Details
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
                Where should we deliver your order?
              </p>
            </div>

            {/* ── Delivery form ── */}
            <div
              className="rounded-none shadow-sm p-5 mb-6"
              style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
            >
              <div className="flex flex-col gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="rev-name" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="rev-name"
                    type="text"
                    value={name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => validateField("name")}
                    placeholder="Rahul Sharma"
                    className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.name}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="rev-phone" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="rev-phone"
                    type="tel"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => handleFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onBlur={() => validateField("phone")}
                    placeholder="9876543210"
                    className={`${inputBase} ${errors.phone ? inputError : inputNormal}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.phone}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="rev-email" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Email Address<span className="text-red-500">*</span>
                  </label>
                  <input          
                    id="rev-email"
                    type="email"
                    value={email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => validateField("email")}
                    placeholder="rahul@example.com"
                    className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.email}</p>}
                </div>

                {/* Flat / House No. / Apartment Name */}
                <div>
                  <label htmlFor="rev-address1" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Flat / House No. / Apartment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="rev-address1"
                    type="text"
                    value={addressLine1}
                    onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
                    onBlur={() => validateField("addressLine1")}
                    placeholder="Flat 4B, Green Residency"
                    className={`${inputBase} ${errors.addressLine1 ? inputError : inputNormal}`}
                  />
                  {errors.addressLine1 && <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.addressLine1}</p>}
                </div>

                {/* Street & Area */}
                <div>
                  <label htmlFor="rev-address2" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Street & Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="rev-address2"
                    type="text"
                    value={addressLine2}
                    onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
                    onBlur={() => validateField("addressLine2")}
                    placeholder="12th Main Road, Vijayanagar"
                    className={`${inputBase} ${errors.addressLine2 ? inputError : inputNormal}`}
                  />
                  {errors.addressLine2 && <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.addressLine2}</p>}
                </div>

                {/* Landmark */}
                <div>
                  <label htmlFor="rev-landmark" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Landmark
                  </label>
                  <input
                    id="rev-landmark"
                    type="text"
                    value={landmark}
                    onChange={(e) => handleFieldChange("landmark", e.target.value)}
                    placeholder="Near SBI Bank (optional)"
                    className={`${inputBase} ${inputNormal}`}
                  />
                </div>

                {/* Delivery Pincode */}
                <div>
                  <label htmlFor="rev-pincode" className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                    Delivery Pincode <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
                    Currently delivering within Bengaluru only
                  </p>
                  <input
                    id="rev-pincode"
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => handleFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onBlur={() => validateField("pincode")}
                    placeholder="560001"
                    className={`${inputBase} ${errors.pincode ? inputError : inputNormal}`}
                  />
                  {errors.pincode && <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.pincode}</p>}
                </div>

                <p className="text-xs" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
                  <span className="text-red-500">*</span> Required fields
                </p>

                {/* Honeypot — hidden from real users */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ position: "absolute", opacity: 0, height: 0, width: 0, overflow: "hidden" }}
                />
              </div>
            </div>

            {/* ── Continue button ── */}
            <button
              id="continue-to-step3-btn"
              type="button"
              onClick={() => { void handleContinueToStep3(); }}
              disabled={geocoding}
              className={[
                "w-full flex items-center justify-center gap-3 rounded-none py-4 text-base font-semibold transition-all duration-200",
                geocoding ? "pointer-events-none opacity-70" : "hover:opacity-90 shadow-md",
              ].join(" ")}
              style={{ background: "#f5945c", color: "#1A1A1A" }}
            >
              {geocoding ? "Calculating delivery..." : "Continue →"}
            </button>
          </>

        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             STEP 3 — Final Confirmation + Payment
             ═══════════════════════════════════════════════════════════════════ */
          <>
            {/* ── Page heading ── */}
            <div className="mb-6">
              <h1 className="font-display text-3xl sm:text-4xl" style={{ color: "#1A1A1A" }}>
                Confirm & Pay
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
                Review everything below, then pay to confirm your order.
              </p>
            </div>

            {/* ── Order summary (compact) ── */}
            <div
              className="rounded-none shadow-sm mb-6 overflow-hidden"
              style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
            >
              <div
                className="flex items-center gap-2.5 p-5 border-b"
                style={{ borderColor: "rgba(26,26,26,0.15)" }}
              >
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(197, 216, 48, 0.15)" }}
                >
                  <ShoppingBag size={17} style={{ color: "#2d4920" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                  Order Summary
                </p>
              </div>

              <div className="px-5 py-4 flex flex-col gap-4">
                {/* Fixed bundle lines */}
                {cart.fixedLines.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {cart.fixedLines.map((line) => (
                      <div key={line.bundleType} className="flex justify-between text-sm">
                        <span style={{ color: "#1A1A1A" }}>
                          {line.displayName} × {line.quantity}
                        </span>
                        <span className="font-semibold" style={{ color: "#1A1A1A" }}>
                          ₹{(line.unitPrice * line.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom bundle */}
                {cart.customBundle && cart.customBundle.items.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(26,26,26,0.45)" }}>
                      Custom Selection
                    </p>
                    {cart.customBundle.items.map((item) => (
                      <div key={item.slug} className="flex justify-between text-sm pl-3">
                        <span style={{ color: "rgba(26,26,26,0.7)" }}>
                          {item.name} × {item.quantity}
                        </span>
                        <span style={{ color: "#1A1A1A" }}>
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {customDiscountUnlocked && (
                      <div className="flex justify-between text-sm pl-3">
                        <span className="font-medium" style={{ color: "#2d4920" }}>10% discount</span>
                        <span className="font-semibold" style={{ color: "#2d4920" }}>−₹{customDiscount}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtotal */}
                <div
                  className="flex justify-between text-sm border-t pt-2"
                  style={{ borderColor: "rgba(26,26,26,0.08)" }}
                >
                  <span style={{ color: "rgba(26,26,26,0.6)" }}>Subtotal</span>
                  <span className="font-semibold" style={{ color: "#1A1A1A" }}>₹{subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── Delivery section ── */}
            <div
              className="rounded-none shadow-sm p-5 mb-6"
              style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
            >
              <p className="font-semibold text-sm mb-3" style={{ color: "#1A1A1A" }}>
                Delivery Address
              </p>
              <div className="text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.7)" }}>
                <p>{addressLine1}</p>
                <p>{addressLine2}</p>
                {landmark.trim() && <p>{landmark}</p>}
                <p>{pincode}</p>
              </div>

              <div className="mt-4 flex justify-between text-sm">
                <span style={{ color: "rgba(26,26,26,0.6)" }}>Delivery fee</span>
                <span className="font-semibold" style={{ color: "#1A1A1A" }}>₹{currentDeliveryFee}</span>
              </div>

              {geocodeResult.geocodeStatus === "failed" && (
                <p className="text-xs mt-2 px-3 py-2 rounded-none" style={{ background: "rgba(254, 199, 111, 0.2)", color: "rgba(26,26,26,0.7)" }}>
                  We couldn't verify your address automatically. Our team will confirm delivery details with you before dispatch.
                </p>
              )}
            </div>

            {/* ── Total ── */}
            <div
              className="rounded-none shadow-sm p-5 mb-6"
              style={{ background: "rgba(197, 216, 48, 0.08)", border: "1px solid rgba(26,26,26,0.15)" }}
            >
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-base" style={{ color: "#1A1A1A" }}>Total</span>
                <span className="font-display text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                  ₹{orderTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── Payment error ── */}
            {paymentError && (
              <div
                className="mb-4 rounded-none px-4 py-3 text-sm flex items-start justify-between gap-3"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#dc2626",
                }}
              >
                <span>⚠️ {paymentError}</span>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="flex-shrink-0 transition-opacity hover:opacity-80"
                  style={{ color: "#dc2626" }}
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── Pay button ── */}
            <button
              id="pay-order-btn"
              onClick={() => { void handlePay(); }}
              disabled={paying}
              className={[
                "w-full flex items-center justify-center gap-3 rounded-none py-4 text-base font-semibold transition-all duration-200",
                paying ? "pointer-events-none opacity-70" : "hover:opacity-90 shadow-md",
              ].join(" ")}
              style={{ background: "#f5945c", color: "#1A1A1A" }}
            >
              {paying ? "Processing…" : `Pay ₹${orderTotal.toLocaleString()} →`}
            </button>
            <p className="text-center text-xs mt-3" style={{ color: "rgba(41, 40, 39, 0.6)" }}>
              Secured by Razorpay · UPI, cards &amp; netbanking accepted
            </p>
          </>
        )}
      </main>

      {/* ── Inline styles for stepper buttons ── */}
      <style>{`
        .rev-qty-selector {
          display: flex;
          align-items: center;
          border: 1.5px solid #000000;
          border-radius: 0;
          overflow: hidden;
        }
        .rev-qty-btn {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1E331E;
          transition: background-color 0.15s;
          flex-shrink: 0;
        }
        .rev-qty-btn:hover:not(:disabled) { background-color: #F5F5F5; }
        .rev-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .rev-qty-count {
          min-width: 28px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1E331E;
          border-left: 1.5px solid #000000;
          border-right: 1.5px solid #000000;
          line-height: 30px;
        }
      `}</style>
    </div>
  );
};

export default ReviewPage;

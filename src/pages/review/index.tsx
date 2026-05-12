import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Calendar, X, CheckCircle2, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Helper: stamp switchToSub flag and navigate to /subscription
const switchToSubscription = (
  cartItems: { id: string; name: string; quantity: number; price: number }[],
  navigate: ReturnType<typeof useNavigate>
) => {
  localStorage.setItem(
    "quartermelon_cart",
    JSON.stringify({ type: "bundle", items: cartItems, switchToSub: true })
  );
  navigate("/subscription");
};

// ─── Constants ───────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "916364471003"; // 🔴 Replace with real number
const BOTTLE_PRICE = 60; // always the anchor price

const BUNDLE_CONFIG = {
  size: 6,
  originalTotal: 360,  // 6 × ₹60
  discount: 60,
  finalPrice: 300,
};

const SUBSCRIPTION_CONFIG = {
  bottles: 30,
  originalTotal: 1800, // 30 × ₹60
  planPrice: 1500,
  loyaltyDiscount: 100,
  finalPrice: 1400,
  saving: 400,         // 1800 - 1400
};
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Cart {
  type: "bundle" | "subscription";
  items: CartItem[];
  savedAt?: number;
}

interface FormErrors {
  name?: string;
  phone?: string;
  pincode?: string;
  address?: string;
}

interface FormFields {
  name: string;
  phone: string;
  pincode: string;
  address: string;
}

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.882l6.198-1.625A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.802 9.802 0 0 1-5.006-1.374l-.359-.214-3.68.965.982-3.594-.234-.369A9.79 9.79 0 0 1 2.182 12C2.182 6.579 6.579 2.182 12 2.182S21.818 6.579 21.818 12 17.421 21.818 12 21.818z" />
  </svg>
);

// ─── Upsell Card (bundle-only, dismissible) ───────────────────────────────────
const UpsellCard = ({ onDismiss }: { onDismiss: () => void }) => (
  <div
    className="relative rounded-2xl p-5 mb-6 shadow-sm border-l-4 transition-all duration-200"
    style={{
      background: "rgba(254, 199, 111, 0.2)",
      borderLeftColor: "#fec76f",
    }}
  >
    {/* Dismiss */}
    <button
      onClick={onDismiss}
      aria-label="Dismiss upsell"
      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
      style={{ color: "#1A1A1A", background: "transparent" }}
    >
      <X size={15} />
    </button>

    <div className="pr-6">
      <p className="text-base font-semibold mb-1" style={{ color: "#1A1A1A" }}>
         Subscribe & Never Miss Your Daily Juice!
      </p>
      <p className="text-sm mb-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
        Get 30 bottles/month for{" "}
        <span className="font-bold">₹{SUBSCRIPTION_CONFIG.finalPrice.toLocaleString()}</span>
      </p>
      <p className="text-sm mb-4" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
        Save ₹{SUBSCRIPTION_CONFIG.saving} vs buying at regular ₹{BOTTLE_PRICE}/bottle price
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to="/subscription"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold px-4 py-2 hover:opacity-90 transition-opacity"
          style={{ background: "#f5945c", color: "#1A1A1A" }}
        >
          Subscribe Now
          <ArrowRight size={14} />
        </Link>
        <button
          onClick={onDismiss}
          className="text-sm font-medium transition-colors underline-offset-2 hover:underline"
          style={{ color: "rgba(26, 26, 26, 0.6)" }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  </div>
);

// ─── Order Summary — Bundle ───────────────────────────────────────────────────
const BundleSummary = ({ items }: { items: CartItem[] }) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div
      className="rounded-2xl shadow-sm mb-6 overflow-hidden"
      style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 border-b"
        style={{ borderColor: "rgba(26,26,26,0.15)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(197, 216, 48, 0.15)" }}
          >
            <ShoppingBag size={17} style={{ color: "#2d4920" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>Your Bundle</p>
          </div>
        </div>
        <p className="text-xs text-right" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
          6 bottles · 180ml each
        </p>
      </div>

      {/* Items */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {items.filter((i) => i.quantity > 0).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span
              className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
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

      {/* Pricing breakdown */}
      <div
        className="px-5 pb-5 border-t pt-4 flex flex-col gap-2"
        style={{ borderColor: "rgba(26,26,26,0.15)" }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: "rgba(26, 26, 26, 0.6)" }}>Subtotal</span>
          <span className="text-gray-400 line-through">₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium" style={{ color: "#2d4920" }}>
            Bundle discount (auto-applied) 
          </span>
          <span className="font-semibold" style={{ color: "#2d4920" }}>
            −₹{BUNDLE_CONFIG.discount}
          </span>
        </div>
        <div
          className="border-t pt-2 mt-1 flex justify-between"
          style={{ borderColor: "rgba(26,26,26,0.15)" }}
        >
          <span className="font-bold" style={{ color: "#1A1A1A" }}>Total</span>
          <span className="font-display text-xl font-bold" style={{ color: "#1A1A1A" }}>
            ₹{BUNDLE_CONFIG.finalPrice.toLocaleString()}
          </span>
        </div>
        <div
          className="mt-2 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5"
          style={{
            background: "rgba(254, 199, 111, 0.25)",
            color: "#1A1A1A",
            borderLeft: "4px solid #fec76f",
          }}
        >
           You're saving ₹{BUNDLE_CONFIG.discount} on this order!
        </div>
      </div>
    </div>
  );
};

// ─── Order Summary — Subscription ────────────────────────────────────────────
const SubscriptionSummary = ({ items }: { items: CartItem[] }) => {
  const planDiscount = SUBSCRIPTION_CONFIG.originalTotal - SUBSCRIPTION_CONFIG.planPrice;

  return (
    <div
      className="rounded-2xl shadow-sm mb-6 overflow-hidden"
      style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 border-b"
        style={{ borderColor: "rgba(26,26,26,0.15)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(197, 216, 48, 0.15)" }}
          >
            <Calendar size={17} style={{ color: "#2d4920" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
              Monthly Subscription
            </p>
          </div>
        </div>
        <p className="text-xs text-right" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
          30 bottles · every month
        </p>
      </div>

      {/* Items */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {items.filter((i) => i.quantity > 0).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span
              className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
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

      {/* Pricing breakdown */}
      <div
        className="px-5 pb-5 border-t pt-4 flex flex-col gap-2"
        style={{ borderColor: "rgba(26,26,26,0.15)" }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            Original price (30 × ₹{BOTTLE_PRICE})
          </span>
          <span className="text-gray-400 line-through">
            ₹{SUBSCRIPTION_CONFIG.originalTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium" style={{ color: "#2d4920" }}>
            Plan discount
          </span>
          <span className="font-semibold" style={{ color: "#2d4920" }}>
            −₹{planDiscount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium" style={{ color: "#2d4920" }}>
            Loyalty discount (auto-applied) 
          </span>
          <span className="font-semibold" style={{ color: "#2d4920" }}>
            −₹{SUBSCRIPTION_CONFIG.loyaltyDiscount}
          </span>
        </div>
        <div
          className="border-t pt-2 mt-1 flex justify-between items-baseline"
          style={{ borderColor: "rgba(26,26,26,0.15)" }}
        >
          <span className="font-bold" style={{ color: "#1A1A1A" }}>Total</span>
          <span className="font-display text-xl font-bold" style={{ color: "#1A1A1A" }}>
            ₹{SUBSCRIPTION_CONFIG.finalPrice.toLocaleString()}
            <span
              className="text-sm font-sans font-normal"
              style={{ color: "rgba(26, 26, 26, 0.6)" }}
            >
              /month
            </span>
          </span>
        </div>
        <div
          className="mt-2 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5"
          style={{
            background: "rgba(254, 199, 111, 0.25)",
            color: "#1A1A1A",
            borderLeft: "4px solid #fec76f",
          }}
        >
           You're saving ₹{SUBSCRIPTION_CONFIG.saving}/month vs regular price!
        </div>
        <p className="text-xs italic mt-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
          We'll reach out on WhatsApp each month to confirm your delivery.
        </p>
      </div>
    </div>
  );
};

// ─── Delivery Details Form ────────────────────────────────────────────────────
interface DeliveryFormProps {
  name: string;
  phone: string;
  pincode: string;
  address: string;
  honeypot: string;
  errors: FormErrors;
  onChange: (field: keyof FormFields, value: string) => void;
  onHoneypotChange: (value: string) => void;
}

const DeliveryForm = ({
  name,
  phone,
  pincode,
  address,
  honeypot,
  errors,
  onChange,
  onHoneypotChange,
}: DeliveryFormProps) => {
  const inputBase =
    "w-full rounded-xl border bg-[#fefefe] px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[rgba(26,26,26,0.6)] outline-none transition-colors";
  const inputNormal =
    "border-[rgba(26,26,26,0.2)] focus:border-[#2d4920] focus:ring-2 focus:ring-[rgba(197,216,48,0.2)]";
  const inputError = "border-red-400 ring-1 ring-red-400";

  return (
    <div
      className="rounded-2xl shadow-sm p-5 mb-6"
      style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
    >
      <p className="font-semibold text-base mb-5" style={{ color: "#1A1A1A" }}>
        Delivery Details
      </p>
      <div className="flex flex-col gap-4">

        {/* Name */}
        <div>
          <label
            htmlFor="rev-name"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#1A1A1A" }}
          >
            Full Name
          </label>
          <input
            id="rev-name"
            type="text"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Rahul Sharma"
            className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="rev-phone"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#1A1A1A" }}
          >
            Phone Number
          </label>
          <input
            id="rev-phone"
            type="tel"
            value={phone}
            maxLength={10}
            onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="9876543210"
            className={`${inputBase} ${errors.phone ? inputError : inputNormal}`}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.phone}</p>
          )}
        </div>

        {/* Pincode */}
        <div>
          <label
            htmlFor="rev-pincode"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#1A1A1A" }}
          >
            Delivery Pincode
          </label>
          <p className="text-xs mb-1.5" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            Currently delivering within Bengaluru only
          </p>
          <input
            id="rev-pincode"
            type="text"
            value={pincode}
            maxLength={6}
            onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="560001"
            className={`${inputBase} ${errors.pincode ? inputError : inputNormal}`}
          />
          {errors.pincode && (
            <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.pincode}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="rev-address"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#1A1A1A" }}
          >
            Delivery Address
          </label>
          <textarea
            id="rev-address"
            value={address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Flat 4B, Green Apartments, HSR Layout, Bengaluru - 560102"
            rows={3}
            className={`${inputBase} resize-none ${errors.address ? inputError : inputNormal}`}
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1.5">⚠️ {errors.address}</p>
          )}
        </div>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => onHoneypotChange(e.target.value)}
          style={{ position: "absolute", opacity: 0, height: 0, width: 0, overflow: "hidden" }}
        />
      </div>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────
const ReviewPage = () => {
  const navigate = useNavigate();

  // ── State ──
  const [orderId, setOrderId] = useState("");
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartExpired, setCartExpired] = useState(false);
  const [incompleteCart, setIncompleteCart] = useState(false);
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);
  const [showRecentOrderWarning, setShowRecentOrderWarning] = useState(true);
  const [showUpsell, setShowUpsell] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionDurationMonths, setSubscriptionDurationMonths] = useState(1);
  const [subscriptionDateError, setSubscriptionDateError] = useState("");

  useEffect(() => {
    setOrderId(`QM-${Date.now().toString(36).toUpperCase()}`);
  }, []);

  useEffect(() => {
    const readCart = () => {
      try {
        const raw = JSON.parse(localStorage.getItem("quartermelon_cart") || "{}") as Partial<Cart>;

        if (!raw.type || !(raw.items as CartItem[] | undefined)?.length) {
          setCart(null);
          setIncompleteCart(false);
          return;
        }

        if (raw.savedAt && Date.now() - raw.savedAt > 3600000) {
          setCartExpired(true);
          setIncompleteCart(false);
          return;
        }

        const totalSelected = (raw.items as CartItem[]).reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0
        );
        const required = raw.type === "bundle" ? 6 : 30;
        setIncompleteCart(totalSelected !== required);
        setCart({ type: raw.type, items: raw.items as CartItem[] });
      } catch {
        setCart(null);
        setIncompleteCart(false);
      }
    };

    readCart();
    window.addEventListener("storage", readCart);
    return () => window.removeEventListener("storage", readCart);
  }, []);

  useEffect(() => {
    const lastOrderTime = Number(localStorage.getItem("qm_last_order_time") || 0);
    if (lastOrderTime && Date.now() - lastOrderTime < 180000) {
      setAlreadyOrdered(true);
    }
  }, []);

  const handleFieldChange = (field: keyof FormFields, value: string) => {
    if (field === "name") setName(value);
    if (field === "phone") setPhone(value);
    if (field === "pincode") setPincode(value);
    if (field === "address") setAddress(value);
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!/^[6-9]\d{9}$/.test(phone.trim()))
      errs.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!/^\d{6}$/.test(pincode.trim())) {
      errs.pincode = "Enter a valid 6-digit pincode";
    } else if (!pincode.trim().startsWith("560")) {
      errs.pincode = "Sorry, we currently deliver within Bengaluru only";
    }
    if (!address.trim() || address.trim().length < 10)
      errs.address = "Please enter a complete delivery address.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const formatReadableDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getSubscriptionEndDate = (startDate: string, months: number): Date | null => {
    if (!startDate) return null;
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + months);
    return end;
  };

  const formattedSubscriptionStartDate = subscriptionStartDate
    ? formatReadableDate(new Date(subscriptionStartDate))
    : "";
  const subscriptionEndDate = getSubscriptionEndDate(
    subscriptionStartDate,
    subscriptionDurationMonths
  );
  const formattedSubscriptionEndDate = subscriptionEndDate
    ? formatReadableDate(subscriptionEndDate)
    : "";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowMin = tomorrow.toISOString().split("T")[0];

  const buildBundleMessage = () => {
    if (!cart) return "";
    const lines = cart.items
      .filter((i) => i.quantity > 0)
      .map((i) => `- ${i.quantity}x ${i.name} (₹${i.price * i.quantity})`)
      .join("\n");

    return `[REF] Order Ref: ${orderId}
 New Bundle Order — Quartermelon

 Name: ${name.trim()}
 Phone: ${phone.trim()}
 Address: ${address.trim()}
 Pincode: ${pincode.trim()}

 Bundle: 6-Pack
 Items:
${lines}

 Original: ₹${BUNDLE_CONFIG.originalTotal}
 Discount: -₹${BUNDLE_CONFIG.discount}
 >>Total: ₹${BUNDLE_CONFIG.finalPrice}

Please confirm my order!`;
  };

  const buildSubscriptionMessage = () => {
    if (!cart) return "";
    const lines = cart.items
      .filter((i) => i.quantity > 0)
      .map((i) => `- ${i.quantity}x ${i.name}`)
      .join("\n");

    const planDiscount = SUBSCRIPTION_CONFIG.originalTotal - SUBSCRIPTION_CONFIG.planPrice;

    return `[REF] Order Ref: ${orderId}
   New Subscription — Quartermelon

 Name: ${name.trim()}
 Phone: ${phone.trim()}
 Address: ${address.trim()}
 Pincode: ${pincode.trim()}

 Plan: Monthly Wellness Plan
 Items:
${lines}

 Start Date: ${formattedSubscriptionStartDate}
 End Date: ${formattedSubscriptionEndDate}
 Duration: ${subscriptionDurationMonths} Month(s)

 Original: ₹${SUBSCRIPTION_CONFIG.originalTotal.toLocaleString()}
 Plan discount: -₹${planDiscount}
 Loyalty discount: -₹${SUBSCRIPTION_CONFIG.loyaltyDiscount}
 >>Total: ₹${SUBSCRIPTION_CONFIG.finalPrice.toLocaleString()}/month

Please confirm my subscription!`;
  };

  const handleConfirm = () => {
    const totalSelected = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const required = cart.type === "bundle" ? 6 : 30;
    if (totalSelected !== required) {
      alert(`Please select exactly ${required} bottles before confirming.`);
      return;
    }

    if (honeypot.trim()) return;

    const attemptWindowMs = 60000;
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
      alert("Too many attempts. Please wait a few minutes and try again.");
      return;
    }
    attempts.count += 1;
    localStorage.setItem("qm_submit_attempts", JSON.stringify(attempts));

    const lastOrderTime = Number(localStorage.getItem("qm_last_order_time") || 0);
    if (lastOrderTime && Date.now() - lastOrderTime < 180000) {
      alert("You placed an order recently. Please wait a few minutes before trying again.");
      return;
    }
    if (submitted) return;
    if (!validate()) return;
    if (cart.type === "subscription" && !subscriptionStartDate) {
      setSubscriptionDateError("Please select a start date.");
      return;
    }

    setSubmitted(true);
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "purchase", {
        event_category: "order",
        event_label: cart.type,
        value: cart.type === "bundle" ? 300 : 1500,
        currency: "INR",
      });
    }
    localStorage.removeItem("qm_submit_attempts");
    localStorage.setItem("qm_last_order_time", String(Date.now()));

    const itemsText = cart.items
      .filter((i) => i.quantity > 0)
      .map((i) => `${i.name} x${i.quantity}`)
      .join(", ");
    const isSubscription = cart.type === "subscription";
    const total = isSubscription
      ? SUBSCRIPTION_CONFIG.finalPrice
      : BUNDLE_CONFIG.finalPrice;

    try {
      void fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          type: "order",
          orderId,
          name: name.trim(),
          phone: phone.trim(),
          pincode: pincode.trim(),
          address: address.trim(),
          cartType: cart.type,
          items: itemsText,
          startDate: isSubscription ? formattedSubscriptionStartDate : "",
          endDate: isSubscription ? formattedSubscriptionEndDate : "",
          duration: isSubscription
            ? `${subscriptionDurationMonths} Month${subscriptionDurationMonths > 1 ? "s" : ""}`
            : "",
          total,
          status: "New",
        }),
      }).catch((err) => {
        console.error("Order sheet logging failed:", err);
      });
    } catch (err) {
      console.error("Order sheet logging failed:", err);
    }

    const message =
      cart.type === "bundle" ? buildBundleMessage() : buildSubscriptionMessage();

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  if (cartExpired) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#fefefe", color: "#1A1A1A" }}
      >
        <div className="container max-w-xl text-center">
          <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: "#1A1A1A" }}>
            Session expired
          </h1>
          <p className="text-sm sm:text-base mb-6" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            Your cart session has expired for freshness. Please rebuild your order to continue.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#f5945c", color: "#1A1A1A" }}
          >
            Go to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fefefe", color: "#1A1A1A" }}>
        <div className="container max-w-xl text-center">
          <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: "#1A1A1A" }}>
            Your box is empty.
          </h1>
          <p className="text-sm sm:text-base mb-6" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            Go back and pick your items.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#f5945c", color: "#1A1A1A" }}
          >
            Go to Products
          </Link>
        </div>
      </div>
    );
  }

  if (incompleteCart) {
    const required = cart.type === "bundle" ? 6 : 30;
    const totalSelected = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fefefe", color: "#1A1A1A" }}>
        <div className="container max-w-xl text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "rgba(26, 26, 26, 0.08)" }}>
            <ShoppingBag size={30} style={{ color: "#1A1A1A" }} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mb-3" style={{ color: "#1A1A1A" }}>
            Your box isn&apos;t complete yet
          </h1>
          <p className="text-sm sm:text-base mb-4" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            {cart.type === "bundle"
              ? "You need 6 bottles to place an order. Go back and finish picking your flavours."
              : "You need 30 bottles to place an order. Go back and finish picking your flavours."}
          </p>
          <p className="text-base font-bold mb-6" style={{ color: "#1A1A1A" }}>
            Selected: {totalSelected} of {required}
          </p>
          <Link
            to={cart.type === "bundle" ? "/bundles" : "/subscription"}
            state={{ scrollToProducts: true }}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#c5d830", color: "#1A1A1A" }}
          >
            Finish Building
          </Link>
        </div>
      </div>
    );
  }

  const isBundle = cart.type === "bundle";

  return (
    <div
      className="min-h-screen"
      style={{ background: "#fefefe", color: "#1A1A1A" }}
    >
      {/* ── Minimal top nav ── */}
      <div
        className="border-b backdrop-blur-sm sticky top-0 z-30"
        style={{
          background: "rgba(254,254,254,0.85)",
          borderBottomColor: "rgba(26,26,26,0.1)",
        }}
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
  ) : (
    <>
      <Link
        to={isBundle ? "/bundles" : "/subscription"}
        state={{ scrollToProducts: true }}
        className="text-sm transition-colors flex items-center gap-1"
        style={{ color: "rgba(26, 26, 26, 0.6)" }}
      >
        ← {isBundle ? "Edit Bundle" : "Edit Subscription"}
      </Link>
      {isBundle && (
        <button
          onClick={() => switchToSubscription(cart.items, navigate)}
          className="text-sm transition-colors flex items-center gap-1"
          style={{ color: "rgba(26, 26, 26, 0.6)" }}
        >
          Switch to Subscription →
        </button>
      )}
    </>
  )}
</div>
        {/* <div className="container max-w-2xl py-3 flex items-center justify-between">
          <Link
            to={isBundle ? "/bundles" : "/subscription"}
            state={{ scrollToProducts: true }}
            className="text-sm transition-colors flex items-center gap-1"
            style={{ color: "rgba(26, 26, 26, 0.6)" }}
          >
            ← {isBundle ? "Edit Bundle" : "Edit Subscription"}
          </Link>
          {isBundle && (
            <button
              onClick={() => switchToSubscription(cart.items, navigate)}
              className="text-sm transition-colors flex items-center gap-1"
              style={{ color: "rgba(26, 26, 26, 0.6)" }}
            >
              Switch to Subscription →
            </button>
          )}
        </div> */}
      </div>

      {/* ── Page content ── */}
      <main className="container max-w-2xl py-8 pb-12">
        {submitted ? (
          <div
            className="rounded-2xl shadow-sm p-8 text-center"
            style={{ background: "rgba(197, 216, 48, 0.15)", border: "1px solid rgba(26,26,26,0.15)" }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5"
              style={{ background: "rgba(197, 216, 48, 0.15)" }}
            >
              <CheckCircle2 size={44} style={{ color: "#1A1A1A" }} />
            </div>
            <h2 className="font-display text-3xl mb-2" style={{ color: "#1A1A1A" }}>
              Order sent
            </h2>
            <p className="text-sm mb-3" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
              Your reference ID
            </p>
            <p
              className="text-lg sm:text-xl font-bold font-mono mb-3"
              style={{
                color: "#1A1A1A",
                background: "rgba(197, 216, 48, 0.15)",
              }}
            >
              {orderId}
            </p>
            <p className="text-sm mb-2" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
              Please screenshot this for reference.
            </p>
            <p className="text-sm mb-1" style={{ color: "#1A1A1A" }}>
              We'll confirm your order on WhatsApp within 2 hours
            </p>
          </div>
        ) : (
          <>
        {alreadyOrdered && showRecentOrderWarning && (
          <div
            className="mb-6 rounded-xl border px-4 py-3 flex items-start justify-between gap-3"
            style={{
              borderColor: "rgba(26,26,26,0.15)",
              background: "rgba(254, 199, 111, 0.3)",
            }}
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

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl" style={{ color: "#1A1A1A" }}>
            {isBundle ? "Review Your Order" : "Review Your Subscription"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
            {isBundle
              ? "Double-check your bundle, then confirm on WhatsApp."
              : "One last look before subscribing."}
          </p>
        </div>

        {/* ── Section 1: Upsell (bundle only) ── */}
        {isBundle && showUpsell && (
          <UpsellCard onDismiss={() => setShowUpsell(false)} />
        )}

        {/* ── Section 2: Order Summary ── */}
        {isBundle ? (
          <BundleSummary items={cart.items} />
        ) : (
          <SubscriptionSummary items={cart.items} />
        )}

        {!isBundle && (
          <div
            className="rounded-2xl shadow-sm p-5 mb-6"
            style={{ background: "#fefefe", border: "1px solid rgba(26,26,26,0.15)" }}
          >
            <p className="font-semibold text-base mb-5" style={{ color: "#1A1A1A" }}>
              Subscription Dates
            </p>

            <div className="mb-5">
              <label
                htmlFor="rev-start-date"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Start Date
              </label>
              <input
                id="rev-start-date"
                type="date"
                min={tomorrowMin}
                value={subscriptionStartDate}
                onChange={(e) => {
                  setSubscriptionStartDate(e.target.value);
                  if (subscriptionDateError) setSubscriptionDateError("");
                }}
                className="w-full rounded-xl border bg-[#fefefe] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors border-[rgba(26,26,26,0.2)] focus:border-[#2d4920] focus:ring-2 focus:ring-[rgba(197,216,48,0.2)]"
              />
              {subscriptionDateError && (
                <p className="text-red-500 text-xs mt-1.5">⚠️ {subscriptionDateError}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>
                Duration
              </p>
              <div className="flex gap-2 flex-wrap">
                {[1, 3, 6].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setSubscriptionDurationMonths(months)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold border transition-colors",
                      subscriptionDurationMonths === months
                        ? "bg-[#f5945c] text-[#1A1A1A] border-[#f5945c]"
                        : "bg-[#fefefe] text-[#1A1A1A] border-[rgba(26,26,26,0.2)] hover:border-[#2d4920]",
                    ].join(" ")}
                  >
                    {months} Month{months > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm" style={{ color: "rgba(26, 26, 26, 0.6)" }}>
              End Date:{" "}
              <span className="font-semibold" style={{ color: "#1A1A1A" }}>
                {formattedSubscriptionEndDate || "—"}
              </span>
            </p>
          </div>
        )}

        {/* ── Section 3: Delivery Details ── */}
        <DeliveryForm
          name={name}
          phone={phone}
          pincode={pincode}
          address={address}
          honeypot={honeypot}
          errors={errors}
          onChange={handleFieldChange}
          onHoneypotChange={setHoneypot}
        />

        {/* ── Section 4: Confirm Button ── */}
        <div>
          <button
            id="confirm-order-btn"
            onClick={handleConfirm}
            disabled={submitted}
            className={[
              "w-full flex items-center justify-center gap-3 rounded-xl py-4 text-base font-semibold transition-all duration-200",
              submitted
                ? "pointer-events-none"
                : "hover:opacity-90 shadow-md",
            ].join(" ")}
            style={{
              background: "#f5945c",
              color: "#1A1A1A",
            }}
          >
            {submitted ? (
              <>
                <CheckCircle2 size={20} />
                Sent on WhatsApp! ✓
              </>
            ) : (
              <>
                <WhatsAppIcon />
                {isBundle ? "Confirm Order on WhatsApp →" : "Subscribe via WhatsApp →"}
              </>
            )}
          </button>
          <p className="text-center text-xs mt-3" style={{ color: "rgba(41, 40, 39, 0.6)" }}>
            You'll be redirected to WhatsApp with your complete order details.
          </p>
        </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ReviewPage;

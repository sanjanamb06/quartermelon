// ─── Cart Data Types ──────────────────────────────────────────────────────────
// These types define the new unified cart shape stored in localStorage
// under the key "quartermelon_cart".
//
// Shape overview:
//   {
//     fixedLines: FixedBundleLine[],   // one entry per pre-set bundle type selected
//     customBundle: CustomBundle | null, // the "Make Your Own" selection, or null
//     savedAt: number,                  // Unix ms timestamp for freshness checks
//   }

/** The three pre-set bundle identifiers. */
export type FixedBundleType = "all-juice" | "all-shots" | "all-beverages";

/** One line in the fixed-bundle section of the cart. */
export interface FixedBundleLine {
  /** Which pre-set bundle this line refers to. */
  bundleType: FixedBundleType;
  /** Human-readable display name (e.g. "All Juice Bundle"). */
  displayName: string;
  /** How many of this bundle the customer has selected (>= 1). */
  quantity: number;
  /** Fixed unit price in INR (349, 349, or 449). */
  unitPrice: number;
}

/** A single product item inside the custom bundle. */
export interface CustomBundleItem {
  /** Product slug (matches Product.slug in data/products.ts). */
  slug: string;
  /** Human-readable product name. */
  name: string;
  /** Number of this product in the custom bundle (>= 1). */
  quantity: number;
  /** Per-unit price in INR at time of selection. */
  price: number;
}

/** The "Make Your Own" custom bundle (Bundle 4). */
export interface CustomBundle {
  /** Individual product items chosen by the customer. */
  items: CustomBundleItem[];
  /** Sum of (item.price x item.quantity) across all items. */
  subtotal: number;
  /** True when subtotal >= 999, which triggers the 10% discount on this bundle. */
  discountUnlocked: boolean;
}

/** The full cart object stored in localStorage as "quartermelon_cart". */
export interface QuartermelonCart {
  /** Selected pre-set bundles. Multiple types can coexist; same type accumulates quantity. */
  fixedLines: FixedBundleLine[];
  /**
   * The custom "Make Your Own" bundle, or null when the customer has not
   * selected any custom items (or cleared them all out).
   */
  customBundle: CustomBundle | null;
  /**
   * Unix-millisecond timestamp of when this cart was last saved.
   * Used by the review page to enforce a 1-hour freshness window.
   */
  savedAt: number;
}

// ─── Pre-set Bundle Definitions (static reference) ───────────────────────────
// These describe what is INSIDE each pre-set bundle.
// They are NOT stored per-order in localStorage; they are a static lookup
// referenced by the /packages page (to display contents) and the review page
// (to render bundle line items).

export interface PresetBundleItem {
  slug: string;
  name: string;
  quantity: number;
}

export interface PresetBundleDefinition {
  type: FixedBundleType;
  displayName: string;
  unitPrice: number;
  items: PresetBundleItem[];
}

export const PRESET_BUNDLES: Record<FixedBundleType, PresetBundleDefinition> = {
  "all-juice": {
    type: "all-juice",
    displayName: "All Juice Bundle",
    unitPrice: 349,
    items: [
      { slug: "watermelon-sabja", name: "Watermelon + Sabja",      quantity: 1 },
      { slug: "lemonade-purple",  name: "Purple Lemonade",         quantity: 2 },
      { slug: "pineapple-sabja",  name: "Pineapple + Sabja",       quantity: 1 },
      { slug: "pineapple-gond",   name: "Pineapple + Gond Katira", quantity: 1 },
    ],
  },
  "all-shots": {
    type: "all-shots",
    displayName: "All Shots Bundle",
    unitPrice: 349,
    items: [
      { slug: "turmeric-shot", name: "Turmeric Shot", quantity: 4 },
      { slug: "abc-shot",      name: "ABC Shot",       quantity: 4 },
    ],
  },
  "all-beverages": {
    type: "all-beverages",
    displayName: "All Beverages Bundle",
    unitPrice: 449,
    items: [
      { slug: "watermelon-sabja", name: "Watermelon + Sabja",      quantity: 1 },
      { slug: "lemonade-purple",  name: "Purple Lemonade",         quantity: 2 },
      { slug: "pineapple-sabja",  name: "Pineapple + Sabja",       quantity: 1 },
      { slug: "pineapple-gond",   name: "Pineapple + Gond Katira", quantity: 1 },
      { slug: "abc-shot",         name: "ABC Shot",                quantity: 1 },
      { slug: "turmeric-shot",    name: "Turmeric Shot",           quantity: 1 },
    ],
  },
};

// ─── Cart Helpers ─────────────────────────────────────────────────────────────

/** The localStorage key used across the whole app. */
export const CART_KEY = "quartermelon_cart";

/** One-hour freshness window in milliseconds (mirrors existing review-page logic). */
export const CART_TTL_MS = 3_600_000;

/**
 * Reads the current cart from localStorage.
 * Returns null if the key is absent, unparseable, or the savedAt timestamp
 * is older than CART_TTL_MS.
 */
export function readCart(): QuartermelonCart | null {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuartermelonCart>;

    // Basic shape guard — new cart shape requires fixedLines array
    if (!Array.isArray(parsed.fixedLines)) return null;
    if (typeof parsed.savedAt !== "number") return null;

    // Freshness check
    if (Date.now() - parsed.savedAt > CART_TTL_MS) return null;

    return {
      fixedLines: parsed.fixedLines,
      customBundle: parsed.customBundle ?? null,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Writes a cart to localStorage, stamping savedAt with the current time.
 * Pass the full cart object; savedAt will be overwritten automatically.
 */
export function writeCart(cart: Omit<QuartermelonCart, "savedAt">): void {
  const full: QuartermelonCart = { ...cart, savedAt: Date.now() };
  localStorage.setItem(CART_KEY, JSON.stringify(full));
}

/**
 * Computes the CustomBundle object from a slug->quantity+meta map.
 * Returns null when the map is effectively empty (total === 0).
 */
export function buildCustomBundle(
  items: Record<string, { name: string; quantity: number; price: number }>
): CustomBundle | null {
  const filtered: CustomBundleItem[] = Object.entries(items)
    .filter(([, v]) => v.quantity > 0)
    .map(([slug, v]) => ({
      slug,
      name: v.name,
      quantity: v.quantity,
      price: v.price,
    }));

  if (filtered.length === 0) return null;

  const subtotal = filtered.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return {
    items: filtered,
    subtotal,
    discountUnlocked: subtotal >= 999,
  };
}

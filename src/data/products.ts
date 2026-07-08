export type ProductCategory = "daily-juice" | "wellness-shot";
export type Availability = "available" | "limited" | "out";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  size: "180ml" | "50ml";
  tagline: string;
  ingredients: string[];
  price: number;
  images: string[];
  fiber?: string;
  noAddedSugar: boolean;
  probiotics?: boolean;
  availability: Availability;
  /** Set to true to hide from all listings without deleting the product data. */
  hidden?: boolean;
}

export const products: Product[] = [
  // --- Daily Juice Line — 180ml ---
  {
    id: "1",
    slug: "watermelon-sabja",
    name: "Watermelon + Sabja",
    category: "daily-juice",
    size: "180ml",
    tagline: "Cool, hydrating & fiber-rich. Your gut's favourite summer companion.",
    ingredients: ["Watermelon Juice", "Sabja Seeds", "Lime", "Pink Himalayan Salt"],
    price: 65,
    images: ["/products/watermelon-sabja.png"],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: true,
    availability: "available",
  },
  {
    id: "2",
    slug: "watermelon-gond",
    name: "Watermelon + Gond Katira",
    category: "daily-juice",
    size: "180ml",
    tagline: "Hydration meets heritage. Gond Katira cools from the inside out.",
    ingredients: ["Watermelon Juice", "Gond Katira", "Rose Water", "Cardamom"],
    price: 65,
    images: ["/products/watermelon-gond.png"],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: false,
    availability: "available",
  },
  {
    id: "3",
    slug: "lemonade-pink",
    name: "Pink Lemonade",
    category: "daily-juice",
    size: "180ml",
    tagline: "Tangy, refreshing, and easy on the gut. Your afternoon pick-me-up.",
    ingredients: ["Lemon", "Beetroot", "Mint"],
    price: 55,
    images: ["/products/placeholder-bottle.png"],
    fiber: "10 to 12g",
    noAddedSugar: true,
    probiotics: true,
    availability: "available",
    hidden: true, // Not launching in V1 — re-enable by removing this line
  },
  {
    id: "4",
    slug: "lemonade-purple",
    name: "Purple Lemonade",
    category: "daily-juice",
    size: "180ml",
    tagline: "Bright, floral, and refreshingly tart. A sip of calm in every bottle.",
    ingredients: ["Lemon", "Butterfly Pea Flower", "Mint"],
    price: 55,
    images: ["/products/purple-lemonade.png"],
    fiber: "10 to 12g",
    noAddedSugar: true,
    probiotics: true,
    availability: "limited",
  },
  {
    id: "5",
    slug: "pineapple-sabja",
    name: "Pineapple + Sabja",
    category: "daily-juice",
    size: "180ml",
    tagline: "Tropical tang + gut fuel. Bromelain meets fiber in one bold sip.",
    ingredients: ["Pineapple Juice", "Sabja Seeds", "Ginger", "Lime"],
    price: 99,
    images: ["/products/pineapple-sabja.png"],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: true,
    availability: "available",
  },
  {
    id: "6",
    slug: "pineapple-gond",
    name: "Pineapple + Gond Katira",
    category: "daily-juice",
    size: "180ml",
    tagline: "Ancient remedy, tropical twist. Your gut will send a thank you note.",
    ingredients: ["Pineapple Juice", "Gond Katira", "Turmeric", "Black Pepper"],
    price: 99,
    images: ["/products/pineapple-gond.png"],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: false,
    availability: "out",
  },
  // --- Wellness Shots — 50ml ---
  {
    id: "7",
    slug: "turmeric-shot",
    name: "Turmeric Shot",
    category: "wellness-shot",
    size: "50ml",
    tagline: "Inflammation's worst nightmare in 50ml. Fire up your morning.",
    ingredients: ["Turmeric", "Ginger", "Orange", "Pineapple", "Lime", "Black Pepper"],
    price: 49,
    images: ["/products/turmeric-shot.png"],
    noAddedSugar: true,
    probiotics: false,
    availability: "available",
  },
  {
    id: "8",
    slug: "abc-shot",
    name: "ABC Shot",
    category: "wellness-shot",
    size: "50ml",
    tagline: "Apple, Beetroot, Carrot. Elementary nutrition. Extra ordinary results.",
    ingredients: ["Apple", "Beetroot", "Carrot"],
    price: 49,
    images: ["/products/abc-shot.png"],
    noAddedSugar: true,
    probiotics: false,
    availability: "limited",
  },
];

export const dailyJuices = products.filter((p) => p.category === "daily-juice" && !p.hidden);
export const wellnessShots = products.filter((p) => p.category === "wellness-shot" && !p.hidden);

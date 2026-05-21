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
    price: 60,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
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
    price: 60,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: false,
    availability: "available",
  },
  {
    id: "3",
    slug: "muskmelon-sabja",
    name: "Musk Melon + Sabja",
    category: "daily-juice",
    size: "180ml",
    tagline: "Silky, sweet, and gut-smart. A hug for your digestive system.",
    ingredients: ["Musk Melon Juice", "Sabja Seeds", "Honey", "Lemon"],
    price: 60,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
    fiber: "10 to 12g",
    noAddedSugar: true,
    probiotics: true,
    availability: "limited",
  },
  {
    id: "4",
    slug: "pineapple-sabja",
    name: "Pineapple + Sabja",
    category: "daily-juice",
    size: "180ml",
    tagline: "Tropical tang + gut fuel. Bromelain meets fiber in one bold sip.",
    ingredients: ["Pineapple Juice", "Sabja Seeds", "Ginger", "Lime"],
    price: 60,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: true,
    availability: "available",
  },
  {
    id: "5",
    slug: "pineapple-gond",
    name: "Pineapple + Gond Katira",
    category: "daily-juice",
    size: "180ml",
    tagline: "Ancient remedy, tropical twist. Your gut will send a thank you note.",
    ingredients: ["Pineapple Juice", "Gond Katira", "Turmeric", "Black Pepper"],
    price: 60,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
    fiber: "10 to 14g",
    noAddedSugar: true,
    probiotics: false,
    availability: "out",
  },
  // --- Wellness Shots — 50ml ---
  {
    id: "6",
    slug: "turmeric-shot",
    name: "Turmeric Shot",
    category: "wellness-shot",
    size: "50ml",
    tagline: "Inflammation's worst nightmare in 50ml. Fire up your morning.",
    ingredients: ["Turmeric", "Ginger", "Orange", "Pineapple", "Lime", "Black Pepper"],
    price: 35,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
    noAddedSugar: true,
    probiotics: false,
    availability: "available",
  },
  {
    id: "7",
    slug: "abc-shot",
    name: "ABC Shot",
    category: "wellness-shot",
    size: "50ml",
    tagline: "Apple, Beetroot, Carrot. Elementary nutrition. Extra ordinary results.",
    ingredients: ["Apple", "Beetroot", "Carrot"],
    price: 35,
    images: [
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
      "/images/placeholder-bottle.png",
    ],
    noAddedSugar: true,
    probiotics: false,
    availability: "limited",
  },
];

export const dailyJuices = products.filter((p) => p.category === "daily-juice");
export const wellnessShots = products.filter((p) => p.category === "wellness-shot");

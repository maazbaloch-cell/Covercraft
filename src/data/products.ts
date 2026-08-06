// Sample starter catalog. Replace with real designs, or load these into the DB via prisma/seed.ts
// price is stored in paisas (Rs. x 100) — e.g. 120000 = Rs. 1,200
export const sampleProducts = [
  {
    title: "Marble Swirl",
    description: "Elegant white & gold marble pattern",
    imageUrl: "/products/marble-swirl.svg",
    price: 120000, // Rs. 1,200
    category: "iPhone 15",
  },
  {
    title: "Neon Cyberpunk",
    description: "Glowing neon city print, matte finish",
    imageUrl: "/products/neon-cyberpunk.svg",
    price: 135000, // Rs. 1,350
    category: "iPhone 15 Pro",
  },
  {
    title: "Minimal Wave",
    description: "Soft pastel wave gradient",
    imageUrl: "/products/minimal-wave.svg",
    price: 99900, // Rs. 999
    category: "Samsung S24",
  },
  {
    title: "Floral Bloom",
    description: "Hand-drawn floral illustration",
    imageUrl: "/products/floral-bloom.svg",
    price: 110000, // Rs. 1,100
    category: "iPhone 14",
  },
];

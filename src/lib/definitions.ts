/**
 * @fileoverview Definiciones de tipos de TypeScript para la aplicación.
 * Centraliza las interfaces y tipos de datos comunes, como `Product`, `CartItem` y `Admin`,
 * para garantizar la consistencia y el tipado estático en todo el proyecto.
 */
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  discount?: number; // Porcentaje de descuento opcional
  category: string;
  isFeatured?: boolean; // Para destacar productos relevantes
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Admin = {
  id: number;
  name: string;
  email: string;
};

export type Notification = {
  id: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  createdAt: string; // ISO date string
};

export type StoreSettings = {
  // Hero Section
  heroHeadline: string;
  heroSubheadline: string;
  heroButtonText: string;
  mainImageUrl: string;
  
  // Featured Collection
  featuredCollectionTitle: string;
  featuredCollectionDescription?: string;

  // Promo Section (Deluxe)
  promoSectionTitle?: string;
  promoSectionDescription?: string;
  promoSectionVideoUrl?: string;

  // Location Section
  locationSectionTitle: string;
  address: string;
  hours: string;
  mapEmbedUrl?: string;
  
  // Footer/Contact info
  phone?: string;
  contactEmail?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
};

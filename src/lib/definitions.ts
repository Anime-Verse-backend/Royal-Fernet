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
  discount?: number;
  category: string;
  is_featured: boolean; // Corregido de isFeatured
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
  id: number;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  created_at: string;
};

export type HeroSlide = {
  id: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  imageUrl: string;
};

export type StoreSettings = {
  heroImages: HeroSlide[];
  featuredCollectionTitle: string;
  featuredCollectionDescription?: string;
  promoSectionTitle?: string;
  promoSectionDescription?: string;
  promoSectionVideoUrl?: string;
  phone?: string;
  contactEmail?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
};

export interface StoreLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  mapEmbedUrl: string;
  imageUrl: string;
}

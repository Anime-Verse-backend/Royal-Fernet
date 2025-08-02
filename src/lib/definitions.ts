
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
  is_featured: boolean; // Snake case to match the database response
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
  image_url?: string;
  link_url?: string;
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
  hero_images: HeroSlide[];
  featured_collection_title: string;
  featured_collection_description?: string;
  promo_section_title?: string;
  promo_section_description?: string;
  promo_section_video_url?: string;
  phone?: string;
  contact_email?: string;
  twitter_url?: string;
  instagram_url?: string;
  facebook_url?: string;
};

export interface StoreLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  map_embed_url: string;
  image_url: string;
}

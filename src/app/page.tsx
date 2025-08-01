/**
 * @fileoverview Página de inicio de la aplicación.
 * Es la página principal que ven los usuarios al visitar el sitio.
 * Muestra una sección de héroe, una colección destacada de productos
 * y información sobre la tienda física.
 */
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCarousel } from '@/components/product-carousel';
import { fetchProducts, fetchStoreSettings } from '@/lib/data';
import type { StoreSettings } from '@/lib/definitions';
import { HeroCarousel } from '@/components/hero-carousel';
import { TestimonialsSection } from '@/components/testimonials-section';

export const revalidate = 0; 

// Default settings in case the API fails or has no data
const defaultSettings: StoreSettings = {
  heroImages: [{
    id: 'default',
    headline: "Elegancia Atemporal, Redefinida.",
    subheadline: "Descubre nuestra colección exclusiva de relojes magistralmente elaborados.",
    buttonText: "Explorar Colección",
    imageUrl: "https://placehold.co/1920x1080.png"
  }],
  featuredCollectionTitle: "Colección Destacada",
};

export default async function Home() {
  const products = await fetchProducts();
  const featuredProducts = products.filter(p => p.is_featured);
  const settings = await fetchStoreSettings();
  const storeInfo = { ...defaultSettings, ...settings };

  return (
    <div className="flex flex-col">
      
      <HeroCarousel slides={storeInfo.heroImages || defaultSettings.heroImages} />

      <section id="featured" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
              {storeInfo.featuredCollectionTitle}
            </h2>
            {storeInfo.featuredCollectionDescription && (
              <p className="text-muted-foreground">{storeInfo.featuredCollectionDescription}</p>
            )}
          </div>
          <ProductCarousel products={featuredProducts} />
        </div>
      </section>

      <TestimonialsSection />
      
    </div>
  );
}

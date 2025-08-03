
/**
 * @fileoverview Página de inicio de la aplicación.
 * Es la página principal que ven los usuarios al visitar el sitio.
 * Muestra una sección de héroe, una colección destacada de productos
 * y información sobre la tienda física.
 */
import * as React from 'react';
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
  hero_images: [{
    id: 'default',
    headline: "Elegancia Atemporal, Redefinida.",
    subheadline: "Descubre nuestra colección exclusiva de relojes magistralmente elaborados.",
    buttonText: "Explorar Colección",
    imageUrl: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  }],
  featured_collection_title: "Colección Destacada",
  featured_collection_description: "Relojes para quienes valoran la distinción.",
  promo_section_title: "ROYAL DELUXE",
  promo_section_description: "Descubre la elegancia y la innovación.",
  promo_section_video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};

export default async function Home() {
  const products = await fetchProducts();
  const featuredProducts = products.filter(p => p.is_featured);
  const settings = await fetchStoreSettings();
  const storeInfo = settings || defaultSettings;

  return (
    <div className="flex flex-col">
      
      <HeroCarousel slides={storeInfo.hero_images || defaultSettings.hero_images} />

      <section id="featured" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
              {storeInfo.featured_collection_title}
            </h2>
            {storeInfo.featured_collection_description && (
              <p className="text-muted-foreground">{storeInfo.featured_collection_description}</p>
            )}
          </div>
          <ProductCarousel products={featuredProducts} />
        </div>
      </section>

      {storeInfo.promo_section_video_url && (
        <section className="bg-secondary py-16 md:py-24">
            <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="aspect-video w-full rounded-lg overflow-hidden shadow-xl">
                    <iframe 
                        src={storeInfo.promo_section_video_url}
                        title={storeInfo.promo_section_title}
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{storeInfo.promo_section_title}</h2>
                    <p className="text-lg text-muted-foreground">{storeInfo.promo_section_description}</p>
                </div>
            </div>
        </section>
      )}

      <TestimonialsSection />

    </div>
  );
}

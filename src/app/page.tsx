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
import { MapPin } from 'lucide-react';

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
  promoSectionTitle: "ROYAL DELUXE",
  promoSectionDescription: "Descubre la elegancia y la innovación.",
  promoSectionVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  locationSectionTitle: "Visita Nuestra Tienda Insignia",
  address: "123 Avenida de Lujo, Ginebra, Suiza",
  hours: "Abierto de Lunes a Sábado, de 10:00 AM a 7:00 PM",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.339668489869!2d-75.56821218898139!3d6.219085093754988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e44282dd3832d61%3A0x47b96e19a41c6e2a!2sParque%20Comercial%20El%20Tesoro!5e0!3m2!1sen!2sco!4v1721938978130!5m2!1sen!2sco"
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

      {storeInfo.promoSectionVideoUrl && (
        <section className="bg-secondary py-16 md:py-24">
            <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{storeInfo.promoSectionTitle}</h2>
                    <p className="text-lg text-muted-foreground">{storeInfo.promoSectionDescription}</p>
                </div>
                <div className="aspect-video w-full rounded-lg overflow-hidden shadow-xl">
                    <iframe 
                        src={storeInfo.promoSectionVideoUrl}
                        title={storeInfo.promoSectionTitle}
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
        </section>
      )}

      <TestimonialsSection />

      {storeInfo.mapEmbedUrl && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{storeInfo.locationSectionTitle}</h2>
              <p className="text-lg text-muted-foreground mb-2">{storeInfo.address}</p>
              <p className="text-muted-foreground mb-8">{storeInfo.hours}</p>
               <div className="mt-8 w-full h-96 md:h-[500px] rounded-lg overflow-hidden shadow-lg border">
                  <iframe
                      src={storeInfo.mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
              </div>
          </div>
        </section>
      )}
      
    </div>
  );
}

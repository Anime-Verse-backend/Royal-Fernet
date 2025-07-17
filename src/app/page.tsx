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
import { MapPin } from 'lucide-react';
import type { StoreSettings } from '@/lib/definitions';

// Default settings in case the API fails or has no data
const defaultSettings: StoreSettings = {
  heroHeadline: "Elegancia Atemporal, Redefinida.",
  heroSubheadline: "Descubre nuestra colección exclusiva de relojes magistralmente elaborados.",
  heroButtonText: "Explorar Colección",
  mainImageUrl: "https://placehold.co/1920x1080.png",
  featuredCollectionTitle: "COLECCIÓN ROYAL SERIES",
  featuredCollectionDescription: "La Royal Series ofrece una gama de relojes pensados para aquellos que valoran la distinción y el estilo sofisticado. Desde diseños vanguardistas, ideales para quienes llevan una vida activa, hasta modelos más elegantes y exclusivos, esta colección satisface cada preferencia y ocasión.",
  promoSectionTitle: "ROYAL DELUXE",
  promoSectionDescription: "Descubre la elegancia y la innovación en cada detalle del ROYAL DELUX, nuestro nuevo reloj femenino que redefine el lujo y la sofisticación. Diseñado para la mujer moderna y exigente, el ROYAL DELUX te ofrece una experiencia única, combinando estilo, funcionalidad y una precisión inigualable. ¡Siente la exclusividad en tu muñeca con ROYAL DELUX!",
  promoSectionVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  locationSectionTitle: "Visita Nuestra Tienda Insignia",
  address: "123 Avenida de Lujo, Ginebra, Suiza",
  hours: "Abierto de Lunes a Sábado, de 10:00 AM a 7:00 PM",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2761.954833291079!2d6.140358315582398!3d46.19839297911627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c652be9a01d6b%3A0x86734c56259c7322!2sRolex%20SA!5e0!3m2!1sen!2sch!4v1622546875878!5m2!1sen!2sch"
};

export default async function Home() {
  const products = await fetchProducts();
  const featuredProducts = products.filter(p => p.isFeatured);
  const settings = await fetchStoreSettings();
  const storeInfo = { ...defaultSettings, ...settings };

  const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    try {
      const videoUrl = new URL(url);
      if (videoUrl.hostname === "youtu.be") {
        return videoUrl.pathname.slice(1);
      }
      if (videoUrl.pathname.startsWith('/embed/')) {
        const pathParts = videoUrl.pathname.split('/');
        return pathParts[pathParts.length - 1];
      }
      return videoUrl.searchParams.get("v");
    } catch (e) {
      return null;
    }
  };
  const videoId = getYouTubeId(storeInfo.promoSectionVideoUrl);

  return (
    <div className="flex flex-col">
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-center text-white">
        <Image
          src={storeInfo.mainImageUrl}
          alt="Luxury watch on a dark background"
          data-ai-hint="luxury watch dark"
          fill
          sizes="100vw"
          className="absolute inset-0 z-0 brightness-50 object-cover"
          priority
        />
        <div className="relative z-10 p-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-white">
            {storeInfo.heroHeadline}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-white/90">
            {storeInfo.heroSubheadline}
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/catalog">{storeInfo.heroButtonText}</Link>
          </Button>
        </div>
      </section>

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

      {videoId && storeInfo.promoSectionTitle && (
        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full rounded-lg shadow-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold font-headline mb-4">{storeInfo.promoSectionTitle}</h2>
                <p className="text-muted-foreground leading-relaxed">{storeInfo.promoSectionDescription}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{storeInfo.locationSectionTitle}</h2>
          <p className="text-lg text-muted-foreground mb-2">{storeInfo.address}</p>
          <p className="text-muted-foreground">{storeInfo.hours}</p>
          {storeInfo.mapEmbedUrl ? (
            <div className="mt-8 mx-auto w-full max-w-2xl h-80 rounded-lg overflow-hidden shadow-lg">
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
          ) : (
            <div className="mt-8 w-full h-96 rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Mapa no disponible</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

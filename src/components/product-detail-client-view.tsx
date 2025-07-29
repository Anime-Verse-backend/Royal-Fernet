'use client';

import * as React from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/definitions';
import { Facebook, Twitter } from 'lucide-react';
import { AddToCartButton } from '@/components/add-to-cart-button';

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.16 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.377-.755-.377-1.845c0-1.713 1.002-2.982 2.245-2.982 1.056 0 1.56.793 1.56 1.758 0 1.066-.684 2.653-1.043 4.128-.295 1.229.613 2.24 1.834 2.24 2.2 0 3.868-2.873 3.868-6.993 0-3.41-2.49-5.975-5.69-5.975-3.834 0-6.155 2.836-6.155 5.772 0 1.01.346 2.081.775 2.681.107.153.124.207.093.356-.08.38-.266 1.127-.334 1.385-.02.075-.084.094-.149.043-1.07-1.03-1.425-2.887-1.425-4.434C2.96 6.402 5.584 3 10.301 3c4.133 0 7.424 2.952 7.424 6.902 0 4.423-2.612 7.854-6.357 7.854-1.218 0-2.358-.63-2.738-1.373 0 0-.593 2.27-.714 2.738-.253.943-.995 2.015-1.465 2.709C6.42 23.492 8.35 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
      fill="currentColor"
    />
  </svg>
);

export function ProductDetailClientView({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = React.useState<string>(product.images?.[0] || 'https://placehold.co/800x800.png');
  const [pageUrl, setPageUrl] = React.useState('');

  React.useEffect(() => {
    setPageUrl(window.location.href);
    setSelectedImage(product.images?.[0] || 'https://placehold.co/800x800.png');
  }, [product]);

  const safeImageUrls = product.images
    .map(img => {
      if (!img || typeof img !== 'string' || !img.trim()) return null;
      if (img.startsWith('/') || img.startsWith('data:')) return img;
      try {
        new URL(img);
        return img;
      } catch (e) {
        return null;
      }
    })
    .filter((img): img is string => img !== null);

  const imagesToShow = safeImageUrls.length > 0 ? safeImageUrls : ['https://placehold.co/800x800.png'];
  
  const originalPrice = Number(product.price);
  const discountedPrice = product.discount && product.discount > 0
    ? originalPrice - (originalPrice * product.discount) / 100
    : originalPrice;

  const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(product.name)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(selectedImage)}&description=${encodeURIComponent(product.name)}`
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            
            <div className="w-full flex flex-col items-center">
                <div className="aspect-square relative w-full max-w-md rounded-lg overflow-hidden mb-4 shadow-lg bg-muted">
                    <Image
                        key={selectedImage}
                        src={selectedImage}
                        alt={`${product.name} main image`}
                        data-ai-hint="watch detail"
                        fill
                        className="object-cover transition-opacity duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
                <div className="grid grid-cols-5 gap-2 max-w-md w-full">
                {imagesToShow.slice(0, 5).map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square relative w-full rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary ring-offset-2 ring-offset-background transition-all duration-200 ${selectedImage === img ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                    >
                        <Image
                            src={img}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            fill
                            className="object-cover bg-muted"
                            sizes="20vw"
                        />
                    </button>
                ))}
                </div>
            </div>

            <div className="flex flex-col justify-center">
                <h1 className="text-3xl lg:text-4xl font-bold font-headline mb-2">{product.name}</h1>
                <p className="text-lg text-muted-foreground mb-4">{product.category}</p>
                
                <div className="flex items-baseline gap-4 mb-6">
                    <p className="text-3xl font-bold text-primary">${discountedPrice.toFixed(2)}</p>
                    {product.discount && product.discount > 0 && (
                      <p className="text-xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</p>
                    )}
                </div>

                <p className="text-foreground/80 leading-relaxed mb-6">{product.description}</p>
                
                {product.stock > 0 ? (
                    <div className="flex items-center gap-2 mb-6 text-sm text-green-500 font-medium">
                        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                        En Stock ({product.stock} disponibles)
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-6 text-sm text-red-500 font-medium">
                        <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                        Agotado
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <AddToCartButton product={product} size="lg" className="w-full sm:w-auto" disabled={product.stock <= 0}>
                        Añadir al Carrito
                    </AddToCartButton>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Compartir</h3>
                    {pageUrl && (
                        <div className="flex items-center gap-3">
                            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href={shareLinks.pinterest} target="_blank" rel="noopener noreferrer" aria-label="Share on Pinterest" className="text-muted-foreground hover:text-primary transition-colors">
                                <PinterestIcon className="h-5 w-5" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

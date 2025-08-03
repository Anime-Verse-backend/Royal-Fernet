/**
 * @fileoverview Componente de tarjeta de producto.
 * Muestra una vista previa de un producto, incluyendo su imagen, nombre,
 * categoría y precio. Se utiliza en listados como el catálogo o la
 * sección de productos destacados.
 */
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/definitions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AddToCartButton } from './add-to-cart-button';
import { formatCurrency, getSafeImageUrl } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}


export function ProductCard({ product }: ProductCardProps) {
  const originalPrice = Number(product.price);
  const discountedPrice = product.discount
    ? originalPrice - (originalPrice * product.discount) / 100
    : originalPrice;

  const imageSrc = getSafeImageUrl(product.images?.[0]);

  return (
    <Card className="group w-full h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex flex-col">
      <Link href={`/product/${product.id}`} className="block flex-grow">
        <CardHeader className="p-0 relative overflow-hidden">
          <div className="aspect-square w-full relative">
            <Image
              src={imageSrc}
              alt={product.name}
              data-ai-hint="watch product"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          </div>
          {product.discount && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              {product.discount}% OFF
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-headline hover:text-primary/80">
            {product.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold">
            {formatCurrency(discountedPrice)}
          </p>
          {product.discount && (
            <p className="text-sm text-muted-foreground line-through">
              {formatCurrency(originalPrice)}
            </p>
          )}
        </div>
        <AddToCartButton product={product} size="sm" />
      </CardFooter>
    </Card>
  );
}

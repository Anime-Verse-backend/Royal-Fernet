'use client';

import * as React from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from './ui/button';
import type { Product } from '@/lib/definitions';
import { ShoppingCart } from 'lucide-react';

export function AddToCartButton({ product, children, ...props }: { product: Product } & React.ComponentProps<typeof Button>) {
  const { addToCart } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <Button onClick={handleAddToCart} {...props}>
      {children || (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          <span>Add to Cart</span>
        </>
      )}
    </Button>
  );
}

/**
 * @fileoverview Componente del carrito de compras.
 * Se muestra como un panel lateral (sheet) y permite a los usuarios ver
 * los productos que han agregado, modificar las cantidades, eliminarlos
 * y proceder al pago, que ahora redirige a WhatsApp con los detalles del pedido.
 */
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from './ui/sheet';
import { useCart } from '@/hooks/use-cart';
import { Separator } from './ui/separator';
import { formatCurrency } from '@/lib/utils';

const getSafeImageUrl = (url?: string): string => {
  const placeholder = 'https://placehold.co/64x64.png';

  if (!url || typeof url !== 'string' || !url.trim()) {
    return placeholder;
  }

  // Allow relative paths
  if (url.startsWith('/')) {
    return url;
  }

  try {
    // This will throw an error for invalid URLs
    new URL(url);
    return url;
  } catch (error) {
    return placeholder;
  }
};


export function CartSheet() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCheckout = () => {
    // =================================================================
    // AQUÍ: Reemplaza con tu número de WhatsApp real (incluyendo el código de país).
    // EJEMPLO: 573001234567 (para Colombia)
    // =================================================================
    const phoneNumber = "YOUR_WHATSAPP_NUMBER_HERE"; 
    
    let message = "¡Hola! Quisiera hacer un pedido de los siguientes artículos:\n\n";
    
    cartItems.forEach(item => {
        const price = Number(item.product.price);
        const itemPrice = item.product.discount
            ? price - (price * item.product.discount / 100)
            : price;
        const totalItemPrice = itemPrice * item.quantity;
        
        message += `*${item.product.name}*\n`;
        message += `(Ref: ${item.product.id})\n`;
        message += `Imagen: ${item.product.images[0]}\n`;
        message += `Cantidad: ${item.quantity}\n`;
        message += `Subtotal: ${formatCurrency(totalItemPrice)}\n\n`;
    });

    message += `*Monto Total: ${formatCurrency(cartTotal)}*\n\n`;
    message += "Por favor, confirme mi pedido y proporcione los detalles de pago. ¡Gracias!";

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    clearCart();
  };

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Open Cart</span>
      </Button>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {itemCount}
            </span>
          )}
          <span className="sr-only">Open Cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Carrito de Compras ({itemCount})</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartItems.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map(({ product, quantity }) => {
                  const imageSrc = getSafeImageUrl(product.images?.[0]);
                  return (
                  <div key={product.id} className="flex items-center space-x-4">
                    <Image
                      src={imageSrc}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(product.id, quantity - 1)}>
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center">{quantity}</span>
                         <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(product.id, quantity + 1)}>
                            <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="font-semibold">{formatCurrency(Number(product.price) * quantity)}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeFromCart(product.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
            <Separator />
            <SheetFooter className="px-6 py-4 bg-secondary">
                <div className="w-full space-y-4">
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleCheckout}>Pagar por WhatsApp</Button>
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">
              Tu carrito está vacío.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

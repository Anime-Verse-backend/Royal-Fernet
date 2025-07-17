/**
 * @fileoverview Hook personalizado para gestionar el estado del carrito de compras.
 * Proporciona la lógica para añadir, eliminar, actualizar productos y calcular el total.
 * Utiliza el `localStorage` del navegador para persistir el estado del carrito
 * entre sesiones.
 */
"use client"

import * as React from 'react';
import type { Product, CartItem } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const storedCart = localStorage.getItem('royal-fernet-cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('royal-fernet-cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
    toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  }

  const cartTotal = cartItems.reduce((total, item) => {
    const price = Number(item.product.price);
    const discountedPrice = item.product.discount 
        ? price - (price * item.product.discount / 100)
        : price;
    return total + discountedPrice * item.quantity;
  }, 0);

  return React.createElement(CartContext.Provider, {
    value: { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }
  }, children);
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

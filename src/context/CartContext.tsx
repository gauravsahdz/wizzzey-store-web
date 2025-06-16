
"use client";

import type { Product, CartItem } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  hasMounted: boolean; // Added to signal client-side mount
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Initialize empty
  const [hasMounted, setHasMounted] = useState(false); // For hydration safety

  // Effect to load cart from localStorage on client mount
  useEffect(() => {
    setHasMounted(true); // Signal that component has mounted
    const localData = localStorage.getItem('cartItems');
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData)) {
          setCartItems(parsedData);
        } else {
          console.warn("Invalid cart data in localStorage:", parsedData);
          localStorage.removeItem('cartItems'); // Clear invalid data
        }
      } catch (error) {
        console.error("Error parsing cart data from localStorage:", error);
        localStorage.removeItem('cartItems'); // Clear corrupted data
      }
    }
  }, []); // Runs once on client mount

  // Effect to save cart to localStorage whenever it changes, after mount
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, hasMounted]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: Math.max(0, item.quantity + quantity) } : item // Ensure quantity doesn't go below 0
        );
      }
      // Ensure product has necessary fields for a CartItem
      const newCartItem: CartItem = { 
        ...product, 
        quantity: Math.max(1, quantity) // Ensure new item has at least 1 quantity
      };
      return [...prevItems, newCartItem];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, hasMounted }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

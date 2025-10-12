import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Formation } from '../lib/firebase';

interface CartContextType {
  cart: Formation[];
  addToCart: (formation: Formation) => void;
  removeFromCart: (formationId: string) => void;
  clearCart: () => void;
  isInCart: (formationId: string) => boolean;
  totalPrice: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'formapro_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Formation[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (formation: Formation) => {
    setCart((prev) => {
      if (prev.find((item) => item.id === formation.id)) {
        return prev;
      }
      return [...prev, formation];
    });
  };

  const removeFromCart = (formationId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== formationId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (formationId: string) => {
    return cart.some((item) => item.id === formationId);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
  const itemCount = cart.length;

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    totalPrice,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

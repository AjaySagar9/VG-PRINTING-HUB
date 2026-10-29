'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const CartContext = createContext(null);

const STORAGE_KEY = 'vg_cart_items_v2';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  // 1. Initialize cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    }
  }, []);

  // 2. Persist cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  // 3. Re-calculate backend quote whenever items, couponCode, or user changes
  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      setQuoteError('');
      return;
    }
    fetchQuote();
  }, [items, couponCode, user]);

  const fetchQuote = async (codeToUse = couponCode) => {
    setLoadingQuote(true);
    setQuoteError('');
    try {
      const res = await fetch('/api/cart/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            quantity: it.quantity,
            selectedColor: it.selectedColor,
            selectedSize: it.selectedSize,
            customization: it.customization,
          })),
          couponCode: codeToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setQuoteError(data.error || 'Pricing calculation failed');
      } else {
        setQuote(data);
      }
    } catch (err) {
      console.error('Error fetching cart quote:', err);
      setQuoteError('Unable to update pricing quote');
    } finally {
      setLoadingQuote(false);
    }
  };

  const addItem = (productItem) => {
    // Generate a unique ID based on productId, size, color, and customization text/placement
    const customHash = productItem.customization
      ? `${productItem.customization.placement || ''}_${productItem.customization.customText || ''}_${productItem.customization.logo ? 'logo' : ''}`
      : 'standard';
    const uniqueId = `${productItem.productId}_${productItem.selectedSize || 'na'}_${productItem.selectedColor || 'na'}_${customHash}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === uniqueId);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += productItem.quantity;
        return updated;
      }
      return [...prev, { ...productItem, id: uniqueId }];
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) return;

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item))
    );
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponData(null);
    setQuote(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  const applyCoupon = async (code) => {
    if (!code || !code.trim()) return;
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          subtotal: quote?.subtotal || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid coupon');
      }

      setCouponCode(data.code);
      setCouponData(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponData(null);
  };

  const totalCount = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalCount,
        quote,
        loadingQuote,
        quoteError,
        couponCode,
        couponData,
        applyCoupon,
        removeCoupon,
        refreshQuote: fetchQuote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

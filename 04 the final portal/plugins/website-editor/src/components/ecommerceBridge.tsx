"use client";

// Stubbed ecommerce dependencies for blocks that originally pulled from
// the Round-1 monolith's `@/context/CartContext`, `@/lib/products`,
// `@/lib/variants`, and `@/components/ProductVariantPicker`.
//
// **Round-2 status**: T2's `@aqua/plugin-ecommerce` doesn't yet expose
// these client-side hooks/components — the plugin contract publishes
// REST routes only. Until T2 lands a `@aqua/plugin-ecommerce/components`
// surface (tracked in 04-plugin-ecommerce.md Round-2 TODO), the lifted
// commerce blocks (cart-summary, checkout-summary, variant-picker)
// fall back to:
//   - `useCart()` → empty cart, no-op mutations
//   - `ProductVariantPicker` → notice div in editor / stub live
//
// When T2 ships the real contexts, swap the imports here without
// touching the block components, or call `setCartProvider()` from the
// host app to inject a live snapshot.
//
// Q-ASSUMED in T3 outbox: stub instead of blocking on T2.

import { useEffect, useState } from "react";

// ─── Cart ──────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
  productHandle?: string;
}

export interface CartSnapshot {
  items: CartItem[];
  subtotal: number;
  count: number;
  updateQty(itemId: string, qty: number): void;
  removeItem(itemId: string): void;
  addItem(item: Omit<CartItem, "quantity"> & { quantity?: number }): void;
  clear(): void;
}

const EMPTY_CART: CartSnapshot = {
  items: [],
  subtotal: 0,
  count: 0,
  updateQty: () => {},
  removeItem: () => {},
  addItem: () => {},
  clear: () => {},
};

let cartProvider: (() => CartSnapshot) | null = null;
export function setCartProvider(fn: () => CartSnapshot): void { cartProvider = fn; }

export function useCart(): CartSnapshot {
  const [snapshot, setSnapshot] = useState<CartSnapshot>(() => cartProvider?.() ?? EMPTY_CART);
  useEffect(() => {
    if (!cartProvider) return;
    setSnapshot(cartProvider());
  }, []);
  return snapshot;
}

// ─── Products + variants ──────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  inStock?: boolean;
  options?: Record<string, string>;
}

export interface Product {
  id: string;
  handle: string;
  slug?: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  image?: string;
  variants?: ProductVariant[];
}

export interface ResolvedVariant {
  product?: Product;
  variant: ProductVariant | null;
  price: number;
  salePrice?: number;
  available?: boolean;
  isCustom?: boolean;
  customHex?: string;
}

// VariantPickerState — onChange shape used by the original component
// (state + resolved variant tuple).
export interface VariantPickerState {
  selectedVariantId: string | null;
  options: Record<string, string>;
  customHex?: string;
}

export interface ProductVariantPickerProps {
  product: Product;
  onChange?: (state: VariantPickerState, resolved: ResolvedVariant | null) => void;
  initialVariantId?: string;
}

export default function ProductVariantPicker(_props: ProductVariantPickerProps) {
  return (
    <div
      data-block-type="variant-picker-stub"
      style={{
        padding: 16,
        borderRadius: 8,
        border: "1px dashed rgba(255,107,53,0.4)",
        color: "rgba(255,107,53,0.7)",
        fontSize: 11,
      }}
    >
      Variant picker — requires <code>@aqua/plugin-ecommerce</code> client surface.
    </div>
  );
}

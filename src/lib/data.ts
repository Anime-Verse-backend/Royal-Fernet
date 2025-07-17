
/**
 * @fileoverview Funciones para obtener datos de la API.
 * Este archivo contiene la lógica para comunicarse con el backend.
 * Define funciones asíncronas para buscar todos los productos, administradores o un producto
 * específico por su ID.
 */
import type { Product, Admin, Notification, StoreSettings } from './definitions';

// For server-side fetching, use the environment variable which points to the full Render URL.
// For client-side fetching (in useEffect, etc.), use a relative path which will be handled by Vercel rewrites or just works if on the same domain.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';
const CLIENT_API_BASE_URL = '/api'; // Used for client-side fetches

// Helper to determine if we are on the server or client
const isServer = typeof window === 'undefined';

export async function fetchProducts(query?: string): Promise<Product[]> {
  const url = query ? `${API_BASE_URL}/products?q=${encodeURIComponent(query)}` : `${API_BASE_URL}/products`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`Error fetching products: ${res.status} ${res.statusText}`);
      return [];
    }
    let products: Product[] = await res.json();
    products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return products;
  } catch (error) {
    console.error('Network error while fetching products:', error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return undefined;
      console.error(`Error fetching product ${id}: ${res.status} ${res.statusText}`);
      return undefined;
    }
    return await res.json();
  } catch (error) {
    console.error(`Network error while fetching product ${id}:`, error);
    return undefined;
  }
}

export async function fetchAdmins(query?: string): Promise<Admin[]> {
  const url = query ? `${API_BASE_URL}/admins?q=${encodeURIComponent(query)}` : `${API_BASE_URL}/admins`;
  try {
    const res = await fetch(url, { cache: 'no-store' }); // Admin data should not be cached
    if (!res.ok) {
       console.error(`Error fetching admins: ${res.status} ${res.statusText}`);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Network error while fetching admins:', error);
    return [];
  }
}

export async function fetchLatestNotification(): Promise<Notification | null> {
    const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
    try {
        const res = await fetch(`${baseUrl}/notifications/latest`, { cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return null; // Not found is not an error.
            console.error(`Error fetching latest notification: ${res.status} ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error('Network error while fetching latest notification:', error);
        return null;
    }
}

export async function fetchStoreSettings(): Promise<StoreSettings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null; // Not found is not an error.
      console.error(`Error fetching store settings: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Network error while fetching store settings:', error);
    return null;
  }
}

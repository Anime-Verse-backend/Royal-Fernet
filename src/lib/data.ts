
/**
 * @fileoverview Funciones para obtener datos de la API.
 * Este archivo contiene la lógica para comunicarse con el backend.
 * Define funciones asíncronas para buscar todos los productos, administradores o un producto
 * específico por su ID.
 */
import type { Product, Admin, Notification, StoreSettings } from './definitions';

// Para la obtención de datos del lado del servidor, usa la variable de entorno que apunta a la URL completa de Render.
// Para la obtención de datos del lado del cliente (en useEffect, etc.), usa una ruta relativa que será manejada por las reescrituras de Vercel.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://exotic-fruits.onrender.com';
const CLIENT_API_BASE_URL = ''; // Usado para las peticiones del lado del cliente

// Ayudante para determinar si estamos en el servidor o en el cliente
const isServer = typeof window === 'undefined';

export async function fetchProducts(query?: string): Promise<Product[]> {
  const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
  const url = query ? `${baseUrl}/api/products?q=${encodeURIComponent(query)}` : `${baseUrl}/api/products`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`Error al obtener productos: ${res.status} ${res.statusText}`);
      return [];
    }
    let products: Product[] = await res.json();
    products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return products;
  } catch (error) {
    console.error('Error de red al obtener productos:', error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return undefined;
      console.error(`Error al obtener el producto ${id}: ${res.status} ${res.statusText}`);
      return undefined;
    }
    return await res.json();
  } catch (error) {
    console.error(`Error de red al obtener el producto ${id}:`, error);
    return undefined;
  }
}

export async function fetchAdmins(query?: string): Promise<Admin[]> {
  const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
  const url = query ? `${baseUrl}/api/admins?q=${encodeURIComponent(query)}` : `${baseUrl}/api/admins`;
  try {
    const res = await fetch(url, { cache: 'no-store' }); // Los datos de administrador no deben ser cacheados
    if (!res.ok) {
       console.error(`Error al obtener administradores: ${res.status} ${res.statusText}`);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error de red al obtener administradores:', error);
    return [];
  }
}

export async function fetchLatestNotification(): Promise<Notification | null> {
    const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
    try {
        const res = await fetch(`${baseUrl}/api/notifications/latest`, { cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return null; // No encontrado no es un error.
            console.error(`Error al obtener la última notificación: ${res.status} ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error('Error de red al obtener la última notificación:', error);
        return null;
    }
}

export async function fetchStoreSettings(): Promise<StoreSettings | null> {
  const baseUrl = isServer ? API_BASE_URL : CLIENT_API_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/settings`, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null; // No encontrado no es un error.
      console.error(`Error al obtener la configuración de la tienda: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error de red al obtener la configuración de la tienda:', error);
    return null;
  }
}

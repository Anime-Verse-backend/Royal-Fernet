
/**
 * @fileoverview Funciones para obtener datos de la API.
 * Este archivo contiene la lógica para comunicarse con el backend.
 * Define funciones asíncronas para buscar todos los productos, administradores o un producto
 * específico por su ID.
 */
import type { Product, Admin, Notification, StoreSettings } from './definitions';

// Para las llamadas desde el servidor (Server Components, Actions), usamos la URL completa.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';

const getBaseUrl = () => {
    // Si el código se ejecuta en el navegador, no uses la URL absoluta.
    // Las reescrituras de Next.js se encargarán de redirigir a /api.
    if (typeof window !== 'undefined') {
        return '';
    }
    // Si el código se ejecuta en el servidor, usa la URL absoluta.
    return API_BASE_URL;
}

// =========================================================================
//  Funciones para obtener datos públicos (con caché deshabilitado para evitar problemas)
// =========================================================================

export async function fetchProducts(query?: string): Promise<Product[]> {
  const baseUrl = getBaseUrl();
  const url = query ? `${baseUrl}/api/products?q=${encodeURIComponent(query)}` : `${baseUrl}/api/products`;
  try {
    // Usamos 'no-store' para asegurar que siempre obtenemos los datos más frescos y las URLs de imagen correctas.
    const res = await fetch(url, { cache: 'no-store' }); 
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
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, { cache: 'no-store' });
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

export async function fetchStoreSettings(): Promise<StoreSettings | null> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/settings`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Error al obtener la configuración de la tienda: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error de red al obtener la configuración de la tienda:', error);
    return null;
  }
}

// =========================================================================
//  Funciones para el panel de administración (siempre sin caché)
// =========================================================================

export async function fetchAdmins(query?: string): Promise<Admin[]> {
  const baseUrl = getBaseUrl();
  const url = query ? `${baseUrl}/api/admins?q=${encodeURIComponent(query)}` : `${baseUrl}/api/admins`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
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
    const baseUrl = getBaseUrl();
    try {
        const res = await fetch(`${baseUrl}/api/notifications/latest`, { cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return null;
            console.error(`Error al obtener la última notificación: ${res.status} ${res.statusText}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error('Error de red al obtener la última notificación:', error);
        return null;
    }
}

/**
 * @fileoverview Funciones de utilidad.
 * Contiene la función `cn`, que combina y fusiona clases de Tailwind CSS
 * de forma segura, y `formatCurrency` para mostrar precios en el formato correcto.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Valida una URL de imagen y devuelve una URL de marcador de posición si es inválida.
 * @param url La URL de la imagen a validar.
 * @param placeholderSize El tamaño del marcador de posición, ej: "64x64".
 * @returns Una URL de imagen segura.
 */
export const getSafeImageUrl = (url?: string, placeholderSize: string = "400x400"): string => {
  const placeholder = `https://placehold.co/${placeholderSize}.png`;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return placeholder;
  }

  // Permitir rutas relativas (que comienzan con /) y data URIs
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  try {
    // Esto arrojará un error para URLs inválidas
    new URL(url);
    return url;
  } catch (error) {
    // Si la URL es inválida, devuelve el marcador de posición
    return placeholder;
  }
};

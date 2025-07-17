/**
 * @fileoverview Proveedor de contexto para la gestión de temas.
 * Utiliza la librería `next-themes` para envolver la aplicación y permitir
 * el cambio dinámico entre temas (claro, oscuro, sistema).
 */
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

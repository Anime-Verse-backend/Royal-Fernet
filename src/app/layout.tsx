
/**
 * @fileoverview Layout principal de la aplicación.
 * Este componente envuelve todas las páginas y define la estructura HTML base.
 * Es un Server Component que carga las fuentes y proveedores de contexto globales.
 */
import * as React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CustomerServiceWidget } from '@/components/customer-service-widget';
import { CartProvider } from '@/hooks/use-cart';
import { ThemeProvider } from '@/components/theme-provider';
import { montserrat } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { AppContent } from './app-content';
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(montserrat.variable)} suppressHydrationWarning>
      <head>
        <title>Royal-Fernet - Exquisite Timepieces</title>
        <meta name="description" content="Discover our collection of luxury watches. Timeless elegance and precision craftsmanship." />
        <meta name="keywords" content="watches, luxury watches, Royal-Fernet, timepieces" />
      </head>
      <body className="font-body antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <Suspense>
                <AppContent>{children}</AppContent>
            </Suspense>
            <CustomerServiceWidget />
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

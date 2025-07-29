'use client';
/**
 * @fileoverview Componente de la barra de navegación para la sección de administración.
 * Proporciona una navegación simplificada específica para el panel de control,
 * incluyendo un selector de tema.
 */
import * as React from 'react';
import Link from 'next/link';
import { GlassWater, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <GlassWater className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block font-headline">
            Royal-Fernet Admin
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Exit to Site
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

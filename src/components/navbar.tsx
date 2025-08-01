/**
 * @fileoverview Componente de la barra de navegación principal.
 * Contiene el logotipo, los enlaces de navegación a las secciones principales
 * del sitio, un buscador, el selector de tema, el acceso al perfil de usuario y al carrito de compras.
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassWater, User, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CartSheet } from './cart-sheet';
import { ThemeToggle } from './theme-toggle';
import { Input } from './ui/input';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/stores', label: 'Tiendas' },
  { href: '/#contact', label: 'Contact' },
];

function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    useEffect(() => {
        setQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const searchQuery = formData.get('search') as string;
        if (searchQuery.trim()) {
            router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push('/catalog');
        }
    };
    
    return (
        <form onSubmit={handleSearch} className="relative w-full ml-auto">
            <Input
                type="search"
                name="search"
                placeholder="Search products..."
                className="pr-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" size="icon" variant="ghost" className="absolute top-0 right-0 h-full">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
            </Button>
        </form>
    )
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <GlassWater className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">
              Royal-Fernet
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between md:justify-end gap-2">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                  <GlassWater className="h-6 w-6" />
                  <span className="font-bold font-headline">Royal-Fernet</span>
                </Link>
                <div className="flex flex-col space-y-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:flex flex-1 mx-4 max-w-sm">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login">
                <User className="h-5 w-5" />
                <span className="sr-only">Login</span>
              </Link>
            </Button>
            <CartSheet />
          </nav>
        </div>
      </div>
       <div className="container pb-2 md:hidden">
            <SearchBar />
       </div>
    </header>
  );
}

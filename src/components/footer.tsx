/**
 * @fileoverview Componente del pie de página de la aplicación.
 * Muestra información de contacto, enlaces de navegación, redes sociales,
 * y el aviso de copyright.
 */
import * as React from 'react';
import Link from 'next/link';
import { GlassWater, Github, Instagram, Facebook } from 'lucide-react';

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 01-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 01-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.52-1.29.372-.775.372-1.457.234-1.828-.156-.389-.42-.516-.6-.516h-.114zM16 2.098a13.91 13.91 0 00-13.908 13.909c0 4.38 2.016 8.33 5.303 10.942l-1.6 5.844 5.973-1.566c1.63.888 3.444 1.374 5.292 1.374a13.91 13.91 0 100-27.817z" />
    </svg>
  );

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-8 md:mb-0">
            <Link href="/" className="flex items-center justify-center md:justify-start space-x-2 mb-4">
              <GlassWater className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold font-headline">Exotic Fruits</span>
            </Link>
            <p className="text-muted-foreground">Crafting legacies, one tick at a time.</p>
          </div>
          <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-16">
            <div>
              <h3 className="font-bold mb-2">Explore</h3>
              <ul className="space-y-1">
                <li><Link href="/catalog" className="text-muted-foreground hover:text-primary">Catalog</Link></li>
                <li><Link href="/#featured" className="text-muted-foreground hover:text-primary">Featured</Link></li>
                <li><Link href="/developers" className="text-muted-foreground hover:text-primary">Developers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2">Support</h3>
              <ul className="space-y-1">
                <li><Link href="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
                <li><Link href="/shipping" className="text-muted-foreground hover:text-primary">Shipping & Returns</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
                <h3 className="font-bold mb-2">Follow Us</h3>
                <div className="flex justify-center md:justify-start space-x-4">
                    <Link href="#" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary"><WhatsappIcon className="h-6 w-6" /></Link>
                    <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></Link>
                    <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook className="h-6 w-6" /></Link>
                    <Link href="#" aria-label="Github" className="text-muted-foreground hover:text-primary"><Github className="h-6 w-6" /></Link>
                </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>&copy; {year} Exotic Fruits. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

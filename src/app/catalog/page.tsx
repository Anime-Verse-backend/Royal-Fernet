/**
 * @fileoverview Página del catálogo de productos.
 * Muestra una cuadrícula con todos los productos disponibles en la tienda,
 * permitiendo a los usuarios explorarlos y buscarlos.
 */
import { ProductCard } from '@/components/product-card';
import { fetchProducts } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Catalog - Royal-Fernet',
    description: 'Explore our full collection of exquisite timepieces.',
};

export default async function CatalogPage({ 
  searchParams 
}: { 
  searchParams?: { [key: string]: string | string[] | undefined }; 
}) {
  const query = searchParams?.q as string || '';
  const products = await fetchProducts(query);

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold font-headline mb-8 text-center">
        {query ? `Searching for "${query}"` : 'Our Collection'}
      </h1>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-2xl text-muted-foreground">No products found.</p>
          <p className="text-muted-foreground mt-2">Try adjusting your search or check back later.</p>
        </div>
      )}
    </div>
  );
}

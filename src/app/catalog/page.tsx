/**
 * @fileoverview Página del catálogo de productos.
 * Muestra una cuadrícula con todos los productos disponibles en la tienda,
 * permitiendo a los usuarios explorarlos y buscarlos. Ahora incluye paginación.
 */
import { ProductCard } from '@/components/product-card';
import { fetchProducts } from '@/lib/data';
import { Pagination } from '@/components/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Catalog - Royal-Fernet',
    description: 'Explore our full collection of exquisite timepieces.',
};

const PRODUCTS_PER_PAGE = 12;

export default async function CatalogPage({ 
  searchParams 
}: { 
  searchParams?: { [key: string]: string | string[] | undefined }; 
}) {
  const query = searchParams?.q as string || '';
  const currentPage = Number(searchParams?.page || '1');

  const allProducts = await fetchProducts(query);
  
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const offset = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const productsToShow = allProducts.slice(offset, offset + PRODUCTS_PER_PAGE);

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col min-h-[80vh]">
      <div className="flex-grow">
        <h1 className="text-4xl font-bold font-headline mb-8 text-center">
          {query ? `Searching for "${query}"` : 'Our Collection'}
        </h1>
        
        {productsToShow.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {productsToShow.map((product) => (
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

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}

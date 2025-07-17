import * as React from 'react';
import { notFound } from 'next/navigation';
import { fetchProductById } from '@/lib/data';
import { ProductDetailClientView } from '@/components/product-detail-client-view';
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const product = await fetchProductById(id)
 
  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
 
  return {
    title: `${product.name} - Royal-Fernet`,
    description: product.description,
    openGraph: {
        title: product.name,
        description: product.description,
        images: [product.images[0], ...previousImages],
    },
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await fetchProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClientView product={product} />;
}

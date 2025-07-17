import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  const skeletonItems = Array.from({ length: 8 });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-center mb-8">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {skeletonItems.map((_, index) => (
          <div key={index} className="flex flex-col space-y-3">
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

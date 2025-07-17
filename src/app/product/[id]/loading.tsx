import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailLoading() {
    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                <div className="w-full flex flex-col items-center">
                    <Skeleton className="aspect-square w-full max-w-md rounded-lg" />
                    <div className="grid grid-cols-5 gap-2 max-w-md w-full mt-4">
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                    </div>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full md:w-40" />
                </div>
            </div>
        </div>
    );
}

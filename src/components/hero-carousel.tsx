'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { HeroSlide } from '@/lib/definitions';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { getSafeImageUrl } from '@/lib/utils';

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 8000 })]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden" ref={emblaRef}>
      <div className="flex h-full">
        {slides.map((slide) => (
          <div key={slide.id} className="relative flex-[0_0_100%] h-full">
            <Image
              src={getSafeImageUrl(slide.imageUrl, '1920x1080')}
              alt={slide.headline}
              data-ai-hint="luxury watch dark"
              fill
              sizes="100vw"
              className="absolute inset-0 z-0 brightness-50 object-cover"
              priority={slides.indexOf(slide) === 0}
            />
            <div className="relative z-10 p-4 flex flex-col items-center justify-center text-center text-white h-full animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-white">
                {slide.headline}
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-white/90">
                {slide.subheadline}
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/catalog">{slide.buttonText}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-300',
              selectedIndex === index ? 'w-6 bg-white' : 'bg-white/50'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

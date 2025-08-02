
import * as React from 'react';
import { fetchStores } from '@/lib/data';
import type { Metadata } from 'next';
import { MapPin, Phone, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Nuestras Tiendas - Royal-Fernet',
    description: 'Encuentra nuestras boutiques y puntos de venta oficiales.',
};

export default async function StoresPage() {
    const stores = await fetchStores();

    return (
        <div className="bg-background">
            <div className="container mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold font-headline tracking-tight sm:text-5xl lg:text-6xl">Nuestras Tiendas</h1>
                    <p className="mt-4 text-xl text-muted-foreground">Visítanos y vive la experiencia Royal-Fernet.</p>
                </div>

                <div className="space-y-16">
                    {stores.map((store, index) => (
                        <div key={store.id} className={`grid md:grid-cols-2 gap-8 lg:gap-16 items-center ${index % 2 !== 0 ? 'md:grid-flow-row-dense' : ''}`}>
                            <div className={`aspect-video w-full rounded-lg overflow-hidden shadow-xl ${index % 2 !== 0 ? 'md:col-start-2' : ''}`}>
                                 <iframe
                                    src={store.map_embed_url}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                            <div className="p-6 rounded-lg">
                                <h2 className="text-3xl font-bold font-headline mb-4">{store.name}</h2>
                                <p className="text-lg text-primary/90 mb-6">{store.city}</p>
                                <div className="space-y-4 text-muted-foreground">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                                        <span>{store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                                        <span>{store.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                                        <span>{store.hours}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 {stores.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-2xl text-muted-foreground">Próximamente</p>
                        <p className="text-muted-foreground mt-2">Actualmente no tenemos tiendas físicas. ¡Vuelve pronto!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

    
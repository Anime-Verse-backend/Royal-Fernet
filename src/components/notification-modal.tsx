
/**
 * @fileoverview Componente modal para mostrar notificaciones al iniciar la app.
 * Obtiene la última notificación de la API y la muestra al usuario al cargar la página.
 */
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchLatestNotification } from '@/lib/data';
import type { Notification } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { getSafeImageUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Clock, ArrowRight } from 'lucide-react';


export function NotificationModal() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenNotification = sessionStorage.getItem('notification_seen');
    if (!hasSeenNotification) {
      fetchLatestNotification().then(data => {
        if (data) {
          setNotification(data);
          setIsOpen(true);
          sessionStorage.setItem('notification_seen', 'true');
        }
      });
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isOpen || !notification) {
    return null;
  }
  
  const safeImageUrl = getSafeImageUrl(notification.image_url, '512x288');

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
       <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {notification.image_url && (
            <div className="relative aspect-video w-full">
                <Image
                src={safeImageUrl}
                alt="Notification image"
                data-ai-hint="announcement promotion"
                fill
                className="object-cover"
                />
                <Badge variant="secondary" className="absolute top-3 left-3 animate-pulse">NUEVO</Badge>
            </div>
        )}
        <div className="p-6 text-center">
            <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-headline">{notification.title || '¡Un Anuncio Especial!'}</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground pt-2">
                    {notification.message}
                </DialogDescription>
            </DialogHeader>

            <div className="flex justify-around items-center my-6 py-4 border-y">
                <div className="flex flex-col items-center gap-2">
                    <Check className="h-6 w-6 text-green-500" />
                    <span className="text-xs font-medium">Seguro</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <span className="text-xs font-medium">Premium</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Clock className="h-6 w-6 text-blue-500" />
                    <span className="text-xs font-medium">Rápido</span>
                </div>
            </div>

            <DialogFooter className="sm:justify-center gap-2 w-full flex-col sm:flex-row">
                <DialogClose asChild>
                    <Button type="button" variant="ghost" className="w-full sm:w-auto">
                        Ahora no
                    </Button>
                </DialogClose>
                {notification.link_url && (
                    <Button asChild className="w-full sm:w-auto">
                    <a href={notification.link_url} target="_blank" rel="noopener noreferrer">
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                    </Button>
                )}
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

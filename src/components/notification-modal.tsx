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
} from '@/components/ui/dialog';
import { getSafeImageUrl } from '@/lib/utils';
import { PartyPopper } from 'lucide-react';


export function NotificationModal() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Solo mostramos la notificación una vez por sesión del navegador
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
  
  const safeImageUrl = getSafeImageUrl(notification.imageUrl, '512x288');

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
       <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {notification.imageUrl && (
          <div className="relative aspect-video w-full">
            <Image
              src={safeImageUrl}
              alt="Notification image"
              data-ai-hint="announcement promotion"
              fill
              className="object-cover"
            />
          </div>
        )}
        <DialogHeader className="p-6 pb-2 text-center items-center space-y-4">
          <PartyPopper className="h-10 w-10 text-primary" />
          <DialogTitle className="text-2xl font-headline">¡Un Anuncio Especial!</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {notification.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="p-6 pt-4 sm:justify-center gap-2 w-full flex-col-reverse sm:flex-row">
            <Button type="button" variant="secondary" onClick={handleDismiss} className="w-full sm:w-auto">
                Cerrar
            </Button>
            {notification.linkUrl && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={notification.linkUrl} target="_blank" rel="noopener noreferrer">Ver más</a>
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

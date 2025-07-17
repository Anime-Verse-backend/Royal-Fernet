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

export function NotificationModal() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchLatestNotification().then(data => {
      if (data) {
        setNotification(data);
        setIsOpen(true);
      }
    });
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isOpen || !notification) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
       <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {notification.imageUrl && (
          <div className="relative aspect-video w-full">
            <Image
              src={notification.imageUrl}
              alt="Notification image"
              data-ai-hint="announcement promotion"
              fill
              className="object-cover"
            />
          </div>
        )}
        <DialogHeader className="p-6 text-center items-center">
          <DialogTitle className="text-2xl font-headline">A Special Announcement</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {notification.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="px-6 pb-6 pt-0 sm:justify-center gap-2 w-full flex-col-reverse sm:flex-row">
            <Button type="button" variant="secondary" onClick={handleDismiss} className="w-full sm:w-auto">
                Dismiss
            </Button>
            {notification.linkUrl && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={notification.linkUrl}>Check it out</a>
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

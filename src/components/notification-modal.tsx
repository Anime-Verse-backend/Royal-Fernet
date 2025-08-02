/**
 * @fileoverview Componente modal para mostrar notificaciones al iniciar la app.
 * Obtiene la última notificación de la API y la muestra al usuario al cargar la página.
 * Diseño minimalista elegante con colores negro y blanco.
 */
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
import { Bell, X, ArrowRight, Clock, Star, Check } from 'lucide-react';

export function NotificationModal() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number, scale: number}>>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenNotification = sessionStorage.getItem('notification_seen');
    if (!hasSeenNotification) {
      fetchLatestNotification().then(data => {
        if (data) {
          setNotification(data);
          setIsOpen(true);
          sessionStorage.setItem('notification_seen', 'true');
          
          // Animación secuencial suave
          setTimeout(() => setIsImageLoaded(true), 200);
          setTimeout(() => setShowContent(true), 400);
        }
      });
    }
  }, []);

  // Efecto ripple minimalista
  const createRipple = (x: number, y: number) => {
    const newRipple = {
      id: Date.now(),
      x,
      y,
      scale: 0
    };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };

  // Seguimiento sutil del mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const newX = ((e.clientX - rect.left) / rect.width) * 100;
      const newY = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition(prev => ({
        x: prev.x + (newX - prev.x) * 0.05,
        y: prev.y + (newY - prev.y) * 0.05
      }));
    }
  };

  const handleDismiss = () => {
    setShowContent(false);
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    createRipple(x, y);
  };

  // Animación de ripples
  useEffect(() => {
    if (ripples.length > 0) {
      ripples.forEach(ripple => {
        setTimeout(() => {
          setRipples(prev => prev.map(r => 
            r.id === ripple.id ? { ...r, scale: 100 } : r
          ));
        }, 10);
      });
    }
  }, [ripples.length]);

  if (!isOpen || !notification) {
    return null;
  }
  
  const safeImageUrl = getSafeImageUrl(notification.image_url, '512x288');

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent 
        ref={modalRef}
        onMouseMove={handleMouseMove}
        className="sm:max-w-lg p-0 overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-black rounded-2xl shadow-2xl"
      >
        {/* Efecto sutil de mouse */}
        <div 
          className="absolute w-64 h-64 bg-gray-500/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none transition-all duration-700 z-0"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Ripples */}
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute pointer-events-none border border-black/20 dark:border-white/20 rounded-full z-10"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              width: `${ripple.scale}px`,
              height: `${ripple.scale}px`,
              transform: 'translate(-50%, -50%)',
              transition: 'all 1s ease-out',
              opacity: 1 - (ripple.scale / 100)
            }}
          />
        ))}

        {/* Botón de cerrar minimalista personalizado */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-50 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200 group"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
        </button>

        <div className="relative z-20">
          {/* Header limpio */}
          <DialogHeader className="p-6 pb-4 text-center items-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide">NUEVO</span>
            </div>
            
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-black dark:bg-white rounded-full blur-md opacity-10 animate-pulse" />
              <div className="relative p-4 bg-gray-50 dark:bg-gray-950 rounded-full">
                <Bell className="h-8 w-8 text-black dark:text-white" />
              </div>
            </div>
          </DialogHeader>

          {/* Imagen minimalista */}
          {notification.image_url && (
            <div className="relative mx-6 mb-6 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
              <Image
                src={safeImageUrl}
                alt="Notification image"
                data-ai-hint="announcement promotion"
                width={512}
                height={288}
                className={`w-full h-48 object-cover transition-all duration-700 ${
                  isImageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                }`}
                onLoad={() => setIsImageLoaded(true)}
              />
              
              {/* Overlay sutil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          {/* Contenido principal */}
          <div className={`px-6 pb-2 transition-all duration-500 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <DialogTitle className="text-xl font-semibold text-black dark:text-white mb-3 text-center">
              {notification.title || 'Nueva Notificación'}
            </DialogTitle>
            
            <DialogDescription className="text-gray-600 dark:text-gray-400 leading-relaxed text-center mb-6 font-light">
              {notification.message}
            </DialogDescription>

            {/* Features minimalistas */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Check, text: "Seguro" },
                { icon: Star, text: "Premium" },
                { icon: Clock, text: "Rápido" }
              ].map((feature, i) => (
                <div key={i} className="text-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors duration-200">
                  <feature.icon className="h-5 w-5 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Separador sutil */}
            <div className="h-px bg-gray-200 dark:bg-gray-800 mb-6" />
          </div>

          {/* Footer con botones minimalistas */}
          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button 
              type="button" 
              variant="ghost"
              onClick={handleDismiss} 
              className="flex-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-950 border-0 font-medium"
            >
              Ahora no
            </Button>
            
            {notification.link_url ? (
              <Button 
                asChild 
                onClick={handleCtaClick}
                className="relative flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-medium overflow-hidden group border-0"
              >
                <a href={notification.link_url} target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center justify-center gap-2">
                    <span>Ver más</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  
                  {/* Efecto hover sutil */}
                  <div className="absolute inset-0 bg-white/10 dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </Button>
            ) : (
              <Button 
                onClick={handleCtaClick}
                className="relative flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-medium overflow-hidden group border-0"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Continuar</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                
                {/* Efecto hover sutil */}
                <div className="absolute inset-0 bg-white/10 dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
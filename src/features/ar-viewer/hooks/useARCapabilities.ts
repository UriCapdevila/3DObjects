'use client';

import { useEffect, useState } from 'react';

export interface ARCapabilities {
  /** Está en un contexto seguro (HTTPS o localhost) */
  isSecureContext: boolean;
  /** Es un dispositivo móvil */
  isMobile: boolean;
  /** Detectó iOS (iPhone/iPad) */
  isIOS: boolean;
  /** Detectó Android */
  isAndroid: boolean;
  /** WebXR está disponible (Android Chrome con ARCore) */
  hasWebXR: boolean;
  /** El navegador soporta AR de algún modo */
  canDoAR: boolean;
  /** Razón principal por la que NO puede hacer AR (si aplica) */
  blockingReason: string | null;
  /** User agent string (para debugging) */
  userAgent: string;
  /** Estado de la detección */
  ready: boolean;
}

export function useARCapabilities(): ARCapabilities {
  const [caps, setCaps] = useState<ARCapabilities>({
    isSecureContext: false,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    hasWebXR: false,
    canDoAR: false,
    blockingReason: null,
    userAgent: '',
    ready: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid;
    const isSecureContext = window.isSecureContext;

    const xr = (
      navigator as Navigator & {
        xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
      }
    ).xr;

    const checkWebXR = async () => {
      let hasWebXR = false;
      if (xr?.isSessionSupported) {
        try {
          hasWebXR = await xr.isSessionSupported('immersive-ar');
        } catch {
          hasWebXR = false;
        }
      }

      const canDoAR = isSecureContext && isMobile && (hasWebXR || isIOS);

      let blockingReason: string | null = null;
      if (!isSecureContext) {
        blockingReason =
          'Se necesita HTTPS para AR. Cuando esté en Netlify se resuelve solo.';
      } else if (!isMobile) {
        blockingReason =
          'AR solo funciona en celular. En desktop podés rotar el modelo 3D pero no plantarlo en tu entorno.';
      } else if (isAndroid && !hasWebXR) {
        blockingReason =
          'Tu Android no expone WebXR. Verificá: 1) usás Chrome actualizado, 2) tenés "Google Play Services for AR" instalado desde Play Store, 3) tu modelo está en la lista de ARCore (developers.google.com/ar/devices).';
      }

      setCaps({
        isSecureContext,
        isMobile,
        isIOS,
        isAndroid,
        hasWebXR,
        canDoAR,
        blockingReason,
        userAgent: ua,
        ready: true,
      });
    };

    checkWebXR();
  }, []);

  return caps;
}

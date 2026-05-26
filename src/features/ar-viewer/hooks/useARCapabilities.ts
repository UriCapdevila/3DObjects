'use client';

import { useEffect, useState } from 'react';

/** Modos de visualización ordenados por calidad de UX (best → fallback). */
export type ARMode = 'native' | 'camera' | 'preview';

export interface ARCapabilities {
  /** Contexto seguro (HTTPS o localhost) */
  isSecureContext: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  /** WebXR / ARCore disponible (Android Chrome con ARCore en dispositivo whitelistado) */
  hasWebXR: boolean;
  /** Hay al menos una cámara (webcam o cam mobile) accesible vía getUserMedia */
  hasCamera: boolean;
  /** Modo recomendado para este dispositivo */
  recommendedMode: ARMode;
  /** Mensaje explicativo del modo elegido */
  modeReason: string;
  userAgent: string;
  ready: boolean;
}

export function useARCapabilities(): ARCapabilities {
  const [caps, setCaps] = useState<ARCapabilities>({
    isSecureContext: false,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    hasWebXR: false,
    hasCamera: false,
    recommendedMode: 'preview',
    modeReason: '',
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

    const detect = async () => {
      // 1) WebXR (Android con ARCore)
      let hasWebXR = false;
      const xr = (
        navigator as Navigator & {
          xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
        }
      ).xr;
      if (xr?.isSessionSupported) {
        try {
          hasWebXR = await xr.isSessionSupported('immersive-ar');
        } catch {
          /* no-op */
        }
      }

      // 2) getUserMedia (webcam / cámara mobile sin ARCore)
      let hasCamera = false;
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasCamera = devices.some((d) => d.kind === 'videoinput');
        } catch {
          /* no-op */
        }
      }

      // 3) Decisión del modo
      // - native: WebXR/ARCore en Android, o iOS (Quick Look siempre presente)
      // - camera: hay cámara accesible y HTTPS, pero no AR nativo
      // - preview: sin cámara o sin contexto seguro → solo modelo 3D
      let recommendedMode: ARMode;
      let modeReason: string;

      if (isSecureContext && (hasWebXR || isIOS)) {
        recommendedMode = 'native';
        modeReason = isIOS
          ? 'iOS Quick Look disponible — AR con tracking real.'
          : 'WebXR/ARCore disponible — AR con tracking real.';
      } else if (isSecureContext && hasCamera) {
        recommendedMode = 'camera';
        if (isAndroid) {
          modeReason =
            'Tu dispositivo no está en la whitelist de ARCore. Usaremos modo cámara como fondo (sin tracking pero igualmente útil para previsualizar).';
        } else if (!isMobile) {
          modeReason =
            'En desktop AR nativo no existe. Usaremos webcam como fondo para que veas el modelo en tu entorno.';
        } else {
          modeReason = 'Modo cámara: el modelo se ve sobre el feed de tu cámara.';
        }
      } else {
        recommendedMode = 'preview';
        if (!isSecureContext) {
          modeReason = 'Se necesita HTTPS para acceder a la cámara.';
        } else if (!hasCamera) {
          modeReason = 'No detectamos cámara en este dispositivo.';
        } else {
          modeReason = 'Solo preview 3D disponible.';
        }
      }

      setCaps({
        isSecureContext,
        isMobile,
        isIOS,
        isAndroid,
        hasWebXR,
        hasCamera,
        recommendedMode,
        modeReason,
        userAgent: ua,
        ready: true,
      });
    };

    detect();
  }, []);

  return caps;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { ARViewerProps } from '../types/ar-viewer.types';

/**
 * ARViewer
 * --------
 * Wrapper React sobre <model-viewer> de Google.
 * - Carga el script del Web Component dinámicamente (solo cliente).
 * - Expone callbacks tipados para integrarse con la capa de analytics.
 * - Es agnóstico al provider de storage: solo recibe URLs ya resueltas.
 */
export function ARViewer({
  src,
  iosSrc,
  alt,
  poster,
  enableAR = true,
  autoRotate = true,
  cameraControls = true,
  exposure = 1,
  shadowIntensity = 1,
  onLoad,
  onError,
  onAREnter,
  onARExit,
  className,
  style,
}: ARViewerProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // 1. Cargar el script de model-viewer una sola vez (client-side).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (customElements.get('model-viewer')) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src =
      'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      console.error('[ARViewer] No se pudo cargar model-viewer.');
    };
    document.head.appendChild(script);
  }, []);

  // 2. Suscribirse a eventos del Web Component cuando esté listo.
  useEffect(() => {
    if (!scriptReady || !viewerRef.current) return;
    const el = viewerRef.current;

    const handleLoad = () => onLoad?.();
    const handleError = (e: Event) => onError?.(e as ErrorEvent);
    const handleArStatus = (ev: Event) => {
      const detail = (ev as CustomEvent<{ status: string }>).detail;
      if (detail?.status === 'session-started') onAREnter?.();
      if (detail?.status === 'not-presenting') onARExit?.();
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('error', handleError);
    el.addEventListener('ar-status', handleArStatus);

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('error', handleError);
      el.removeEventListener('ar-status', handleArStatus);
    };
  }, [scriptReady, onLoad, onError, onAREnter, onARExit]);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-neutral-100',
        'aspect-square md:aspect-[4/3]',
        className,
      )}
      style={style}
    >
      {!scriptReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
        </div>
      )}

      {scriptReady && (
        <model-viewer
          ref={viewerRef as React.RefObject<HTMLElement>}
          src={src}
          ios-src={iosSrc}
          alt={alt}
          poster={poster}
          ar={enableAR}
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          ar-placement="floor"
          camera-controls={cameraControls}
          auto-rotate={autoRotate}
          shadow-intensity={shadowIntensity}
          exposure={exposure}
          loading="lazy"
          reveal="auto"
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        >
          {/* Botón AR custom — reemplaza el default de model-viewer.
              El atributo `slot="ar-button"` es lo que activa el override. */}
          {enableAR && (
            <button
              slot="ar-button"
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-neutral-800 active:scale-95"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Ver en tu espacio
            </button>
          )}
        </model-viewer>
      )}
    </div>
  );
}

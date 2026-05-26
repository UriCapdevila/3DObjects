'use client';

import { useState } from 'react';
import { useARCapabilities, type ARMode } from '../hooks/useARCapabilities';
import { ARViewer } from './ARViewer';
import { ARCameraViewer } from './ARCameraViewer';
import { cn } from '@/lib/utils/cn';

export interface SmartARViewerProps {
  /** URL del modelo .glb */
  src: string;
  /** URL del modelo .usdz (para iOS Quick Look) */
  iosSrc?: string;
  alt: string;
  poster?: string;
  className?: string;
  /** Callback con el modo seleccionado (útil para analytics) */
  onModeSelected?: (mode: ARMode) => void;
}

/**
 * SmartARViewer
 * -------------
 * Componente público del feature. Decide qué experiencia ofrecer:
 *
 *   recommendedMode === 'native'  → <ARViewer> (Scene Viewer / Quick Look)
 *   recommendedMode === 'camera'  → <ARCameraViewer> (Magic Mirror)
 *   recommendedMode === 'preview' → <ARViewer> sin botón AR
 *
 * En modo 'camera' arranca con un preview 3D y un botón "Iniciar cámara",
 * para no pedir permisos antes de que el usuario lo decida explícitamente.
 *
 * Para analytics: onModeSelected dispara cuando se elige el modo inicial.
 * Cuando exista services/analytics, se va a poder trackear conversion
 * por tipo de experiencia.
 */
export function SmartARViewer({
  src,
  iosSrc,
  alt,
  poster,
  className,
  onModeSelected,
}: SmartARViewerProps) {
  const caps = useARCapabilities();
  const [cameraActive, setCameraActive] = useState(false);
  const [modeAnnounced, setModeAnnounced] = useState(false);

  // Anunciar el modo seleccionado una sola vez cuando caps está listo
  if (caps.ready && !modeAnnounced) {
    onModeSelected?.(caps.recommendedMode);
    setModeAnnounced(true);
  }

  if (!caps.ready) {
    return (
      <div
        className={cn(
          'flex aspect-square w-full items-center justify-center rounded-2xl bg-neutral-100 md:aspect-[4/3]',
          className,
        )}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
      </div>
    );
  }

  // Modo nativo: AR con tracking real
  if (caps.recommendedMode === 'native') {
    return (
      <ARViewer
        src={src}
        iosSrc={iosSrc}
        alt={alt}
        poster={poster}
        className={className}
      />
    );
  }

  // Modo cámara activo: Magic Mirror
  if (caps.recommendedMode === 'camera' && cameraActive) {
    return (
      <div className="relative">
        <ARCameraViewer
          src={src}
          alt={alt}
          className={className}
          onError={() => setCameraActive(false)}
        />
        <button
          type="button"
          onClick={() => setCameraActive(false)}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition active:scale-95"
        >
          ✕ Volver a preview
        </button>
      </div>
    );
  }

  // Modo cámara no iniciado o modo preview: mostrar preview 3D
  // Con botón "Iniciar cámara" si el modo recomendado lo permite
  return (
    <div className="relative">
      <ARViewer
        src={src}
        iosSrc={iosSrc}
        alt={alt}
        poster={poster}
        enableAR={false}
        className={className}
      />

      {caps.recommendedMode === 'camera' && (
        <button
          type="button"
          onClick={() => setCameraActive(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-neutral-800 active:scale-95"
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
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Ver con mi cámara
        </button>
      )}
    </div>
  );
}

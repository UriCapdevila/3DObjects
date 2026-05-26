import type { CSSProperties } from 'react';

export interface ARViewerProps {
  /** URL del modelo .glb (Android / desktop / WebXR) */
  src: string;
  /** URL del modelo .usdz (iOS Quick Look). Opcional pero recomendado. */
  iosSrc?: string;
  /** Texto alternativo accesible. */
  alt: string;
  /** Imagen de poster mostrada mientras carga el modelo (mejora LCP). */
  poster?: string;
  /** Activa el botón AR. Default: true */
  enableAR?: boolean;
  /** Rotación automática del modelo en preview. Default: true */
  autoRotate?: boolean;
  /** Permitir al usuario rotar/mover con touch o mouse. Default: true */
  cameraControls?: boolean;
  /** Exposición de la escena (1 = neutral). */
  exposure?: number;
  /** Sombra del modelo (0 a 1). */
  shadowIntensity?: number;
  /** Callback cuando el modelo termina de cargar. */
  onLoad?: () => void;
  /** Callback cuando hay un error de carga. */
  onError?: (error: ErrorEvent) => void;
  /** Callback cuando el usuario entra al modo AR. */
  onAREnter?: () => void;
  /** Callback cuando el usuario sale del modo AR. */
  onARExit?: () => void;
  /** Clases adicionales para el contenedor. */
  className?: string;
  /** Estilos inline para el contenedor. */
  style?: CSSProperties;
}

/**
 * Tipado mínimo para que TypeScript acepte <model-viewer> en JSX.
 * En React 19 se extiende `React.JSX.IntrinsicElements` (no el namespace global).
 */
type ModelViewerAttributes = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string;
    'ios-src'?: string;
    alt?: string;
    poster?: string;
    ar?: boolean;
    'ar-modes'?: string;
    'ar-scale'?: string;
    'ar-placement'?: 'floor' | 'wall';
    'camera-controls'?: boolean;
    'auto-rotate'?: boolean;
    'shadow-intensity'?: string | number;
    exposure?: string | number;
    loading?: 'auto' | 'lazy' | 'eager';
    reveal?: 'auto' | 'interaction' | 'manual';
  },
  HTMLElement
>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

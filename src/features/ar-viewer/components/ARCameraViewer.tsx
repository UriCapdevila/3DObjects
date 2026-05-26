'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cn } from '@/lib/utils/cn';

export interface ARCameraViewerProps {
  /** URL del .glb a renderizar encima del feed de cámara */
  src: string;
  alt?: string;
  /** Callback cuando arranca la cámara */
  onCameraStart?: () => void;
  /** Callback cuando se cierra */
  onCameraStop?: () => void;
  /** Callback de error (permisos denegados, sin cámara, etc.) */
  onError?: (msg: string) => void;
  className?: string;
}

/**
 * ARCameraViewer ("Magic Mirror")
 * -------------------------------
 * Fallback para dispositivos sin ARCore.
 * Renderiza el feed de la cámara como fondo y un modelo 3D superpuesto.
 * No tiene tracking de superficies — el modelo queda anclado a la cámara virtual,
 * no al mundo real. Es UX intencionalmente diferente al AR nativo.
 *
 * Soporta:
 * - Desktop con webcam
 * - Mobile sin ARCore (ej. Poco C65, Moto E, Redmi gama baja)
 * - Cualquier navegador con getUserMedia + HTTPS
 *
 * No soporta: tracking de piso/paredes (para eso necesitarías MindAR o WebXR).
 */
export function ARCameraViewer({
  src,
  alt = 'Modelo 3D',
  onCameraStart,
  onCameraStop,
  onError,
  className,
}: ARCameraViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const sceneStateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    model?: THREE.Group;
    controls?: OrbitControls;
  }>({});

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Inicializar cámara + escena Three.js
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!videoRef.current || !canvasRef.current || !containerRef.current) return;

      setStatus('loading');

      // 1) Pedir cámara
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        onCameraStart?.();
      } catch (e) {
        const msg =
          e instanceof Error && e.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Habilitalo en los settings del navegador.'
            : e instanceof Error
              ? e.message
              : 'No se pudo acceder a la cámara.';
        setErrorMsg(msg);
        setStatus('error');
        onError?.(msg);
        return;
      }

      // 2) Escena Three.js (canvas transparente encima del video)
      const container = containerRef.current!;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // transparente

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
      camera.position.set(0, 0.3, 2);

      // Luces (importantes para que el modelo no se vea plano)
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 1);
      dir.position.set(2, 3, 2);
      scene.add(dir);

      // Controles: el usuario puede rotar y zoomear el modelo
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.target.set(0, 0.3, 0);

      // 3) Cargar el modelo
      const loader = new GLTFLoader();
      loader.load(
        src,
        (gltf) => {
          if (cancelled) return;
          const model = gltf.scene;
          // Centrar y escalar el modelo a un tamaño manejable
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);
          model.position.sub(center); // centrar en origen
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1 / maxDim;
          model.scale.setScalar(scale);
          scene.add(model);
          sceneStateRef.current.model = model;
          setStatus('ready');
        },
        undefined,
        (err) => {
          if (cancelled) return;
          const msg = `Error cargando modelo: ${(err as Error).message ?? 'desconocido'}`;
          setErrorMsg(msg);
          setStatus('error');
          onError?.(msg);
        },
      );

      sceneStateRef.current = { renderer, scene, camera, controls };

      // 4) Loop de render
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // 5) Resize handler
      const onResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      return () => window.removeEventListener('resize', onResize);
    };

    start();

    // Cleanup
    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const { renderer, controls, scene } = sceneStateRef.current;
      controls?.dispose();
      renderer?.dispose();
      scene?.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      onCameraStop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, facingMode]);

  const flipCamera = () => {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-black',
        'aspect-square md:aspect-[4/3]',
        className,
      )}
      aria-label={alt}
    >
      {/* Feed de cámara (fondo) */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
      />

      {/* Canvas 3D (encima del video, transparente) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-sm">Activando cámara…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-white">
          <div className="max-w-xs text-center">
            <p className="mb-2 text-lg">⚠️ No se pudo iniciar la cámara</p>
            <p className="text-sm text-white/80">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Controles */}
      {status === 'ready' && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          <button
            type="button"
            onClick={flipCamera}
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg backdrop-blur transition active:scale-95"
            title="Cambiar cámara"
          >
            🔄 Cámara
          </button>
        </div>
      )}

      {/* Badge informativo */}
      {status === 'ready' && (
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
          Modo cámara · sin tracking
        </div>
      )}
    </div>
  );
}

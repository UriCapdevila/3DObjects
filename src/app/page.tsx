'use client';

import { ARViewer, ARSupportBadge } from '@/features/ar-viewer';

/**
 * Página principal — Validación del pipeline AR.
 *
 * Modelos:
 * - rack-demo.glb (servido desde public/models/) → funciona en Android
 * - rack-demo.usdz → falta generar (ver instrucciones más abajo).
 *   Sin .usdz, iOS NO abre la cámara aunque el botón AR aparezca.
 */
export default function HomePage() {
  const model = {
    src: '/models/rack-demo.glb',
    iosSrc: '/models/rack-demo.usdz', // 404 hasta que lo generes, no rompe Android
    alt: 'Rack de madera de 3 estantes — modelo demo',
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Rack AR — MVP</h1>
        <p className="mt-2 text-neutral-600">
          Abrí esta página desde tu <strong>celular</strong> (Android Chrome o iPhone Safari)
          para plantar el rack en tu entorno real.
        </p>
      </header>

      <ARViewer
        src={model.src}
        iosSrc={model.iosSrc}
        alt={model.alt}
        onLoad={() => console.log('[ARViewer] modelo cargado')}
        onAREnter={() => console.log('[ARViewer] sesión AR iniciada — cámara activa')}
        onARExit={() => console.log('[ARViewer] sesión AR finalizada')}
        onError={(e) => console.error('[ARViewer] error:', e)}
      />

      <ARSupportBadge className="mt-6" modelUrls={model} />

      <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Flujo de validación</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Verificá en <em>desktop</em> que el rack se renderiza y rota (preview 3D).</li>
          <li>Tocá <em>&quot;Verificar archivos del modelo&quot;</em> arriba — debería decir <code>.glb → 200 · model/gltf-binary</code>.</li>
          <li>Deploy a Netlify (ver README).</li>
          <li>Abrí la URL de Netlify desde tu celu → tocá <em>&quot;Ver en tu espacio&quot;</em>.</li>
        </ol>
      </section>
    </main>
  );
}

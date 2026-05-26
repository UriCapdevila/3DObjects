'use client';

import { SmartARViewer, ARSupportBadge } from '@/features/ar-viewer';

export default function HomePage() {
  const model = {
    src: '/models/rack-demo.glb',
    iosSrc: '/models/rack-demo.usdz',
    alt: 'Rack de madera de 3 estantes — modelo demo',
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Rack AR — MVP</h1>
        <p className="mt-2 text-neutral-600">
          Visualizá el rack en tu entorno. Si tu dispositivo soporta AR nativo
          (ARCore o iOS Quick Look), vas a tener tracking real.
          Si no, podés usar el modo cámara como fondo.
        </p>
      </header>

      <SmartARViewer
        src={model.src}
        iosSrc={model.iosSrc}
        alt={model.alt}
        onModeSelected={(mode) => {
          // 🔮 Cuando exista services/analytics:
          // analytics.track('ar_mode_selected', { mode, productId: '...' });
          console.log('[SmartARViewer] modo seleccionado:', mode);
        }}
      />

      <ARSupportBadge className="mt-6" modelUrls={model} />

      <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Sobre los modos</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>AR nativo</strong>: tracking de piso real. Android con ARCore
            o cualquier iPhone moderno.
          </li>
          <li>
            <strong>Cámara (Magic Mirror)</strong>: el modelo se ve sobre el feed
            de tu cámara. Sin tracking pero útil como preview en cualquier
            dispositivo (Poco C65 incluido).
          </li>
          <li>
            <strong>Preview 3D</strong>: solo modelo rotable. Fallback final si no
            hay cámara o HTTPS.
          </li>
        </ul>
      </section>
    </main>
  );
}

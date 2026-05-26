'use client';

import { useState } from 'react';
import { useARCapabilities } from '../hooks/useARCapabilities';
import { cn } from '@/lib/utils/cn';

interface Props {
  className?: string;
  /** URLs de los modelos para diagnóstico de red */
  modelUrls?: { src: string; iosSrc?: string };
}

/**
 * Panel de diagnóstico AR.
 * En mobile sin AR muestra qué falta. En desktop confirma que es esperado.
 * También verifica que los archivos del modelo se sirvan con HTTP 200 + MIME correcto.
 */
export function ARSupportBadge({ className, modelUrls }: Props) {
  const caps = useARCapabilities();
  const [netCheck, setNetCheck] = useState<{
    src?: { status: number; type: string };
    iosSrc?: { status: number; type: string };
    error?: string;
  } | null>(null);

  const runNetworkCheck = async () => {
    if (!modelUrls) return;
    try {
      const checks: typeof netCheck = {};
      const r1 = await fetch(modelUrls.src, { method: 'HEAD' });
      checks!.src = {
        status: r1.status,
        type: r1.headers.get('content-type') || 'unknown',
      };
      if (modelUrls.iosSrc) {
        const r2 = await fetch(modelUrls.iosSrc, { method: 'HEAD' });
        checks!.iosSrc = {
          status: r2.status,
          type: r2.headers.get('content-type') || 'unknown',
        };
      }
      setNetCheck(checks);
    } catch (e) {
      setNetCheck({ error: (e as Error).message });
    }
  };

  const Row = ({ label, ok }: { label: string; ok: boolean }) => (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          ok ? 'bg-emerald-500' : 'bg-red-500',
        )}
      />
      <span className="text-neutral-700">{label}</span>
    </li>
  );

  if (!caps.ready) {
    return (
      <div className={cn('rounded-xl border border-neutral-200 bg-white p-4', className)}>
        <p className="text-sm text-neutral-500">Detectando capacidades…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm',
        className,
      )}
    >
      <p className="mb-3 font-medium text-neutral-900">Diagnóstico AR</p>

      <ul className="space-y-1.5">
        <Row label="HTTPS / contexto seguro" ok={caps.isSecureContext} />
        <Row label="Dispositivo móvil" ok={caps.isMobile} />
        {caps.isAndroid && <Row label="WebXR / ARCore" ok={caps.hasWebXR} />}
        {caps.isIOS && <Row label="iOS Quick Look disponible" ok={true} />}
        <Row label="Puede iniciar AR" ok={caps.canDoAR} />
      </ul>

      {caps.blockingReason && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-amber-900">
          <p className="font-medium">¿Por qué?</p>
          <p className="mt-1">{caps.blockingReason}</p>
        </div>
      )}

      {caps.canDoAR && (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-emerald-900">
          ✅ Tocá <strong>&quot;Ver en tu espacio&quot;</strong> abajo a la derecha del visor.
        </div>
      )}

      {modelUrls && (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={runNetworkCheck}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Verificar archivos del modelo
          </button>
          {netCheck && (
            <div className="mt-3 space-y-1 font-mono text-xs text-neutral-700">
              {netCheck.error && (
                <p className="text-red-600">Error: {netCheck.error}</p>
              )}
              {netCheck.src && (
                <p>
                  .glb → <span className={netCheck.src.status === 200 ? 'text-emerald-700' : 'text-red-600'}>
                    {netCheck.src.status}
                  </span>{' '}
                  · {netCheck.src.type}
                </p>
              )}
              {netCheck.iosSrc && (
                <p>
                  .usdz → <span className={netCheck.iosSrc.status === 200 ? 'text-emerald-700' : 'text-red-600'}>
                    {netCheck.iosSrc.status}
                  </span>{' '}
                  · {netCheck.iosSrc.type}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <details className="mt-4 border-t border-neutral-200 pt-3">
        <summary className="cursor-pointer text-xs font-medium text-neutral-600">
          Info del dispositivo (para debugging)
        </summary>
        <p className="mt-2 break-all font-mono text-xs text-neutral-500">
          {caps.userAgent}
        </p>
      </details>
    </div>
  );
}

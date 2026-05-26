'use client';

import { useState } from 'react';
import { useARCapabilities } from '../hooks/useARCapabilities';
import { cn } from '@/lib/utils/cn';

interface Props {
  className?: string;
  modelUrls?: { src: string; iosSrc?: string };
}

const MODE_LABELS = {
  native: { label: 'AR nativo', color: 'emerald', icon: '🎯' },
  camera: { label: 'Cámara (Magic Mirror)', color: 'blue', icon: '📷' },
  preview: { label: 'Preview 3D', color: 'neutral', icon: '🔄' },
} as const;

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

  const mode = MODE_LABELS[caps.recommendedMode];

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-neutral-900">Diagnóstico AR</p>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            mode.color === 'emerald' && 'bg-emerald-100 text-emerald-800',
            mode.color === 'blue' && 'bg-blue-100 text-blue-800',
            mode.color === 'neutral' && 'bg-neutral-100 text-neutral-700',
          )}
        >
          {mode.icon} {mode.label}
        </span>
      </div>

      <ul className="space-y-1.5">
        <Row label="HTTPS / contexto seguro" ok={caps.isSecureContext} />
        <Row label="Dispositivo móvil" ok={caps.isMobile} />
        {caps.isAndroid && <Row label="WebXR / ARCore" ok={caps.hasWebXR} />}
        {caps.isIOS && <Row label="iOS Quick Look" ok={true} />}
        <Row label="Cámara accesible (getUserMedia)" ok={caps.hasCamera} />
      </ul>

      <div
        className={cn(
          'mt-3 rounded-lg p-3',
          caps.recommendedMode === 'native' && 'bg-emerald-50 text-emerald-900',
          caps.recommendedMode === 'camera' && 'bg-blue-50 text-blue-900',
          caps.recommendedMode === 'preview' && 'bg-amber-50 text-amber-900',
        )}
      >
        <p className="font-medium">{mode.label}</p>
        <p className="mt-1">{caps.modeReason}</p>
      </div>

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
                  .glb →{' '}
                  <span
                    className={
                      netCheck.src.status === 200 ? 'text-emerald-700' : 'text-red-600'
                    }
                  >
                    {netCheck.src.status}
                  </span>{' '}
                  · {netCheck.src.type}
                </p>
              )}
              {netCheck.iosSrc && (
                <p>
                  .usdz →{' '}
                  <span
                    className={
                      netCheck.iosSrc.status === 200
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }
                  >
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
          Info del dispositivo
        </summary>
        <p className="mt-2 break-all font-mono text-xs text-neutral-500">
          {caps.userAgent}
        </p>
      </details>
    </div>
  );
}

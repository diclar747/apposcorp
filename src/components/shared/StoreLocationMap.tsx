import { useState } from 'react';
import { MapPin, LocateFixed } from 'lucide-react';

interface StoreLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  editable?: boolean;
  onChange?: (lat: number, lng: number) => void;
  height?: string;
}

// Modo edición: pide la ubicación del navegador (sin API key ni costo).
// Modo lectura: embed gratuito de Google Maps por URL (tampoco requiere API key).
export function StoreLocationMap({ latitude, longitude, editable = false, onChange, height = '220px' }: StoreLocationMapProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange?.(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('No se pudo obtener tu ubicación. Revisá los permisos de ubicación del navegador.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (editable) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-60"
        >
          <LocateFixed className="w-4 h-4" />
          {locating ? 'Obteniendo ubicación...' : hasCoords ? 'Actualizar mi ubicación' : 'Usar mi ubicación actual'}
        </button>
        {hasCoords && (
          <p className="text-xs text-slate-400 font-medium">
            Ubicación guardada ({latitude!.toFixed(5)}, {longitude!.toFixed(5)}).{' '}
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver en Google Maps
            </a>
          </p>
        )}
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }

  if (!hasCoords) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center px-4"
      >
        <MapPin className="w-6 h-6 text-slate-300" />
        <p className="text-xs text-slate-400 font-medium">Ubicación no disponible</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <iframe
        title="Ubicación de la tienda"
        src={`https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`}
        style={{ width: '100%', height, border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

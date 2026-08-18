import { useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Asunción, Paraguay
const DEFAULT_CENTER = { lat: -25.2637, lng: -57.5759 };

interface StoreLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  editable?: boolean;
  onChange?: (lat: number, lng: number) => void;
  height?: string;
}

export function StoreLocationMap({ latitude, longitude, editable = false, onChange, height = '280px' }: StoreLocationMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
  });

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const center = hasCoords ? { lat: latitude as number, lng: longitude as number } : DEFAULT_CENTER;

  const handleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!editable || !onChange || !e.latLng) return;
    onChange(e.latLng.lat(), e.latLng.lng());
  }, [editable, onChange]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!editable || !onChange || !e.latLng) return;
    onChange(e.latLng.lat(), e.latLng.lng());
  }, [editable, onChange]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center px-4"
      >
        <MapPin className="w-6 h-6 text-slate-300" />
        <p className="text-xs text-slate-400 font-medium">
          Mapa no disponible: falta configurar la clave de Google Maps (VITE_GOOGLE_MAPS_API_KEY).
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div style={{ height }} className="rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={center}
        zoom={hasCoords ? 16 : 13}
        onClick={handleClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {hasCoords && (
          <Marker
            position={center}
            draggable={editable}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </GoogleMap>
      {editable && (
        <p className="text-[11px] text-slate-400 font-medium px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          Hacé clic en el mapa o arrastrá el pin para ubicar tu tienda.
        </p>
      )}
    </div>
  );
}

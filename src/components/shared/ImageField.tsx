import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Subir imágenes desde la computadora o el teléfono (en el celular abre cámara o galería),
// o pegar una URL. Las imágenes se comprimen en el navegador y se guardan igual que en el resto
// del sistema (perfil, tienda del vendedor, productos del vendedor).

const MAX_FILE_SIZE = 20 * 1024 * 1024; // antes de comprimir

const isValidUrl = (url: string) => /^https?:\/\/.+/i.test(url);

async function processFile(file: File, maxWidth: number, maxHeight: number) {
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten archivos de imagen');
  if (file.size > MAX_FILE_SIZE) throw new Error('La imagen no puede superar 20MB');
  return compressImage(file, maxWidth, maxHeight, 0.82);
}

function UrlInput({ onAdd, disabled }: { onAdd: (url: string) => void; disabled?: boolean }) {
  const [url, setUrl] = useState('');
  const add = () => {
    const value = url.trim();
    if (!value) return;
    if (!isValidUrl(value)) {
      toast.error('Ingresa una URL válida (https://...)');
      return;
    }
    onAdd(value);
    setUrl('');
  };
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={url}
          disabled={disabled}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="o pegar URL de imagen (https://...)"
          className="pl-8 text-sm h-9"
        />
      </div>
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={add} disabled={disabled}>
        Usar
      </Button>
    </div>
  );
}

interface SingleImageFieldProps {
  value?: string | null;
  onChange: (value: string) => void;
  /** 'square' para logos, 'wide' para banners */
  shape?: 'square' | 'wide';
  maxWidth?: number;
  maxHeight?: number;
}

/** Una sola imagen (logo, banner). */
export function SingleImageField({ value, onChange, shape = 'square', maxWidth, maxHeight }: SingleImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const wide = shape === 'wide';

  const handleFile = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      onChange(await processFile(file, maxWidth ?? (wide ? 1600 : 500), maxHeight ?? (wide ? 600 : 500)));
    } catch (e: any) {
      toast.error(e.message || 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            'relative shrink-0 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer overflow-hidden flex items-center justify-center bg-muted/40 transition-colors',
            wide ? 'w-40 h-16' : 'w-16 h-16',
          )}
          title="Subir imagen"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
            <Upload className="w-4 h-4 mr-1.5" />
            {value ? 'Cambiar imagen' : 'Subir desde el equipo'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 h-7" onClick={() => onChange('')}>
              <X className="w-3.5 h-3.5 mr-1" /> Quitar
            </Button>
          )}
        </div>
      </div>
      <UrlInput onAdd={onChange} disabled={loading} />
    </div>
  );
}

interface ImageGalleryFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}

/** Varias imágenes (productos). La primera es la principal. */
export function ImageGalleryField({ value, onChange, max = 5 }: ImageGalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(0);
  const images = value || [];
  const room = max - images.length;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (files.length > room) toast.warning(`Máximo ${max} imágenes: se agregan solo ${Math.max(0, room)}`);
    const accepted = files.slice(0, Math.max(0, room));
    setProcessing(accepted.length);
    const results: string[] = [];
    for (const file of accepted) {
      try {
        results.push(await processFile(file, 800, 800));
      } catch (e: any) {
        toast.error(`${file.name}: ${e.message || 'no se pudo procesar'}`);
      }
    }
    setProcessing(0);
    if (results.length) onChange([...images, ...results]);
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));
  const makeMain = (idx: number) => onChange([images[idx], ...images.filter((_, i) => i !== idx)]);

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button type="button" onClick={() => remove(idx)} className="text-white text-[10px] font-semibold flex items-center gap-0.5" aria-label={`Quitar imagen ${idx + 1}`}>
                  <X className="w-3.5 h-3.5" /> Quitar
                </button>
                {idx > 0 && (
                  <button type="button" onClick={() => makeMain(idx)} className="text-white text-[10px] font-semibold underline">
                    Hacer principal
                  </button>
                )}
              </div>
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[9px] text-center py-0.5">Principal</span>
              )}
            </div>
          ))}
        </div>
      )}

      {room > 0 && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(Array.from(e.target.files || []));
              e.target.value = '';
            }}
          />
          <div
            onClick={() => !processing && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(Array.from(e.dataTransfer.files));
            }}
            className="border-2 border-dashed border-border hover:border-primary rounded-lg p-4 text-center cursor-pointer transition-colors"
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando {processing} imagen(es)...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Tocá para elegir fotos de tu computadora o teléfono, o arrastralas acá</span>
                <span className="text-[10px]">{images.length}/{max} · JPG, PNG o WEBP</span>
              </div>
            )}
          </div>
          <UrlInput onAdd={(url) => onChange([...images, url])} disabled={!!processing} />
        </>
      )}
    </div>
  );
}

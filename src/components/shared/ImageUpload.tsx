import { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  shape?: 'circle' | 'rect';
  maxWidth?: number;
  maxHeight?: number;
  label?: string;
  className?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB before compression

export function ImageUpload({
  value,
  onChange,
  shape = 'circle',
  maxWidth = 300,
  maxHeight = 300,
  label = 'Subir imagen',
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('La imagen no puede superar 20MB');
      return;
    }

    setLoading(true);
    try {
      const compressed = await compressImage(file, maxWidth, maxHeight);
      onChange(compressed);
    } catch {
      toast.error('Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => inputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isCircle = shape === 'circle';

  return (
    <div className={cn('relative group', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <div
        onClick={handleClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center bg-muted/50',
          isCircle ? 'w-24 h-24 rounded-full' : 'w-full aspect-[2/1] rounded-xl',
          loading && 'opacity-50 pointer-events-none'
        )}
      >
        {value ? (
          <img
            src={value}
            alt="Preview"
            className={cn(
              'w-full h-full object-cover',
              isCircle && 'rounded-full'
            )}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {isCircle ? (
              <Camera className="w-6 h-6" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-xs">{label}</span>
              </>
            )}
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center',
          isCircle && 'rounded-full'
        )}>
          <Camera className="w-5 h-5 text-white" />
        </div>

        {loading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Remove button */}
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
          className={cn(
            'absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md',
            !isCircle && 'top-1 right-1'
          )}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { Upload, X, FileText, Video, Music, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  value?: string | null;
  onChange: (value: string | null, fileType: string, fileSize: number) => void;
  label?: string;
  className?: string;
}

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel Serverless Limit)

export function FilePicker({
  value,
  onChange,
  label = 'Subir Material (PDF, Video, Audio)',
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo supera el límite de 4.5MB para Vercel Production');
      return;
    }

    setLoading(true);
    setFileName(file.name);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Detect type manually if needed or use file.type
        let type: 'pdf' | 'video' | 'audio' | 'doc' = 'doc';
        if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        onChange(base64String, type, file.size);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Error al procesar el archivo');
      setLoading(false);
    }
  };

  const Icon = () => {
    if (!value) return <Upload className="w-8 h-8 opacity-40" />;
    if (value.startsWith('data:application/pdf')) return <FileText className="w-8 h-8 text-rose-500" />;
    if (value.startsWith('data:video/')) return <Video className="w-8 h-8 text-blue-500" />;
    if (value.startsWith('data:audio/')) return <Music className="w-8 h-8 text-emerald-500" />;
    return <FileIcon className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className={cn('relative group w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,video/*,audio/*,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition-all overflow-hidden flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl min-h-[140px] text-center p-4',
          loading && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="mb-2">
            <Icon />
        </div>
        
        {value ? (
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                {fileName || 'Archivo cargado'}
            </p>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">¡Listo!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-500">
            <span className="text-sm font-bold">{label}</span>
            <span className="text-[10px] font-medium opacity-60">PDF, MP4, MP3 (Máx. 4.5MB)</span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 flex flex-center">
             <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-violet-600 uppercase">Procesando...</span>
             </div>
          </div>
        )}
      </div>

      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null, 'pdf', 0);
            setFileName(null);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

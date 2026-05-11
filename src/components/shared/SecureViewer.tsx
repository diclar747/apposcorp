import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, FileText, Video, Music, Loader2, X, Maximize2, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface SecureViewerProps {
  url: string;
  type: 'pdf' | 'video' | 'audio' | 'doc';
  title: string;
  onClose?: () => void;
}

export function SecureViewer({ url, type, title, onClose }: SecureViewerProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect fullscreen changes to keep state in sync
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    // On mobile, we prefer pseudo-fullscreen (fixed inset-0) because 
    // real Fullscreen API is buggy or unsupported on iOS Safari
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      setIsFullscreen(!isFullscreen);
      return;
    }

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error: ${err.message}`);
        // Fallback to pseudo-fullscreen if real one fails
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const preventContextMenu = (e: any) => {
    e.preventDefault();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print (Ctrl+P) and Save (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        alert('La descarga de materiales está protegida.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
        ref={containerRef}
        className={cn(
          "flex flex-col bg-slate-950 overflow-hidden border border-white/10 shadow-2xl relative transition-all duration-300",
          isFullscreen 
            ? "fixed inset-0 z-[9999] rounded-none border-none" 
            : "h-full rounded-[2.5rem]"
        )}
        onContextMenu={preventContextMenu}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Volver</span>
            </Button>
          )}
          <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-xs sm:text-sm font-black text-white tracking-tight truncate max-w-[100px] xs:max-w-[150px] md:max-w-xs">{title}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md hidden md:inline">VISTA SEGURA</span>
           
           <Button variant="ghost" size="icon" onClick={handleFullscreen} className={cn("rounded-full transition-all shrink-0", isFullscreen ? "bg-violet-600 text-white" : "text-white bg-white/10 sm:bg-transparent sm:text-slate-400 hover:text-white")} title="Pantalla Completa">
             <Maximize2 className="w-5 h-5" />
           </Button>

           {onClose && (
             <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
             </Button>
           )}
        </div>
      </div>

      {/* Viewer Content */}
      <div className={cn(
        "flex-1 relative overflow-auto scrollbar-hide touch-auto",
        type === 'pdf' && "overflow-y-scroll -webkit-overflow-scrolling-touch cursor-auto"
      )}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          </div>
        )}

        {type === 'pdf' && (
          <div className="w-full h-full bg-slate-800 flex flex-col relative">
            <object
              data={url}
              type="application/pdf"
              className="w-full h-full border-none"
              onLoad={() => setLoading(false)}
            >
              <iframe
                src={url}
                className="w-full h-full border-none"
                onLoad={() => setLoading(false)}
                title={title}
              />
            </object>
            
            {/* Mobile zoom tip */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white/80 pointer-events-none sm:hidden">
              Usa el botón ⛶ para mejor visualización y zoom
            </div>
          </div>
        )}

        {type === 'video' && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <video
              src={url}
              controls
              controlsList="nodownload"
              onLoadedData={() => setLoading(false)}
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
              disablePictureInPicture
            />
          </div>
        )}

        {type === 'audio' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
             <div className="w-24 h-24 bg-violet-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Music className="w-10 h-10 text-violet-400" />
             </div>
             <p className="text-white font-bold mb-4">{title}</p>
             <audio
               src={url}
               controls
               controlsList="nodownload"
               onLoadedData={() => setLoading(false)}
               className="w-full max-w-md"
             />
          </div>
        )}

        {type === 'doc' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
             <FileText className="w-16 h-16 mb-4 opacity-20" />
             <p className="font-bold">Este documento debe ser consultado en línea.</p>
             <p className="text-sm">La visualización de archivos .DOC está limitada por seguridad.</p>
             {/* Note: Vieweing .docx usually requires a 3rd party like Microsoft Office Online or converting to PDF on server */}
             <Button 
                variant="outline" 
                className="mt-6 border-white/10 hover:bg-white/5 text-white"
                onClick={() => setLoading(false)}
             >
                Cerrar Visor
             </Button>
          </div>
        )}
      </div>

      {/* Security Overlay (Subtle watermark) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden rotate-[-45deg]">
         <p className="text-[120px] font-black whitespace-nowrap">INGENIO MILLONARIO PROTECTED CONTENT</p>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Play, Square, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WheelSegment {
  number: number;
  color: string;
  title: string;
  description?: string;
}

interface WheelProps {
  segments?: WheelSegment[];
  onSegmentSelected?: (segment: WheelSegment) => void;
  size?: number;
  className?: string;
}

// Default segments for Ingenio Millonario
const defaultSegments: WheelSegment[] = [
  { number: 1, color: '#ef4444', title: 'Poder del Dinero', description: 'Entiende cómo funciona el dinero' },
  { number: 2, color: '#f97316', title: 'Crear más Dinero', description: 'Genera múltiples ingresos' },
  { number: 3, color: '#f59e0b', title: 'Manejar el Dinero', description: 'Presupuestos inteligentes' },
  { number: 4, color: '#84cc16', title: 'Proteger el Dinero', description: 'Seguros y protección' },
  { number: 5, color: '#22c55e', title: 'Ahorrar el Dinero', description: 'Fondos de emergencia' },
  { number: 6, color: '#10b981', title: 'Crecer el Dinero', description: 'Inversiones consistentes' },
  { number: 7, color: '#06b6d4', title: 'Preservar el Dinero', description: 'Planificación a largo plazo' },
  { number: 8, color: '#3b82f6', title: 'Invertir el Dinero', description: 'Oportunidades diversificadas' },
  { number: 9, color: '#6366f1', title: 'Donar el Dinero', description: 'Filantropía y contribución' },
  { number: 10, color: '#8b5cf6', title: 'Disfrutar el Dinero', description: 'Balance en la vida' },
];

export function Wheel({ 
  segments = defaultSegments, 
  onSegmentSelected, 
  size = 400, 
  className 
}: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const animationRef = useRef<any>(null);

  const wheelSegments = segments.slice(0, 10);
  const segmentAngle = 360 / 10;

  const startSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedSegment(null);
    
    const spins = 5 + Math.random() * 5;
    const finalRotation = rotation + (spins * 360) + (Math.random() * 360);
    
    animationRef.current = animate(rotation, finalRotation, {
      duration: 8,
      ease: [0.2, 0.8, 0.4, 1],
      onUpdate: (latest) => setRotation(latest),
      onComplete: () => {
        setIsSpinning(false);
        determineWinner(finalRotation);
      }
    });
  };

  const stopSpin = () => {
    if (!isSpinning || !animationRef.current) return;
    
    animationRef.current.stop();
    
    const normalizedRotation = rotation % 360;
    const segmentIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % 10;
    const targetRotation = rotation + (360 - normalizedRotation) + (segmentIndex * segmentAngle) - (segmentAngle / 2);
    
    animate(rotation, targetRotation, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (latest) => setRotation(latest),
      onComplete: () => {
        setIsSpinning(false);
        determineWinner(targetRotation);
      }
    });
  };

  const reset = () => {
    if (isSpinning) return;
    setRotation(0);
    setSelectedSegment(null);
  };

  const determineWinner = (finalRotation: number) => {
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const segmentIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % 10;
    const winner = wheelSegments[segmentIndex];
    
    setSelectedSegment(winner);
    onSegmentSelected?.(winner);
  };

  const generateSegmentPath = (index: number) => {
    const startAngle = index * segmentAngle - 90;
    const endAngle = (index + 1) * segmentAngle - 90;
    const radius = size / 2 - 10;
    const center = size / 2;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  const getTextPosition = (index: number) => {
    const angle = index * segmentAngle + segmentAngle / 2 - 90;
    const radius = size / 2 - 50;
    const center = size / 2;
    const rad = (angle * Math.PI) / 180;
    
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
      rotate: angle + 90
    };
  };

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer border */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 shadow-2xl" />
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
        </div>
        
        {/* Wheel */}
        <motion.div
          className="absolute inset-2 rounded-full overflow-hidden shadow-inner bg-slate-800"
          style={{ rotate: rotation }}
        >
          <svg width={size - 16} height={size - 16} viewBox={`0 0 ${size} ${size}`}>
            {wheelSegments.map((segment, index) => {
              const pos = getTextPosition(index);
              return (
                <g key={segment.number}>
                  <path
                    d={generateSegmentPath(index)}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="20"
                    fontWeight="bold"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      transform: `rotate(${pos.rotate}deg)`,
                      transformOrigin: `${pos.x}px ${pos.y}px`
                    }}
                  >
                    {segment.number}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>
        
        {/* Center hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-white/20 shadow-xl flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-0.5" />
              <span className="text-[8px] font-black text-white uppercase tracking-wider">OSCORP</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={startSpin}
          disabled={isSpinning}
          className={cn(
            "h-12 px-6 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all",
            isSpinning 
              ? "bg-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105"
          )}
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Girar
        </Button>
        
        <Button
          onClick={stopSpin}
          disabled={!isSpinning}
          variant="outline"
          className={cn(
            "h-12 px-6 rounded-xl font-bold text-sm uppercase tracking-wider border-2",
            !isSpinning && "opacity-50 cursor-not-allowed"
          )}
        >
          <Square className="w-4 h-4 mr-2 fill-current" />
          Detener
        </Button>

        <Button
          onClick={reset}
          disabled={isSpinning || rotation === 0}
          variant="ghost"
          className="h-12 px-4 rounded-xl"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Result */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-sm"
        >
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white shadow-lg"
            style={{ backgroundColor: selectedSegment.color }}
          >
            {selectedSegment.number}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{selectedSegment.title}</h3>
          {selectedSegment.description && (
            <p className="text-sm text-slate-300">{selectedSegment.description}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default Wheel;

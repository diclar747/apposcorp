import { useState, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Play, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface WheelSegment {
  number: number;
  color: string;
  title: string;
  description?: string;
}

interface WheelProps {
  segments?: WheelSegment[];
  onSegmentSelected?: (segment: WheelSegment) => void;
  onSpinStateChange?: (isSpinning: boolean) => void;
  size?: number;
}

const defaultSegments: WheelSegment[] = [
  { number: 1, color: '#ef4444', title: 'Poder del Dinero' },
  { number: 2, color: '#f97316', title: 'Crear más Dinero' },
  { number: 3, color: '#f59e0b', title: 'Manejar el Dinero' },
  { number: 4, color: '#84cc16', title: 'Proteger el Dinero' },
  { number: 5, color: '#22c55e', title: 'Ahorrar el Dinero' },
  { number: 6, color: '#10b981', title: 'Crecer el Dinero' },
  { number: 7, color: '#06b6d4', title: 'Preservar el Dinero' },
  { number: 8, color: '#3b82f6', title: 'Invertir el Dinero' },
  { number: 9, color: '#6366f1', title: 'Donar el Dinero' },
  { number: 10, color: '#8b5cf6', title: 'Disfrutar el Dinero' },
];

export function Wheel({ 
  segments = defaultSegments, 
  onSegmentSelected, 
  onSpinStateChange,
  size = 400 
}: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const animationRef = useRef<any>(null);

  const wheelSize = size;
  const center = wheelSize / 2;
  const radius = wheelSize / 2 - 30;
  const segmentAngle = 360 / 10;

  const getSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
    
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  const getTextPosition = (index: number) => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const textRadius = radius * 0.7;
    return {
      x: center + textRadius * Math.cos(angle),
      y: center + textRadius * Math.sin(angle),
      rotation: index * segmentAngle + segmentAngle / 2
    };
  };

  const startSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedSegment(null);
    onSpinStateChange?.(true);
    
    // Gira entre 5 y 10 vueltas completas + ángulo aleatorio
    const spins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const targetRotation = rotation + (spins * 360) + randomAngle;
    
    animationRef.current = animate(rotation, targetRotation, {
      duration: 8,
      ease: [0.15, 0.5, 0.3, 1], // Ease-out personalizado
      onUpdate: (latest) => {
        setRotation(latest);
      },
      onComplete: () => {
        finishSpin(targetRotation);
      }
    });
  };

  const stopSpin = () => {
    if (!isSpinning || !animationRef.current) return;
    
    // Detener la animación actual
    animationRef.current.stop();
    
    // Calcular dónde está ahora y completar hasta el segmento más cercano
    const currentRotation = rotation % 360;
    const targetIndex = Math.floor((360 - currentRotation + segmentAngle / 2) / segmentAngle) % 10;
    const targetAngle = rotation + (360 - currentRotation) + (targetIndex * segmentAngle) - (segmentAngle / 2);
    
    animate(rotation, targetAngle, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (latest) => setRotation(latest),
      onComplete: () => finishSpin(targetAngle)
    });
  };

  const finishSpin = (finalRotation: number) => {
    setIsSpinning(false);
    onSpinStateChange?.(false);
    
    // Calcular el segmento ganador
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const winningIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % 10;
    const winner = segments[winningIndex];
    
    setSelectedSegment(winner);
    onSegmentSelected?.(winner);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div 
        className="relative rounded-full bg-white shadow-2xl border-8 border-slate-100"
        style={{ width: wheelSize, height: wheelSize }}
      >
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-slate-900 drop-shadow-lg" />
        </div>
        
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        
        {/* Rotating Wheel */}
        <motion.div
          className="absolute inset-2 rounded-full overflow-hidden"
          style={{ rotate: rotation }}
        >
          <svg width={wheelSize - 16} height={wheelSize - 16} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
            {segments.map((seg, i) => {
              const pos = getTextPosition(i);
              return (
                <g key={i}>
                  {/* Segment */}
                  <path
                    d={getSegmentPath(i)}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="3"
                  />
                  {/* Number */}
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="28"
                    fontWeight="bold"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      transform: `rotate(${pos.rotation}deg)`,
                      transformOrigin: `${pos.x}px ${pos.y}px`
                    }}
                  >
                    {seg.number}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>
        
        {/* Center Hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-200 shadow-xl flex flex-col items-center justify-center">
            <Sparkles className="w-8 h-8 text-yellow-500 mb-1" />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">OSCORP</span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={startSpin}
          disabled={isSpinning}
          size="lg"
          className={`h-14 px-8 rounded-full font-bold text-lg shadow-lg transition-all ${
            isSpinning 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105'
          }`}
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          PLAY
        </Button>
        
        <Button
          onClick={stopSpin}
          disabled={!isSpinning}
          size="lg"
          variant="outline"
          className={`h-14 px-8 rounded-full font-bold text-lg border-3 ${
            !isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
          }`}
        >
          <Square className="w-5 h-5 mr-2 fill-current" />
          DETENER
        </Button>
      </div>
      
      {/* Result */}
      {selectedSegment && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="text-center p-6 rounded-2xl bg-white shadow-lg border-2 border-slate-100"
        >
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: selectedSegment.color }}
          >
            {selectedSegment.number}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{selectedSegment.title}</h3>
          {selectedSegment.description && (
            <p className="text-sm text-slate-500 mt-1">{selectedSegment.description}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default Wheel;

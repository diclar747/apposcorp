import { useState, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Play, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function Wheel({ segments = defaultSegments, onSegmentSelected, size = 380 }: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const controlsRef = useRef<any>(null);

  const wheelSize = size;
  const center = wheelSize / 2;
  const radius = wheelSize / 2 - 20;
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

  const getTextPos = (index: number) => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const textRadius = radius * 0.65;
    return {
      x: center + textRadius * Math.cos(angle),
      y: center + textRadius * Math.sin(angle),
      rotation: index * segmentAngle + segmentAngle / 2
    };
  };

  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedSegment(null);
    
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + (extraSpins * 360) + randomAngle;
    
    controlsRef.current = animate(rotation, totalRotation, {
      duration: 6,
      ease: [0.15, 0.5, 0.3, 1],
      onUpdate: (v) => setRotation(v),
      onComplete: () => {
        setIsSpinning(false);
        const finalAngle = totalRotation % 360;
        const winningIndex = Math.floor((360 - finalAngle) / segmentAngle) % 10;
        const winner = segments[winningIndex];
        setSelectedSegment(winner);
        onSegmentSelected?.(winner);
      }
    });
  };

  const stop = () => {
    if (!isSpinning || !controlsRef.current) return;
    controlsRef.current.stop();
    setIsSpinning(false);
    
    const currentAngle = rotation % 360;
    const winningIndex = Math.floor((360 - currentAngle) / segmentAngle) % 10;
    const winner = segments[winningIndex];
    setSelectedSegment(winner);
    onSegmentSelected?.(winner);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div 
        className="relative rounded-full bg-slate-800 shadow-2xl"
        style={{ width: wheelSize, height: wheelSize }}
      >
        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
        </div>
        
        {/* Rotating Wheel */}
        <motion.div
          className="absolute inset-2 rounded-full overflow-hidden"
          style={{ rotate: rotation }}
        >
          <svg width={wheelSize - 16} height={wheelSize - 16} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
            {segments.map((seg, i) => {
              const pos = getTextPos(i);
              return (
                <g key={i}>
                  <path
                    d={getSegmentPath(i)}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="18"
                    fontWeight="bold"
                    style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
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
          <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-white/20 shadow-xl flex flex-col items-center justify-center">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span className="text-[8px] font-bold text-white uppercase">OSCORP</span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-3">
        <Button
          onClick={spin}
          disabled={isSpinning}
          className={`h-12 px-6 rounded-xl font-bold ${
            isSpinning 
              ? 'bg-gray-500' 
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105'
          }`}
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          GIRAR
        </Button>
        
        <Button
          onClick={stop}
          disabled={!isSpinning}
          variant="outline"
          className="h-12 px-6 rounded-xl font-bold border-2"
        >
          <Square className="w-4 h-4 mr-2 fill-current" />
          DETENER
        </Button>
      </div>
      
      {/* Result */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 rounded-xl bg-white/10 border border-white/20"
        >
          <div 
            className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: selectedSegment.color }}
          >
            {selectedSegment.number}
          </div>
          <h3 className="text-lg font-bold text-white">{selectedSegment.title}</h3>
        </motion.div>
      )}
    </div>
  );
}

export default Wheel;

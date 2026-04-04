import { useState, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Play, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WheelSegment {
  number: number;
  color: string;
  title: string;
  description?: string;
}

interface WheelProps {
  segments: WheelSegment[];
  onSegmentSelected?: (segment: WheelSegment) => void;
  size?: number;
  className?: string;
}

export function Wheel({ segments, onSegmentSelected, size = 400, className }: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const animationRef = useRef<any>(null);

  // Ensure we have 10 segments, fill with defaults if needed
  const wheelSegments: WheelSegment[] = segments.length >= 10 
    ? segments.slice(0, 10) 
    : [...segments, ...Array(10 - segments.length).fill(null).map((_, i) => ({
        number: segments.length + i + 1,
        color: `hsl(${(segments.length + i) * 36}, 70%, 50%)`,
        title: `Tema ${segments.length + i + 1}`,
        description: ''
      }))];

  const segmentAngle = 360 / 10;

  const startSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedSegment(null);
    
    // Random rotation between 5 and 10 full spins
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
    setIsSpinning(false);
    
    // Calculate current position and snap to nearest segment
    const normalizedRotation = rotation % 360;
    const segmentIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % 10;
    const targetRotation = rotation + (360 - normalizedRotation) + (segmentIndex * segmentAngle) - (segmentAngle / 2);
    
    animate(rotation, targetRotation, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (latest) => setRotation(latest),
      onComplete: () => determineWinner(targetRotation)
    });
  };

  const determineWinner = (finalRotation: number) => {
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const segmentIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % 10;
    const winner = wheelSegments[segmentIndex];
    
    setSelectedSegment(winner);
    onSegmentSelected?.(winner);
  };

  // Generate SVG paths for each segment
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

  // Calculate text position for each segment
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
      {/* Wheel Container */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 shadow-2xl" />
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
        </div>
        
        {/* Wheel */}
        <motion.div
          className="absolute inset-2 rounded-full overflow-hidden shadow-inner"
          style={{ rotate: rotation }}
        >
          <svg width={size - 16} height={size - 16} viewBox={`0 0 ${size} ${size}`}>
            {/* Segments */}
            {wheelSegments.map((segment, index) => (
              <g key={segment.number}>
                <path
                  d={generateSegmentPath(index)}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-opacity hover:opacity-90"
                />
                {/* Segment Number */}
                {(() => {
                  const pos = getTextPosition(index);
                  return (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="24"
                      fontWeight="bold"
                      style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        transform: `rotate(${pos.rotate}deg)`,
                        transformOrigin: `${pos.x}px ${pos.y}px`
                      }}
                    >
                      {segment.number}
                    </text>
                  );
                })()}
              </g>
            ))}
          </svg>
          
          {/* Center Logo Circle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-white/20 shadow-xl flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
                <span className="text-[8px] font-black text-white uppercase tracking-wider">OSCORP</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={startSpin}
          disabled={isSpinning}
          className={cn(
            "h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-lg transition-all",
            isSpinning 
              ? "bg-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105"
          )}
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          Comenzar
        </Button>
        
        <Button
          onClick={stopSpin}
          disabled={!isSpinning}
          variant="destructive"
          className={cn(
            "h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-lg transition-all",
            !isSpinning && "opacity-50 cursor-not-allowed"
          )}
        >
          <Square className="w-5 h-5 mr-2 fill-current" />
          Detener
        </Button>
      </div>
      
      {/* Selected Segment Display */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-black text-white shadow-lg"
            style={{ backgroundColor: selectedSegment.color }}
          >
            {selectedSegment.number}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{selectedSegment.title}</h3>
          {selectedSegment.description && (
            <p className="text-sm text-muted-foreground">{selectedSegment.description}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

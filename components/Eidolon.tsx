
import React from 'react';

interface EidolonProps {
  resonance: number;
  level: number;
  isThinking?: boolean;
  isSpeaking?: boolean;
}

export const Eidolon: React.FC<EidolonProps> = ({ resonance, level, isThinking, isSpeaking }) => {
  const scale = (1 + (level * 0.03)) * (isSpeaking ? 1.1 : 1);
  const glowSize = 40 + (resonance % 100) * 0.5 + (isSpeaking ? 40 : 0);

  return (
    <div className={`relative flex items-center justify-center w-64 h-64 transition-transform duration-500 ${isThinking ? 'animate-pulse' : ''}`}>
      {/* Outer Halo */}
      <div 
        className={`absolute inset-0 rounded-full border border-cyan-400/20 transition-all duration-1000 ${isThinking ? 'border-dashed animate-spin' : 'animate-[spin_20s_linear_infinite]'}`} 
        style={{ transform: `scale(${1.4 * scale})` }} 
      />
      
      {/* Mid Rings */}
      <div 
        className="absolute inset-4 rounded-full border border-purple-500/10 animate-[spin_15s_linear_infinite_reverse]" 
        style={{ transform: `scale(${1.2 * scale}) rotate(45deg)` }} 
      />

      {/* Glow Pulse */}
      <div 
        className={`absolute w-48 h-48 rounded-full blur-[60px] transition-colors duration-500 ${isSpeaking ? 'bg-cyan-300/40' : 'bg-cyan-400/20'}`}
        style={{ transform: `scale(${scale})` }}
      />

      {/* Core Body */}
      <div 
        className="relative z-10 w-32 h-32 rounded-full shadow-2xl transition-all duration-500 ease-in-out overflow-hidden"
        style={{
          background: isThinking 
            ? 'radial-gradient(circle at 30% 30%, #fff, #581c87, #2e1065, #000)'
            : 'radial-gradient(circle at 30% 30%, #fff, #22d3ee, #0891b2, #000)',
          boxShadow: `0 0 ${glowSize}px rgba(34, 211, 238, 0.4)`,
          transform: `scale(${scale})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/40 mix-blend-overlay animate-pulse" />
        
        {/* Fractal-like Pattern */}
        <svg className={`absolute inset-0 w-full h-full opacity-30 mix-blend-screen transition-all ${isSpeaking ? 'scale-125' : ''}`} viewBox="0 0 100 100">
           <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 2" />
           <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="1 1" />
           <path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke="white" strokeWidth="0.1" />
        </svg>
      </div>
      
      {/* Level Indicators */}
      {level > 0 && [...Array(level)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]"
          style={{
            transform: `rotate(${i * (360/level)}deg) translateY(-${80 * scale}px)`
          }}
        />
      ))}
    </div>
  );
};

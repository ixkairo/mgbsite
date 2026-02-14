import React from 'react';
import { RarityStyle } from '../../utils/rarity';

interface HeartContainerProps {
  children: React.ReactNode;
  maskedChildren?: React.ReactNode;
  className?: string;
  glowColor?: string;
  valentineStyle?: RarityStyle;
  showShadow?: boolean;
}

const HeartContainer: React.FC<HeartContainerProps> = ({
  children,
  maskedChildren,
  className = '',
  glowColor = 'rgba(139, 92, 246, 0.6)',
  valentineStyle,
  showShadow = true
}) => {
  const activeGlow = valentineStyle?.glow || glowColor;
  const intensity = valentineStyle?.glowIntensity || 1;

  return (
    <div
      className={`relative w-full aspect-square ${className}`}
      style={{
        background: 'transparent'
      }}
    >

      {/* SHADOW BACKING - Heart-shaped darkened silhouette */}
      {showShadow && (
        <img
          src="/heart1.png"
          alt=""
          className="absolute pointer-events-none"
          style={{
            inset: '-8%',
            width: '116%',
            height: '116%',
            objectFit: 'contain',
            filter: 'brightness(0) blur(30px)',
            opacity: 0.85,
            zIndex: 0,
          }}
        />
      )}

      {/* ATOMIC BLOOM - Tighter, smaller background glow layers */}
      <div className="absolute inset-x-[-10%] inset-y-[-10%] pointer-events-none z-[-1]">
        {/* Outer Aura */}
        <div
          className="absolute inset-[15%] rounded-full opacity-[0.05] blur-[40px]"
          style={{ backgroundColor: activeGlow }}
        />
        {/* Core Glow */}
        <div
          className="absolute inset-[20%] rounded-full opacity-[0.08] blur-[30px]"
          style={{ backgroundColor: valentineStyle?.innerGlow || activeGlow }}
        />
        {/* Sharp Accent */}
        <div
          className="absolute inset-[30%] rounded-full opacity-[0.1] blur-[20px]"
          style={{ backgroundColor: activeGlow }}
        />
      </div>

      {/* Heart image as base with enhanced glow filter */}
      <img
        src="/heart1.png"
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-[1]"
        style={{
          filter: `drop-shadow(0 0 ${20 * intensity}px ${activeGlow})`,
          mixBlendMode: 'screen',
          opacity: 0.85
        }}
      />

      {/* SOLID BODY BASE - Ensures heart is not transparent even if shadow is off */}
      <div
        className="absolute inset-0 z-[-2]"
        style={{
          WebkitMaskImage: 'url(/heart1.png)',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: 'url(/heart1.png)',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          backgroundColor: '#030303'
        }}
      />

      {/* Internal gradient background inside heart */}
      <div
        className="absolute inset-0 z-[0]"
        style={{
          WebkitMaskImage: 'url(/heart1.png)',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: 'url(/heart1.png)',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          background: valentineStyle?.gradient || `radial-gradient(ellipse at center, ${activeGlow} 0%, rgba(139, 92, 246, 0.4) 30%, rgba(5, 5, 5, 0.8) 70%, rgba(0, 0, 0, 0.95) 100%)`
        }}
      />

      {/* ORNATE INNER BORDERS - "Energy Rings" and "Arcane Strokes" */}
      <div className="absolute inset-[3.5%] pointer-events-none z-[2]">
        {/* Outer Fine Ring */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            WebkitMaskImage: 'url(/heart1.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: 'url(/heart1.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            border: `1.5px solid ${activeGlow}`,
            filter: `blur(0.5px) drop-shadow(0 0 5px ${activeGlow})`,
            borderRadius: '45%' // Approximation for the heart's inner curve
          }}
        />

        {/* Inner Segmented Ring */}
        <div
          className="absolute inset-[4%] opacity-30"
          style={{
            WebkitMaskImage: 'url(/heart1.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: 'url(/heart1.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            border: `1px dashed ${valentineStyle?.innerGlow || activeGlow}`,
            filter: `drop-shadow(0 0 8px ${activeGlow})`,
            borderRadius: '45%'
          }}
        />

        {/* Designer "Arcane Strokes" - Ornate decorative lines near the edges */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Top Left Arc */}
          <div
            className="absolute top-[5%] left-[20%] w-[15%] h-[2px] rotate-[-15deg]"
            style={{
              backgroundColor: valentineStyle?.frameColor || activeGlow,
              boxShadow: `0 0 10px ${valentineStyle?.frameGlow || activeGlow}`
            }}
          />
          {/* Top Right Arc */}
          <div
            className="absolute top-[5%] right-[20%] w-[15%] h-[2px] rotate-[15deg]"
            style={{
              backgroundColor: valentineStyle?.frameColor || activeGlow,
              boxShadow: `0 0 10px ${valentineStyle?.frameGlow || activeGlow}`
            }}
          />
          {/* Bottom Side Brackets */}
          <div
            className="absolute bottom-[25%] left-[8%] w-[2px] h-[15%] rounded-full"
            style={{
              backgroundColor: activeGlow,
              boxShadow: `0 0 15px ${activeGlow}`,
              opacity: 0.6
            }}
          />
          <div
            className="absolute bottom-[25%] right-[8%] w-[2px] h-[15%] rounded-full"
            style={{
              backgroundColor: activeGlow,
              boxShadow: `0 0 15px ${activeGlow}`,
              opacity: 0.6
            }}
          />
        </div>
      </div>

      {/* Masked Content Layer (e.g. Ghost Avatars) */}
      {maskedChildren && (
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            WebkitMaskImage: 'url(/heart1.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: 'url(/heart1.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        >
          {maskedChildren}
        </div>
      )}

      {/* Content layer with safe padding */}
      <div className="absolute inset-0 flex items-center justify-center z-[10]" style={{ padding: '18% 18% 25% 18%' }}>
        <div className="w-full h-full">
          {children}
        </div>
      </div>

    </div>
  );
};

export default HeartContainer;

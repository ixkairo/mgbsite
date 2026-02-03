import React from 'react';

interface CardPerimeterMarkProps {
    glowColor: string;
}

const CardPerimeterMark: React.FC<CardPerimeterMarkProps> = ({ glowColor }) => {
    const logoUrl = "https://raw.githubusercontent.com/argonq1/dasdsassad/main/MagicBlock-Logomark-White.webp";

    return (
        <div className="absolute inset-0 z-[1] pointer-events-none select-none overflow-hidden" style={{ opacity: 0.3 }}>
            <svg
                viewBox="0 0 1200 675"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
            >
                <defs>
                    {/* Top Path: Close to top edge, centered horizontally */}
                    <path id="pathTop" d="M 100,18 H 1100" />
                    {/* Right Path: Close to right edge, centered vertically */}
                    <path id="pathRight" d="M 1182,120 V 555" />
                    {/* Bottom Path: Close to bottom edge, centered horizontally */}
                    <path id="pathBottom" d="M 1100,658 H 100" />
                    {/* Left Path: Close to left edge, centered vertically */}
                    <path id="pathLeft" d="M 18,555 V 120" />

                    <filter id="perimeterGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <style>
                    {`
            .perimeter-text {
              font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              font-size: 8px;
              font-weight: 900;
              letter-spacing: 0.6em;
              fill: ${glowColor};
              filter: url(#perimeterGlow);
              opacity: 0.7;
              text-transform: uppercase;
            }
          `}
                </style>

                {/* LOGOS IN 4 CORNERS - Closer to edges */}
                <g opacity="0.5" style={{ filter: 'grayscale(1) brightness(1.5)' }}>
                    <image href={logoUrl} x="16" y="16" width="20" height="20" crossOrigin="anonymous" />
                    <image href={logoUrl} x="1164" y="16" width="20" height="20" crossOrigin="anonymous" />
                    <image href={logoUrl} x="1164" y="639" width="20" height="20" crossOrigin="anonymous" />
                    <image href={logoUrl} x="16" y="639" width="20" height="20" crossOrigin="anonymous" />
                </g>

                {/* TOP SEGMENT */}
                <text className="perimeter-text">
                    <textPath href="#pathTop" startOffset="50%" textAnchor="middle">
                        MAGICCARD // PROTOCOL ORIGINAL // MAGICCARD
                    </textPath>
                </text>

                {/* RIGHT SEGMENT */}
                <text className="perimeter-text">
                    <textPath href="#pathRight" startOffset="50%" textAnchor="middle">
                        LABORATORY // EXPERIMENTAL SECTION
                    </textPath>
                </text>

                {/* BOTTOM SEGMENT */}
                <text className="perimeter-text">
                    <textPath href="#pathBottom" startOffset="50%" textAnchor="middle">
                        IDENTITY SYSTEM // MAGICBLOCK IDENTITY
                    </textPath>
                </text>

                {/* LEFT SEGMENT */}
                <text className="perimeter-text">
                    <textPath href="#pathLeft" startOffset="50%" textAnchor="middle">
                        MAGICIAN IDENTITY // USER PROFILE
                    </textPath>
                </text>
            </svg>
        </div>
    );
};

export default CardPerimeterMark;

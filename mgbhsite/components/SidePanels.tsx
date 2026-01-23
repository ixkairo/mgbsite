
import React from 'react';

const SidePanels: React.FC = () => {
  return (
    <>
      {/* Left Panel - Calculated to stop before the 6xl (1152px) container */}
      <div className="fixed inset-y-0 left-0 w-[calc(50vw-580px)] z-40 pointer-events-none hidden xl:block select-none mix-blend-screen overflow-hidden">
         <div className="absolute inset-0 bg-black/40" />
         {/* Gradient to blend smoothly into content */}
         <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-black via-black/80 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
      </div>

      {/* Right Panel - Calculated to stop before the 6xl (1152px) container */}
      <div className="fixed inset-y-0 right-0 w-[calc(50vw-580px)] z-40 pointer-events-none hidden xl:block select-none mix-blend-screen overflow-hidden">
         <div className="absolute inset-0 bg-black/40" />
         {/* Gradient to blend smoothly into content */}
         <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black via-black/80 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
      </div>
    </>
  );
};

export default SidePanels;

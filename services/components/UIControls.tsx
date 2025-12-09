import React, { useEffect, useState } from 'react';

interface UIControlsProps {
  onUpload: (file: File) => void;
  isHidden: boolean;
}

const UIControls: React.FC<UIControlsProps> = ({ onUpload, isHidden }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 z-10 ${isHidden ? 'opacity-0' : 'opacity-100'}`}>
      {/* Title */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h1 
          className="font-cinzel text-5xl md:text-6xl font-bold tracking-wider"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #d4af37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0px 0px 10px rgba(212, 175, 55, 0.5))'
          }}
        >
          Merry Christmas
        </h1>
      </div>

      {/* Upload Controls */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 upload-wrapper pointer-events-auto">
        <label className="cursor-pointer group relative">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
          <div className="
            px-8 py-3 
            bg-black/30 backdrop-blur-md 
            border border-[#d4af37] 
            text-[#d4af37] 
            font-cinzel tracking-widest text-sm
            uppercase
            transition-all duration-300
            hover:bg-[#d4af37] hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]
          ">
            Add Memories
          </div>
        </label>
        
        <p className="text-[#fceea7]/60 font-serif text-xs italic tracking-wider">
          Press 'H' to Hide Controls
        </p>
      </div>

      {/* Mode Indicators (Optional visual aid for gesture states) */}
      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 text-right hidden md:block">
        <div className="text-[#d4af37]/40 text-xs font-cinzel space-y-2">
            <p>GESTURES</p>
            <p>FIST • Tree</p>
            <p>OPEN • Scatter</p>
            <p>PINCH • Focus</p>
        </div>
      </div>
    </div>
  );
};

export default UIControls;
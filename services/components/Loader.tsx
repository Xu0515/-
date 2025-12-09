import React, { useEffect, useState } from 'react';

interface LoaderProps {
  loaded: boolean;
}

const Loader: React.FC<LoaderProps> = ({ loaded }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setVisible(false), 1000); // Fade out duration
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${loaded ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-10 h-10 border-4 border-gray-900 border-t-[#d4af37] rounded-full animate-spin mb-6"></div>
      <h2 className="text-[#d4af37] font-cinzel tracking-[0.2em] text-sm animate-pulse">
        LOADING HOLIDAY MAGIC
      </h2>
    </div>
  );
};

export default Loader;
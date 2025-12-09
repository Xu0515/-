import React, { useEffect, useRef, useState } from 'react';
import { ThreeService } from '../services/threeService';
import { visionService } from '../services/visionService';
import { AppMode } from '../types';
import Loader from './Loader';
import UIControls from './UIControls';

const Experience: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const threeServiceRef = useRef<ThreeService | null>(null);
  
  const [loaded, setLoaded] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);

  // Initialize Systems
  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current || !videoRef.current) return;

      // 1. Start Three.js
      const threeSvc = new ThreeService(canvasRef.current);
      threeServiceRef.current = threeSvc;
      threeSvc.start();

      // 2. Camera Permission & Start Video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
            if(videoRef.current) {
                videoRef.current.onloadeddata = () => {
                    videoRef.current!.play();
                    resolve();
                }
            }
        });

        // 3. Start Vision
        await visionService.initialize(videoRef.current);
        
        // 4. Start Loop for Vision -> Three sync
        const syncLoop = () => {
            const result = visionService.detect();
            if (result && threeServiceRef.current) {
                // Map position to rotation
                // Landmarks are normalized 0-1
                threeServiceRef.current.setRotationFromHand(
                    result.gesture.position.x, 
                    result.gesture.position.y
                );

                // Map Gesture to Mode
                if (result.gesture.name === 'FIST') {
                    threeServiceRef.current.setMode(AppMode.TREE);
                } else if (result.gesture.name === 'OPEN') {
                    threeServiceRef.current.setMode(AppMode.SCATTER);
                } else if (result.gesture.name === 'PINCH') {
                    threeServiceRef.current.setMode(AppMode.FOCUS);
                }
            }
            requestAnimationFrame(syncLoop);
        };
        syncLoop();

        setLoaded(true);
      } catch (err) {
        console.error("Initialization failed:", err);
        // Fallback if camera denied: still show 3D but no hand control
        setLoaded(true);
      }
    };

    init();

    return () => {
      threeServiceRef.current?.dispose();
      visionService.stop();
    };
  }, []);

  // Keyboard 'H' Listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setUiHidden(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Upload Handler
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && typeof ev.target.result === 'string') {
        threeServiceRef.current?.addPhotoFromURL(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Loader loaded={loaded} />
      
      <UIControls onUpload={handleUpload} isHidden={uiHidden} />
      
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Hidden CV Container */}
      <div className="fixed bottom-0 right-0 opacity-0 pointer-events-none w-[160px] h-[120px] overflow-hidden">
        <video 
            ref={videoRef} 
            className="w-full h-full object-cover transform scale-x-[-1]" 
            playsInline 
            muted 
        />
      </div>
    </>
  );
};

export default Experience;
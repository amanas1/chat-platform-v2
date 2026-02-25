
import React, { useRef, useEffect } from 'react';

interface RainEffectProps {
  intensity: number; // 0 to 1
}

const RainEffect: React.FC<RainEffectProps> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;
    
    // Pool of drops
    const drops: { x: number; y: number; length: number; speed: number; opacity: number }[] = [];
    const maxDrops = 800; // Max drops at full intensity

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    // Initial resize
    resize();
    window.addEventListener('resize', resize);

    // Initialize drops
    for (let i = 0; i < maxDrops; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 15 + Math.random() * 25,
        speed: 20 + Math.random() * 10,
        opacity: 0.2 + Math.random() * 0.3
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      const currentIntensity = intensityRef.current;
      
      if (currentIntensity > 0.01) {
          const activeDropCount = Math.floor(maxDrops * currentIntensity);
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(164, 184, 214, 0.6)'; // Rain color
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          
          for (let i = 0; i < activeDropCount; i++) {
            const d = drops[i];
            
            // Draw drop
            ctx.globalAlpha = d.opacity;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x, d.y + d.length);
            
            // Update position
            d.y += d.speed;
            
            // Reset if falls off screen
            if (d.y > height) {
              d.y = -d.length;
              d.x = Math.random() * width;
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000" 
      style={{ opacity: intensity > 0 ? 1 : 0 }}
    />
  );
};

export default RainEffect;

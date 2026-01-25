
import React, { useRef, useEffect } from 'react';

interface FireEffectProps {
  intensity: number; // 0 to 1
}

const FireEffect: React.FC<FireEffectProps> = ({ intensity }) => {
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
    
    // Pool of sparks
    const sparks: { x: number; y: number; size: number; speedY: number; speedX: number; opacity: number; color: string }[] = [];
    const maxSparks = 400; // Max sparks at full intensity

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    // Initial resize
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#ff7b00', '#ffaa00', '#ff4d00', '#ffcc00'];

    // Initialize random sparks
    const createSpark = (fromBottom: boolean = false) => {
        return {
            x: Math.random() * width,
            y: fromBottom ? height + Math.random() * 50 : Math.random() * height,
            size: Math.random() * 3 + 1,
            speedY: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 1.5,
            opacity: Math.random() * 0.8 + 0.2,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    };

    for (let i = 0; i < maxSparks; i++) {
      sparks.push(createSpark());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      const currentIntensity = intensityRef.current;
      
      if (currentIntensity > 0.01) {
          const activeSparkCount = Math.floor(maxSparks * currentIntensity);
          
          // Draw faint warm glow at bottom based on intensity
          const gradient = ctx.createLinearGradient(0, height, 0, height - (height * 0.3 * currentIntensity));
          gradient.addColorStop(0, `rgba(255, 100, 0, ${0.15 * currentIntensity})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          ctx.globalCompositeOperation = 'lighter'; // Additive blending for fire look

          for (let i = 0; i < activeSparkCount; i++) {
            const s = sparks[i];
            
            ctx.globalAlpha = s.opacity;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Update
            s.y -= s.speedY;
            s.x += s.speedX + Math.sin(s.y * 0.05) * 0.5; // Wiggle
            s.opacity -= 0.005;
            
            // Reset if faded out or off screen
            if (s.opacity <= 0 || s.y < 0) {
              Object.assign(s, createSpark(true));
            }
          }
          ctx.globalCompositeOperation = 'source-over';
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

export default FireEffect;

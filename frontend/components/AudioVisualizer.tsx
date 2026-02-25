
import React, { useEffect, useRef } from 'react';
import { VisualizerVariant, VisualizerSettings, VisualMode } from '../types';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  variant?: VisualizerVariant;
  settings?: VisualizerSettings;
  visualMode?: VisualMode;
  danceStyle?: number;
}

interface CelestialObject {
  id: number;
  type: 'planet' | 'star' | 'nebula' | 'galaxy';
  name?: string;
  x: number;
  y: number;
  z: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  angle: number;
  rotationSpeed: number;
  hasRings?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyserNode, 
  isPlaying, 
  variant = 'segmented',
  settings = { scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 1, speed: 1, autoIdle: true, performanceMode: true, isDisabled: false, energySaver: false },
  visualMode = 'medium',
  danceStyle = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);
  const starsRef = useRef<any[]>([]);
  const journeyObjectsRef = useRef<CelestialObject[]>([]);
  const lastVariantRef = useRef<string>(variant);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Blink State
  const nextBlinkTimeRef = useRef<number>(0);
  const blinkEndTimeRef = useRef<number>(0);

  const smoothedLowRef = useRef(0);
  const smoothedMidRef = useRef(0);
  const smoothedHighRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        
        let width = rect.width;
        let height = rect.height;
        
        // --- ADAPTIVE DPR SCALING ---
        let scaleFactor = dpr;
        if (visualMode === 'low' || settings.isDisabled) {
            scaleFactor = 1.0; // Hard limit for low end or Eco Mode
        } else if (visualMode === 'medium') {
            scaleFactor = Math.min(dpr, 1.5);
        } else {
            scaleFactor = Math.min(dpr, 2.0);
        }

        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scaleFactor, scaleFactor);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const renderFrame = (timestamp: number) => {
      // --- BACKGROUND OPTIMIZATION ---
      // Completely stop rendering if tab is hidden to save battery
      if (document.hidden) {
          setTimeout(() => requestAnimationFrame(renderFrame), 200); // Check again in 200ms
          return;
      }

      // --- FPS THROTTLING ---
      // Smart FPS caps:
      // - Eco Mode (Energy Saver): 15 FPS
      // - Low Mode (Weak devices): 24 FPS
      // - Medium Mode (Balanced): 30 FPS
      // - High Mode (Performance): 60 FPS
      let targetFPS = 60;
      if (settings.isDisabled || settings.energySaver) targetFPS = 15;
      else if (visualMode === 'low') targetFPS = 24;
      else if (visualMode === 'medium') targetFPS = 30;

      const interval = 1000 / targetFPS;
      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed < interval) {
          animationRef.current = requestAnimationFrame(renderFrame);
          return;
      }

      // Adjust for slight drift
      lastFrameTimeRef.current = timestamp - (elapsed % interval);

      // Use client dimensions
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
           animationRef.current = requestAnimationFrame(renderFrame);
           return;
      }
      
      const width = canvas.width / (canvas.width / rect.width);
      const height = canvas.height / (canvas.height / rect.height);
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw background dimming layer
      if (settings.bgOpacity && settings.bgOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${settings.bgOpacity})`;
        ctx.fillRect(0, 0, width, height);
      }
      
      // If Disabled, Draw Simple Twinkling Stars and Return
      if (settings.isDisabled) {
          if (starsRef.current.length === 0) {
              // Reduce star count in disabled mode
              starsRef.current = Array.from({ length: 20 }, () => ({
                  x: Math.random() * width,
                  y: Math.random() * height,
                  size: Math.random() * 1.5 + 0.5,
                  phase: Math.random() * Math.PI * 2
              }));
          }
          
          const time = Date.now() / 2000; // Slow time
          starsRef.current.forEach(s => {
              const flicker = Math.sin(time + s.phase) * 0.5 + 0.5; // Smooth sine wave 0 to 1
              ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + flicker * 0.4})`; // 0.1 to 0.5 opacity
              ctx.beginPath();
              ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
              ctx.fill();
          });
          animationRef.current = requestAnimationFrame(renderFrame);
          return;
      }

      canvas.style.opacity = String(settings.opacity);
      canvas.style.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) hue-rotate(${settings.hue}deg)`;

      const bufferLength = analyserNode?.frequencyBinCount || 128;
      const dataArray = new Uint8Array(bufferLength);
      
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      }

      if (lastVariantRef.current !== variant) {
        particlesRef.current = [];
        starsRef.current = [];
        journeyObjectsRef.current = [];
        lastVariantRef.current = variant;
      }

      const effectiveWidth = width * settings.scaleX;
      const offsetX = (width - effectiveWidth) / 2;
      const effectiveHeight = height * settings.scaleY;
      const offsetY = (height - effectiveHeight) / 2;
      const animationSpeed = settings.speed;

      const low = isPlaying ? (dataArray[4] || 0) : 0; 
      const mid = isPlaying ? (dataArray[25] || 0) : 0; 
      const high = isPlaying ? (dataArray[120] || 0) : 0;
      
      const lerpFactor = 0.12;
      smoothedLowRef.current += (low - smoothedLowRef.current) * lerpFactor;
      smoothedMidRef.current += (mid - smoothedMidRef.current) * lerpFactor;
      smoothedHighRef.current += (high - smoothedHighRef.current) * lerpFactor;
      
      const sLow = smoothedLowRef.current;
      const sMid = smoothedMidRef.current;
      const sHigh = smoothedHighRef.current;
      
      const beatVal = sLow / 255;
      const intensity = dataArray.reduce((a,b)=>a+b,0) / (bufferLength || 1); 
      const time = Date.now() / 1000 * animationSpeed;

      const drawStars = (baseCount: number, syncToBeat: boolean) => {
        // ... existing logic ...
        // --- ADAPTIVE PARTICLE COUNT ---
        const multiplier = visualMode === 'low' ? 0.3 : visualMode === 'medium' ? 0.6 : 1;
        const finalCount = Math.floor(baseCount * multiplier);

        if (starsRef.current.length === 0) {
          starsRef.current = Array.from({ length: finalCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2.0 + 0.5,
            phase: Math.random() * Math.PI * 2,
            isBeacon: Math.random() > 0.85,
            hue: Math.random() * 360 // Add random color
          }));
        }
        starsRef.current.forEach(s => {
          const flicker = Math.sin(time * 6 + s.phase) * 0.5 + 0.5;
          let musicBoost = syncToBeat ? beatVal * 2.5 : beatVal * 0.5;
          if (s.isBeacon && isPlaying) musicBoost *= 3.0;
          
          const finalOpacity = Math.min(1, (0.1 + musicBoost) * flicker);
          const finalSize = s.size * (1 + beatVal * (s.isBeacon ? 2.0 : 1.2));

          // Use HSLA for colored stars
          ctx.fillStyle = `hsla(${s.hue}, 80%, 70%, ${finalOpacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, finalSize, 0, Math.PI * 2);
          ctx.fill();
          
          if (s.isBeacon && finalOpacity > 0.3 && visualMode === 'high') {
             ctx.shadowBlur = 15 * beatVal;
             ctx.shadowColor = `hsla(${s.hue}, 80%, 70%, 1)`; // Colored shadow
             ctx.fill();
             ctx.shadowBlur = 0;
          }
        });
      };

      const drawSpotlight = (x: number, angle: number, colorHue: number, intensity: number) => {
          if (!isPlaying || intensity < 0.05) return;
          
          ctx.save();
          ctx.translate(x, 0); // Top edge
          ctx.rotate(angle);
          
          // Cone gradient
          const length = height * 1.5;
          const spread = width * 0.3;
          
          const grd = ctx.createLinearGradient(0, 0, 0, length);
          grd.addColorStop(0, `hsla(${colorHue}, 100%, 70%, ${intensity * 0.8})`); // Bright source
          grd.addColorStop(0.2, `hsla(${colorHue}, 100%, 60%, ${intensity * 0.3})`);
          grd.addColorStop(1, `hsla(${colorHue}, 100%, 50%, 0)`);
          
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-spread * 0.5, length);
          ctx.lineTo(spread * 0.5, length);
          ctx.closePath();
          ctx.fill();
          
          // Lens Flare / Source Glow
          if (visualMode !== 'low') {
              ctx.shadowBlur = 20 * intensity;
              ctx.shadowColor = `hsla(${colorHue}, 100%, 70%, 1)`;
          }
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(0, 5, 5 + intensity * 10, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
      };

      const drawDancer = (x: number, y: number, dancerScale: number, style: number, settings: VisualizerSettings, isBlinking: boolean) => {
        const armIntensity = settings.danceArmIntensity ?? 1.0;
        const legIntensity = settings.danceLegIntensity ?? 1.0;
        const headIntensity = settings.danceHeadIntensity ?? 1.0;

        let bounce = 0;
        let hipSway = 0;
        let headWobble = 0;
        let shoulderXMod = 0;
        let armWaveL = 0;
        let armWaveR = 0;
        let stompL = 0;
        let stompR = 0;

        if (isPlaying) {
          if (style === 1) { 
            bounce = (sLow / 255) * 30 * dancerScale;
            hipSway = Math.sin(time * 4) * 25 * dancerScale;
            headWobble = Math.sin(time * 4) * (sMid / 255) * 10 * dancerScale; 
            armWaveL = Math.sin(time * 6) * (sMid / 255) * 80 * dancerScale;
            armWaveR = Math.sin(time * 6 + Math.PI) * (sMid / 255) * 80 * dancerScale;
            stompL = Math.max(0, Math.sin(time * 4)) * (sLow / 255) * 35 * dancerScale;
            stompR = Math.max(0, Math.sin(time * 4 + Math.PI)) * (sLow / 255) * 35 * dancerScale;
          } else if (style === 2) {
            bounce = (sMid / 255) * 30 * dancerScale;
            hipSway = Math.sin(time * 2) * 40 * dancerScale;
            headWobble = Math.sin(time * 4) * 15 * dancerScale;
            shoulderXMod = Math.sin(time * 3) * 15 * dancerScale;
            armWaveL = Math.sin(time * 4) * 60 * dancerScale;
            armWaveR = Math.sin(time * 4 + Math.PI) * 60 * dancerScale;
            stompL = Math.abs(Math.sin(time * 2)) * 20 * dancerScale;
            stompR = Math.abs(Math.cos(time * 2)) * 20 * dancerScale;
          } else {
            const stepTime = Math.floor(time * 4) % 4;
            bounce = stepTime % 2 === 0 ? 15 * dancerScale : 0;
            hipSway = stepTime === 1 ? 20 * dancerScale : stepTime === 3 ? -20 * dancerScale : 0;
            headWobble = (sHigh / 255) > 0.5 ? (Math.random()-0.5)*20*dancerScale : 0;
            armWaveL = stepTime === 0 ? -60 * dancerScale : 0;
            armWaveR = stepTime === 2 ? 60 * dancerScale : 0;
            stompL = stepTime === 1 ? 30 * dancerScale : 0;
            stompR = stepTime === 3 ? 30 * dancerScale : 0;
          }
        }

        bounce *= legIntensity;
        stompL *= legIntensity;
        stompR *= legIntensity;
        armWaveL *= armIntensity;
        armWaveR *= armIntensity;
        headWobble *= headIntensity;

        const hipY = y - 100 * dancerScale - bounce;
        const hipX = x + hipSway;
        const shoulderY = hipY - 80 * dancerScale;
        const shoulderX = hipX + shoulderXMod;
        const headY = shoulderY - 30 * dancerScale;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8 * dancerScale;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x - 30 * dancerScale, y - stompL);
        ctx.lineTo(hipX - 20 * dancerScale, y - 50 * dancerScale - bounce * 0.5);
        ctx.lineTo(hipX, hipY);
        ctx.lineTo(hipX + 20 * dancerScale, y - 50 * dancerScale - bounce * 0.5);
        ctx.lineTo(x + 30 * dancerScale, y - stompR);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(shoulderX, shoulderY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        const lElbowX = shoulderX - 50 * dancerScale;
        const lElbowY = shoulderY + armWaveL;
        ctx.lineTo(lElbowX, lElbowY);
        ctx.lineTo(lElbowX - 30 * dancerScale, lElbowY - 20 * dancerScale);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        const rElbowX = shoulderX + 50 * dancerScale;
        const rElbowY = shoulderY + armWaveR;
        ctx.lineTo(rElbowX, rElbowY);
        ctx.lineTo(rElbowX + 30 * dancerScale, rElbowY - 20 * dancerScale);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(shoulderX + headWobble, headY, 25 * dancerScale, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        
        if (isBlinking) {
            // Draw Closed Eyes (Disappear for high contrast blink)
            // User requested that eyes disappear then appear for better visibility from distance
        } else {
            // Draw Open Eyes - Larger and clearer
            ctx.fillStyle = '#000';
            ctx.strokeStyle = '#000'; 
            ctx.beginPath();
            ctx.arc(shoulderX + headWobble - 8*dancerScale, headY - 4*dancerScale, 4*dancerScale, 0, Math.PI*2);
            ctx.arc(shoulderX + headWobble + 8*dancerScale, headY - 4*dancerScale, 4*dancerScale, 0, Math.PI*2);
            ctx.fill();
        }


      };

        // Human-like Blink Logic (Global for all dancers)
      if (time > nextBlinkTimeRef.current) {
          nextBlinkTimeRef.current = time + 1.5 + Math.random() * 3; // Next blink in 1.5-4.5s
          blinkEndTimeRef.current = time + 0.12; // Blink lasts 120ms
      }

      // Refactor: Smoother blink logic without setTimeout
      let isBlinking = time < blinkEndTimeRef.current;

      // Determine visualizer type
      if (variant === 'stage-dancer') {
        // Light Show - Dynamic Spotlights (Enabled for Mobile/Low too, but optimized)
        // User Request: Remove spotlights on mobile for performance
        const isMobile = window.innerWidth < 768;

        if (isPlaying && !isMobile) {
            // Left Spotlight (Chaotic & Active)
            drawSpotlight(
                width * 0.2, 
                -Math.PI * 0.15 + Math.sin(time * 2.5) * 0.25 + Math.cos(time * 4.3) * 0.15, // Fast, wide chaotic swing
                (time * 60) % 360, 
                (sLow / 255) * 1.2
            );
            
            // Right Spotlight (Chaotic & Active)
            drawSpotlight(
                width * 0.8, 
                Math.PI * 0.15 + Math.cos(time * 2.2) * 0.25 + Math.sin(time * 3.7) * 0.15, // Different chaotic pattern
                (time * 70 + 180) % 360, 
                (sMid / 255) * 1.2
            );

            // Center Strobe (More aggressive)
            if (beatVal > 0.45) { // Lower threshold for more activity
                 drawSpotlight(width * 0.5, Math.sin(time * 10) * 0.1, 0, Math.pow(beatVal, 3) * 0.8); 
            }
        }

        drawStars(120, true);
        const grd = ctx.createLinearGradient(0, height, 0, height * 0.7);
        grd.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
        
        drawDancer(width/2, height*0.9, Math.min(width, height)/450, danceStyle, settings, isBlinking);

      } else if (variant === 'trio-dancers') {
        drawStars(160, true);
        const floorY = height * 0.9;
        const grd = ctx.createLinearGradient(0, height, 0, height * 0.7);
        grd.addColorStop(0, 'rgba(15, 23, 42, 0.6)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, height * 0.7, width, height * 0.3);

        const dScale = Math.min(width, height) / 550;
        const spacing = width * 0.25;
        
        // Optimize: Only draw center dancer in Low mode
        if (visualMode !== 'low') {
            drawDancer(width/2 - spacing, floorY, dScale, 3, settings, isBlinking);
            drawDancer(width/2 + spacing, floorY, dScale, 2, settings, isBlinking);
        }
        drawDancer(width/2, floorY, dScale * 1.1, 1, settings, isBlinking);

      } else if (variant === 'galaxy') {
        const centerX = width / 2;
        const centerY = height / 2;
        const bass = (dataArray[10] || 0) / 255;
        const treble = (dataArray[200] || 0) / 255;
        
        let starCount = 150;
        let particleCount = 100;
        
        // Mobile Optimization
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            starCount = 40;
            particleCount = 40; 
        }

        if (visualMode === 'low') {
            starCount = 30;
            particleCount = 20;
        } else if (visualMode === 'medium') {
            starCount = isMobile ? 50 : 80;
            particleCount = isMobile ? 50 : 80;
        }

        if (starsRef.current.length === 0) {
          starsRef.current = Array.from({ length: starCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.5,
          }));
        }
        starsRef.current.forEach(s => {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        if (particlesRef.current.length === 0) {
            particlesRef.current = Array.from({ length: particleCount }, () => ({
              angle: Math.random() * Math.PI * 2,
              distance: Math.random() * 500,
              speed: 0.5 + Math.random() * 2,
              size: 2 + Math.random() * 4,
              hue: Math.random() * 360
            }));
        }
        particlesRef.current.forEach(p => {
          if (isPlaying) {
             p.distance += p.speed * (1 + bass * 2) * animationSpeed;
             if (p.distance > 800) p.distance = 0;
          }
          const px = centerX + Math.cos(p.angle) * p.distance * settings.scaleX;
          const py = centerY + Math.sin(p.angle) * p.distance * settings.scaleY;
          ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${1 - p.distance/800})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 + treble), 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (variant === 'viz-journey') {
        const centerX = width / 2;
        const centerY = height / 2;
        
        drawStars(120, true);

        if (journeyObjectsRef.current.length === 0) {
          const objCount = visualMode === 'low' ? 10 : (visualMode === 'medium' ? 20 : 35);
          
          const createObj = (index: number): CelestialObject => {
            const isSolar = index < 10;
            const types: ('planet' | 'star' | 'nebula' | 'galaxy')[] = ['planet', 'star', 'nebula', 'galaxy'];
            const type = isSolar ? 'planet' : types[Math.floor(Math.random() * types.length)];
            
            return {
              id: index,
              type,
              x: (Math.random() - 0.5) * 120,
              y: (Math.random() - 0.5) * 120,
              z: 1 + Math.random() * 4,
              size: type === 'galaxy' || type === 'nebula' ? 50 + Math.random() * 50 : 15 + Math.random() * 25,
              hue: Math.random() * 360,
              saturation: 80 + Math.random() * 20,
              lightness: 50 + Math.random() * 20,
              angle: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.03,
              hasRings: type === 'planet' && Math.random() > 0.6
            };
          };
          journeyObjectsRef.current = Array.from({ length: objCount }, (_, i) => createObj(i));
        }

        journeyObjectsRef.current.forEach(obj => {
          if (isPlaying) {
            obj.z -= 0.012 * animationSpeed * (1 + beatVal * 2.5);
            if (obj.z < 0.05) {
              obj.z = 4.5;
              obj.x = (Math.random() - 0.5) * 120;
              obj.y = (Math.random() - 0.5) * 120;
              obj.hue = Math.random() * 360;
            }
          }

          const perspectiveScale = 1 / obj.z;
          const drawX = centerX + obj.x * perspectiveScale * settings.scaleX * 12;
          const drawY = centerY + obj.y * perspectiveScale * settings.scaleY * 12;
          const drawSize = obj.size * perspectiveScale;
          const opacity = Math.min(1, perspectiveScale * 0.8);

          if (drawX < -drawSize * 3 || drawX > width + drawSize * 3 || drawY < -drawSize * 3 || drawY > height + drawSize * 3) return;

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(time * obj.rotationSpeed);
          ctx.globalAlpha = opacity;

          if (obj.type === 'planet') {
            const grd = ctx.createRadialGradient(-drawSize*0.4, -drawSize*0.4, 0, 0, 0, drawSize);
            grd.addColorStop(0, `hsla(${obj.hue}, ${obj.saturation}%, ${obj.lightness + 30}%, 1)`);
            grd.addColorStop(0.5, `hsla(${obj.hue}, ${obj.saturation}%, ${obj.lightness}%, 1)`);
            grd.addColorStop(0.8, `hsla(${obj.hue}, ${obj.saturation}%, ${obj.lightness - 30}%, 1)`);
            grd.addColorStop(1, '#000'); 
            
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
            ctx.fill();

            if (obj.hasRings) {
               ctx.strokeStyle = `hsla(${obj.hue}, 60%, 75%, 0.5)`;
               ctx.lineWidth = drawSize * 0.18;
               ctx.beginPath();
               ctx.ellipse(0, 0, drawSize * 2.0, drawSize * 0.5, Math.PI/6, 0, Math.PI * 2);
               ctx.stroke();
            }
          } else if (obj.type === 'star') {
            // Simplified star for low mode (no gradient flare)
            if (visualMode === 'low') {
                ctx.fillStyle = `hsla(${obj.hue}, 100%, 85%, 0.9)`;
                ctx.beginPath();
                ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const flicker = Math.sin(time * 12 + obj.id) * 0.4 + 0.6;
                const starFlare = (beatVal * 3 + flicker) * drawSize * 1.0;
                
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, drawSize + starFlare);
                grd.addColorStop(0, '#fff');
                grd.addColorStop(0.1, `hsla(${obj.hue}, 100%, 85%, 0.9)`);
                grd.addColorStop(0.4, `hsla(${obj.hue}, 100%, 70%, 0.4)`);
                grd.addColorStop(1, 'transparent');
                
                if (visualMode === 'high') {
                    ctx.shadowBlur = 20 * beatVal * flicker;
                    ctx.shadowColor = `hsla(${obj.hue}, 100%, 70%, 1)`;
                }
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, drawSize + starFlare, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
          } else if (obj.type === 'nebula') {
            const glow = (intensity / 255) * drawSize * 1.5;
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, drawSize + glow);
            grd.addColorStop(0, `hsla(${obj.hue}, 90%, 50%, 0.5)`);
            grd.addColorStop(0.7, `hsla(${(obj.hue + 60)%360}, 80%, 40%, 0.2)`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize + glow, 0, Math.PI * 2);
            ctx.fill();
          } else if (obj.type === 'galaxy') {
            const armCount = visualMode === 'low' ? 3 : 6; 
            for (let j = 0; j < armCount; j++) {
              ctx.rotate(Math.PI / (armCount/2));
              const armLen = drawSize * (1 + beatVal * 1.2);
              const grd = ctx.createRadialGradient(armLen, 0, 0, armLen, 0, drawSize * 0.6);
              grd.addColorStop(0, `hsla(${(obj.hue + j * 30)%360}, 90%, 65%, 0.7)`);
              grd.addColorStop(1, 'transparent');
              ctx.fillStyle = grd;
              ctx.beginPath();
              ctx.ellipse(armLen, 0, drawSize * 1.2, drawSize * 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        });

      } else if (variant === 'mixed-rings') {
        const ringCount = visualMode === 'low' ? 4 : (visualMode === 'medium' ? 6 : 10);
        const centerX = width / 2;
        const centerY = height / 2;
        const timeShift = Date.now() / 1000 * animationSpeed;
        for (let i = 0; i < ringCount; i++) {
          const val = (dataArray[i * 20] || 0) / 255;
          const pulse = isPlaying ? Math.sin(timeShift + i) * 10 : 0;
          const radius = (40 + i * 30 + pulse) * (1 + val * 0.5);
          ctx.strokeStyle = `hsla(${(i/ringCount)*360 + (isPlaying ? timeShift * 20 : 0)}, 70%, 50%, 0.6)`;
          ctx.lineWidth = settings.performanceMode ? (3 + val * 6) : (4 + val * 10);
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radius * settings.scaleX, radius * settings.scaleY, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (variant === 'bubbles') {
        const bubbleCount = visualMode === 'low' ? 15 : (visualMode === 'medium' ? 25 : 50);
        if (particlesRef.current.length === 0) {
          particlesRef.current = Array.from({ length: bubbleCount }, () => ({
            x: Math.random() * width,
            y: height + Math.random() * 100,
            radius: 5 + Math.random() * 15,
            speed: 1 + Math.random() * 3
          }));
        }
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        particlesRef.current.forEach(p => {
          if (isPlaying) {
             p.y -= p.speed * (1 + avg/100) * animationSpeed;
             if (p.y < -50) p.y = height + 50;
          }
          ctx.fillStyle = `hsla(${(p.x/width)*360}, 60%, 70%, 0.4)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (1 + avg/150), 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        const baseBarCount = visualMode === 'low' ? 50 : (visualMode === 'medium' ? 80 : 120);
        const barCount = Math.floor(baseBarCount * (settings.barDensity || 1.2));
        const effectiveWidthFill = width * 0.98;
        const offsetXFill = (width - effectiveWidthFill) / 2;
        const barWidth = effectiveWidthFill / barCount;
        const timeShift = Date.now() / 100 * animationSpeed;
        const glowMult = settings.glowIntensity ?? 1.2;
        
        for (let i = 0; i < barCount; i++) {
          const t = i / barCount;
          // Stretch more of the active spectrum (bass-mids-highs up to ~14kHz)
          // index 0.6 of 1024 is ~13.2kHz, where most radio energy ends.
          const freqIndex = Math.floor(Math.pow(t, 0.85) * (bufferLength * 0.65));
          
          const rawVal = (dataArray[freqIndex] || 0) / 255;
          // High frequency boost + small noise floor to keep it alive
          const sensitivity = 1 + t * 0.8;
          const noise = isPlaying ? (Math.random() * 0.02 * t) : 0;
          const intensityVal = Math.min(1, rawVal * sensitivity + noise);
          
          const barHeight = intensityVal * effectiveHeight;
          const x = offsetXFill + (i * barWidth);
          const hue = (i / barCount) * 360 + (isPlaying ? timeShift : 0);
          
          if (variant === 'segmented') {
            const isBottom = settings.vizAlignment === 'bottom';
            const baselineY = isBottom ? height - 10 : height / 2;
            const segH = 4;
            const segG = 2;
            const count = Math.max(isBottom ? 1 : 0, Math.floor(barHeight / (segH + segG)));
            
            if (visualMode !== 'low' && intensityVal > 0.05) {
              ctx.shadowBlur = 15 * intensityVal * glowMult;
              ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.8)`;
            }

            // Draw segments
            for(let s=0; s<count; s++) {
              if (isBottom) {
                const rectY = baselineY - s*(segH+segG) - segH;
                const opacity = 0.4 + (1 - s/count) * 0.6;
                ctx.fillStyle = `hsla(${hue}, 100%, ${70 - (s/count)*20}%, ${opacity})`;
                ctx.fillRect(x, rectY, barWidth - 1.5, segH);
                
                // Add a small highlight on top segment
                if (s === count - 1) {
                  ctx.fillStyle = '#fff';
                  ctx.globalAlpha = 0.5 * intensityVal;
                  ctx.fillRect(x, rectY, barWidth - 1.5, 1);
                  ctx.globalAlpha = 1;
                }
              } else {
                const rectYTop = baselineY - s*(segH+segG) - segH;
                const rectYBottom = baselineY + s*(segH+segG);
                const opacity = 0.4 + (1 - s/count) * 0.6;
                ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${opacity})`;
                ctx.fillRect(x, rectYTop, barWidth - 1.5, segH);
                ctx.fillRect(x, rectYBottom, barWidth - 1.5, segH);
              }
            }
            
            ctx.shadowBlur = 0;
          } else {
            const barGrd = ctx.createLinearGradient(x, height, x, height - barHeight);
            barGrd.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.9)`);
            barGrd.addColorStop(1, `hsla(${hue}, 100%, 80%, 1)`);
            
            ctx.fillStyle = barGrd;
            if (visualMode === 'high') {
                ctx.shadowBlur = 10 * intensityVal;
                ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.5)`;
            }
            ctx.fillRect(x, height - barHeight - (height - effectiveHeight)/2, barWidth - 1, barHeight);
            ctx.shadowBlur = 0;
          }
        }
      }

      animationRef.current = requestAnimationFrame(renderFrame);
    };

    animationRef.current = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
    };
  }, [analyserNode, isPlaying, variant, settings, visualMode]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 z-10" />
    </div>
  );
};

export default AudioVisualizer;

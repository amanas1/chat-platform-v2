
import React from 'react';

interface CosmicBackgroundProps {
  showMoon?: boolean;
}

const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ showMoon = true }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Stars / Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(white 1px, transparent 1px), radial-gradient(white 0.5px, transparent 0.5px)',
            backgroundSize: '50px 50px, 20px 20px',
            backgroundPosition: '0 0, 10px 10px',
            opacity: 0.2
        }}></div>

        {/* The Moon */}
        {showMoon && (
            <div className="absolute top-[12%] right-[15%] w-[10vh] h-[10vh] md:w-[14vh] md:h-[14vh] rounded-full shadow-[0_0_60px_rgba(255,255,255,0.2)] opacity-95 animate-[float_10s_ease-in-out_infinite]">
                <img 
                    src="https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=500&auto=format&fit=crop" 
                    alt="Moon"
                    className="w-full h-full object-cover rounded-full grayscale brightness-125 contrast-125"
                />
                {/* Inner Shadow for dimensionality */}
                <div className="absolute inset-0 rounded-full shadow-[inset_15px_15px_40px_rgba(0,0,0,0.8)] mix-blend-multiply"></div>
                {/* Subtle Atmosphere Glow */}
                <div className="absolute inset-0 rounded-full bg-blue-100/10 mix-blend-overlay"></div>
            </div>
        )}
    </div>
  );
};

export default CosmicBackground;

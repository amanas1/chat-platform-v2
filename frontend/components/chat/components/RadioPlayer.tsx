import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/* ─── Equalizer CSS (injected once) ─── */
const eqStyle = `
@keyframes eq1 { 0%,100%{height:4px} 50%{height:16px} }
@keyframes eq2 { 0%,100%{height:8px} 50%{height:20px} }
@keyframes eq3 { 0%,100%{height:12px} 50%{height:6px} }
@keyframes eq4 { 0%,100%{height:6px} 50%{height:18px} }
@keyframes eq5 { 0%,100%{height:10px} 50%{height:4px} }
`;

const SOCIALS = [
  { id: 'telegram', label: 'TELEGRAM', color: '#2AABEE', letter: 'T', url: 'https://t.me/share/url?url=' },
  { id: 'whatsapp', label: 'WHATSAPP', color: '#25D366', letter: 'W', url: 'https://wa.me/?text=' },
  { id: 'vk', label: 'VK', color: '#4C75A3', letter: 'V', url: 'https://vk.com/share.php?url=' },
  { id: 'x', label: 'X', color: '#333', letter: 'X', url: 'https://twitter.com/intent/tweet?url=' },
  { id: 'facebook', label: 'FACEBOOK', color: '#1877F2', letter: 'F', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
  { id: 'reddit', label: 'REDDIT', color: '#FF4500', letter: 'R', url: 'https://reddit.com/submit?url=' },
  { id: 'linkedin', label: 'LINKEDIN', color: '#0077B5', letter: 'L', url: 'https://linkedin.com/sharing/share-offsite/?url=' },
];

interface RadioPlayerProps {
  radioPlaying?: boolean;
  radioStationName?: string;
  onTogglePlay?: () => void;
  onNextStation?: () => void;
  onPrevStation?: () => void;
  isRandomMode?: boolean;
  onToggleRandom?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const RadioPlayer: React.FC<RadioPlayerProps> = ({ radioPlaying = false, radioStationName = '', onTogglePlay, onNextStation, onPrevStation, isRandomMode = false, onToggleRandom, isFavorite = false, onToggleFavorite }) => {
  const [isPlaying, setIsPlaying] = React.useState(radioPlaying);
  const [showVolume, setShowVolume] = React.useState(false);
  const [playerVolume, setPlayerVolume] = React.useState(75);
  const [showShare, setShowShare] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);
  const volumeRef = React.useRef<HTMLDivElement>(null);

  // Sync with dashboard radio state
  React.useEffect(() => {
    setIsPlaying(radioPlaying);
  }, [radioPlaying]);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auradiochat.com';

  // Close volume on outside click
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) setShowVolume(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const handleShare = (url: string) => {
    window.open(url + encodeURIComponent(shareUrl), '_blank', 'width=600,height=400');
  };

  return (
    <>
      <style>{eqStyle}</style>

      {/* ═══ SHARE MODAL ═══ */}
      <AnimatePresence>
        {showShare && (
          <motion.div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShare(false)}>
            <motion.div className="w-[320px] bg-[#1e293b] rounded-2xl border border-white/10 p-5" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  <h3 className="text-[15px] font-bold text-white">Поделиться</h3>
                </div>
                <button onClick={() => setShowShare(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-5">
                {SOCIALS.map(s => (
                  <button key={s.id} onClick={() => handleShare(s.url)} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[14px] font-bold transition-transform group-hover:scale-110" style={{ backgroundColor: s.color }}>
                      {s.letter}
                    </div>
                    <span className="text-[8px] text-slate-500 font-semibold uppercase">{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5">
                <p className="flex-1 text-[12px] text-slate-300 truncate">{shareUrl}</p>
                <button onClick={handleCopy} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-white/10 text-white hover:bg-white/15 transition-colors">
                  {copied ? '✓' : 'COPY'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PLAYER BAR ═══ */}
      <div className="shrink-0 border-t border-white/[0.06]">

        {/* Row 1 — Track Info Bar */}
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Volume */}
          <div className="relative" ref={volumeRef}>
            <button onClick={() => setShowVolume(!showVolume)} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                {playerVolume === 0
                  ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                }
              </svg>
            </button>
            {/* Volume Popup */}
            {showVolume && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1e293b] border border-white/10 rounded-xl p-3 w-10 h-[120px] flex flex-col items-center shadow-xl">
                <input type="range" min="0" max="100" value={playerVolume} onChange={e => setPlayerVolume(Number(e.target.value))}
                  className="w-[100px] h-1 appearance-none bg-white/10 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
                <span className="text-[9px] text-slate-500 font-bold mt-auto">{playerVolume}</span>
              </div>
            )}
          </div>

          {/* Track Name + Equalizer */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* Equalizer Bars */}
            {isPlaying && (
              <div className="flex items-end gap-[2px] h-5 shrink-0">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-[2.5px] rounded-full bg-orange-400" style={{
                    animation: `eq${i} ${0.4 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${i * 0.05}s`,
                  }} />
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#e5e7eb] font-medium truncate">
              {isPlaying ? (radioStationName || 'Radio') : 'Radio'}
            </p>
            {/* Live indicator */}
            {isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />}
          </div>

          {/* Expand/Collapse */}
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-600 hover:text-slate-400 transition-colors">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        {/* Row 2 — Controls (collapsible) */}
        {expanded && (
          <div className="flex items-center justify-center gap-4 px-4 pb-3">
            {/* Equalizer Icon */}
            <button className="p-1.5 text-orange-400 hover:text-orange-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18h2V6H7v12zm4 4h2V2h-2v20zm-8-8h2v-4H3v4zm12 4h2V6h-2v12zm4-8v4h2v-4h-2z"/></svg>
            </button>

            {/* Rewind / Previous Station */}
            <button onClick={() => onPrevStation?.()} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors active:scale-90">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
            </button>

            {/* Play/Pause */}
            <button onClick={() => { if (onTogglePlay) onTogglePlay(); else setIsPlaying(!isPlaying); }} className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-white hover:bg-white/[0.12] transition-all active:scale-95">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Forward / Next Station */}
            <button onClick={() => onNextStation?.()} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors active:scale-90">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
            </button>

            {/* Favorite */}
            <button onClick={() => onToggleFavorite?.()} className={`p-1.5 transition-all active:scale-90 ${isFavorite ? 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'text-slate-600 hover:text-red-400'}`}>
              <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>

            {/* Random Mode Toggle */}
            <button onClick={() => onToggleRandom?.()} className={`p-1.5 transition-colors ${isRandomMode ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-slate-600 hover:text-slate-400'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>

            {/* Share */}
            <button onClick={() => setShowShare(true)} className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

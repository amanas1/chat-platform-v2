import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, CheckIcon, MicrophoneIcon, StopIcon, PlayIcon, 
  PauseIcon, ForwardIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
  CloudArrowDownIcon
} from './Icons';

interface RegistrationDemoAnimationProps {
  onComplete: () => void;
}

export default function RegistrationDemoAnimation({ onComplete }: RegistrationDemoAnimationProps) {
  // Animation State
  const [cursorPos, setCursorPos] = useState({ x: '50%', y: '110%' });
  const [cursorClick, setCursorClick] = useState(false);
  const [step, setStep] = useState(0); // 0: Start, 1: Form, 2: Voice, 3: Settings, 4: Player, 5: Save
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [status, setStatus] = useState('online');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [trackIndex, setTrackIndex] = useState(0);
  
  // Save State
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper for delays
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    let mounted = true;

    const click = async () => {
        if (!mounted) return;
        setCursorClick(true);
        await wait(200);
        setCursorClick(false);
    };

    const typeText = async (text: string, setter: (s: string) => void) => {
        for (let i = 0; i <= text.length; i++) {
            if (!mounted) return;
            setter(text.slice(0, i));
            await wait(100 + Math.random() * 50);
        }
    };

    const runScript = async () => {
        await wait(1000);

        // --- PHASE 1: AVATAR ---
        // Move to Avatar placeholder
        setCursorPos({ x: '50%', y: '30%' });
        await wait(1000);
        await click();
        // Simulate avatar selection appearing and selecting
        await wait(500);
        setSelectedAvatar('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'); // Sunglasses guy
        
        // --- PHASE 2: FORM FILLING ---
        await wait(1000);
        // Name input
        setCursorPos({ x: '50%', y: '45%' });
        await wait(800);
        await click();
        await typeText("Alex", setName);
        
        await wait(500);
        // Age input
        setCursorPos({ x: '50%', y: '55%' });
        await wait(800);
        await click();
        await typeText("25", setAge);

        // --- PHASE 3: VOICE INTRO ---
        await wait(1000);
        // Move to Mic
        setCursorPos({ x: '50%', y: '68%' });
        await wait(1000);
        await click();
        setIsRecording(true);
        
        // Record for 2s
        for (let i = 0; i <= 100; i+=5) {
            if (!mounted) return;
            setVoiceProgress(i);
            await wait(100);
        }
        
        // Stop recording
        setCursorPos({ x: '50%', y: '68%' }); // Still on button (became stop)
        await click();
        setIsRecording(false);
        setVoiceRecorded(true);

        // --- PHASE 4: SCROLL TO SETTINGS ---
        await wait(1000);
        // Simulate scroll
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 300, behavior: 'smooth' });
        }
        await wait(1500);

        // --- PHASE 5: PLAYER INTERACTION ---
        setStep(4);
        // Move to Play Button
        setCursorPos({ x: '50%', y: '85%' }); // Center Play button
        await wait(1000);
        await click();
        setIsPlaying(true);
        await wait(2000); // Listen

        // Next Track
        setCursorPos({ x: '65%', y: '85%' }); // Next button
        await wait(1000);
        await click();
        setTrackIndex(1);
        await wait(1000);

        // Volume Down
        setCursorPos({ x: '85%', y: '85%' }); // Volume area
        await wait(1000);
        // Drag slider down simulation
        setVolume(0.4); 
        await wait(1000);

        // --- PHASE 6: SAVE ---
        setStep(5);
        // Scroll to bottom
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 600, behavior: 'smooth' });
        }
        await wait(1000);
        
        // Click Save
        setCursorPos({ x: '80%', y: '92%' }); // Save button position (relative to container)
        await wait(1000);
        await click();
        setShowSaveConfirm(true);

        // Confirm Save
        await wait(1500);
        setCursorPos({ x: '65%', y: '58%' }); // Confirm "Yes" button in modal
        await wait(1000);
        await click();
        
        // Finish
        await wait(2000);
        onComplete();
    };

    runScript();

    return () => { mounted = false; };
  }, [onComplete]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[60] bg-slate-900 overflow-hidden flex flex-col font-sans select-none pointer-events-none">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-white/10 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Регистрация (Demo)
            </h2>
            <button className="p-2 text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
        </div>

        {/* Scrollable Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-8 relative">
            
            {/* 1. Avatar Section */}
            <div className="flex flex-col items-center gap-4">
                <div className={`w-32 h-32 rounded-full border-4 ${selectedAvatar ? 'border-primary' : 'border-slate-700'} flex items-center justify-center bg-slate-800 overflow-hidden transition-all duration-500 relative`}>
                    {selectedAvatar ? (
                        <img src={selectedAvatar} className="w-full h-full object-cover animate-in fade-in zoom-in" />
                    ) : (
                        <div className="text-4xl">?</div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CloudArrowDownIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
                <p className="text-slate-400 text-sm">Нажмите, чтобы выбрать аватар</p>
            </div>

            {/* 2. Form Section */}
            <div className="space-y-4 max-w-md mx-auto w-full">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Имя</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 h-12 flex items-center">
                        <span className="text-white">{name}</span>
                        {!name && <span className="text-slate-600">Введите имя...</span>}
                        <span className="w-0.5 h-5 bg-primary animate-pulse ml-1" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Возраст</label>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 h-12 flex items-center">
                            <span className="text-white">{age}</span>
                             {!age && <span className="text-slate-600">18+</span>}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Статус</label>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 h-12 flex items-center justify-between text-green-400">
                            <span>Online</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Voice Intro Section */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5 space-y-4">
                 <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block text-center">Голосовое приветствие</label>
                 <div className="flex justify-center">
                    <button className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' : (voiceRecorded ? 'bg-green-500' : 'bg-slate-700')}`}>
                        {isRecording ? <StopIcon className="w-8 h-8 text-white" /> : (voiceRecorded ? <CheckIcon className="w-8 h-8 text-white" /> : <MicrophoneIcon className="w-8 h-8 text-white" />)}
                    </button>
                 </div>
                 {isRecording && (
                     <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                         <div className="h-full bg-red-500 transition-all duration-100" style={{ width: `${voiceProgress}%` }} />
                     </div>
                 )}
                 {voiceRecorded && <p className="text-center text-green-400 text-sm">✅ Приветствие записано</p>}
            </div>

            {/* 4. Settings Section (Mock) */}
            <div className="space-y-4 pt-4 opacity-50">
                 <h3 className="font-bold text-slate-500">Настройки поиска</h3>
                 <div className="flex gap-2">
                     <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs">Парни</div>
                     <div className="px-3 py-1 bg-primary text-black rounded-lg text-xs font-bold">Девушки</div>
                     <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs">Любой</div>
                 </div>
            </div>

             <div className="h-24" /> {/* Spacer */}
        </div>

        {/* 5. Player Bar Mockup */}
        <div className="bg-black/90 backdrop-blur-md border-t border-white/10 p-4 shrink-0 relative z-20">
             <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-1/3">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg overflow-hidden animate-spin-slow">
                        {/* Album Art Mock */}
                        <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-blue-500" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white">{trackIndex === 0 ? 'Deep House Radio' : 'Chillhop Essentials'}</div>
                        <div className="text-[10px] text-slate-400">Live Stream</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 justify-center w-1/3">
                    <PlayIcon className="w-5 h-5 opacity-50 rotate-180" /> {/* Prev */}
                    <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-primary text-black' : 'bg-white text-black'}`}>
                        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-1" />}
                    </button>
                    <PlayIcon className="w-5 h-5 hover:text-white transition-colors cursor-pointer" /> {/* Next */}
                </div>

                <div className="flex items-center gap-2 w-1/3 justify-end">
                    <SpeakerWaveIcon className="w-4 h-4 text-slate-400" />
                    <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden relative">
                         <div className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-300" style={{ width: `${volume * 100}%` }} />
                    </div>
                </div>
             </div>
        </div>

        {/* 6. Save Button Overlay (Bottom Right) */}
        <div className="absolute bottom-24 right-6 z-30">
             <button className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-full shadow-lg shadow-green-500/20 transition-all flex items-center gap-2">
                 <CheckIcon className="w-5 h-5" />
                 Сохранить
             </button>
        </div>


        {/* Mock Save Confirmation Modal */}
        {showSaveConfirm && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center animate-in fade-in duration-300">
                <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full border border-white/10 text-center shadow-2xl scale-100 animate-in zoom-in-95">
                    <h3 className="text-xl font-bold mb-2">Сохранить профиль?</h3>
                    <p className="text-slate-400 mb-6 text-sm">Ваши данные будут доступны в поиске.</p>
                    <div className="flex gap-3 justify-center">
                        <button className="px-6 py-2 bg-slate-700 rounded-lg text-slate-300">Отмена</button>
                        <button className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90">Да, сохранить</button>
                    </div>
                </div>
            </div>
        )}

      {/* CURSOR */}
      <div 
        className="fixed w-6 h-6 z-[100] transition-all duration-500 ease-in-out pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        style={{ 
            left: cursorPos.x, 
            top: cursorPos.y,
            transform: `translate(-50%, -50%) scale(${cursorClick ? 0.8 : 1})`
        }}
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-full h-full filter drop-shadow-md">
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" />
        </svg>
      </div>

      {/* Overlay Description text for steps */}
      <div className="absolute top-20 left-0 right-0 text-center pointer-events-none z-40">
           <div className="inline-block bg-black/60 backdrop-blur px-4 py-2 rounded-full text-sm font-mono text-primary animate-pulse">
               {step === 0 && "Demo: Создание профиля..."}
               {step === 1 && "Шаг 1: Заполнение данных"}
               {step === 2 && "Шаг 2: Запись голоса (Voice Intro)"}
               {step === 4 && "Шаг 3: Проверка плеера"}
               {step === 5 && "Шаг 4: Сохранение"}
           </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { XMarkIcon, AndroidIcon, AppleIcon, ArrowLeftIcon } from './Icons';
import { Language } from '../types';

interface DownloadAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    installPrompt: any;
}

const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose, language, installPrompt }) => {
    const [qrUrl, setQrUrl] = useState('');
    const [instruction, setInstruction] = useState<'android' | 'ios' | null>(null);

    useEffect(() => {
        // Generate QR code for current URL
        const url = window.location.href;
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=1e293b&color=ffffff`);
    }, []);

    if (!isOpen) return null;

    const t = language === 'ru' ? {
        title: "Скачайте приложение",
        subtitle: "Слушайте AU RadioChat на ходу",
        scan: "Сканируйте камерой телефона",
        install: "Установить App",
        android: "Android",
        ios: "iOS",
        desc: "Откройте камеру на телефоне и наведите на QR-код, чтобы открыть приложение.",
        androidInst: "Нажмите на меню (⋮) в браузере и выберите «Установить приложение» или «Добавить на гл. экран».",
        iosInst: "В Safari нажмите кнопку «Поделиться» (квадрат со стрелкой), прокрутите вниз и выберите «На экран „Домой“».",
        back: "Назад"
    } : {
        title: "Get the App",
        subtitle: "Listen to AU RadioChat on the go",
        scan: "Scan with phone camera",
        install: "Install App",
        android: "Android",
        ios: "iOS",
        desc: "Open your phone camera and point it at the QR code to launch the app.",
        androidInst: "Tap the browser menu (⋮) and select 'Install App' or 'Add to Home Screen'.",
        iosInst: "In Safari, tap the 'Share' button (square with arrow), scroll down, and select 'Add to Home Screen'.",
        back: "Back"
    };

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                onClose();
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg glass-panel rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 flex flex-col items-center text-center overflow-hidden border border-white/10">
                
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[80px] animate-pulse rounded-full"></div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center shadow-[0_0_30px_rgba(188,111,241,0.4)] relative z-10 animate-transition border border-white/20">
                <svg className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
            </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{t.title}</h2>
        <p className="text-slate-400 text-sm mb-8 font-medium">{t.subtitle}</p>

        <div className="flex flex-col md:flex-row items-stretch gap-8 w-full mb-8 min-h-[180px]">
            {/* Left Side: QR or Instructions */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-6 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
                {instruction ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-left duration-300">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4 w-full backdrop-blur-sm">
                            <p className="text-sm font-bold text-white leading-relaxed">
                                {instruction === 'android' ? t.androidInst : t.iosInst}
                            </p>
                        </div>
                        <button onClick={() => setInstruction(null)} className="flex items-center gap-2 text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">
                            <ArrowLeftIcon className="w-4 h-4" /> {t.back}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4 transform hover:scale-105 transition-all duration-500 border-4 border-white/10">
                             {qrUrl && <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-xl" />}
                        </div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">{t.scan}</p>
                    </div>
                )}
            </div>

            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch"></div>

            {/* Right Side: Buttons */}
            <div className="flex-1 flex flex-col justify-center gap-4 w-full">
                 {installPrompt && (
                     <button onClick={handleInstallClick} className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(188,111,241,0.3)] flex items-center justify-center gap-2 border border-white/20">
                         {t.install}
                     </button>
                 )}
                 
                 <div className="flex gap-3">
                     <button 
                        onClick={() => setInstruction('android')}
                        className={`flex-1 py-3.5 bg-white/5 border rounded-2xl flex items-center justify-center gap-2 transition-all group ${instruction === 'android' ? 'border-primary bg-primary/20 shadow-[0_0_20px_rgba(188,111,241,0.2)]' : 'border-white/10 hover:bg-white/10 shadow-lg'}`}
                     >
                        <AndroidIcon className={`w-5 h-5 transition-colors ${instruction === 'android' ? 'text-[#3DDC84]' : 'text-slate-400 group-hover:text-[#3DDC84]'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wide ${instruction === 'android' ? 'text-white' : 'text-slate-300'}`}>{t.android}</span>
                     </button>
                     <button 
                        onClick={() => setInstruction('ios')}
                        className={`flex-1 py-3.5 bg-white/5 border rounded-2xl flex items-center justify-center gap-2 transition-all group ${instruction === 'ios' ? 'border-white bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-white/10 hover:bg-white/10 shadow-lg'}`}
                     >
                        <AppleIcon className={`w-5 h-5 transition-colors ${instruction === 'ios' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wide ${instruction === 'ios' ? 'text-white' : 'text-slate-300'}`}>{t.ios}</span>
                     </button>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed opacity-80">{t.desc}</p>
            </div>
        </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <p className="mt-6 text-[9px] text-slate-500 uppercase font-black tracking-[0.4em] opacity-50">AU RadioChat Mobile Engine</p>
            </div>
        </div>
    );
};

export default DownloadAppModal;

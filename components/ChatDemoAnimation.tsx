import React, { useState, useEffect } from 'react';
import { UserIcon, PaperAirplaneIcon, FaceSmileIcon } from './Icons';

const ChatDemoAnimation: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: '50%', y: '110%' });
    const [cursorClick, setCursorClick] = useState(false);
    const [typedText, setTypedText] = useState('');
    
    // Demo Data
    const demoPartner = { name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', age: 23 };

    useEffect(() => {
        let mounted = true;
        const timeline = async () => {
            if (!mounted) return;

            // 0s: Start - Show Search List
            // 1s: Move cursor to Alice
            await wait(1000);
            setCursorPos({ x: '60%', y: '40%' });
            
            // 2s: Click
            await wait(1000);
            setCursorClick(true);
            setTimeout(() => setCursorClick(false), 200);

            // 2.5s: Knocking Screen
            await wait(500);
            setStep(1); // Knocking
            setCursorPos({ x: '80%', y: '80%' }); // Move cursor away

            // 4.5s: Chat Open (Knock accepted)
            await wait(2000);
            setStep(2); // Chat

            // 5.5s: Partner typing
            await wait(1000);
            // (Visual indicator handles this)

            // 7.5s: Partner message appears
            await wait(1500);
            setStep(3); // Partner sent message

            // 8.5s: We type reply
            await wait(1000);
            const reply = "Привет! Как настроение?";
            for (let i = 0; i <= reply.length; i++) {
                if (!mounted) return;
                setTypedText(reply.slice(0, i));
                await wait(50 + Math.random() * 50);
            }

            // 10s: Move cursor to send
            await wait(500);
            setCursorPos({ x: '90%', y: '90%' }); // Send button position approx
            
            // 11s: Click Send
            await wait(1000);
            setCursorClick(true);
            setTimeout(() => setCursorClick(false), 200);

            // 11.5s: Message sent
            await wait(300);
            setStep(4); // Sent
            setTypedText('');

            // 14s: Finish
            await wait(2000);
            // Loop or close? Let's show "Try it yourself" overlay
            setStep(5);
        };

        timeline();

        return () => { mounted = false; };
    }, []);

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    return (
        <div className="relative w-full h-[400px] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl font-sans select-none">
            {/* Header */}
            <div className="h-12 bg-slate-800 flex items-center px-4 border-b border-white/5 justify-between">
                <span className="font-bold text-white text-sm">StreamFlow Chat</span>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><span className="text-lg">×</span></button>
            </div>

            {/* Content Area */}
            <div className="h-full bg-[#0f172a] relative">
                
                {/* 1. SEARCH LIST */}
                {step === 0 && (
                    <div className="p-4 space-y-3 animate-in fade-in">
                        <div className="text-xs font-bold text-slate-500 uppercase">Online Users</div>
                        {[demoPartner, { name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', age: 25 }].map((u, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border border-white/5 ${i === 0 ? 'bg-white/10' : 'bg-white/5'}`}>
                                <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-700" />
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-sm">{u.name}, {u.age}</h4>
                                    <p className="text-slate-400 text-[10px]">Just now</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. KNOCKING */}
                {step === 1 && (
                    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-primary/30 flex items-center justify-center animate-pulse mb-4">
                            <span className="text-2xl">✊</span>
                        </div>
                        <h3 className="text-white font-bold mb-1">Стучимся к {demoPartner.name}...</h3>
                        <p className="text-slate-400 text-xs text-center px-8">Ожидаем ответа...</p>
                    </div>
                )}

                {/* 3. CHAT */}
                {step >= 2 && step <= 4 && (
                    <div className="h-full flex flex-col pb-12 animate-in slide-in-from-right duration-300">
                        <div className="flex-1 p-4 space-y-4">
                            {/* Partner Msg */}
                            {step >= 3 && (
                                <div className="flex justify-start animate-in slide-in-from-left">
                                    <div className="bg-white/10 rounded-t-xl rounded-br-xl p-3 max-w-[80%] text-sm text-white">
                                        Привет! 👋 Ищешь компанию послушать музыку?
                                    </div>
                                </div>
                            )}

                            {/* My Msg */}
                            {step === 4 && (
                                <div className="flex justify-end animate-in slide-in-from-right">
                                    <div className="bg-primary/20 border border-white/10 rounded-t-xl rounded-bl-xl p-3 max-w-[80%] text-sm text-white">
                                        Привет! Как настроение?
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="absolute bottom-12 left-0 right-0 p-3 bg-slate-900 border-t border-white/5 flex items-center gap-2">
                            <div className="flex-1 bg-white/5 rounded-full px-3 py-2 text-sm text-white border border-white/5 h-10 flex items-center">
                                {typedText}<span className="w-0.5 h-4 bg-primary animate-pulse ml-0.5"></span>
                            </div>
                            <div className="p-2 bg-primary/20 rounded-full text-white">
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                 {/* 5. FINISH */}
                 {step === 5 && (
                    <div className="h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm absolute inset-0 animate-in fade-in z-20">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3 className="text-white font-bold text-xl mb-2">Теперь вы готовы!</h3>
                        <button onClick={onClose} className="px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded-full font-bold transition-all transform hover:scale-105">
                            Попробовать
                        </button>
                    </div>
                )}

                {/* FAKE CURSOR */}
                {step < 5 && (
                    <div 
                        className="absolute pointer-events-none z-50 transition-all duration-700 ease-in-out drop-shadow-2xl"
                        style={{ 
                            left: cursorPos.x, 
                            top: cursorPos.y,
                            transform: `translate(-50%, -50%) scale(${cursorClick ? 0.8 : 1})`
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2L24 16L17 18L21 28L17 30L12 19L5 24L10 2Z" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                        <div className={`absolute -ml-3 -mt-3 w-6 h-6 rounded-full bg-white/30 animate-ping ${cursorClick ? 'block' : 'hidden'}`}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDemoAnimation;

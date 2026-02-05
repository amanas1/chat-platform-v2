import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, PaperAirplaneIcon, FaceSmileIcon, MicrophoneIcon, PaperClipIcon, CameraIcon, PlayIcon } from './Icons';

const ChatDemoAnimation: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: '50%', y: '110%' });
    const [cursorClick, setCursorClick] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    
    // Demo Data
    const demoPartner = { name: 'Max', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', age: 27 };

    const addMessage = (msg: any) => {
        const id = Date.now() + Math.random();
        setMessages(prev => [...prev, { ...msg, id }]);
        
        // Accelerated fading for demo
        // Start fading after 6s (was 3s), remove after 8s (was 5s)
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, fading: true } : m));
        }, 6000); 
        setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== id));
        }, 8000); 
    };

    useEffect(() => {
        let mounted = true;

        const typeAndSend = async (text: string) => {
             for (let i = 0; i <= text.length; i++) {
                if (!mounted) return;
                setTypedText(text.slice(0, i));
                await wait(50 + Math.random() * 30); // Slower typing (was 30+20)
            }
            await wait(500);
            
            // Move cursor to send
            setCursorPos({ x: '92%', y: '92%' }); 
            await wait(600);
            click();
            addMessage({ sender: 'Me', text, type: 'text' });
            setTypedText('');
        };

        const click = () => {
            setCursorClick(true);
            setTimeout(() => setCursorClick(false), 200);
        }

        const timeline = async () => {
            if (!mounted) return;

            // --- PHASE 1: SEARCH & KNOCK ---
            await wait(800);
            // Search list
            // Move to Max
            setCursorPos({ x: '60%', y: '40%' }); 
            await wait(1000);
            click();
            
            await wait(600);
            setStep(1); // Knocking
            setCursorPos({ x: '80%', y: '80%' }); // Move clear

            // --- PHASE 2: CONNECTED ---
            await wait(1500);
            setStep(2); // Chat open

            // 1. Me: Привет как дела?
            await wait(1000);
            await typeAndSend("Привет как дела?");

            // 2. Him: Приветики Лена нормально ,как ты?
            await wait(2500); // Thinking time increased
            addMessage({ sender: 'Max', text: 'Приветики Лена нормально ,как ты?', type: 'text' });

            // 3. Me: Что делаешь сегодня ты свободен?
            await wait(2000); // Reading time
            await typeAndSend("Что делаешь сегодня ты свободен?");

            // 4. Him: Даа дома ,могу приехать...
            await wait(3000);
            addMessage({ sender: 'Max', text: 'Даа дома ,могу приехать к тебе в гости, а ты кушать приготовила,я голодный?', type: 'text' });

            // 5. Me: Да я приготовила курочку...
            await wait(3500); // Reading long msg
            await typeAndSend("Да я приготовила курочку в духовке ,приходи пораньше я по тебе соскучилась!");

            // 5.1 Photo of Chicken
            await wait(1000);
            setCursorPos({ x: '8%', y: '92%' }); // Paperclip
            await wait(800);
            click();
            await wait(1500); // Selecting file
            addMessage({ sender: 'Me', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', type: 'image' });

            // 6. Him: Недавно приехал...
            await wait(3000);
            addMessage({ sender: 'Max', text: 'Недавно приехал с работы ,высплюсь и вечером к тебе заеду 😘', type: 'text' });
            
            // 7. Me: возьми с собой вино красное ок?
            await wait(2000);
            await typeAndSend("возьми с собой вино красное ок?");

            // 8. Him: Хорошо ,жди родная! + Emoji
            await wait(2500);
            addMessage({ sender: 'Max', text: 'Хорошо ,жди родная! 😘', type: 'text' });
            
            // --- FINISH ---
            await wait(6000); // Let users see the fading effect longer
            setStep(5);
        };

        timeline();
        return () => { mounted = false; };
    }, []);

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    return (
        <div className="relative w-full h-[500px] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl font-sans select-none flex flex-col">
            {/* Header */}
            <div className="h-12 bg-slate-800 flex items-center px-4 border-b border-white/5 justify-between shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-bold text-white text-sm">StreamFlow Demo</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><span className="text-lg">×</span></button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#0f172a] relative overflow-hidden flex flex-col">
                
                {/* 1. SEARCH LIST */}
                {step === 0 && (
                    <div className="p-4 space-y-3 animate-in fade-in">
                        <div className="text-xs font-bold text-slate-500 uppercase">Online Users</div>
                        {[demoPartner, { name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', age: 32 }].map((u, i) => (
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
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col-reverse">
                             {/* Messages List - Reversed for correct stacking if we used column-reverse, but here we perform auto-scroll or just stack normal. Let's stack normal and assume it fits or auto-scrolls. Actually, for demo, let's just stack normal. */}
                             <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'} transition-all duration-1000 ease-in-out ${msg.fading ? 'opacity-0 blur-sm scale-95' : 'opacity-100 scale-100'}`}
                                    >
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm animate-in slide-in-from-bottom-2 ${msg.sender === 'Me' ? 'bg-primary/20 rounded-tr-sm text-white' : 'bg-white/10 rounded-tl-sm text-white'}`}>
                                            {msg.type === 'text' && msg.text}
                                            
                                            {msg.type === 'image' && (
                                                <div className="space-y-1">
                                                     <img src={msg.image} className="rounded-lg max-w-full h-auto border border-white/10" alt="attachment" />
                                                </div>
                                            )}
                                            
                                        </div>
                                    </div>
                                ))}
                             </div>
                             {messages.some(m => m.fading) && <div className="fixed top-14 left-0 right-0 text-[10px] text-slate-500 text-center animate-pulse pointer-events-none">Сообщения исчезают...</div>}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-slate-900 border-t border-white/5 relative shrink-0">
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"><PaperClipIcon className="w-5 h-5" /></button>
                                <div className="flex-1 bg-white/5 rounded-full px-3 py-2 text-sm text-white border border-white/5 h-10 flex items-center gap-2">
                                    <span className="flex-1 truncate">{typedText}</span>
                                    <button className="text-slate-400 hover:text-yellow-400"><FaceSmileIcon className="w-5 h-5" /></button>
                                </div>
                                <button 
                                    className={`p-2 rounded-full transition-all bg-white/5 text-slate-400`}
                                >
                                    {typedText ? <PaperAirplaneIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                 {/* 5. FINISH */}
                 {step === 5 && (
                    <div className="h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm absolute inset-0 animate-in fade-in z-30 text-center p-6">
                        <div className="text-5xl mb-4">💨</div>
                        <h3 className="text-white font-bold text-xl mb-2">Все исчезло!</h3>
                        <p className="text-slate-400 text-sm mb-6">Ваша переписка осталась только в вашей памяти.</p>
                        <button onClick={onClose} className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/30">
                            Закрыть демо
                        </button>
                    </div>
                )}

                {/* FAKE CURSOR */}
                {step < 5 && (
                    <div 
                        className="absolute pointer-events-none z-50 transition-all duration-300 ease-out drop-shadow-2xl"
                        style={{ 
                            left: cursorPos.x, 
                            top: cursorPos.y,
                            transform: `translate(-50%, -50%) scale(${cursorClick ? 0.8 : 1})`
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-md">
                            <path d="M5.5 3.5L11.5 17.5L8.5 14.5L12.5 22.5L9.5 23.5L5.5 15.5L2.5 18.5L5.5 3.5Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        <div className={`absolute -ml-3 -mt-3 w-6 h-6 rounded-full bg-white/50 animate-ping ${cursorClick ? 'block' : 'hidden'}`}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDemoAnimation;

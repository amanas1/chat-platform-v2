import React, { useState, useEffect } from 'react';
import { 
    signInWithGoogle 
} from '../auth';
import { Language } from '../types';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, language }) => {
    // Stage: 'choice', 'success'
    const [stage, setStage] = useState<'choice' | 'success'>('choice');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(() => {
        // Initialize from localStorage
        if (typeof window !== 'undefined') {
            return localStorage.getItem('agreedToTerms') === 'true';
        }
        return false;
    });

    // Reset state on open, but keep agreement if already set in storage
    useEffect(() => {
        if (isOpen) {
            setStage('choice');
            setError(null);
            setLoading(false);
            // Re-check storage in case it changed while modal was closed
            const storedAgreement = localStorage.getItem('agreedToTerms') === 'true';
            setAgreedToTerms(storedAgreement);
        }
    }, [isOpen]);

    // Listen for storage changes (for cross-tab synchronization)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'agreedToTerms') {
                setAgreedToTerms(e.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Update localStorage when local state changes
    useEffect(() => {
        if (agreedToTerms) {
            localStorage.setItem('agreedToTerms', 'true');
        } else {
             localStorage.removeItem('agreedToTerms');
        }
    }, [agreedToTerms]);

    const handleGoogleLogin = async () => {
        if (!agreedToTerms) return;
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            setStage('success');
        } catch (err: any) {
            console.error("Google Login Error:", err);
            const errorMessage = language === 'ru' 
                ? `Ошибка входа: ${err.code || err.message}` 
                : `Login failed: ${err.code || err.message}`;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isRu = language === 'ru';
    
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            
            <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10 overflow-hidden">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white mb-2">
                        {stage === 'success' ? (isRu ? 'Успешно!' : 'Success!') : (isRu ? 'Вход' : 'Sign In')}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {isRu ? 'Получите полный доступ к функциям' : 'Unlock full access to all features'}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center animate-pulse break-words select-text">
                        {error}
                        <div className="mt-2 text-[10px] text-slate-500 font-mono">
                            Please take a screenshot of this error.
                        </div>
                    </div>
                )}

                {/* Loading Grid (Overlay) */}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Content based on Stage */}
                {stage === 'choice' && (
                    <div className="space-y-4">
                        {/* Consent Checkbox */}
                        <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                            <label className="flex items-start gap-4 cursor-pointer">
                                <div className="relative flex items-center mt-1">
                                    <input 
                                        type="checkbox" 
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-500 rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                        <svg className={`w-3 h-3 text-white transition-opacity ${agreedToTerms ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-[11px] leading-snug text-slate-400 group-hover:text-slate-300 transition-colors">
                                    {isRu ? (
                                        <>
                                            Я принимаю <a href="/terms.html" target="_blank" className="text-primary hover:underline">условия использования</a> и <a href="/privacy.html" target="_blank" className="text-primary hover:underline">политику конфиденциальности</a>
                                        </>
                                    ) : (
                                        <>
                                            I agree to the <a href="/terms.html" target="_blank" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy.html" target="_blank" className="text-primary hover:underline">Privacy Policy</a>
                                        </>
                                    )}
                                </span>
                            </label>
                        </div>

                        <button 
                            onClick={handleGoogleLogin}
                            disabled={!agreedToTerms}
                            className={`w-full py-4 bg-white text-slate-900 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] ${!agreedToTerms ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'}`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                            </svg>
                            {isRu ? 'Войти через Google' : 'Sign in with Google'}
                        </button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
                        </div>

                        <button 
                            onClick={async () => {
                                if (!agreedToTerms) return;
                                setLoading(true);
                                const { signInWithGoogleRedirect } = await import('../auth');
                                try {
                                    await signInWithGoogleRedirect();
                                } catch (err) {
                                    console.error(err);
                                    setLoading(false);
                                    setError(String(err));
                                }
                            }}
                            disabled={!agreedToTerms}
                            className={`w-full py-4 bg-slate-800 text-white border border-white/10 rounded-xl font-bold transition-all text-sm ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 active:scale-95'}`}
                        >
                            {isRu ? 'Войти стандартным способом (Redirect)' : 'Standard Login (Redirect)'}
                        </button>
                    </div>
                )}

                {stage === 'success' && (
                    <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        {isRu ? 'Успешно!' : 'Success!'}
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 text-center">
                        {isRu ? 'Добро пожаловать!' : 'Welcome back!'}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs transition-colors"
                    >
                        {isRu ? 'Нажмите, если не перенаправляет...' : 'Click if not redirecting...'}
                    </button>
                </div>
                )}

            </div>
        </div>
    );
};

export default LoginModal;

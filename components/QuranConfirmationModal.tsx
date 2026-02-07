import React, { useState } from 'react';

interface QuranConfirmationModalProps {
    isOpen: boolean;
    stationName: string;
    language: 'ru' | 'en';
    onContinue: (dontShowAgain: boolean) => void;
    onCancel: () => void;
}

const QuranConfirmationModal: React.FC<QuranConfirmationModalProps> = ({
    isOpen,
    stationName,
    language,
    onContinue,
    onCancel
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    const text = {
        ru: {
            title: 'Чтение Священного Корана',
            description: [
                'Данная радиостанция транслирует чтение сур Священного Корана.',
                'Прослушивание предполагает спокойное и уважительное отношение.',
                'Контент не содержит пропаганды, призывов или вводящей в заблуждение информации.',
                'Можно слушать независимо от вероисповедания.'
            ],
            continue: 'Продолжить прослушивание',
            selectOther: 'Выбрать другую станцию',
            dontShow: 'Больше не показывать'
        },
        en: {
            title: 'Quran Recitation',
            description: [
                'This station broadcasts recitation of Quran suras.',
                'Listening implies a calm and respectful attitude.',
                'Content does not contain propaganda, calls, or misleading information.',
                'Can be listened to regardless of religion.'
            ],
            continue: 'Continue listening',
            selectOther: 'Select another station',
            dontShow: "Don't show again"
        }
    };

    const t = text[language];

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center ring-4 ring-blue-500/20">
                        <span className="text-5xl">📿</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                    {t.title}
                </h2>

                {/* Description */}
                <div className="text-slate-300 text-sm leading-relaxed mb-8 space-y-3">
                    {t.description.map((para, i) => (
                        <p key={i} className={i === 0 ? 'font-medium text-white' : ''}>
                            {para}
                        </p>
                    ))}
                </div>

                {/* Checkbox */}
                <label className="flex items-center gap-3 mb-6 cursor-pointer group px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                        {t.dontShow}
                    </span>
                </label>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => onContinue(dontShowAgain)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        {t.continue}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    >
                        {t.selectOther}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuranConfirmationModal;

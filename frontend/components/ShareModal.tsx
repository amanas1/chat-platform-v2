import React, { useState } from 'react';
import { XMarkIcon, LinkIcon, ShareIcon } from './Icons';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SOCIAL_NETWORKS = [
    { id: 'telegram', name: 'Telegram', color: '#229ED9', url: 'https://t.me/share/url?url={url}&text={text}' },
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', url: 'https://api.whatsapp.com/send?text={text}%20{url}' },
    { id: 'vk', name: 'VK', color: '#4C75A3', url: 'https://vk.com/share.php?url={url}&title={text}' },
    { id: 'twitter', name: 'X / Twitter', color: '#000000', url: 'https://twitter.com/intent/tweet?url={url}&text={text}' },
    { id: 'facebook', name: 'Facebook', color: '#1877F2', url: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
    { id: 'reddit', name: 'Reddit', color: '#FF4500', url: 'https://www.reddit.com/submit?url={url}&title={text}' },
    { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', url: 'https://www.linkedin.com/sharing/share-offsite/?url={url}' },
];

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    
    if (!isOpen) return null;

    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auradiochat.app';
    const shareText = "AU RadioChat - Listen to the world's music with visual magic! 🎵✨";

    const handleCopy = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (network: typeof SOCIAL_NETWORKS[0]) => {
        const url = network.url
            .replace('{url}', encodeURIComponent(shareUrl))
            .replace('{text}', encodeURIComponent(shareText));
        window.open(url, '_blank', 'width=600,height=400');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <ShareIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Поделиться</h2>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {SOCIAL_NETWORKS.map(net => (
                        <button
                            key={net.id}
                            onClick={() => handleShare(net)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl transition-all duration-300 group-hover:scale-110 shadow-lg"
                                style={{ backgroundColor: net.color }}
                            >
                                {net.name[0]}
                            </div>
                            <span className="text-[10px] text-slate-400 group-hover:text-white uppercase tracking-wider font-semibold">
                                {net.name.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="bg-black/40 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                    <div className="flex-1 truncate text-sm text-slate-400 font-mono">
                        {shareUrl}
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;

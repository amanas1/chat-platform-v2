
import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, PlayIcon, PauseIcon, XMarkIcon, TrashIcon } from './Icons';

interface VoiceBioRecorderProps {
    onRecordingComplete: (audioUrl: string | null) => void;
    currentAudio?: string | null;
    label?: string;
}

const VoiceBioRecorder: React.FC<VoiceBioRecorderProps> = ({ onRecordingComplete, currentAudio, label = "Voice Bio (max 7s)" }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(7);
    const [audioUrl, setAudioUrl] = useState<string | null>(currentAudio || null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                // Convert to Base64 to store easily in profile for MVP 
                // (In production, upload to Firebase Storage)
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    setAudioUrl(base64data);
                    onRecordingComplete(base64data);
                };
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTimeLeft(7);

            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current && audioUrl) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const deleteRecording = () => {
        setAudioUrl(null);
        onRecordingComplete(null);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    return (
        <div className="w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-2 tracking-widest">{label}</label>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all hover:border-white/20 relative overflow-hidden group">
                
                {/* Background visual cue during recording */}
                {isRecording && (
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse z-0"></div>
                )}

                {/* Left Side: Controls */}
                <div className="flex items-center gap-4 z-10">
                    {!audioUrl && !isRecording && (
                        <button 
                            onClick={startRecording}
                            type="button"
                            className="w-12 h-12 rounded-full bg-slate-800 hover:bg-primary transition-colors flex items-center justify-center text-white shadow-lg"
                        >
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>
                    )}

                    {isRecording && (
                        <button 
                            onClick={stopRecording}
                            type="button"
                            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center text-white shadow-lg animate-pulse"
                        >
                            <div className="w-4 h-4 bg-white rounded-sm" />
                        </button>
                    )}

                    {audioUrl && !isRecording && (
                         <button 
                            onClick={togglePlayback}
                            type="button"
                            className={`w-12 h-12 rounded-full transition-colors flex items-center justify-center text-white shadow-lg ${isPlaying ? 'bg-primary/80' : 'bg-primary'}`}
                        >
                            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}
                        </button>
                    )}

                    {/* Status Text */}
                    <div className="flex flex-col">
                        <span className={`text-sm font-bold ${isRecording ? 'text-red-400' : 'text-slate-300'}`}>
                            {isRecording ? 'Recording...' : (audioUrl ? 'Voice Note Recorded' : 'Record Greeting')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                            {isRecording ? `00:0${timeLeft}` : audioUrl ? 'Ready' : 'Max 7s'}
                        </span>
                    </div>
                </div>

                {/* Right Side: Delete / Waveform Placeholder */}
                {audioUrl && !isRecording && (
                    <button 
                        onClick={deleteRecording}
                        type="button"
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors z-10"
                        title="Delete recording"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default VoiceBioRecorder;

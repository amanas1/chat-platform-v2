import React from 'react';
import { AvatarBuilderModal, AvatarResult } from './components/AvatarBuilderModal';
import { AvatarPreview } from './components/AvatarPreview';

/* ─── localStorage ─── */
const LS_KEY = 'radio_chat_profile';

interface ProfileData {
  nickname: string;
  gender: 'male' | 'female' | '';
  age: number;
  status: string;
  avatar: AvatarResult;
  voiceBlob?: string;
}

const DEFAULT_AVATAR: AvatarResult = { emoji: '👨', face: 'face2', hair: 'short', hairColor: '#1C1C1C', accessory: 'none' };

const loadProfile = (): ProfileData | null => {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
};
const saveProfile = (p: ProfileData) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
};

interface Props {
  onComplete: (profile: ProfileData) => void;
}

const STATUS_OPTIONS = ['Хочу поговорить', 'Свободен', 'Просто слушаю', 'Без флирта'];
const AGES = Array.from({ length: 48 }, (_, i) => i + 18);

export const RegistrationPanel: React.FC<Props> = ({ onComplete }) => {
  const [nickname, setNickname] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female' | ''>('');
  const [age, setAge] = React.useState(25);
  const [status, setStatus] = React.useState('');
  const [avatar, setAvatar] = React.useState<AvatarResult>(DEFAULT_AVATAR);
  const [showAvatarBuilder, setShowAvatarBuilder] = React.useState(false);
  const [showAgePicker, setShowAgePicker] = React.useState(false);
  const agePickerRef = React.useRef<HTMLDivElement>(null);

  // Voice recording
  const [isRecording, setIsRecording] = React.useState(false);
  const [voiceUrl, setVoiceUrl] = React.useState<string | null>(null);
  const [recTime, setRecTime] = React.useState(0);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // Validation error
  const [error, setError] = React.useState('');

  // Load saved profile
  React.useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setNickname(saved.nickname || '');
      setGender(saved.gender || '');
      setAge(saved.age || 25);
      setStatus(saved.status || '');
      if (saved.avatar) setAvatar(saved.avatar);
    }
  }, []);

  // Close age picker on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (agePickerRef.current && !agePickerRef.current.contains(e.target as Node)) setShowAgePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => {
        setRecTime(prev => {
          if (prev >= 7) { stopRecording(); return 7; }
          return prev + 1;
        });
      }, 1000);
    } catch { setError('Нет доступа к микрофону'); }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const deleteVoice = () => { setVoiceUrl(null); setRecTime(0); };

  // Submit
  const handleSubmit = () => {
    if (!nickname.trim()) { setError('Введите имя'); return; }
    if (!gender) { setError('Выберите пол'); return; }
    setError('');
    const profile: ProfileData = { nickname: nickname.trim(), gender, age, status, avatar, voiceBlob: voiceUrl || undefined };
    saveProfile(profile);
    onComplete(profile);
  };

  return (
    <>
      <AvatarBuilderModal isOpen={showAvatarBuilder} onClose={() => setShowAvatarBuilder(false)} onSave={setAvatar} initial={avatar} />

      <div className="fixed inset-y-0 right-0 z-[100] font-['Inter']">
        <div className="h-full w-[420px] flex flex-col bg-[#0f172a] border-l border-white/[0.06]">

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">

            {/* ── Avatar ── */}
            <div className="flex flex-col items-center mb-7">
              <button onClick={() => setShowAvatarBuilder(true)} className="relative group">
                <div className="w-[110px] h-[110px] rounded-full bg-[#1a2235] border-2 border-white/[0.08] flex items-center justify-center transition-all group-hover:border-orange-400/30 group-hover:shadow-[0_0_20px_rgba(255,165,0,0.08)] overflow-hidden">
                  {avatar.avatarConfig 
                    ? <AvatarPreview config={avatar.avatarConfig} size={100} />
                    : <span className="text-6xl">{avatar.emoji}</span>
                  }
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-orange-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
              </button>
              <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
                <span className="text-red-400 text-[8px]">📍</span> Авто-определение: <span className="font-semibold text-slate-300">Global</span>
              </p>
            </div>

            {/* ── Nickname ── */}
            <div className="mb-5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Имя (псевдоним)</label>
              <input
                type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] font-medium text-white placeholder:text-slate-600 outline-none focus:border-white/15 transition-colors"
                placeholder="Введите имя..." maxLength={20}
              />
            </div>

            {/* ── Gender ── */}
            <div className="mb-5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Пол</label>
              <div className="flex gap-2">
                <button onClick={() => setGender('male')}
                  className={`flex-1 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all border ${gender === 'male' ? 'bg-white/[0.08] text-white border-white/20' : 'bg-white/[0.02] text-slate-500 border-white/[0.06] hover:bg-white/[0.04]'}`}
                >МУЖ</button>
                <button onClick={() => setGender('female')}
                  className={`flex-1 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all border ${gender === 'female' ? 'bg-white/[0.08] text-white border-white/20' : 'bg-white/[0.02] text-slate-500 border-white/[0.06] hover:bg-white/[0.04]'}`}
                >ЖЕН</button>
              </div>
            </div>

            {/* ── Age ── */}
            <div className="mb-5 relative" ref={agePickerRef}>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Возраст</label>
              <button onClick={() => setShowAgePicker(!showAgePicker)}
                className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-white text-[15px] font-bold">{age}{age >= 65 ? '+' : ''}</span>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${showAgePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showAgePicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f172a] border border-white/10 rounded-xl max-h-[200px] overflow-y-auto no-scrollbar z-50 shadow-2xl py-1">
                  {AGES.map(a => (
                    <button key={a} onClick={() => { setAge(a); setShowAgePicker(false); }}
                      className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${a === age ? 'bg-orange-500/15 text-orange-400' : 'text-slate-300 hover:bg-white/[0.04]'}`}
                    >{a}{a >= 65 ? '+' : ''}</button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Status ── */}
            <div className="mb-5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Статус</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => setStatus(s === status ? '' : s)}
                    className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border ${status === s ? 'bg-white/[0.08] text-white border-white/20' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* ── Voice Recording ── */}
            <div className="mb-6">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Голос</label>
              {voiceUrl ? (
                /* Recorded */
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
                  </div>
                  <audio src={voiceUrl} controls className="flex-1 h-7" style={{ filter: 'invert(1) hue-rotate(180deg)', opacity: 0.6 }} />
                  <button onClick={deleteVoice} className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ) : isRecording ? (
                /* Recording in progress */
                <div className="p-4 rounded-xl bg-red-500/[0.04] border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 animate-pulse">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-red-400">Запись... {recTime}с / 7с</p>
                      <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                        <div className="h-full bg-red-500/50 rounded-full transition-all duration-1000" style={{ width: `${(recTime / 7) * 100}%` }} />
                      </div>
                    </div>
                    <button onClick={stopRecording} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/15 transition-colors uppercase">Стоп</button>
                  </div>
                </div>
              ) : (
                /* Not recorded */
                <button onClick={startRecording} className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] transition-colors flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-slate-300">Нажмите для записи</p>
                    <p className="text-[10px] text-slate-600">макс 7 сек</p>
                  </div>
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-[11px] text-red-400 text-center mb-3">{error}</p>
            )}

            {/* ── Continue Button ── */}
            <button onClick={handleSubmit}
              className="w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-[0.15em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98]"
            >ГОТОВО / ПРОДОЛЖИТЬ</button>

            <p className="text-[8px] text-slate-600 text-center mt-3">Данные хранятся локально в браузере</p>
          </div>
        </div>
      </div>
    </>
  );
};

export type { ProfileData };
export default RegistrationPanel;

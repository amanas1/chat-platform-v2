import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CameraIcon, XMarkIcon, UserIcon, AdjustmentsIcon, CheckIcon, FaceSmileIcon, StarIcon } from './Icons';
import { getAvatarTerm } from './AvatarTranslations';
import { PRESET_AVATARS } from '../constants';

// DiceBear Avataaars Options
const AVATAR_OPTIONS = {
  topType: [
    "hat", "hijab", "turban", "winterHat1", "winterHat02", "winterHat03", "winterHat04", 
    "bob", "bun", "curly", "curvy", "dreads", "frida", "fro", "froBand", 
    "longButNotTooLong", "miaWallace", "shavedSides", "straight01", "straight02", 
    "straightAndStrand", "dreads01", "dreads02", "frizzle", "shaggy", 
    "shaggyMullet", "shortCurly", "shortFlat", "shortRound", "shortWaved", 
    "sides", "theCaesar", "theCaesarAndSidePart", "bigHair"
  ],
  accessoriesType: [
    "none", "kurt", "prescription01", "prescription02", "round", 
    "sunglasses", "wayfarers"
  ],
  hairColor: [
    'Auburn', 'Black', 'Blonde', 'BlondeGolden', 
    'Brown', 'BrownDark', 'PastelPink', 'Platinum', 
    'Red', 'SilverGray'
  ],
  facialHairType: [
    "none", "beardLight", "beardMajestic", "beardMedium", 
    "moustacheFancy", "moustacheMagnum"
  ],
  clotheType: [
    "blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", 
    "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"
  ],
  eyeType: [
    "closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", 
    "squint", "surprised", "wink", "winkWacky", "xDizzy"
  ],
  eyebrowType: [
    "angry", "angryNatural", "default", "defaultNatural", "flatNatural", 
    "frownNatural", "raisedExcited", "raisedExcitedNatural", "sadConcerned", 
    "sadConcernedNatural", "unibrowNatural", "upDown", "upDownNatural"
  ],
  mouthType: [
    "concerned", "default", "disbelief", "eating", "grimace", "sad", 
    "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"
  ],
  skinColor: [
    'Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 
    'DarkBrown', 'Black'
  ]
};

const FEMALE_SPECIFIC_TOPS = [
    "hijab", "bob", "bun", "curvy", "frida", "froBand", 
    "longButNotTooLong", "miaWallace", "straight01", "straight02", 
    "straightAndStrand", "bigHair"
];

const getRandomOption = (key: keyof typeof AVATAR_OPTIONS) => {
  const options = AVATAR_OPTIONS[key];
  return options[Math.floor(Math.random() * options.length)];
};

interface AvatarCreatorProps {
  onSelect: (avatarUrl: string) => void;
  onClose: () => void;
  currentAvatar?: string;
  t?: any;
  lang?: string;
}

export const AvatarCreator: React.FC<AvatarCreatorProps> = ({ onSelect, onClose, currentAvatar, t = {}, lang = 'en' }) => {
  const [mode, setMode] = useState<'main' | 'scan' | 'editor'>('main');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Avatar State
  // Avatar State
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [params, setParams] = useState({
    topType: 'shortFlat',
    accessoriesType: 'none',
    hairColor: 'BrownDark',
    facialHairType: 'none',
    clotheType: 'hoodie',
    eyeType: 'default',
    eyebrowType: 'default',
    mouthType: 'smile',
    skinColor: 'Light'
  });
  const [seed, setSeed] = useState(() => Math.random().toString(36).substring(7));

  const [activeTab, setActiveTab] = useState<'head' | 'face' | 'style' | 'presets'>('head');

  // Randomize initial avatar if not set
  useEffect(() => {
    if (mode === 'main') {
      randomize();
    }
  }, [mode]);

  // Reset facial hair when gender is female
  useEffect(() => {
    if (gender === 'female') {
        setParams(p => ({ ...p, facialHairType: 'none' }));
    }
  }, [gender]);

  const randomize = (forcedGender?: 'male' | 'female', forcedMode?: string) => { // added forcedMode just in case
    
    const targetGender = forcedGender || gender;

    const validTops = targetGender === 'male' 
        ? AVATAR_OPTIONS.topType.filter(t => !FEMALE_SPECIFIC_TOPS.includes(t))
        : AVATAR_OPTIONS.topType;

    setSeed(Math.random().toString(36).substring(7));
    setParams({
      topType: validTops[Math.floor(Math.random() * validTops.length)],
      accessoriesType: getRandomOption('accessoriesType'),
      hairColor: getRandomOption('hairColor'),
      facialHairType: targetGender === 'female' ? 'none' : getRandomOption('facialHairType'),
      clotheType: getRandomOption('clotheType'),
      eyeType: getRandomOption('eyeType'),
      eyebrowType: getRandomOption('eyebrowType'),
      mouthType: getRandomOption('mouthType'),
      skinColor: getRandomOption('skinColor'),
    });
  };

  const handleGenderSelect = (g: 'male' | 'female') => {
      setGender(g);
      randomize(g);
      setMode('editor');
  };


  const getAvatarUrl = (p: typeof params) => {
    const baseUrl = 'https://api.dicebear.com/9.x/avataaars/svg';
    
    // UI Color Names to Hex Mapping for API
    const skinColorMap: Record<string, string> = {
        'Tanned': 'fd9841', 'Yellow': 'f8d25c', 'Pale': 'ffdbb4', 
        'Light': 'edb98a', 'Brown': 'd08b5b', 
        'DarkBrown': 'ae5d29', 'Black': '614335'
    };

    const hairColorMap: Record<string, string> = {
        'Auburn': 'a55728', 'Black': '2c1b18', 'Blonde': 'b58143', 
        'BlondeGolden': 'd6b370', 'Brown': '724133', 'BrownDark': '4a312c', 
        'PastelPink': 'f59797', 'Platinum': 'ecdcbf', 
        'Red': 'c93305', 'SilverGray': 'e8e1e1'
    };

    const apiParams: Record<string, string> = {};

    // Only add parameters if they are valid (not 'none')
    if (p.topType) apiParams.top = p.topType; 
    
    if (p.accessoriesType === 'none') {
        apiParams.accessoriesProbability = '0';
    } else {
        apiParams.accessories = p.accessoriesType;
        apiParams.accessoriesProbability = '100';
    }

    if (p.facialHairType === 'none') {
        apiParams.facialHairProbability = '0';
    } else {
        apiParams.facialHair = p.facialHairType;
        apiParams.facialHairProbability = '100';
    }

    if (p.clotheType) apiParams.clothing = p.clotheType;
    
    apiParams.hairColor = hairColorMap[p.hairColor] || '4a312c';
    apiParams.eyes = p.eyeType;
    apiParams.eyebrows = p.eyebrowType;
    apiParams.mouth = p.mouthType;
    apiParams.skinColor = skinColorMap[p.skinColor] || 'edb98a';

    const queryString = Object.entries(apiParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    // Using a seed allows consistency
    return `${baseUrl}?seed=${seed}&${queryString}`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setScannedImage(ev.target?.result as string);
      setMode('scan');
      setIsScanning(true);
      
      // Simulate scanning process
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setScanProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          randomize(); // "Detected" random traits
          setMode('editor');
        }
      }, 150);
    };
    reader.readAsDataURL(file);
  };

  // UI Components
  const TabButton = ({ id, icon, label }: { id: typeof activeTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === id ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-white'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  const ParamSelector = ({ title, options, current, onChange }: { title: string, options: string[], current: string, onChange: (val: string) => void }) => (
    <div className="mb-4">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{title}</h4>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] truncate px-1 transition-all ${current === opt ? 'bg-primary text-white border-primary' : 'hover:bg-white/10 text-slate-400'}`}
            title={getAvatarTerm(opt, lang)}
          >
             {/* Visual preview if possible, otherwise text */}
             {getAvatarTerm(opt, lang)}
          </button>
        ))}
      </div>
    </div>
  );

  const ColorSelector = ({ title, options, current, onChange }: { title: string, options: string[], current: string, onChange: (val: string) => void }) => (
     <div className="mb-4">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
            let colorCode = '#ccc';
            // Simple mapping for UI preview
            switch(opt) {
                case 'Auburn': colorCode = '#A55728'; break;
                case 'Black': colorCode = '#2C1B18'; break;
                case 'Blonde': colorCode = '#B58143'; break;
                case 'BlondeGolden': colorCode = '#D6B370'; break;
                case 'Brown': colorCode = '#724133'; break;
                case 'BrownDark': colorCode = '#4A312C'; break;
                case 'PastelPink': colorCode = '#F59797'; break;
                case 'Blue': colorCode = '#000fcc'; break;
                case 'Platinum': colorCode = '#ECDCBF'; break;
                case 'Red': colorCode = '#C93305'; break;
                case 'SilverGray': colorCode = '#E8E1E1'; break;
                case 'Tanned': colorCode = '#FD9841'; break;
                case 'Yellow': colorCode = '#F8D25C'; break;
                case 'Pale': colorCode = '#FFDBB4'; break;
                case 'Light': colorCode = '#EDB98A'; break;
                case 'DarkBrown': colorCode = '#AE5D29'; break;
            }
            
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${current === opt ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                style={{ backgroundColor: colorCode }}
                title={getAvatarTerm(opt, lang)}
              />
            );
        })}
      </div>
    </div>
  );


  // --- MAN RENDER ---
  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-[85vh] md:h-[700px] flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white bg-black/20 rounded-full hover:bg-black/40 transition-colors"
        >
            <XMarkIcon className="w-6 h-6" />
        </button>

        {/* LEFT PANEL: PREVIEW */}
        {mode !== 'main' && (
            <div className="md:w-[40%] bg-gradient-to-br from-[#0f172a] to-black p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5">
             {mode === 'scan' ? (
                 <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                     {scannedImage && <img src={scannedImage} className="w-full h-full object-cover opacity-50" />}
                     <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                     {/* Scanning Grid */}
                     <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.5)_50%,transparent_51%)] bg-[length:100%_4px] animate-[scan_2s_linear_infinite] opacity-50"></div>
                     <div className="absolute bottom-4 left-0 right-0 text-center">
                         <span className="text-xs font-black text-green-400 bg-black/60 px-2 py-1 rounded">ANALYZING... {scanProgress}%</span>
                     </div>
                 </div>
             ) : (
                 <div className="relative group">
                     <img 
                        src={getAvatarUrl(params)} 
                        alt="Avatar Preview" 
                        className="w-48 h-48 md:w-56 md:h-56 drop-shadow-2xl transition-all duration-500"
                        key={JSON.stringify(params)} // Force re-anim
                     />
                     <button 
                        onClick={() => randomize()}
                        className="absolute bottom-0 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white border border-white/10 transition-all hover:rotate-180"
                        title="Randomize"
                     >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                     </button>
                 </div>
             )}
             
             {mode === 'editor' && (
                 <div className="mt-6 w-full px-4">
                     <button 
                        onClick={() => onSelect(getAvatarUrl(params))}
                        className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                         <span>{t.checkLook}</span> <CheckIcon className="w-4 h-4" />
                     </button>
                 </div>
             )}
            </div>
        )}


        {/* RIGHT PANEL: CONTROLS */}
        <div className="flex-1 bg-slate-900 flex flex-col min-h-0">
             {mode === 'main' && (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 animate-in fade-in duration-500">
                     <div className="text-center mb-4">
                         <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{t.chooseAppearance}</h3>
                     </div>
                     
                     <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl justify-center items-stretch">
                        {/* Male Selection */}
                        <div 
                            onClick={() => handleGenderSelect('male')}
                            className="flex-1 p-8 bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-white/10 hover:border-indigo-500 rounded-[2rem] cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col items-center gap-6 relative overflow-hidden backdrop-blur-sm"
                        >
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            
                            <div className="relative w-40 h-40 rounded-full bg-indigo-500/20 shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                <span className="text-6xl absolute z-0 opacity-50 select-none">👱‍♂️</span>
                                <img 
                                    src="https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver&top=shortFlat&facialHair=beardMedium&hairColor=2c1b18&clothing=blazerAndShirt" 
                                    className="w-full h-full object-cover relative z-10"
                                    alt=""
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            </div>

                            <h4 className="font-black text-2xl text-white uppercase tracking-wider z-10">{t.male}</h4>
                        </div>

                        {/* Female Selection */}
                        <div 
                            onClick={() => handleGenderSelect('female')}
                            className="flex-1 p-8 bg-gradient-to-br from-pink-900/40 to-rose-900/20 border border-white/10 hover:border-pink-500 rounded-[2rem] cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(236,72,153,0.2)] flex flex-col items-center gap-6 relative overflow-hidden backdrop-blur-sm"
                        >
                            <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative w-40 h-40 rounded-full bg-pink-500/20 shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                <span className="text-6xl absolute z-0 opacity-50 select-none">👱‍♀️</span>
                                <img 
                                    src="https://api.dicebear.com/9.x/avataaars/svg?seed=Maria&top=longButNotTooLong&facialHair=none&clothing=shirtScoopNeck" 
                                    className="w-full h-full object-cover relative z-10"
                                    alt=""
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            </div>

                            <h4 className="font-black text-2xl text-white uppercase tracking-wider z-10">{t.female}</h4>
                        </div>
                     </div>
                 </div>
             )}

             {mode === 'scan' && (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                     <h3 className="text-2xl font-black text-white animate-pulse mb-2">{t.scanningBiometrics}</h3>
                     <p className="text-slate-400 font-mono text-xs">{t.analyzingStructural}</p>
                 </div>
             )}


             {mode === 'editor' && (
                 <>
                    {/* Gender Toggle removed as per user request */}
                    
                    <div className="flex border-b border-white/10 bg-black/20 shrink-0 mx-6 rounded-t-xl overflow-hidden mt-6">
                        <TabButton id="head" icon={<UserIcon className="w-4 h-4" />} label={t.head} />
                        <TabButton id="face" icon={<div className="text-lg leading-none">👀</div>} label={t.face} />
                        <TabButton id="style" icon={<div className="text-lg leading-none">👕</div>} label={t.style} />
                        <button 
                          onClick={() => setActiveTab('presets')}
                          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all border-b-2 ${activeTab === 'presets' ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-white'}`}
                        >
                          <StarIcon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{t.presets || 'PRESETS'}</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
                        {activeTab === 'presets' && (
                             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">
                                    {t.premiumPresets || "Premium 3D Avatars"}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {PRESET_AVATARS.map((url, index) => (
                                        <button
                                            key={index}
                                            onClick={() => onSelect(url)}
                                            className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-white/5 bg-white/5 backdrop-blur-sm hover:border-primary/50 transition-all hover:scale-105 active:scale-95 shadow-lg"
                                        >
                                            <img src={url} alt={`Preset ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t.select || "SELECT"}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-500 mt-6 text-center italic">
                                    {t.moreAvatarsSoon || "More premium styles coming soon..."}
                                </p>
                             </div>
                        )}

                        {activeTab === 'head' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <ColorSelector 
                                    title={t.skinTone} 
                                    options={AVATAR_OPTIONS.skinColor} 
                                    current={params.skinColor} 
                                    onChange={(v) => setParams(p => ({...p, skinColor: v}))} 
                                />
                                <ParamSelector 
                                    title={t.hairStyle} 
                                    options={gender === 'male' ? AVATAR_OPTIONS.topType.filter(t => !FEMALE_SPECIFIC_TOPS.includes(t)) : AVATAR_OPTIONS.topType} 
                                    current={params.topType} 
                                    onChange={(v) => setParams(p => ({...p, topType: v}))} 
                                />
                                <ColorSelector 
                                    title={t.hairColor} 
                                    options={AVATAR_OPTIONS.hairColor} 
                                    current={params.hairColor} 
                                    onChange={(v) => setParams(p => ({...p, hairColor: v}))} 
                                />
                            </div>
                        )}

                        {activeTab === 'face' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <ParamSelector 
                                    title={t.eyes} 
                                    options={AVATAR_OPTIONS.eyeType} 
                                    current={params.eyeType} 
                                    onChange={(v) => setParams(p => ({...p, eyeType: v}))} 
                                />
                                <ParamSelector 
                                    title={t.eyebrows} 
                                    options={AVATAR_OPTIONS.eyebrowType} 
                                    current={params.eyebrowType} 
                                    onChange={(v) => setParams(p => ({...p, eyebrowType: v}))} 
                                />
                                <ParamSelector 
                                    title={t.mouth} 
                                    options={AVATAR_OPTIONS.mouthType} 
                                    current={params.mouthType} 
                                    onChange={(v) => setParams(p => ({...p, mouthType: v}))} 
                                />
                                {gender === 'male' && (
                                    <ParamSelector 
                                        title={t.facialHair} 
                                        options={AVATAR_OPTIONS.facialHairType} 
                                        current={params.facialHairType} 
                                        onChange={(v) => setParams(p => ({...p, facialHairType: v}))} 
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'style' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <ParamSelector 
                                    title={t.clothing} 
                                    options={AVATAR_OPTIONS.clotheType} 
                                    current={params.clotheType} 
                                    onChange={(v) => setParams(p => ({...p, clotheType: v}))} 
                                />
                                <ParamSelector 
                                    title={t.accessories} 
                                    options={AVATAR_OPTIONS.accessoriesType} 
                                    current={params.accessoriesType} 
                                    onChange={(v) => setParams(p => ({...p, accessoriesType: v}))} 
                                />
                            </div>
                        )}
                    </div>
                 </>
             )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

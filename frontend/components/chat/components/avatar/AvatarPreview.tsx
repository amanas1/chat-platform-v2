import React from 'react';
import { AvatarConfig } from './avatarData';

/* ══════════════════════════════════════════════════
   AvatarPreview — Layered SVG avatar renderer
   Each feature is a separate SVG layer composited
   together in a single <svg> element.
   ══════════════════════════════════════════════════ */

interface Props {
  config: AvatarConfig;
  size?: number;
}

/* ─── Helper: darken color ─── */
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

/* ─── HAIR LAYER ─── */
const HairLayer: React.FC<{ style: string; color: string; gender: string }> = ({ style, color, gender }) => {
  if (style === 'none') return null;
  const d = darken(color, 20);
  switch (style) {
    case 'short': return <><ellipse cx="60" cy="28" rx="32" ry="18" fill={color}/><ellipse cx="60" cy="32" rx="30" ry="14" fill={d}/></>;
    case 'medium': return <><ellipse cx="60" cy="26" rx="34" ry="20" fill={color}/><path d="M28 40 Q26 60 30 70" stroke={color} strokeWidth="6" fill="none"/><path d="M92 40 Q94 60 90 70" stroke={color} strokeWidth="6" fill="none"/></>;
    case 'curly': return <><ellipse cx="60" cy="26" rx="36" ry="22" fill={color}/><circle cx="30" cy="38" r="10" fill={d}/><circle cx="90" cy="38" r="10" fill={d}/><circle cx="36" cy="24" r="8" fill={d}/><circle cx="84" cy="24" r="8" fill={d}/><circle cx="60" cy="18" r="9" fill={d}/></>;
    case 'afro': return <><ellipse cx="60" cy="32" rx="42" ry="36" fill={color}/><ellipse cx="60" cy="30" rx="38" ry="32" fill={d}/></>;
    case 'buzz': return <ellipse cx="60" cy="32" rx="30" ry="16" fill={color} opacity="0.6"/>;
    case 'spiky': return <><polygon points="40,18 45,4 50,20" fill={color}/><polygon points="55,16 60,0 65,16" fill={color}/><polygon points="70,18 75,4 80,20" fill={color}/><ellipse cx="60" cy="30" rx="30" ry="14" fill={d}/></>;
    case 'slickback': return <><ellipse cx="60" cy="30" rx="32" ry="16" fill={color}/><path d="M30 34 Q28 20 60 16 Q92 20 90 34" fill={d}/></>;
    case 'long': return <><ellipse cx="60" cy="26" rx="34" ry="20" fill={color}/><path d="M28 36 Q24 70 30 95" stroke={color} strokeWidth="8" fill="none"/><path d="M92 36 Q96 70 90 95" stroke={color} strokeWidth="8" fill="none"/><path d="M32 36 Q28 60 34 85" stroke={d} strokeWidth="4" fill="none"/><path d="M88 36 Q92 60 86 85" stroke={d} strokeWidth="4" fill="none"/></>;
    case 'ponytail': return <><ellipse cx="60" cy="28" rx="32" ry="18" fill={color}/><path d="M60 16 Q80 10 85 30 Q88 50 80 70" stroke={color} strokeWidth="7" fill="none"/></>;
    case 'bun': return <><ellipse cx="60" cy="28" rx="32" ry="18" fill={color}/><circle cx="60" cy="12" r="12" fill={d}/></>;
    case 'bob': return <><ellipse cx="60" cy="26" rx="34" ry="20" fill={color}/><path d="M28 36 Q26 55 34 65" stroke={color} strokeWidth="8" fill="none"/><path d="M92 36 Q94 55 86 65" stroke={color} strokeWidth="8" fill="none"/></>;
    case 'pixie': return <><ellipse cx="58" cy="28" rx="30" ry="16" fill={color}/><path d="M88 30 Q92 24 86 28" fill={d}/></>;
    case 'braids': return <><ellipse cx="60" cy="26" rx="34" ry="20" fill={color}/><path d="M34 40 L30 70 L34 72 L38 70 L34 40" fill={d}/><path d="M86 40 L90 70 L86 72 L82 70 L86 40" fill={d}/></>;
    default: return null;
  }
};

/* ─── EYES LAYER ─── */
const EyesLayer: React.FC<{ style: string }> = ({ style }) => {
  switch (style) {
    case 'default': return <><ellipse cx="47" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="48" cy="48" r="2.5" fill="#1C1C1C"/><ellipse cx="73" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="74" cy="48" r="2.5" fill="#1C1C1C"/></>;
    case 'happy': return <><path d="M42 48 Q47 43 52 48" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M68 48 Q73 43 78 48" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>;
    case 'squint': return <><path d="M42 47 Q47 45 52 47" stroke="#1C1C1C" strokeWidth="2" fill="none"/><circle cx="47" cy="48" r="1.5" fill="#1C1C1C"/><path d="M68 47 Q73 45 78 47" stroke="#1C1C1C" strokeWidth="2" fill="none"/><circle cx="73" cy="48" r="1.5" fill="#1C1C1C"/></>;
    case 'wink': return <><ellipse cx="47" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="48" cy="48" r="2.5" fill="#1C1C1C"/><path d="M68 48 Q73 44 78 48" stroke="#1C1C1C" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>;
    case 'closed': return <><path d="M42 48 L52 48" stroke="#1C1C1C" strokeWidth="2.5" strokeLinecap="round"/><path d="M68 48 L78 48" stroke="#1C1C1C" strokeWidth="2.5" strokeLinecap="round"/></>;
    case 'surprised': return <><ellipse cx="47" cy="48" rx="6" ry="7" fill="white"/><circle cx="47" cy="48" r="3.5" fill="#1C1C1C"/><ellipse cx="73" cy="48" rx="6" ry="7" fill="white"/><circle cx="73" cy="48" r="3.5" fill="#1C1C1C"/></>;
    case 'hearts': return <><path d="M44 45 Q44 42 47 42 Q50 42 50 45 Q50 48 47 51 Q44 48 44 45Z" fill="#E74C3C"/><path d="M70 45 Q70 42 73 42 Q76 42 76 45 Q76 48 73 51 Q70 48 70 45Z" fill="#E74C3C"/></>;
    case 'side': return <><ellipse cx="47" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="44" cy="48" r="2.5" fill="#1C1C1C"/><ellipse cx="73" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="70" cy="48" r="2.5" fill="#1C1C1C"/></>;
    case 'rolling': return <><ellipse cx="47" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="47" cy="45" r="2.5" fill="#1C1C1C"/><ellipse cx="73" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="73" cy="45" r="2.5" fill="#1C1C1C"/></>;
    case 'cry': return <><ellipse cx="47" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="48" cy="48" r="2.5" fill="#1C1C1C"/><path d="M47 54 Q47 60 45 64" stroke="#5DADE2" strokeWidth="2" fill="none"/><ellipse cx="73" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="74" cy="48" r="2.5" fill="#1C1C1C"/><path d="M73 54 Q73 60 71 64" stroke="#5DADE2" strokeWidth="2" fill="none"/></>;
    case 'dizzy': return <><path d="M43 44 L51 52 M51 44 L43 52" stroke="#1C1C1C" strokeWidth="2.5" strokeLinecap="round"/><path d="M69 44 L77 52 M77 44 L69 52" stroke="#1C1C1C" strokeWidth="2.5" strokeLinecap="round"/></>;
    case 'crazy': return <><ellipse cx="47" cy="48" rx="7" ry="6" fill="white"/><circle cx="45" cy="47" r="3" fill="#1C1C1C"/><ellipse cx="73" cy="48" rx="4" ry="5" fill="white"/><circle cx="74" cy="49" r="2" fill="#1C1C1C"/></>;
    default: return <><ellipse cx="47" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="48" cy="48" r="2.5" fill="#1C1C1C"/><ellipse cx="73" cy="48" rx="5" ry="5.5" fill="white"/><circle cx="74" cy="48" r="2.5" fill="#1C1C1C"/></>;
  }
};

/* ─── EYEBROWS LAYER ─── */
const EyebrowsLayer: React.FC<{ style: string; hairColor: string }> = ({ style, hairColor }) => {
  const c = darken(hairColor, 30);
  switch (style) {
    case 'default': return <><path d="M40 40 Q47 37 54 40" stroke={c} strokeWidth="2.5" fill="none"/><path d="M66 40 Q73 37 80 40" stroke={c} strokeWidth="2.5" fill="none"/></>;
    case 'raised': return <><path d="M40 38 Q47 33 54 38" stroke={c} strokeWidth="2.5" fill="none"/><path d="M66 38 Q73 33 80 38" stroke={c} strokeWidth="2.5" fill="none"/></>;
    case 'angry': return <><path d="M40 42 Q47 38 54 40" stroke={c} strokeWidth="3" fill="none"/><path d="M66 40 Q73 38 80 42" stroke={c} strokeWidth="3" fill="none"/></>;
    case 'sad': return <><path d="M40 38 Q47 42 54 40" stroke={c} strokeWidth="2.5" fill="none"/><path d="M66 40 Q73 42 80 38" stroke={c} strokeWidth="2.5" fill="none"/></>;
    case 'unibrow': return <path d="M38 40 Q47 36 60 40 Q73 36 82 40" stroke={c} strokeWidth="3" fill="none"/>;
    case 'excited': return <><path d="M40 36 Q47 31 54 36" stroke={c} strokeWidth="2.5" fill="none"/><path d="M66 36 Q73 31 80 36" stroke={c} strokeWidth="2.5" fill="none"/></>;
    case 'frown': return <><path d="M42 42 L52 40" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M68 40 L78 42" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"/></>;
    case 'flat': return <><line x1="40" y1="40" x2="54" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="66" y1="40" x2="80" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>;
    case 'updown': return <><path d="M40 38 Q47 34 54 38" stroke={c} strokeWidth="2.5" fill="none"/><path d="M66 42 Q73 38 80 42" stroke={c} strokeWidth="2.5" fill="none"/></>;
    default: return <><path d="M40 40 Q47 37 54 40" stroke={c} strokeWidth="2.5" fill="none"/><path d="M66 40 Q73 37 80 40" stroke={c} strokeWidth="2.5" fill="none"/></>;
  }
};

/* ─── MOUTH LAYER ─── */
const MouthLayer: React.FC<{ style: string; skinTone: string }> = ({ style, skinTone }) => {
  const lip = darken(skinTone, 60);
  switch (style) {
    case 'smile': return <path d="M50 68 Q60 76 70 68" stroke={lip} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
    case 'default': return <line x1="50" y1="68" x2="70" y2="68" stroke={lip} strokeWidth="2" strokeLinecap="round"/>;
    case 'open': return <><ellipse cx="60" cy="68" rx="8" ry="6" fill="#5C2626"/><path d="M52 68 Q60 62 68 68" stroke={lip} strokeWidth="2" fill="none"/></>;
    case 'sad': return <path d="M50 72 Q60 65 70 72" stroke={lip} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
    case 'serious': return <line x1="52" y1="68" x2="68" y2="68" stroke={lip} strokeWidth="2.5" strokeLinecap="round"/>;
    case 'tongue': return <><path d="M50 68 Q60 76 70 68" stroke={lip} strokeWidth="2" fill="none"/><ellipse cx="60" cy="74" rx="4" ry="3" fill="#E74C3C"/></>;
    case 'smirk': return <path d="M52 68 Q62 68 70 64" stroke={lip} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
    case 'grimace': return <><rect x="48" y="64" width="24" height="8" rx="3" fill="white"/><line x1="54" y1="64" x2="54" y2="72" stroke={lip} strokeWidth="1"/><line x1="60" y1="64" x2="60" y2="72" stroke={lip} strokeWidth="1"/><line x1="66" y1="64" x2="66" y2="72" stroke={lip} strokeWidth="1"/><rect x="48" y="64" width="24" height="8" rx="3" fill="none" stroke={lip} strokeWidth="1.5"/></>;
    case 'scream': return <ellipse cx="60" cy="70" rx="7" ry="9" fill="#5C2626"/>;
    case 'concerned': return <path d="M50 70 Q55 66 60 70 Q65 66 70 70" stroke={lip} strokeWidth="2" fill="none" strokeLinecap="round"/>;
    case 'disbelief': return <><circle cx="60" cy="69" r="5" fill="none" stroke={lip} strokeWidth="2"/></>;
    case 'eating': return <><path d="M50 68 Q60 76 70 68" stroke={lip} strokeWidth="2" fill="none"/><ellipse cx="60" cy="70" rx="5" ry="3" fill={lip} opacity="0.3"/></>;
    default: return <path d="M50 68 Q60 76 70 68" stroke={lip} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
  }
};

/* ─── BEARD LAYER ─── */
const BeardLayer: React.FC<{ style: string; hairColor: string }> = ({ style, hairColor }) => {
  if (style === 'none') return null;
  const c = darken(hairColor, 10);
  switch (style) {
    case 'stubble': return <><circle cx="48" cy="72" r="1" fill={c} opacity="0.4"/><circle cx="54" cy="74" r="1" fill={c} opacity="0.4"/><circle cx="60" cy="75" r="1" fill={c} opacity="0.4"/><circle cx="66" cy="74" r="1" fill={c} opacity="0.4"/><circle cx="72" cy="72" r="1" fill={c} opacity="0.4"/><circle cx="51" cy="76" r="1" fill={c} opacity="0.3"/><circle cx="57" cy="77" r="1" fill={c} opacity="0.3"/><circle cx="63" cy="77" r="1" fill={c} opacity="0.3"/><circle cx="69" cy="76" r="1" fill={c} opacity="0.3"/></>;
    case 'short': return <path d="M42 72 Q44 82 60 84 Q76 82 78 72 Q74 78 60 80 Q46 78 42 72Z" fill={c} opacity="0.6"/>;
    case 'full': return <path d="M38 64 Q36 80 44 90 Q52 96 60 96 Q68 96 76 90 Q84 80 82 64 Q78 72 60 76 Q42 72 38 64Z" fill={c} opacity="0.7"/>;
    case 'goatee': return <path d="M52 72 Q52 84 60 86 Q68 84 68 72 Q64 76 60 76 Q56 76 52 72Z" fill={c} opacity="0.6"/>;
    case 'mustache': return <path d="M46 64 Q50 68 60 68 Q70 68 74 64 Q72 66 60 67 Q48 66 46 64Z" fill={c} strokeWidth="2"/>;
    case 'handlebar': return <><path d="M46 64 Q50 68 60 68 Q70 68 74 64" stroke={c} strokeWidth="2.5" fill="none"/><path d="M46 64 Q42 62 38 64" stroke={c} strokeWidth="2" fill="none"/><path d="M74 64 Q78 62 82 64" stroke={c} strokeWidth="2" fill="none"/></>;
    default: return null;
  }
};

/* ─── CLOTHES LAYER ─── */
const ClothesLayer: React.FC<{ style: string }> = ({ style }) => {
  const colors: Record<string, [string, string]> = {
    tshirt: ['#4A90D9', '#3A7BC8'], vneck: ['#7B68EE', '#6A5AC7'], hoodie: ['#6B7280', '#555D68'],
    blazer: ['#2C3E50', '#1A252F'], sweater: ['#C0392B', '#A93226'], collar: ['#27AE60', '#1E8449'],
    overall: ['#7F8C8D', '#6B7B7C'], graphic: ['#E74C3C', '#C0392B'], deepv: ['#8E44AD', '#7D3C98'],
  };
  const [main, shade] = colors[style] || colors.tshirt;
  
  const base = <path d="M20 110 Q20 90 40 84 Q50 80 60 80 Q70 80 80 84 Q100 90 100 110 L100 120 L20 120Z" fill={main}/>;
  
  switch (style) {
    case 'vneck': return <>{base}<path d="M50 80 L60 95 L70 80" fill={shade}/></>;
    case 'hoodie': return <>{base}<path d="M40 84 Q42 78 48 80" stroke={shade} strokeWidth="3" fill="none"/><path d="M80 84 Q78 78 72 80" stroke={shade} strokeWidth="3" fill="none"/><path d="M52 80 L60 90 L68 80" fill={shade}/></>;
    case 'blazer': return <>{base}<line x1="60" y1="80" x2="60" y2="120" stroke={shade} strokeWidth="1.5"/><path d="M48 80 L44 88 L50 86Z" fill="white" opacity="0.8"/><path d="M72 80 L76 88 L70 86Z" fill="white" opacity="0.8"/></>;
    case 'collar': return <>{base}<path d="M48 80 L42 90 L52 86Z" fill="white" opacity="0.7"/><path d="M72 80 L78 90 L68 86Z" fill="white" opacity="0.7"/></>;
    case 'graphic': return <>{base}<circle cx="60" cy="100" r="8" fill={shade} opacity="0.5"/><path d="M56 98 L60 94 L64 98 L62 98 L62 104 L58 104 L58 98Z" fill="white" opacity="0.6"/></>;
    case 'deepv': return <>{base}<path d="M48 80 L60 100 L72 80" fill={shade}/></>;
    default: return base;
  }
};

/* ─── ACCESSORIES LAYER ─── */
const AccessoriesLayer: React.FC<{ style: string }> = ({ style }) => {
  if (style === 'none') return null;
  switch (style) {
    case 'glasses1': return <><rect x="38" y="43" width="16" height="12" rx="3" fill="none" stroke="#4A4A4A" strokeWidth="2"/><rect x="66" y="43" width="16" height="12" rx="3" fill="none" stroke="#4A4A4A" strokeWidth="2"/><line x1="54" y1="48" x2="66" y2="48" stroke="#4A4A4A" strokeWidth="1.5"/></>;
    case 'glasses2': return <><rect x="37" y="42" width="18" height="14" rx="2" fill="none" stroke="#333" strokeWidth="2.5"/><rect x="65" y="42" width="18" height="14" rx="2" fill="none" stroke="#333" strokeWidth="2.5"/><line x1="55" y1="48" x2="65" y2="48" stroke="#333" strokeWidth="2"/></>;
    case 'round': return <><circle cx="46" cy="49" r="9" fill="none" stroke="#8B7355" strokeWidth="1.5"/><circle cx="74" cy="49" r="9" fill="none" stroke="#8B7355" strokeWidth="1.5"/><line x1="55" y1="48" x2="65" y2="48" stroke="#8B7355" strokeWidth="1.5"/></>;
    case 'sunglasses': return <><rect x="36" y="42" width="18" height="13" rx="4" fill="#1C1C1C" opacity="0.85"/><rect x="66" y="42" width="18" height="13" rx="4" fill="#1C1C1C" opacity="0.85"/><line x1="54" y1="48" x2="66" y2="48" stroke="#333" strokeWidth="2"/><rect x="36" y="42" width="18" height="13" rx="4" fill="none" stroke="#555" strokeWidth="1.5"/><rect x="66" y="42" width="18" height="13" rx="4" fill="none" stroke="#555" strokeWidth="1.5"/></>;
    case 'wayfarers': return <><path d="M34 44 L36 42 L56 42 L56 56 L36 56 L34 54Z" fill="#1C1C1C" opacity="0.9"/><path d="M64 42 L84 42 L86 44 L86 54 L84 56 L64 56Z" fill="#1C1C1C" opacity="0.9"/><line x1="56" y1="48" x2="64" y2="48" stroke="#333" strokeWidth="2.5"/></>;
    case 'kurt': return <><circle cx="46" cy="49" r="10" fill="#FFEB3B" opacity="0.7"/><circle cx="74" cy="49" r="10" fill="#FFEB3B" opacity="0.7"/><circle cx="46" cy="49" r="10" fill="none" stroke="#E0A800" strokeWidth="1.5"/><circle cx="74" cy="49" r="10" fill="none" stroke="#E0A800" strokeWidth="1.5"/><line x1="56" y1="48" x2="64" y2="48" stroke="#E0A800" strokeWidth="1.5"/></>;
    default: return null;
  }
};

/* ═══ MAIN COMPONENT ═══ */
export const AvatarPreview: React.FC<Props> = ({ config, size = 200 }) => {
  const { skinTone, hairStyle, hairColor, eyes, eyebrows, mouth, beard, clothes, accessories, gender } = config;
  
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      {/* Clothes */}
      <ClothesLayer style={clothes} />
      {/* Neck */}
      <rect x="52" y="76" width="16" height="10" rx="3" fill={skinTone}/>
      {/* Head */}
      <ellipse cx="60" cy="52" rx="28" ry="30" fill={skinTone}/>
      {/* Ears */}
      <ellipse cx="32" cy="54" rx="5" ry="7" fill={darken(skinTone, 15)}/>
      <ellipse cx="88" cy="54" rx="5" ry="7" fill={darken(skinTone, 15)}/>
      {/* Hair (behind head for some styles already drawn) */}
      <HairLayer style={hairStyle} color={hairColor} gender={gender}/>
      {/* Eyes */}
      <EyesLayer style={eyes}/>
      {/* Eyebrows */}
      <EyebrowsLayer style={eyebrows} hairColor={hairColor}/>
      {/* Nose */}
      <path d="M58 58 Q60 62 62 58" stroke={darken(skinTone, 30)} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Mouth */}
      <MouthLayer style={mouth} skinTone={skinTone}/>
      {/* Beard */}
      <BeardLayer style={beard} hairColor={hairColor}/>
      {/* Accessories */}
      <AccessoriesLayer style={accessories}/>
    </svg>
  );
};

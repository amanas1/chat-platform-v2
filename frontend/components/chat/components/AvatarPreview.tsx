import React from 'react';

export interface AvatarConfig {
  gender: 'male' | 'female';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  beard: string;
  clothes: string;
  accessories: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  gender: 'male', skinTone: '#E8A56A', hairStyle: 'short',
  hairColor: '#1C1C1C', eyes: 'default', eyebrows: 'default',
  mouth: 'smile', beard: 'none', clothes: 'crew', accessories: 'none',
};

/* ─── SVG HAIR ─── */
const HairLayer: React.FC<{ style: string; color: string; gender: string }> = ({ style, color, gender }) => {
  const h: Record<string, React.ReactNode> = {
    none: null,
    short: <><path d="M30 18C30 12 38 4 64 4C90 4 98 12 98 18L98 32C95 28 88 22 64 22C40 22 33 28 30 32Z" fill={color}/><path d="M30 28C30 22 35 16 40 14" stroke={color} strokeWidth="3" fill="none" opacity="0.3"/></>,
    medium: <><path d="M26 20C26 8 40 2 64 2C88 2 102 8 102 20L102 48C100 44 96 38 94 36L94 24C94 18 86 10 64 10C42 10 34 18 34 24L34 36C32 38 28 44 26 48Z" fill={color}/></>,
    long: <><path d="M24 22C24 6 40 0 64 0C88 0 104 6 104 22L104 80C104 86 100 88 96 86L96 36C96 24 86 14 64 14C42 14 32 24 32 36L32 86C28 88 24 86 24 80Z" fill={color}/></>,
    curly: <><path d="M24 22C24 6 40 0 64 0C88 0 104 6 104 22L104 70C108 74 106 82 100 78C104 84 100 92 94 86C96 92 90 96 86 90L86 36C86 26 78 18 64 18C50 18 42 26 42 36L42 90C38 96 32 92 34 86C28 92 24 84 28 78C22 82 20 74 24 70Z" fill={color}/><circle cx="24" cy="56" r="6" fill={color}/><circle cx="104" cy="56" r="6" fill={color}/><circle cx="22" cy="70" r="5" fill={color}/><circle cx="106" cy="70" r="5" fill={color}/></>,
    afro: <><ellipse cx="64" cy="30" rx="48" ry="42" fill={color}/><ellipse cx="64" cy="32" rx="44" ry="38" fill={color} opacity="0.7"/></>,
    buzz: <><path d="M32 26C32 14 44 6 64 6C84 6 96 14 96 26L96 32C92 28 80 24 64 24C48 24 36 28 32 32Z" fill={color} opacity="0.6"/></>,
    mohawk: <><path d="M56 2L64 0L72 2L72 28L56 28Z" fill={color}/><path d="M54 4L64 0L74 4" stroke={color} strokeWidth="4" fill="none"/></>,
    ponytail: gender === 'female'
      ? <><path d="M28 20C28 8 42 2 64 2C86 2 100 8 100 20L100 32C96 28 84 22 64 22C44 22 32 28 28 32Z" fill={color}/><path d="M82 8C92 12 96 20 94 34C94 40 100 44 102 54C104 68 96 78 88 74C92 68 92 56 86 46C82 38 84 24 82 8Z" fill={color}/></>
      : <><path d="M30 20C30 10 42 4 64 4C86 4 98 10 98 20L98 30C94 26 82 22 64 22C46 22 34 26 30 30Z" fill={color}/><path d="M80 10C88 16 92 24 90 36L90 52C92 58 88 62 84 58L84 36C84 26 82 18 80 10Z" fill={color}/></>,
    dreads: <><path d="M26 20C26 6 42 0 64 0C86 0 102 6 102 20L102 30C98 26 84 22 64 22C44 22 30 26 26 30Z" fill={color}/>{[28,38,48,58,68,78,88,98].map((x,i)=><rect key={i} x={x-2} y="28" width="5" rx="2.5" height={24+Math.random()*16} fill={color} opacity={0.8}/>)}</>,
    shaggy: <><path d="M22 24C22 6 40 -2 64 -2C88 -2 106 6 106 24L106 50C108 46 104 38 100 42C102 36 96 30 92 34L92 28C92 18 80 10 64 10C48 10 36 18 36 28L36 34C32 30 26 36 28 42C24 38 20 46 22 50Z" fill={color}/></>,
    slickback: <><path d="M30 28C30 12 44 4 64 4C84 4 98 12 98 28L96 22C92 14 80 8 64 8C48 8 36 14 32 22Z" fill={color}/><path d="M34 24C34 16 46 8 64 8C82 8 94 16 94 24" stroke={color} strokeWidth="2" fill="none" opacity="0.4"/></>,
    hat: <><rect x="20" y="16" width="88" height="14" rx="4" fill="#333"/><rect x="30" y="4" width="68" height="16" rx="8" fill="#444"/><rect x="20" y="16" width="88" height="3" rx="1" fill="#555"/></>,
    turban: <><ellipse cx="64" cy="16" rx="34" ry="18" fill="#D32F2F"/><path d="M30 16C30 4 44 -2 64 -2C84 -2 98 4 98 16" fill="#C62828"/><line x1="64" y1="-2" x2="64" y2="16" stroke="#FFD54F" strokeWidth="2"/></>,
    beanie: <><path d="M30 24C30 10 44 2 64 2C84 2 98 10 98 24L98 30L30 30Z" fill="#37474F"/><rect x="28" y="26" width="72" height="6" rx="2" fill="#455A64"/><circle cx="64" cy="2" r="4" fill="#455A64"/></>,
  };
  return <g>{h[style] || null}</g>;
};

/* ─── SVG EYES ─── */
const EyesLayer: React.FC<{ style: string }> = ({ style }) => {
  const e: Record<string, React.ReactNode> = {
    default: <><ellipse cx="48" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="49" cy="42" r="2.5" fill="#1a1a2e"/><ellipse cx="80" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="81" cy="42" r="2.5" fill="#1a1a2e"/></>,
    happy: <><path d="M43 42C45 38 51 38 53 42" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M75 42C77 38 83 38 85 42" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    closed: <><line x1="42" y1="42" x2="54" y2="42" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/><line x1="74" y1="42" x2="86" y2="42" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/></>,
    wink: <><ellipse cx="48" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="49" cy="42" r="2.5" fill="#1a1a2e"/><path d="M75 42C77 38 83 38 85 42" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    surprised: <><ellipse cx="48" cy="42" rx="6" ry="7" fill="white"/><circle cx="49" cy="42" r="3" fill="#1a1a2e"/><ellipse cx="80" cy="42" rx="6" ry="7" fill="white"/><circle cx="81" cy="42" r="3" fill="#1a1a2e"/></>,
    squint: <><ellipse cx="48" cy="42" rx="5" ry="3" fill="white"/><circle cx="49" cy="42" r="2" fill="#1a1a2e"/><ellipse cx="80" cy="42" rx="5" ry="3" fill="white"/><circle cx="81" cy="42" r="2" fill="#1a1a2e"/></>,
    hearts: <><path d="M44 39C44 37 46 36 48 38C50 36 52 37 52 39C52 42 48 45 48 45C48 45 44 42 44 39Z" fill="#E53935"/><path d="M76 39C76 37 78 36 80 38C82 36 84 37 84 39C84 42 80 45 80 45C80 45 76 42 76 39Z" fill="#E53935"/></>,
    side: <><ellipse cx="48" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="45" cy="42" r="2.5" fill="#1a1a2e"/><ellipse cx="80" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="77" cy="42" r="2.5" fill="#1a1a2e"/></>,
    dizzy: <><g transform="translate(48,42)"><line x1="-4" y1="-4" x2="4" y2="4" stroke="#1a1a2e" strokeWidth="2"/><line x1="4" y1="-4" x2="-4" y2="4" stroke="#1a1a2e" strokeWidth="2"/></g><g transform="translate(80,42)"><line x1="-4" y1="-4" x2="4" y2="4" stroke="#1a1a2e" strokeWidth="2"/><line x1="4" y1="-4" x2="-4" y2="4" stroke="#1a1a2e" strokeWidth="2"/></g></>,
    cry: <><ellipse cx="48" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="49" cy="42" r="2.5" fill="#1a1a2e"/><ellipse cx="80" cy="42" rx="5" ry="5.5" fill="white"/><circle cx="81" cy="42" r="2.5" fill="#1a1a2e"/><path d="M52 46C52 48 50 52 48 52C46 52 44 48 44 46" fill="#64B5F6" opacity="0.6"/><path d="M84 46C84 48 82 52 80 52C78 52 76 48 76 46" fill="#64B5F6" opacity="0.6"/></>,
  };
  return <g>{e[style] || e.default}</g>;
};

/* ─── SVG EYEBROWS ─── */
const EyebrowsLayer: React.FC<{ style: string; color: string }> = ({ style, color }) => {
  const c = color === '#F5F5F5' || color === '#E8C97E' ? '#666' : color;
  const eb: Record<string, React.ReactNode> = {
    default: <><path d="M42 34C44 32 52 32 54 34" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M74 34C76 32 84 32 86 34" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    angry: <><path d="M42 36C44 32 52 30 54 32" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M74 32C76 30 84 32 86 36" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    raised: <><path d="M42 32C44 28 52 28 54 32" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M74 32C76 28 84 28 86 32" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    sad: <><path d="M42 32C44 34 52 36 54 34" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M74 34C76 36 84 34 86 32" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    unibrow: <><path d="M42 34C46 30 56 30 64 34C72 30 82 30 86 34" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    flat: <><line x1="42" y1="34" x2="54" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="74" y1="34" x2="86" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    none: null,
  };
  return <g>{eb[style] || eb.default}</g>;
};

/* ─── SVG MOUTH ─── */
const MouthLayer: React.FC<{ style: string; skinTone: string }> = ({ style, skinTone }) => {
  const m: Record<string, React.ReactNode> = {
    smile: <path d="M54 58C58 64 70 64 74 58" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    grin: <><path d="M52 56C56 64 72 64 76 56Z" fill="#1a1a2e"/><path d="M56 62C60 64 68 64 72 62" fill="#C62828" opacity="0.5"/></>,
    sad: <path d="M54 62C58 56 70 56 74 62" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    open: <><ellipse cx="64" cy="60" rx="8" ry="6" fill="#1a1a2e"/><ellipse cx="64" cy="62" rx="5" ry="3" fill="#C62828" opacity="0.5"/></>,
    neutral: <line x1="56" y1="60" x2="72" y2="60" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round"/>,
    smirk: <path d="M56 58C60 56 68 58 74 60" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    tongue: <><path d="M54 58C58 64 70 64 74 58" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="64" cy="64" rx="4" ry="4" fill="#E53935" opacity="0.6"/></>,
    grimace: <><path d="M52 58L76 58" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round"/><line x1="56" y1="56" x2="56" y2="60" stroke="#1a1a2e" strokeWidth="1"/><line x1="60" y1="56" x2="60" y2="60" stroke="#1a1a2e" strokeWidth="1"/><line x1="64" y1="56" x2="64" y2="60" stroke="#1a1a2e" strokeWidth="1"/><line x1="68" y1="56" x2="68" y2="60" stroke="#1a1a2e" strokeWidth="1"/><line x1="72" y1="56" x2="72" y2="60" stroke="#1a1a2e" strokeWidth="1"/></>,
    scream: <ellipse cx="64" cy="62" rx="6" ry="8" fill="#1a1a2e"/>,
    serious: <path d="M56 60L64 58L72 60" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/>,
  };
  return <g>{m[style] || m.smile}</g>;
};

/* ─── SVG BEARD ─── */
const BeardLayer: React.FC<{ style: string; color: string }> = ({ style, color }) => {
  const b: Record<string, React.ReactNode> = {
    none: null,
    stubble: <><circle cx="52" cy="64" r="0.8" fill={color} opacity="0.4"/><circle cx="56" cy="66" r="0.8" fill={color} opacity="0.4"/><circle cx="60" cy="65" r="0.8" fill={color} opacity="0.4"/><circle cx="64" cy="67" r="0.8" fill={color} opacity="0.4"/><circle cx="68" cy="65" r="0.8" fill={color} opacity="0.4"/><circle cx="72" cy="66" r="0.8" fill={color} opacity="0.4"/><circle cx="76" cy="64" r="0.8" fill={color} opacity="0.4"/></>,
    goatee: <path d="M58 62C58 62 60 70 64 72C68 70 70 62 70 62" fill={color} opacity="0.7"/>,
    full: <path d="M40 52C40 52 42 74 64 78C86 74 88 52 88 52C86 56 80 60 80 64C80 72 72 78 64 78C56 78 48 72 48 64C48 60 42 56 40 52Z" fill={color} opacity="0.65"/>,
    mustache: <path d="M52 56C56 54 58 56 64 56C70 56 72 54 76 56C74 58 70 60 64 60C58 60 54 58 52 56Z" fill={color} opacity="0.7"/>,
    vandyke: <><path d="M52 56C56 54 58 56 64 56C70 56 72 54 76 56C74 58 70 60 64 60C58 60 54 58 52 56Z" fill={color} opacity="0.7"/><path d="M60 64L64 76L68 64Z" fill={color} opacity="0.6"/></>,
  };
  return <g>{b[style] || null}</g>;
};

/* ─── SVG CLOTHES ─── */
const ClothesLayer: React.FC<{ style: string }> = ({ style }) => {
  const colors: Record<string, [string, string]> = {
    crew: ['#3F51B5', '#303F9F'], vneck: ['#424242', '#303030'],
    hoodie: ['#5C6BC0', '#3949AB'], blazer: ['#1B2631', '#17202A'],
    tshirt: ['#E65100', '#BF360C'], collared: ['#F5F5F5', '#E0E0E0'],
    tank: ['#C62828', '#B71C1C'], turtleneck: ['#1B5E20', '#0D3311'],
    overall: ['#0D47A1', '#0A3D8F'],
  };
  const [c1, c2] = colors[style] || colors.crew;
  const cl: Record<string, React.ReactNode> = {
    crew: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M52 68C56 72 72 72 76 68" stroke={c2} strokeWidth="1.5" fill="none"/></>,
    vneck: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M52 68L64 80L76 68" stroke={c2} strokeWidth="1.5" fill="none"/></>,
    hoodie: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M54 68L58 78L64 82L70 78L74 68" fill={c2}/><ellipse cx="64" cy="88" rx="8" ry="4" fill={c2} opacity="0.3"/></>,
    blazer: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M64 68L56 100" stroke={c2} strokeWidth="1.5"/><path d="M64 68L72 100" stroke={c2} strokeWidth="1.5"/><rect x="56" y="70" width="16" height="30" fill="#ECEFF1" opacity="0.15"/></>,
    tshirt: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M50 68C50 68 46 72 44 76" stroke={c2} strokeWidth="1" fill="none" opacity="0.5"/><path d="M78 68C78 68 82 72 84 76" stroke={c2} strokeWidth="1" fill="none" opacity="0.5"/></>,
    collared: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M52 68L58 76L64 72L70 76L76 68" fill={c2} stroke="#bbb" strokeWidth="0.5"/></>,
    tank: <><path d="M40 82C40 74 48 68 64 68C80 68 88 74 88 82L88 100L40 100Z" fill={c1}/></>,
    turtleneck: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><rect x="50" y="64" width="28" height="8" rx="4" fill={c2}/></>,
    overall: <><path d="M32 82C32 74 44 68 64 68C84 68 96 74 96 82L96 100L32 100Z" fill={c1}/><path d="M48 68L44 100M80 68L84 100" stroke="#FFC107" strokeWidth="2"/><rect x="44" y="80" width="40" height="20" rx="4" fill={c2} opacity="0.3"/></>,
  };
  return <g>{cl[style] || cl.crew}</g>;
};

/* ─── SVG ACCESSORIES ─── */
const AccessoriesLayer: React.FC<{ style: string }> = ({ style }) => {
  const a: Record<string, React.ReactNode> = {
    none: null,
    glasses: <><circle cx="48" cy="42" r="9" stroke="#666" strokeWidth="2" fill="none"/><circle cx="80" cy="42" r="9" stroke="#666" strokeWidth="2" fill="none"/><line x1="57" y1="42" x2="71" y2="42" stroke="#666" strokeWidth="2"/><line x1="39" y1="40" x2="32" y2="38" stroke="#666" strokeWidth="1.5"/><line x1="89" y1="40" x2="96" y2="38" stroke="#666" strokeWidth="1.5"/></>,
    glasses2: <><rect x="38" y="36" width="20" height="14" rx="3" stroke="#333" strokeWidth="2" fill="rgba(200,200,255,0.1)"/><rect x="70" y="36" width="20" height="14" rx="3" stroke="#333" strokeWidth="2" fill="rgba(200,200,255,0.1)"/><line x1="58" y1="42" x2="70" y2="42" stroke="#333" strokeWidth="2"/></>,
    round: <><circle cx="48" cy="42" r="10" stroke="#8D6E63" strokeWidth="2" fill="none"/><circle cx="80" cy="42" r="10" stroke="#8D6E63" strokeWidth="2" fill="none"/><line x1="58" y1="42" x2="70" y2="42" stroke="#8D6E63" strokeWidth="2"/></>,
    sunglasses: <><path d="M36 36L58 36L58 48C58 52 54 54 48 54C42 54 38 52 38 48L36 36Z" fill="#1a1a2e" opacity="0.85"/><path d="M70 36L92 36L92 48C92 52 88 54 80 54C74 54 70 52 70 48Z" fill="#1a1a2e" opacity="0.85"/><line x1="58" y1="40" x2="70" y2="40" stroke="#333" strokeWidth="2"/><line x1="36" y1="38" x2="28" y2="36" stroke="#333" strokeWidth="2"/><line x1="92" y1="38" x2="100" y2="36" stroke="#333" strokeWidth="2"/></>,
    wayfarers: <><path d="M36 36L58 36L56 50C56 54 52 56 48 56C42 56 38 52 38 48Z" fill="#2C2C2C" opacity="0.9"/><path d="M70 36L92 36L90 50C90 54 86 56 80 56C74 56 70 52 70 48Z" fill="#2C2C2C" opacity="0.9"/><line x1="58" y1="40" x2="70" y2="40" stroke="#1a1a1a" strokeWidth="2.5"/></>,
    earring: <><circle cx="32" cy="54" r="3" fill="#FFD700"/><circle cx="96" cy="54" r="3" fill="#FFD700"/></>,
    necklace: <><path d="M44 72C52 78 76 78 84 72" stroke="#FFD700" strokeWidth="1.5" fill="none"/><circle cx="64" cy="78" r="3" fill="#FFD700"/></>,
  };
  return <g>{a[style] || null}</g>;
};

/* ─── NOSE ─── */
const NoseLayer: React.FC<{ skinTone: string }> = ({ skinTone }) => {
  // Slightly darker
  const darker = skinTone + '99';
  return <path d="M62 50C62 48 64 46 66 48C68 50 66 54 64 54C62 54 62 52 62 50Z" fill={darker} opacity="0.4"/>;
};

/* ═══ MAIN AVATAR PREVIEW ═══ */
export const AvatarPreview: React.FC<{ config: AvatarConfig; size?: number }> = ({ config, size = 200 }) => {
  return (
    <svg viewBox="0 0 128 110" width={size} height={size * 0.86} xmlns="http://www.w3.org/2000/svg">
      {/* Body / Clothes */}
      <ClothesLayer style={config.clothes} />
      {/* Neck */}
      <rect x="56" y="62" width="16" height="12" rx="4" fill={config.skinTone} />
      {/* Head */}
      <ellipse cx="64" cy="42" rx="28" ry="30" fill={config.skinTone} />
      {/* Ears */}
      <ellipse cx="36" cy="46" rx="4" ry="6" fill={config.skinTone} />
      <ellipse cx="92" cy="46" rx="4" ry="6" fill={config.skinTone} />
      {/* Nose */}
      <NoseLayer skinTone={config.skinTone} />
      {/* Eyes */}
      <EyesLayer style={config.eyes} />
      {/* Eyebrows */}
      <EyebrowsLayer style={config.eyebrows} color={config.hairColor} />
      {/* Mouth */}
      <MouthLayer style={config.mouth} skinTone={config.skinTone} />
      {/* Beard */}
      <BeardLayer style={config.beard} color={config.hairColor} />
      {/* Hair (on top of everything except accessories) */}
      <HairLayer style={config.hairStyle} color={config.hairColor} gender={config.gender} />
      {/* Accessories (topmost) */}
      <AccessoriesLayer style={config.accessories} />
    </svg>
  );
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

let soundEnabled: boolean = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

const initEngine = () => {
  if (!soundEnabled) return null;
  try {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      ctx = new AudioContextClass();
      
      masterGain = ctx.createGain();
      // Master volume (0.1 - 0.15)
      masterGain.gain.value = 0.15;
      masterGain.connect(ctx.destination);
    }
    
    // Resume context if browser autoplay policy suspended it
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    return { ctx, masterGain };
  } catch (error) {
    console.warn('Web Audio API not initialized', error);
    return null;
  }
};

/**
 * Slide Open Public Panel (3D)
 * Feel: Slides from left to center
 */
export const playSlideOpenSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const panner = ctx.createStereoPanner();

  // Premium, subtle tone
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

  // Pan transition: -0.4 to 0 over 200ms
  panner.pan.setValueAtTime(-0.4, ctx.currentTime);
  panner.pan.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

  // Gain fade: 0 -> 0.12 -> 0 over 300ms
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05); // Slight fade-in
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

  osc.connect(env);
  env.connect(panner);
  panner.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};

/**
 * Slide Close Public Panel (3D)
 * Feel: Retreats away to the right, lower pitch
 */
export const playSlideCloseSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);

  // Pan transition: 0 to +0.3
  panner.pan.setValueAtTime(0, ctx.currentTime);
  panner.pan.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);

  // Fade out
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

  osc.connect(env);
  env.connect(panner);
  panner.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};

/**
 * Tab Switch Sound
 * Feel: Light stereo, almost unnoticeable click to prevent mechanical repetition
 */
export const playTabSwitchSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  // Very short click (40-60ms)
  const duration = 0.05; 
  
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);

  // Random pan between -0.1 and +0.1
  const randomPan = (Math.random() * 0.2) - 0.1;
  panner.pan.setValueAtTime(randomPan, ctx.currentTime);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.connect(env);
  env.connect(panner);
  panner.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

/**
 * Category Flip Sound (Airport flip)
 * Feel: Mechanical, fast double transient
 */
export const playFlipSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  // Mechanical squareish tone
  osc.type = 'square';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

  // Double attack envelope to simulate mechanical flip flap
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
  env.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.04);
  env.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);

  osc.connect(env);
  env.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
};

/**
 * Hover Sparkle
 * Feel: Very light sparkle, high pitch, very quiet
 */
export const playHoverSparkleSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.04);

  // Very quiet
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.01);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.04);

  osc.connect(env);
  env.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
};

/**
 * Message Notification
 * Feel: Clean short ping with soft attack
 */
export const playMessageNotification = (isPrivate: boolean) => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const panner = ctx.createStereoPanner();

  // Clean ping
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);

  // Private: +0.15, Public: -0.15
  panner.pan.setValueAtTime(isPrivate ? 0.15 : -0.15, ctx.currentTime);

  // Soft attack
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  
  // Cleanup at 0.4
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

  osc.connect(env);
  env.connect(panner);
  panner.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
};

/**
 * Knock Notification
 * Feel: Centered, deeper tone, low-pass filter
 */
export const playKnockNotification = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const env = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const filter = ctx.createBiquadFilter();

  // Deeper tone
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(300, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);

  // Center pan
  panner.pan.setValueAtTime(0, ctx.currentTime);

  // Low-pass filter to cut harsh frequencies
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08); // soft attack
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(env);
  env.connect(panner);
  panner.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
  osc2.stop(ctx.currentTime + 0.5);
};

/**
 * Card Open
 * Feel: Soft click-air sound
 */
export const playCardOpenSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(env);
  env.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

/**
 * Modal Open
 * Feel: Low frequency subtle thump
 */
export const playModalOpenSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

  osc.connect(env);
  env.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
};

/**
 * Message Sent
 * Feel: Soft digital tap
 */
export const playMessageSentSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(env);
  env.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
};

/**
 * Room Join
 * Feel: Soft rising tone
 */
export const playRoomJoinSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);

  panner.pan.setValueAtTime(0, ctx.currentTime);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

  osc.connect(env);
  env.connect(panner);
  panner.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
};

/**
 * Panel Close
 * Feel: Soft fade-down whoosh
 */
export const playPanelCloseSound = () => {
  const engine = initEngine();
  if (!engine) return;
  const { ctx, masterGain } = engine;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);

  osc.connect(env);
  env.connect(masterGain as GainNode);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
};

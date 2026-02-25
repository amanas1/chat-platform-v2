
/**
 * PRODUCTION-GRADE AUDIO ENGINE v3 (SINGLETON)
 * Built for high-concurrency radio streaming.
 * 
 * DESIGN GOALS:
 * 1. ZERO-Click Station Switching (Volume Ramping).
 * 2. Rapid-Switching Stability (RequestID Debouncing).
 * 3. Mobile Performance (Dynamic FFT & SafeMode).
 * 4. Enterprise Reliability (FSM & Defensive Guards).
 */

export type AudioEngineState = 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'SUSPENDED' | 'ERROR';

interface EngineStatus {
  state: AudioEngineState;
  isReady: boolean;
  isSafeMode: boolean;
  isDynamicsEnabled: boolean;
  activeRequestId: number;
}

export class AudioEngine {
  private static instance: AudioEngine;
  
  // WebAudio API Nodes
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private volumeGain: GainNode | null = null; // Master Volume / Ramping
  private panner: StereoPannerNode | null = null;
  private filters: BiquadFilterNode[] = [];
  
  // State Management
  private state: AudioEngineState = 'UNINITIALIZED';
  private graphInitialized: boolean = false;
  private isSafeMode: boolean = false;
  private isDynamicsEnabled: boolean = true;
  private currentAudioElement: HTMLMediaElement | null = null;
  
  // Stability & Control
  private requestId = 0;
  private currentVolume = 1.0;
  private fadeTime = 0.2; // 200ms Crossfade/Ramp
  private impulseLoaded = false;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Status API
   */
  public getStatus(): EngineStatus {
    return {
      state: this.state,
      isReady: this.graphInitialized,
      isSafeMode: this.isSafeMode,
      isDynamicsEnabled: this.isDynamicsEnabled,
      activeRequestId: this.requestId
    };
  }

  public isReady(): boolean { return this.graphInitialized; }
  public getState(): AudioEngineState { return this.state; }
  public isSafeModeEnabled(): boolean { return this.isSafeMode; }

  /**
   * Idempotent Initialization
   * Optimized for rapid station switching.
   */
  public async init(audioElement: HTMLMediaElement): Promise<void> {
    const rid = ++this.requestId;
    
    // 1. Guard against duplicate init for same element
    if (this.state === 'READY' && this.currentAudioElement === audioElement) return;
    
    console.info(`[AudioEngine] 🚀 Init sequence started (ID: ${rid})`);
    this.state = 'INITIALIZING';

    try {
      // 2. Persistent Context Lazy Init
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
          latencyHint: 'playback'
        });
      }

      // 3. User interaction unlock / Resume
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // 4. Stale Request Check
      if (rid !== this.requestId) return;

      // 5. Build/Rebuild Graph
      this.rebuildGraph(audioElement);
      
      this.state = 'READY';
      console.info(`[AudioEngine] ✅ Engine Ready (ID: ${rid})`);
    } catch (err) {
      console.error('[AudioEngine] ❌ Initialization failure:', err);
      this.state = 'ERROR';
    }
  }

  /**
   * Robust Graph Construction
   * Prevents "HTMLMediaElement already connected" errors.
   */
  private rebuildGraph(audioElement: HTMLMediaElement): void {
    if (!this.ctx) return;

    // Safety Disconnect
    if (this.source) {
      try { this.source.disconnect(); } catch (e) { console.debug('[AudioEngine] Cleanup disconnect failed', e); }
    }

    // Re-use or Create nodes
    if (!this.graphInitialized) {
      this.createNodes();
    }

    // Bind current element
    if (this.currentAudioElement !== audioElement || !this.source) {
       this.currentAudioElement = audioElement;
       this.source = this.ctx.createMediaElementSource(audioElement);
       this.routeGraph();
    }

    this.graphInitialized = true;
    this.syncAllParameters();
  }

  private createNodes(): void {
    if (!this.ctx) return;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = this.isSafeMode ? 512 : 1024;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.limiter = this.ctx.createDynamicsCompressor();
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();
    this.reverb = this.ctx.createConvolver();
    this.panner = this.ctx.createStereoPanner();
    this.volumeGain = this.ctx.createGain();

    // EQ Initialization (10-Band ISO)
    const freqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.filters = freqs.map(f => {
      const bq = this.ctx!.createBiquadFilter();
      bq.type = 'peaking';
      bq.frequency.value = f;
      bq.Q.value = 1.2;
      bq.gain.value = 0;
      return bq;
    });

    // Default Node Configurations
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.limiter.threshold.value = -1.0;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20; // Hard Limiter
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.1;

    this.generateProceduralImpulse();
  }

  private routeGraph(): void {
    if (!this.source || !this.analyser || !this.compressor || !this.limiter || !this.dryGain || !this.wetGain || !this.reverb || !this.panner || !this.volumeGain || !this.ctx) return;

    // Direct Routing Path (Stable - gain based)
    this.source.connect(this.analyser);
    this.analyser.connect(this.compressor);
    this.compressor.connect(this.limiter);
    
    // Split: Dry / Reverb
    this.limiter.connect(this.dryGain);
    this.limiter.connect(this.reverb);
    this.reverb.connect(this.wetGain);

    // Merge -> EQ Bank
    this.dryGain.connect(this.filters[0]);
    this.wetGain.connect(this.filters[0]);

    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i+1]);
    }

    // End Chain
    this.filters[this.filters.length - 1].connect(this.panner);
    this.panner.connect(this.volumeGain);
    this.volumeGain.connect(this.ctx.destination);
    
    console.debug('[AudioEngine] 🏗️ Routing chain established');
  }

  private syncAllParameters(): void {
    this.setSafeMode(this.isSafeMode);
    this.setDynamics(this.isDynamicsEnabled);
    this.setVolume(this.currentVolume);
  }

  /**
   * Safe Mode Logic
   * Balances Dry/Wet via Gain interpolation.
   */
  public setSafeMode(enabled: boolean): void {
    this.isSafeMode = enabled;
    if (!this.graphInitialized || !this.ctx || !this.dryGain || !this.wetGain || !this.analyser) return;

    const now = this.ctx.currentTime;
    this.analyser.fftSize = enabled ? 512 : 1024;

    if (enabled) {
      this.dryGain.gain.setTargetAtTime(1.0, now, 0.1);
      this.wetGain.gain.setTargetAtTime(0.0, now, 0.1);
    } else {
      // Logic for balanced wet/dry is in setFX
    }
  }

  /**
   * Dynamics Control
   */
  public setDynamics(enabled: boolean): void {
    this.isDynamicsEnabled = enabled;
    if (!this.compressor || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const ratio = enabled ? 4 : 1; 
    this.compressor.ratio.setTargetAtTime(ratio, now, 0.1);
  }

  /**
   * Master Volume with Click-Prevention Ramp
   */
  public setVolume(val: number, instant: boolean = false): void {
    this.currentVolume = val;
    if (!this.volumeGain || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    if (instant) {
      this.volumeGain.gain.cancelScheduledValues(now);
      this.volumeGain.gain.value = val;
    } else {
      this.volumeGain.gain.setTargetAtTime(val, now, this.fadeTime);
    }
  }

  /**
   * Reverb & FX Control
   */
  public setFX(reverbMix: number): void {
    if (!this.graphInitialized || !this.ctx || this.isSafeMode) return;
    
    const now = this.ctx.currentTime;
    const wet = Math.max(0, Math.min(1, reverbMix));
    const dry = 1 - (wet * 0.4); // Adaptive Dry Balance

    this.wetGain?.gain.setTargetAtTime(wet, now, 0.1);
    this.dryGain?.gain.setTargetAtTime(dry, now, 0.1);
  }

  /**
   * 10-Band EQ Interface
   */
  public setEQ(gains: number[]): void {
    if (!this.graphInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    gains.forEach((g, i) => {
      if (this.filters[i]) {
        this.filters[i].gain.setTargetAtTime(g, now, 0.1);
      }
    });
  }

  /**
   * Spatial Pan (8D Logic)
   */
  public setSpatialPan(val: number): void {
    if (this.panner && this.ctx) {
      this.panner.pan.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Rapid Switching Helper
   * Smoothly ramps down before source change.
   */
  public prepareForSwitch(): void {
    if (this.volumeGain && this.ctx) {
      this.volumeGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
      this.state = 'SUSPENDED';
    }
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
      this.state = 'READY';
    }
  }

  /**
   * Procedural Impulse Response Generation
   * Ensures reverb works without external IR file.
   */
  private generateProceduralImpulse(): void {
    if (!this.ctx || !this.reverb || this.impulseLoaded) return;

    try {
      const rate = this.ctx.sampleRate;
      const length = rate * 2.0;
      const decay = 2.0;
      const impulse = this.ctx.createBuffer(2, length, rate);

      for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      this.reverb.buffer = impulse;
      this.impulseLoaded = true;
      console.debug('[AudioEngine] 🪄 Procedural IR Generated');
    } catch (e) {
      console.error('[AudioEngine] ❌ IR Generation failed', e);
    }
  }

  /**
   * Deep Cleanup
   * Closes everything and resets for full teardown.
   */
  public async cleanup(): Promise<void> {
    console.info('[AudioEngine] 🧹 Full Teardown initiated');
    this.requestId++; 
    
    if (this.ctx) {
      // Disconnect all nodes
      try {
        this.source?.disconnect();
        this.analyser?.disconnect();
        this.compressor?.disconnect();
        this.limiter?.disconnect();
        this.dryGain?.disconnect();
        this.wetGain?.disconnect();
        this.reverb?.disconnect();
        this.panner?.disconnect();
        this.filters.forEach(f => f.disconnect());
        this.volumeGain?.disconnect();
      } catch (e) { console.debug('[AudioEngine] Nodes already disconnected'); }

      // Close Context
      await this.ctx.close();
      this.ctx = null;
    }

    this.filters = [];
    this.source = null;
    this.analyser = null;
    this.compressor = null;
    this.limiter = null;
    this.dryGain = null;
    this.wetGain = null;
    this.reverb = null;
    this.panner = null;
    this.volumeGain = null;
    
    this.graphInitialized = false;
    this.impulseLoaded = false;
    this.state = 'UNINITIALIZED';
    this.currentAudioElement = null;
  }
}

export const audioEngine = AudioEngine.getInstance();

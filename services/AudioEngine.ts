
/**
 * PRODUCTION-GRADE AUDIO ENGINE (SINGLETON) v2
 * 
 * FEATURES:
 * 1. 10-Band EQ Bank.
 * 2. Spatial 8D Panning.
 * 3. Idempotent Graph Init.
 * 4. Safe Mode Routing.
 */

export type AudioEngineState = 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'ERROR';

export class AudioEngine {
  private static instance: AudioEngine;
  
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private volumeGain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private filters: BiquadFilterNode[] = [];
  
  private state: AudioEngineState = 'UNINITIALIZED';
  private graphInitialized: boolean = false;
  private isSafeMode: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init(audioElement: HTMLAudioElement): Promise<void> {
    if (this.state === 'READY' && this.currentAudioElement === audioElement) return;
    if (this.state === 'INITIALIZING') return;

    this.state = 'INITIALIZING';
    this.currentAudioElement = audioElement;

    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
          latencyHint: 'playback'
        });
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.initializeGraph();
      this.state = 'READY';
      console.info('[AudioEngine] ✅ Graph Initialized and Ready');
    } catch (err) {
      this.state = 'ERROR';
      console.error('[AudioEngine] ❌ Initialization failed:', err);
      throw err;
    }
  }

  private initializeGraph(): void {
    if (!this.ctx || !this.currentAudioElement || this.graphInitialized) return;

    this.source = this.ctx.createMediaElementSource(this.currentAudioElement);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;

    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();
    this.volumeGain = this.ctx.createGain();
    this.panner = this.ctx.createStereoPanner();
    this.reverb = this.ctx.createConvolver();

    // EQ Bank (10-band)
    const freqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.filters = freqs.map(f => {
      const bq = this.ctx!.createBiquadFilter();
      bq.type = 'peaking';
      bq.frequency.value = f;
      bq.Q.value = 1;
      bq.gain.value = 0;
      return bq;
    });

    // Routing: Source -> Analyser -> Split (Dry / Reverb -> Wet) -> EQ Bank -> Panner -> Volume -> Destination
    this.source.connect(this.analyser);
    
    this.analyser.connect(this.dryGain);
    this.analyser.connect(this.reverb);
    this.reverb.connect(this.wetGain);

    this.dryGain.connect(this.filters[0]);
    this.wetGain.connect(this.filters[0]);

    for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i+1]);
    }

    this.filters[this.filters.length - 1].connect(this.panner);
    this.panner.connect(this.volumeGain);
    this.volumeGain.connect(this.ctx.destination);

    this.graphInitialized = true;
  }

  public setSafeMode(enabled: boolean): void {
    if (!this.ctx || !this.dryGain || !this.wetGain) return;
    this.isSafeMode = enabled;
    const now = this.ctx.currentTime;
    
    // In safe mode, we bypass FX by setting wet to 0 and dry to 1.
    // We keep the routing nodes connected to avoid clicks/pops.
    this.dryGain.gain.setTargetAtTime(enabled ? 1.0 : 1.0, now, 0.05);
    this.wetGain.gain.setTargetAtTime(enabled ? 0.0 : 0.0, now, 0.05);
  }

  public setVolume(val: number): void {
    if (this.volumeGain && this.ctx) {
        this.volumeGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  public setFX(reverbMix: number): void {
    if (!this.graphInitialized || !this.ctx || this.isSafeMode) return;
    const now = this.ctx.currentTime;
    this.wetGain?.gain.setTargetAtTime(reverbMix, now, 0.1);
    this.dryGain?.gain.setTargetAtTime(1 - (reverbMix * 0.4), now, 0.1);
  }

  public setEQ(gains: number[]): void {
    if (!this.graphInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    gains.forEach((g, i) => {
      if (this.filters[i]) {
        this.filters[i].gain.setTargetAtTime(g, now, 0.1);
      }
    });
  }

  public setSpatialPan(val: number): void {
    if (this.panner && this.ctx) {
        this.panner.pan.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public cleanup(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.graphInitialized = false;
    this.state = 'UNINITIALIZED';
    this.source = null;
    this.currentAudioElement = null;
  }
}

export const audioEngine = AudioEngine.getInstance();

export const playSlideSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        
        // Master gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05); // low volume
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25); // 250ms total
        masterGain.connect(ctx.destination);

        // Sub-bass sweep
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.2);
        
        // Distortion for metallic feel
        const waveShaper = ctx.createWaveShaper();
        const curve = new Float32Array(400);
        for (let i = 0; i < 400; ++i) {
            const x = i * 2 / 400 - 1;
            curve[i] = (Math.PI + x) * Math.sin(x) * 2;
        }
        waveShaper.curve = curve;
        
        // Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);

        osc.connect(waveShaper);
        waveShaper.connect(filter);
        filter.connect(masterGain);

        // Noise burst for mechanical friction
        const bufferSize = ctx.sampleRate * 0.25; // 250ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // pinkish noise
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        // Play
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        noiseSource.start(ctx.currentTime);
        noiseSource.stop(ctx.currentTime + 0.3);

        // Cleanup
        setTimeout(() => {
            if (ctx.state !== 'closed') {
                ctx.close();
            }
        }, 500);

    } catch (e) {
        console.warn('AudioContext not supported or blocked by browser', e);
    }
};

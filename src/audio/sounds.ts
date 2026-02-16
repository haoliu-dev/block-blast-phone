type SoundType = 'place' | 'placeFail' | 'clear' | 'clearDouble' | 'clearTriple' | 'clearMega' | 'combo' | 'gameover';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = false;

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume audio context if it's suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.enabled = true;
  }

  setEnabled(enabled: boolean): void { this.enabled = enabled; }

  private createOscillator(frequency: number, type: OscillatorType, startTime: number, duration: number, ctx: AudioContext): OscillatorNode {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(frequency, startTime);
    osc.type = type;
    return osc;
  }

  private createGain(value: number, startTime: number, ctx: AudioContext): GainNode {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(value, startTime);
    return gain;
  }

  play(type: SoundType): void {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    switch (type) {
      case 'place': {
        const osc = this.createOscillator(1200, 'sine', now, 0.08, ctx);
        const gain = this.createGain(0.15, now, ctx);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      
      case 'placeFail': {
        const osc = this.createOscillator(150, 'sawtooth', now, 0.3, ctx);
        const gain = this.createGain(0.1, now, ctx);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      
      case 'clear': {
        // Single line clear - satisfying pop
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
          const osc = this.createOscillator(freq, 'triangle', now + i * 0.05, 0.3, ctx);
          const gain = this.createGain(0.2, now + i * 0.05, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.3);
        });
        break;
      }
      
      case 'clearDouble': {
        // Double line - rising arpeggio with harmony
        const baseNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const harmonyNotes = [659.25, 783.99, 1046.50, 1318.51]; // E5, G5, C6, E6
        
        baseNotes.forEach((freq, i) => {
          const osc = this.createOscillator(freq, 'triangle', now + i * 0.04, 0.4, ctx);
          const gain = this.createGain(0.25, now + i * 0.04, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.4);
        });
        
        harmonyNotes.forEach((freq, i) => {
          const osc = this.createOscillator(freq, 'sine', now + i * 0.04 + 0.02, 0.35, ctx);
          const gain = this.createGain(0.15, now + i * 0.04 + 0.02, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.37);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.04 + 0.02);
          osc.stop(now + i * 0.04 + 0.37);
        });
        break;
      }
      
      case 'clearTriple': {
        // Triple line - triumphant fanfare
        const chord1 = [523.25, 659.25, 783.99]; // C major
        const chord2 = [659.25, 783.99, 1046.50]; // E minor
        const chord3 = [783.99, 1046.50, 1318.51]; // G major
        
        // First chord with impact
        chord1.forEach(freq => {
          const osc = this.createOscillator(freq, 'triangle', now, 0.5, ctx);
          const gain = this.createGain(0.3, now, ctx);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        });
        
        // Second chord
        chord2.forEach(freq => {
          const osc = this.createOscillator(freq, 'triangle', now + 0.15, 0.4, ctx);
          const gain = this.createGain(0.25, now + 0.15, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.15);
          osc.stop(now + 0.55);
        });
        
        // Third chord - climax
        chord3.forEach(freq => {
          const osc = this.createOscillator(freq, 'triangle', now + 0.3, 0.6, ctx);
          const gain = this.createGain(0.35, now + 0.3, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.3);
          osc.stop(now + 0.9);
        });
        
        // Add sparkle high notes
        const sparkleNotes = [2093, 2637, 3136, 4186]; // C7, E7, G7, C8
        sparkleNotes.forEach((freq, i) => {
          const osc = this.createOscillator(freq, 'sine', now + 0.4 + i * 0.03, 0.3, ctx);
          const gain = this.createGain(0.1, now + 0.4 + i * 0.03, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7 + i * 0.03);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.4 + i * 0.03);
          osc.stop(now + 0.7 + i * 0.03);
        });
        break;
      }
      
      case 'clearMega': {
        // Mega clear (4+ lines) - EPIC CELEBRATION
        const now = ctx.currentTime;
        
        // Bass drop impact
        const bassOsc = this.createOscillator(60, 'sawtooth', now, 1.0, ctx);
        const bassGain = this.createGain(0.4, now, ctx);
        bassOsc.frequency.exponentialRampToValueAtTime(30, now + 1.0);
        bassGain.gain.setValueAtTime(0.4, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 1.0);
        
        // Rising power chord
        const powerChord = [261.63, 392.00, 523.25]; // C4, G4, C5
        [0, 0.1, 0.2, 0.3].forEach((delay, idx) => {
          const mult = 1 + idx * 0.5;
          powerChord.forEach(freq => {
            const osc = this.createOscillator(freq * mult, 'triangle', now + delay, 0.8, ctx);
            const gain = this.createGain(0.3 - idx * 0.05, now + delay, ctx);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.8);
          });
        });
        
        // Fast arpeggio cascade
        const cascadeNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00, 2637.02];
        cascadeNotes.forEach((freq, i) => {
          const osc = this.createOscillator(freq, 'sine', now + 0.3 + i * 0.02, 0.4, ctx);
          const gain = this.createGain(0.15, now + 0.3 + i * 0.02, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7 + i * 0.02);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.3 + i * 0.02);
          osc.stop(now + 0.7 + i * 0.02);
        });
        
        // Victory shimmer
        const shimmerNotes = [4186.01, 5274.04, 6271.93, 8372.02];
        shimmerNotes.forEach((freq, i) => {
          const osc = this.createOscillator(freq, 'sine', now + 0.5 + i * 0.05, 0.5, ctx);
          const gain = this.createGain(0.08, now + 0.5 + i * 0.05, ctx);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + i * 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.5 + i * 0.05);
          osc.stop(now + 1.0 + i * 0.05);
        });
        break;
      }
      
      case 'gameover': {
        // 四段式下降悲伤音效
        const stages = [
          { freq: 400, duration: 0.4, type: 'sawtooth' as OscillatorType, vol: 0.3 },
          { freq: 300, duration: 0.4, type: 'sawtooth' as OscillatorType, vol: 0.25 },
          { freq: 200, duration: 0.4, type: 'sawtooth' as OscillatorType, vol: 0.2 },
          { freq: 100, duration: 0.5, type: 'sawtooth' as OscillatorType, vol: 0.15 },
        ];
        
        let timeOffset = 0;
        stages.forEach((stage) => {
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(stage.freq, now + timeOffset);
          osc.frequency.exponentialRampToValueAtTime(stage.freq * 0.7, now + timeOffset + stage.duration);
          osc.type = stage.type;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.001, now + timeOffset);
          gain.gain.linearRampToValueAtTime(stage.vol, now + timeOffset + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + stage.duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + stage.duration);
          
          timeOffset += stage.duration - 0.05; // 轻微重叠
        });
        break;
      }
    }
  }
  
  // Helper to determine which clear sound to play based on line count
  playClear(linesCleared: number): void {
    if (linesCleared >= 4) {
      this.play('clearMega');
    } else if (linesCleared === 3) {
      this.play('clearTriple');
    } else if (linesCleared === 2) {
      this.play('clearDouble');
    } else {
      this.play('clear');
    }
  }
}

export const soundManager = new SoundManager();

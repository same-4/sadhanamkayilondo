/**
 * Sadhanam Kayyilundo? - WebAudio API Sound Synthesizer
 * Fully synthesized sound effects using AudioContext. No external audio files.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this._initialized = true;
      }
    } catch (e) {
      console.warn("WebAudio API initialization failed:", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muteState) {
    this.muted = muteState;
  }

  isMuted() {
    return this.muted;
  }
  playFaah() {
  if (this.muted) return;

  const audio = new Audio('assets/sounds/faah.mp3');
  audio.volume = 0.9;
  audio.currentTime = 0;
  audio.play().catch(err => {
    console.warn("FAAH sound could not play:", err);
  });
}
  // --- Wrong Grab Buzzer ---
  playBuzzer() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Dissonant low frequencies
    osc1.frequency.setValueAtTime(130, now);
    osc2.frequency.setValueAtTime(142, now); // Harsh tritonal clash

    osc1.frequency.exponentialRampToValueAtTime(70, now + 0.35);
    osc2.frequency.exponentialRampToValueAtTime(75, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // --- Success Chime ---
  playChime() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  // --- False "Correct" Chime (Level 10 Deception) ---
  playFalseChime() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Sounds 90% like a chime, but slightly off pitch to feel subtly wrong/cruel!
    const notes = [523.25, 650.00, 770.00, 1030.00];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.22);
    });
  }

  // --- Level Up Fanfare ---
  playLevelUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A Major arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // --- Teleport Sound ---
  playTeleport() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- Screen Flip / Invert Glitch SFX ---
  playGlitch() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(200, now + 0.05);
    osc.frequency.setValueAtTime(1200, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- Ending Victory / Anti-Climax Fanfare ---
  playEnding() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Grand orchestral synth sweep followed by a comical low detuned chord
    const triumphNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    triumphNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.6);
    });

    // Saddest low chord at the end
    setTimeout(() => {
      if (this.muted || !this.ctx) return;
      const endNow = this.ctx.currentTime;
      [110, 116.54, 130.81].forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, endNow);
        gain.gain.setValueAtTime(0.2, endNow);
        gain.gain.exponentialRampToValueAtTime(0.001, endNow + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(endNow);
        osc.stop(endNow + 1.2);
      });
    }, 1000);
  }
}

window.soundSynth = new SoundSynthesizer();

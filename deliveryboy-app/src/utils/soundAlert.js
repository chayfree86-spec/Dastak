class SoundAlert {
  constructor() {
    this.audioContext = null
    this.isPlaying = false
    this.intervalId = null
    this.currentAudioElement = null
  }

  initContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.audioContext = new AudioCtx()
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  // 1. Synthesizer Tone Presets (Web Audio API - Fast, Offline, Universal)
  playPresetTone(preset = 'chime') {
    try {
      this.initContext()
      if (!this.audioContext) return

      const ctx = this.audioContext
      const now = ctx.currentTime

      if (preset === 'radar') {
        // High-tempo Urgent Double Pulse
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(1318.51, now) // E6
        osc1.frequency.setValueAtTime(1760.00, now + 0.1) // A6
        gain1.gain.setValueAtTime(0.001, now)
        gain1.gain.exponentialRampToValueAtTime(0.7, now + 0.03)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.22)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(1760.00, now + 0.25)
        osc2.frequency.setValueAtTime(2093.00, now + 0.35) // C7
        gain2.gain.setValueAtTime(0.001, now + 0.25)
        gain2.gain.exponentialRampToValueAtTime(0.7, now + 0.28)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.25)
        osc2.stop(now + 0.48)
      } else if (preset === 'siren') {
        // Digital Smooth Siren Sweep
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(650, now)
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25)
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.5)
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.exponentialRampToValueAtTime(0.4, now + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.52)
      } else if (preset === 'subtle') {
        // Soft Minimal Ping
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, now) // A5
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.exponentialRampToValueAtTime(0.5, now + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.32)
      } else if (preset === 'bell') {
        // Crystal Front Desk Bell Chime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(1046.50, now) // C6
        osc.frequency.setValueAtTime(1318.51, now + 0.08) // E6
        osc.frequency.setValueAtTime(1567.98, now + 0.16) // G6
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.exponentialRampToValueAtTime(0.6, now + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.65)
      } else {
        // Default 'chime': Royal Harmonic 3-Tone Chime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(587.33, now) // D5
        osc.frequency.setValueAtTime(880, now + 0.1) // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.22) // D6
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.exponentialRampToValueAtTime(0.6, now + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.45)
      }
    } catch (e) {
      console.warn('Synthesizer audio play exception:', e)
    }
  }

  // 2. Play Custom Uploaded Audio (MP3, WAV, AAC, M4A, OGG, FLAC, WEBM)
  playCustomAudio(dataUrl) {
    try {
      if (!dataUrl) return
      if (this.currentAudioElement) {
        this.currentAudioElement.pause()
        this.currentAudioElement.currentTime = 0
      }
      const audio = new Audio(dataUrl)
      audio.volume = 1.0
      this.currentAudioElement = audio
      audio.play().catch((err) => {
        console.warn('Custom audio playback error:', err)
      })
    } catch (e) {
      console.warn('Custom audio play exception:', e)
    }
  }

  // 3. Unified Dispatcher
  playAlert(preset = 'chime', customAudioData = null) {
    if (customAudioData) {
      this.playCustomAudio(customAudioData)
    } else {
      this.playPresetTone(preset)
    }
  }

  startContinuousAlert(preset = 'chime', customAudioData = null) {
    if (this.isPlaying) return
    this.isPlaying = true
    this.playAlert(preset, customAudioData)
    this.intervalId = setInterval(() => {
      this.playAlert(preset, customAudioData)
    }, 2000)
  }

  stopAlert() {
    this.isPlaying = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause()
      this.currentAudioElement.currentTime = 0
    }
  }
}

export const soundAlert = new SoundAlert()
export default soundAlert

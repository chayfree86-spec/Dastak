/**
 * Web Audio API based Kitchen POS Order Alert Chime
 * Produces a clear, loud, dual-frequency attention chime without external file dependencies.
 */
class SoundAlertManager {
  constructor() {
    this.audioCtx = null
    this.enabled = true
    const saved = localStorage.getItem('dastak_partner_sound')
    if (saved !== null) {
      this.enabled = saved === 'true'
    }
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.audioCtx = new AudioContext()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  playOrderChime() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.audioCtx) return

      const now = this.audioCtx.currentTime

      // Tone 1: High crisp bell (880 Hz - A5)
      const osc1 = this.audioCtx.createOscillator()
      const gain1 = this.audioCtx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now)
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc1.connect(gain1)
      gain1.connect(this.audioCtx.destination)
      osc1.start(now)
      osc1.stop(now + 0.35)

      // Tone 2: Harmonious resonance (1318.5 Hz - E6)
      const osc2 = this.audioCtx.createOscillator()
      const gain2 = this.audioCtx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(1318.5, now + 0.12)
      gain2.gain.setValueAtTime(0.4, now + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      osc2.connect(gain2)
      gain2.connect(this.audioCtx.destination)
      osc2.start(now + 0.12)
      osc2.stop(now + 0.6)

      // Tone 3: Final confirmation ring (1760 Hz - A6)
      const osc3 = this.audioCtx.createOscillator()
      const gain3 = this.audioCtx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(1760, now + 0.25)
      gain3.gain.setValueAtTime(0.35, now + 0.25)
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
      osc3.connect(gain3)
      gain3.connect(this.audioCtx.destination)
      osc3.start(now + 0.25)
      osc3.stop(now + 0.8)
    } catch (e) {
      console.warn('Audio chime playback restricted by browser policy:', e)
    }
  }

  toggleSound(val) {
    this.enabled = typeof val === 'boolean' ? val : !this.enabled
    localStorage.setItem('dastak_partner_sound', String(this.enabled))
    if (this.enabled) {
      this.playOrderChime()
    }
    return this.enabled
  }

  isSoundEnabled() {
    return this.enabled
  }
}

export const soundAlert = new SoundAlertManager()

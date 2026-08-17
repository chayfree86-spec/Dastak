class SoundAlert {
  constructor() {
    this.audioContext = null
    this.isPlaying = false
    this.intervalId = null
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

  playOrderTone() {
    try {
      this.initContext()
      if (!this.audioContext) return

      const ctx = this.audioContext
      const now = ctx.currentTime

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
    } catch (e) {
      console.warn('Audio play exception:', e)
    }
  }

  startContinuousAlert() {
    if (this.isPlaying) return
    this.isPlaying = true
    this.playOrderTone()
    this.intervalId = setInterval(() => {
      this.playOrderTone()
    }, 1800)
  }

  stopAlert() {
    this.isPlaying = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

export const soundAlert = new SoundAlert()
export default soundAlert

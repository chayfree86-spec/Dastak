/**
 * Web Audio API & Custom File Audio Notification System for Restaurant Kitchen POS
 * Supports Universal Audio Formats: MP3, WAV, OGG, AAC, M4A, FLAC, WebM
 */
const STATIC_SOUNDS = {
  announcement: '/anymix-announcement-sound-effect-254037.mp3',
  warning: '/tithuh-warning-545568.mp3',
}

class SoundAlertManager {
  constructor() {
    this.audioCtx = null
    this.currentAudioObj = null
    this.isPlaying = false

    // Load saved preferences
    this.enabled = localStorage.getItem('dastak_partner_sound') !== 'false'
    this.soundType = localStorage.getItem('dastak_partner_sound_type') || 'default' // 'default' | 'announcement' | 'warning' | 'buzzer' | 'digital' | 'marimba' | 'custom'
    this.customSoundData = localStorage.getItem('dastak_partner_custom_sound') || null
    this.customSoundName = localStorage.getItem('dastak_partner_custom_sound_name') || ''
    this.volume = parseFloat(localStorage.getItem('dastak_partner_sound_volume') || '0.8')
    this.repeatCount = parseInt(localStorage.getItem('dastak_partner_sound_repeat') || '2', 10)
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  playOrderChime(onEndCallback) {
    if (!this.enabled) return

    this.stopChime()

    // 1. If Custom Audio is active and file data is available
    if (this.soundType === 'custom' && this.customSoundData) {
      this.playAudioUrl(this.customSoundData, onEndCallback)
      return
    }

    // 2. If Public MP3 Audio Preset is active (Announcement / Warning)
    if (STATIC_SOUNDS[this.soundType]) {
      this.playAudioUrl(STATIC_SOUNDS[this.soundType], onEndCallback)
      return
    }

    // 3. Play Synthesized Preset Tone
    this.playSynthesizedTone(this.soundType || 'default', onEndCallback)
  }

  playAudioUrl(url, onEndCallback) {
    try {
      const audio = new Audio(url)
      audio.volume = Math.min(Math.max(this.volume, 0.05), 1.0)
      this.currentAudioObj = audio
      this.isPlaying = true

      audio.onended = () => {
        this.isPlaying = false
        this.currentAudioObj = null
        if (onEndCallback) onEndCallback()
      }

      audio.onerror = (e) => {
        console.warn('Audio file playback error, falling back to synthesizer:', e)
        this.isPlaying = false
        this.playSynthesizedTone('default', onEndCallback)
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play prevented by browser policy:', err)
          this.isPlaying = false
          if (onEndCallback) onEndCallback()
        })
      }
    } catch (err) {
      console.warn('Failed to load audio file, playing preset tone instead:', err)
      this.playSynthesizedTone('default', onEndCallback)
    }
  }

  playSynthesizedTone(type = 'default', onEndCallback) {
    try {
      this.initContext()
      if (!this.audioCtx) return

      this.isPlaying = true
      const now = this.audioCtx.currentTime
      const vol = Math.min(Math.max(this.volume, 0.05), 1.0)

      if (type === 'buzzer') {
        // Loud Kitchen Buzzer (Two rapid urgent pulses)
        for (let i = 0; i < 2; i++) {
          const startTime = now + i * 0.28
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(440, startTime)
          osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.2)
          gain.gain.setValueAtTime(0.35 * vol, startTime)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22)
          osc.connect(gain)
          gain.connect(this.audioCtx.destination)
          osc.start(startTime)
          osc.stop(startTime + 0.22)
        }
        setTimeout(() => {
          this.isPlaying = false
          if (onEndCallback) onEndCallback()
        }, 600)
      } else if (type === 'digital') {
        // Fast Digital Tri-Tone (High energy chime)
        const notes = [659.25, 880, 1174.66, 1760] // E5, A5, D6, A6
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.1
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = 'square'
          osc.frequency.setValueAtTime(freq, startTime)
          gain.gain.setValueAtTime(0.2 * vol, startTime)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15)
          osc.connect(gain)
          gain.connect(this.audioCtx.destination)
          osc.start(startTime)
          osc.stop(startTime + 0.15)
        })
        setTimeout(() => {
          this.isPlaying = false
          if (onEndCallback) onEndCallback()
        }, 550)
      } else if (type === 'marimba') {
        // Melodic Marimba Chime (Warm, resonant)
        const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.12
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, startTime)
          gain.gain.setValueAtTime(0.4 * vol, startTime)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45)
          osc.connect(gain)
          gain.connect(this.audioCtx.destination)
          osc.start(startTime)
          osc.stop(startTime + 0.45)
        })
        setTimeout(() => {
          this.isPlaying = false
          if (onEndCallback) onEndCallback()
        }, 850)
      } else {
        // Default Crystal Bell (Dual-frequency crisp attention ring)
        const osc1 = this.audioCtx.createOscillator()
        const gain1 = this.audioCtx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(880, now)
        gain1.gain.setValueAtTime(0.3 * vol, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        osc1.connect(gain1)
        gain1.connect(this.audioCtx.destination)
        osc1.start(now)
        osc1.stop(now + 0.35)

        const osc2 = this.audioCtx.createOscillator()
        const gain2 = this.audioCtx.createGain()
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(1318.5, now + 0.12)
        gain2.gain.setValueAtTime(0.4 * vol, now + 0.12)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
        osc2.connect(gain2)
        gain2.connect(this.audioCtx.destination)
        osc2.start(now + 0.12)
        osc2.stop(now + 0.6)

        const osc3 = this.audioCtx.createOscillator()
        const gain3 = this.audioCtx.createGain()
        osc3.type = 'sine'
        osc3.frequency.setValueAtTime(1760, now + 0.25)
        gain3.gain.setValueAtTime(0.35 * vol, now + 0.25)
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
        osc3.connect(gain3)
        gain3.connect(this.audioCtx.destination)
        osc3.start(now + 0.25)
        osc3.stop(now + 0.8)

        setTimeout(() => {
          this.isPlaying = false
          if (onEndCallback) onEndCallback()
        }, 850)
      }
    } catch (e) {
      console.warn('Audio chime playback restricted by browser policy:', e)
      this.isPlaying = false
      if (onEndCallback) onEndCallback()
    }
  }

  stopChime() {
    if (this.currentAudioObj) {
      try {
        this.currentAudioObj.pause()
        this.currentAudioObj.currentTime = 0
      } catch (err) {
        // ignore
      }
      this.currentAudioObj = null
    }
    this.isPlaying = false
  }

  toggleSound(val) {
    this.enabled = typeof val === 'boolean' ? val : !this.enabled
    localStorage.setItem('dastak_partner_sound', String(this.enabled))
    if (this.enabled) {
      this.playOrderChime()
    }
    return this.enabled
  }

  setSoundType(type) {
    this.soundType = type
    localStorage.setItem('dastak_partner_sound_type', type)
    this.playOrderChime()
  }

  setCustomAudio(base64Data, fileName) {
    this.customSoundData = base64Data
    this.customSoundName = fileName
    this.soundType = 'custom'
    localStorage.setItem('dastak_partner_custom_sound', base64Data)
    localStorage.setItem('dastak_partner_custom_sound_name', fileName)
    localStorage.setItem('dastak_partner_sound_type', 'custom')
    this.playOrderChime()
  }

  removeCustomAudio() {
    this.customSoundData = null
    this.customSoundName = ''
    this.soundType = 'default'
    localStorage.removeItem('dastak_partner_custom_sound')
    localStorage.removeItem('dastak_partner_custom_sound_name')
    localStorage.setItem('dastak_partner_sound_type', 'default')
    this.playOrderChime()
  }

  setVolume(vol) {
    const val = parseFloat(vol)
    this.volume = isNaN(val) ? 0.8 : Math.min(Math.max(val, 0.05), 1.0)
    localStorage.setItem('dastak_partner_sound_volume', String(this.volume))
  }

  setRepeatCount(count) {
    this.repeatCount = parseInt(count, 10) || 1
    localStorage.setItem('dastak_partner_sound_repeat', String(this.repeatCount))
  }

  getSettings() {
    return {
      enabled: this.enabled,
      soundType: this.soundType,
      customSoundName: this.customSoundName,
      hasCustomSound: Boolean(this.customSoundData),
      volume: this.volume,
      repeatCount: this.repeatCount,
      isPlaying: this.isPlaying,
    }
  }

  isSoundEnabled() {
    return this.enabled
  }
}

export const soundAlert = new SoundAlertManager()
export default soundAlert

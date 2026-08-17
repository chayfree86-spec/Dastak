/**
 * Browser Speech Recognition Helper for Hindi/English voice search
 */
export class SpeechSearchListener {
  constructor(onResult, onError, onEnd) {
    this.onResult = onResult
    this.onError = onError
    this.onEnd = onEnd
    this.recognition = null

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = 'hi-IN' // Default to Indian Hindi / Hinglish

      this.recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || ''
        if (this.onResult) this.onResult(transcript)
      }

      this.recognition.onerror = (event) => {
        if (this.onError) this.onError(event.error)
      }

      this.recognition.onend = () => {
        if (this.onEnd) this.onEnd()
      }
    }
  }

  isSupported() {
    return Boolean(this.recognition)
  }

  start() {
    if (!this.recognition) {
      if (this.onError) this.onError('Speech recognition not supported in this browser.')
      return
    }
    try {
      this.recognition.start()
    } catch (e) {
      console.warn('Speech start error:', e)
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch (e) {}
    }
  }
}

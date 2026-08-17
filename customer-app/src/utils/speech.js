/**
 * Browser Speech Recognition Helper for Hindi/English voice search
 * Supports live interim results, automatic language detection (hi-IN / en-IN), and fallback
 */
export class SpeechSearchListener {
  constructor(onResult, onError, onEnd, lang = 'hi-IN', onInterim = null) {
    this.onResult = onResult
    this.onError = onError
    this.onEnd = onEnd
    this.onInterim = onInterim
    this.recognition = null
    this.lang = lang

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true // Enable live real-time speech preview
      this.recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN'
      this.recognition.maxAlternatives = 1

      this.recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        if (interimTranscript && this.onInterim) {
          this.onInterim(interimTranscript)
        }

        if (finalTranscript) {
          if (this.onResult) this.onResult(finalTranscript)
        }
      }

      this.recognition.onerror = (event) => {
        if (this.onError) this.onError(event.error || 'error')
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

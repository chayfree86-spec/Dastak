import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, RefreshCw, Keyboard, Volume2, Sparkles, AudioWaveform } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { SpeechSearchListener } from '../../utils/speech'
import { useLanguage } from '../../context/LanguageContext'

export const VoiceSearchModal = ({ isOpen, onClose, onSearch, onTypeInstead }) => {
  const { t, lang } = useLanguage()
  const [status, setStatus] = useState('listening') // 'listening' | 'error' | 'unsupported'
  const [errorMessage, setErrorMessage] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const listenerRef = useRef(null)

  const quickPrompts = [
    '2 cup Chai',
    'Chicken Biryani',
    'Paneer Butter Masala',
    'Cheese Burger',
    'Gulab Jamun',
  ]

  useEffect(() => {
    if (!isOpen) return

    setStatus('listening')
    setErrorMessage('')
    setLiveTranscript('')

    const listener = new SpeechSearchListener(
      (transcript) => {
        if (transcript && transcript.trim()) {
          setLiveTranscript(transcript.trim())
          setTimeout(() => {
            onSearch(transcript.trim())
            onClose()
          }, 400)
        } else {
          setStatus('error')
          setErrorMessage(t.voiceNotHeard || (lang === 'hi' ? 'आवाज़ सुनाई नहीं दी' : 'Could not hear anything'))
        }
      },
      (err) => {
        console.warn('Voice recognition error:', err)
        setStatus('error')
        setErrorMessage(t.voiceNotHeard || (lang === 'hi' ? 'आवाज़ स्पष्ट नहीं थी, कृपया पुनः प्रयास करें' : 'Could not hear clearly, please retry'))
      },
      () => {
        // onEnd
      },
      lang,
      (interim) => {
        setLiveTranscript(interim)
      }
    )

    listenerRef.current = listener

    if (!listener.isSupported()) {
      setStatus('unsupported')
      setErrorMessage(
        lang === 'hi'
          ? 'इस ब्राउज़र में वॉयस सर्च उपलब्ध नहीं है। कृपया नीचे दिए गए बटन से टाइप करके खोजें।'
          : 'Voice search is not supported in this browser. Please type your search.'
      )
      return
    }

    listener.start()

    return () => {
      listener.stop()
    }
  }, [isOpen, onSearch, onClose, t, lang])

  const handleRetry = () => {
    setStatus('listening')
    setErrorMessage('')
    setLiveTranscript('')
    if (listenerRef.current) {
      listenerRef.current.start()
    }
  }

  const handlePromptClick = (promptText) => {
    if (listenerRef.current) {
      listenerRef.current.stop()
    }
    onSearch(promptText)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'hi' ? 'बोलकर खोजें (Voice Search)' : 'Voice Search'}
      maxWidth="max-w-sm"
    >
      <div className="text-center py-4 space-y-5">
        {/* Animated Microphone Icon with Orange Pulse Rings */}
        <div className="relative inline-flex items-center justify-center">
          {status === 'listening' && (
            <>
              <span className="absolute w-24 h-24 rounded-full bg-[#FF5200]/25 animate-ping" />
              <span className="absolute w-32 h-32 rounded-full bg-[#FF5200]/15 animate-pulse" />
            </>
          )}

          <div
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-[#FF5200] to-[#EA580C] scale-110 shadow-orange-500/40'
                : 'bg-slate-400 dark:bg-slate-700'
            }`}
          >
            {status === 'listening' ? (
              <Mic className="w-9 h-9 animate-bounce" />
            ) : (
              <MicOff className="w-9 h-9 text-slate-200" />
            )}
          </div>
        </div>

        {/* Real-Time Live Transcript Preview or Status */}
        <div className="space-y-1.5 min-h-[50px] flex flex-col justify-center">
          {liveTranscript ? (
            <div className="p-3 rounded-2xl bg-orange-50 dark:bg-slate-800/80 border border-orange-200 dark:border-orange-900/50">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                {lang === 'hi' ? 'सुनाई दे रहा है:' : 'Hearing:'}
              </span>
              <p className="text-base font-black text-[#FF5200] dark:text-orange-400 animate-pulse">
                "{liveTranscript}"
              </p>
            </div>
          ) : (
            <>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {status === 'listening'
                  ? lang === 'hi'
                    ? 'सुन रहे हैं... बोलिए'
                    : 'Listening... Speak now'
                  : errorMessage || (lang === 'hi' ? 'आवाज़ सुनाई नहीं दी' : 'Could not hear anything')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {status === 'listening'
                  ? lang === 'hi'
                    ? 'उदा. "2 कप चाय", "चिकन बिरयानी", "पनीर पिज्जा"'
                    : 'e.g. "2 cup chai", "biryani", "burger"'
                  : lang === 'hi'
                  ? 'दोबारा बोलने के लिए पुनः प्रयास पर टैप करें'
                  : 'Tap retry to speak again'}
              </p>
            </>
          )}
        </div>

        {/* Quick Voice Suggestions Chips */}
        {status === 'listening' && (
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {lang === 'hi' ? 'या इनमे से चुनें:' : 'Or tap to search:'}
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(item)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-[#FF5200] dark:hover:text-orange-400 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {status === 'error' && (
            <Button
              variant="primary"
              size="md"
              icon={RefreshCw}
              onClick={handleRetry}
              className="text-xs font-bold"
            >
              {lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            icon={Keyboard}
            onClick={() => {
              onClose()
              if (onTypeInstead) onTypeInstead()
            }}
            className="text-xs font-bold"
          >
            {lang === 'hi' ? 'टाइप करके खोजें' : 'Type Instead'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default VoiceSearchModal

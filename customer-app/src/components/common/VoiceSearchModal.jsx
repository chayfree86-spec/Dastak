import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, RefreshCw, Keyboard, Sparkles, Volume2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { SpeechSearchListener } from '../../utils/speech'
import { useLanguage } from '../../context/LanguageContext'

export const VoiceSearchModal = ({ isOpen, onClose, onSearch, onTypeInstead }) => {
  const { t, lang } = useLanguage()
  const [status, setStatus] = useState('listening') // 'listening' | 'error' | 'unsupported'
  const [errorMessage, setErrorMessage] = useState('')
  const listenerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    setStatus('listening')
    setErrorMessage('')

    const listener = new SpeechSearchListener(
      (transcript) => {
        if (transcript && transcript.trim()) {
          onSearch(transcript.trim())
          onClose()
        } else {
          setStatus('error')
          setErrorMessage(t.voiceNotHeard)
        }
      },
      (err) => {
        console.warn('Voice recognition error:', err)
        setStatus('error')
        setErrorMessage(t.voiceNotHeard)
      },
      () => {
        // onEnd
      }
    )

    listenerRef.current = listener

    if (!listener.isSupported()) {
      setStatus('unsupported')
      setErrorMessage(lang === 'hi' ? 'इस ब्राउज़र में वॉयस सर्च उपलब्ध नहीं है। कृपया टाइप करके खोजें।' : 'Voice search is not supported in this browser. Please type your search.')
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
    if (listenerRef.current) {
      listenerRef.current.start()
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.voiceSearchTitle}
      maxWidth="max-w-sm"
    >
      <div className="text-center py-4 space-y-6">
        {/* Animated Microphone Icon */}
        <div className="relative inline-flex items-center justify-center">
          {status === 'listening' && (
            <>
              <span className="absolute w-24 h-24 rounded-full bg-[#2845D6]/20 animate-pulse-ring" />
              <span className="absolute w-32 h-32 rounded-full bg-[#F97316]/15 animate-ping" />
            </>
          )}

          <div
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-[#2845D6] to-[#F97316] scale-110'
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

        {/* Status Text & Hints */}
        <div className="space-y-1.5">
          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
            {status === 'listening' ? t.voiceListening : errorMessage || t.voiceNotHeard}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {status === 'listening' ? t.voiceHint : (lang === 'hi' ? 'दोबारा बोलने के लिए पुनः प्रयास पर टैप करें' : 'Tap retry to speak again')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {status === 'error' && (
            <Button
              variant="accent"
              size="md"
              icon={RefreshCw}
              onClick={handleRetry}
              className="text-xs font-bold"
            >
              {t.voiceRetry}
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            icon={Keyboard}
            onClick={() => {
              onClose()
              if (onTypeInstead) onTypeInstead()
            }}
            className="text-xs font-bold"
          >
            {t.voiceTypeText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default VoiceSearchModal

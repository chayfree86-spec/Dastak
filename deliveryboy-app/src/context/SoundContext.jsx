import React, { createContext, useContext, useState, useEffect } from 'react'
import soundAlert from '../utils/soundAlert'

const SoundContext = createContext(null)

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('dastak_delivery_sound')
    return saved !== null ? saved === 'true' : true
  })

  useEffect(() => {
    localStorage.setItem('dastak_delivery_sound', String(soundEnabled))
  }, [soundEnabled])

  const toggleSound = () => {
    soundAlert.initContext()
    setSoundEnabled((prev) => !prev)
  }

  const playAlert = () => {
    if (soundEnabled) {
      soundAlert.playOrderTone()
    }
  }

  const startAlert = () => {
    if (soundEnabled) {
      soundAlert.startContinuousAlert()
    }
  }

  const stopAlert = () => {
    soundAlert.stopAlert()
  }

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playAlert,
        startAlert,
        stopAlert,
      }}
    >
      {children}
    </SoundContext.Provider>
  )
}

export const useSound = () => {
  const context = useContext(SoundContext)
  if (!context) throw new Error('useSound must be used within SoundProvider')
  return context
}

export default SoundProvider

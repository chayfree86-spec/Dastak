import React, { createContext, useContext, useState, useEffect } from 'react'
import { soundAlert } from '../utils/soundAlert'

const SoundContext = createContext(null)

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(soundAlert.isSoundEnabled())

  const toggleSound = () => {
    const next = soundAlert.toggleSound()
    setSoundEnabled(next)
  }

  const playChime = () => {
    soundAlert.playOrderChime()
  }

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playChime }}>
      {children}
    </SoundContext.Provider>
  )
}

export const useSound = () => {
  const context = useContext(SoundContext)
  if (!context) throw new Error('useSound must be used within SoundProvider')
  return context
}

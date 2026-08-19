import React, { createContext, useContext, useState, useEffect } from 'react'
import { soundAlert } from '../utils/soundAlert'

const SoundContext = createContext(null)

export const SoundProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => soundAlert.getSettings())
  const [isPlaying, setIsPlaying] = useState(false)

  const refreshSettings = () => {
    setSettings(soundAlert.getSettings())
  }

  const toggleSound = (val) => {
    const next = soundAlert.toggleSound(val)
    refreshSettings()
    return next
  }

  const playChime = () => {
    setIsPlaying(true)
    soundAlert.playOrderChime(() => {
      setIsPlaying(false)
    })
  }

  const stopChime = () => {
    soundAlert.stopChime()
    setIsPlaying(false)
  }

  const setSoundType = (type) => {
    soundAlert.setSoundType(type)
    refreshSettings()
  }

  const setCustomAudio = (base64Data, fileName) => {
    soundAlert.setCustomAudio(base64Data, fileName)
    refreshSettings()
  }

  const removeCustomAudio = () => {
    soundAlert.removeCustomAudio()
    refreshSettings()
  }

  const setVolume = (vol) => {
    soundAlert.setVolume(vol)
    refreshSettings()
  }

  const setRepeatCount = (count) => {
    soundAlert.setRepeatCount(count)
    refreshSettings()
  }

  return (
    <SoundContext.Provider
      value={{
        soundEnabled: settings.enabled,
        soundType: settings.soundType,
        customSoundName: settings.customSoundName,
        hasCustomSound: settings.hasCustomSound,
        volume: settings.volume,
        repeatCount: settings.repeatCount,
        isPlaying,
        toggleSound,
        playChime,
        stopChime,
        setSoundType,
        setCustomAudio,
        removeCustomAudio,
        setVolume,
        setRepeatCount,
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

export default SoundContext

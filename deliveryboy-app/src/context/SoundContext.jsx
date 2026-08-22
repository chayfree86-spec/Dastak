import React, { createContext, useContext, useState, useEffect } from 'react'
import soundAlert from '../utils/soundAlert'

const SoundContext = createContext(null)

export const SOUND_PRESETS = [
  { id: 'chime', name: 'Royal Chime', desc: 'Harmonic 3-tone chime (Default)' },
  { id: 'radar', name: 'Urgent Radar', desc: 'High-tempo double pulse for traffic' },
  { id: 'siren', name: 'Digital Siren', desc: 'Frequency sweep alert' },
  { id: 'bell', name: 'Crystal Bell', desc: 'Desk bell resonance' },
  { id: 'subtle', name: 'Gentle Ping', desc: 'Minimal soft notification' },
]

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('dastak_delivery_sound')
    return saved !== null ? saved === 'true' : true
  })

  const [soundPreset, setSoundPresetState] = useState(() => {
    return localStorage.getItem('dastak_sound_preset') || 'chime'
  })

  const [customAudioData, setCustomAudioData] = useState(() => {
    return localStorage.getItem('dastak_custom_sound_data') || null
  })

  const [customAudioName, setCustomAudioName] = useState(() => {
    return localStorage.getItem('dastak_custom_sound_name') || null
  })

  useEffect(() => {
    localStorage.setItem('dastak_delivery_sound', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('dastak_sound_preset', soundPreset)
  }, [soundPreset])

  const setSoundPreset = (preset) => {
    soundAlert.initContext()
    setSoundPresetState(preset)
    // Play preview of the selected preset
    if (preset === 'custom' && customAudioData) {
      soundAlert.playCustomAudio(customAudioData)
    } else {
      soundAlert.playPresetTone(preset)
    }
  }

  const setCustomAudio = (dataUrl, fileName) => {
    soundAlert.initContext()
    setCustomAudioData(dataUrl)
    setCustomAudioName(fileName)
    setSoundPresetState('custom')
    localStorage.setItem('dastak_custom_sound_data', dataUrl)
    localStorage.setItem('dastak_custom_sound_name', fileName)
    localStorage.setItem('dastak_sound_preset', 'custom')
    // Play preview
    soundAlert.playCustomAudio(dataUrl)
  }

  const removeCustomAudio = () => {
    setCustomAudioData(null)
    setCustomAudioName(null)
    setSoundPresetState('chime')
    localStorage.removeItem('dastak_custom_sound_data')
    localStorage.removeItem('dastak_custom_sound_name')
    localStorage.setItem('dastak_sound_preset', 'chime')
    soundAlert.playPresetTone('chime')
  }

  const toggleSound = () => {
    soundAlert.initContext()
    setSoundEnabled((prev) => !prev)
  }

  const playAlert = (overridePreset, overrideCustomAudio) => {
    if (!soundEnabled) return
    const activePreset = overridePreset || soundPreset
    const activeCustom =
      overrideCustomAudio !== undefined
        ? overrideCustomAudio
        : activePreset === 'custom'
        ? customAudioData
        : null

    soundAlert.playAlert(activePreset, activeCustom)
  }

  const playPreview = (presetId) => {
    soundAlert.initContext()
    if (presetId === 'custom') {
      if (customAudioData) {
        soundAlert.playCustomAudio(customAudioData)
      }
    } else {
      soundAlert.playPresetTone(presetId)
    }
  }

  const startAlert = () => {
    if (!soundEnabled) return
    const activeCustom = soundPreset === 'custom' ? customAudioData : null
    soundAlert.startContinuousAlert(soundPreset, activeCustom)
  }

  const stopAlert = () => {
    soundAlert.stopAlert()
  }

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        soundPreset,
        customAudioData,
        customAudioName,
        setSoundPreset,
        setCustomAudio,
        removeCustomAudio,
        toggleSound,
        playAlert,
        playPreview,
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

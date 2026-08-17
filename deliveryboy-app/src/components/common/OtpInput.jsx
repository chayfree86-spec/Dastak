import React, { useRef } from 'react'

export const OtpInput = ({ length = 4, value = '', onChange }) => {
  const inputRefs = useRef([])

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (!val) {
      const otpArr = value.split('')
      otpArr[index] = ''
      onChange(otpArr.join(''))
      return
    }

    const char = val[val.length - 1]
    const otpArr = (value + '    ').substring(0, length).split('')
    otpArr[index] = char
    const nextVal = otpArr.join('').trim()
    onChange(nextVal)

    // Auto-focus next input
    if (index < length - 1 && char) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 my-2">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          autoFocus={index === 0}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2845D6] dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-xs"
        />
      ))}
    </div>
  )
}

export default OtpInput

import React, { useRef } from 'react'
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react'

export const ImageUpload = ({
  label,
  value,
  onChange,
  onRemove,
  error,
  helperText,
  accept = 'image/png, image/jpeg, image/webp',
  maxSizeMB = 5,
  className = '',
}) => {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File size exceeds ${maxSizeMB}MB`)
        return
      }
      onChange(file)
    }
  }

  const previewUrl = typeof value === 'string' ? value : value ? URL.createObjectURL(value) : null

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</label>}

      {previewUrl ? (
        <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold shadow-sm transition-colors"
            >
              Change
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-36 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#2845D6] dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col items-center justify-center p-4 cursor-pointer text-center ${
            error ? 'border-rose-400 bg-rose-50/20' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2845D6] dark:text-blue-400 flex items-center justify-center mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Click to upload image
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG or WEBP (Max {maxSizeMB}MB)</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  )
}

export default ImageUpload

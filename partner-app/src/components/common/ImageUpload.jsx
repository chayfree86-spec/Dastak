import React, { useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export const ImageUpload = ({
  label,
  value,
  onChange,
  error,
  helperText = 'Upload item photo (JPEG/PNG/WebP, max 5MB)',
  className = '',
}) => {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewUrl = value
    ? typeof value === 'string'
      ? value
      : URL.createObjectURL(value)
    : null

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">{label}</label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          previewUrl
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900'
            : 'border-slate-200 dark:border-slate-700 hover:border-[#2845D6] dark:hover:border-blue-500 bg-slate-50/30 dark:bg-slate-900/60 hover:bg-blue-50/20 dark:hover:bg-slate-800'
        } ${error ? 'border-rose-300 dark:border-rose-500' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative group w-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-28 w-auto max-w-full object-cover rounded-xl shadow-xs"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 py-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Click to browse <span className="text-[#2845D6] dark:text-blue-400 font-bold">image</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
    </div>
  )
}

export default ImageUpload

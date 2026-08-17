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
        <label className="block text-xs font-bold text-slate-700">{label}</label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          previewUrl
            ? 'border-slate-300 bg-slate-50/50'
            : 'border-slate-200 hover:border-[#2845D6] bg-slate-50/30 hover:bg-blue-50/20'
        } ${error ? 'border-rose-300' : ''}`}
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
              className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 py-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2845D6] flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Click to upload photo</p>
            <p className="text-[11px] text-slate-400">{helperText}</p>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
    </div>
  )
}

export default ImageUpload

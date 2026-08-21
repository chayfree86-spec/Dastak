import React, { useRef, useMemo, useEffect, useState } from 'react'
import { UploadCloud, X, Image as ImageIcon, Loader2, Globe, FolderOpen } from 'lucide-react'
import { compressImage } from '../../utils/imageCompressor'

export const ImageUpload = ({
  label,
  value,
  onChange,
  onRemove,
  onOpenWebSearch,
  error,
  helperText = 'Upload dish photo or search web (JPEG/PNG/WebP, max 10MB)',
  accept = 'image/png, image/jpeg, image/webp',
  maxSizeMB = 10,
  className = '',
}) => {
  const fileInputRef = useRef(null)
  const [compressing, setCompressing] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File size exceeds ${maxSizeMB}MB`)
        return
      }
      setCompressing(true)
      try {
        const optimized = await compressImage(file)
        onChange(optimized)
      } catch (err) {
        onChange(file)
      } finally {
        setCompressing(false)
      }
    }
  }

  const handleClear = (e) => {
    e?.stopPropagation?.()
    if (onRemove) {
      onRemove()
    } else {
      onChange(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewUrl = useMemo(() => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (value instanceof Blob || value instanceof File) {
      return URL.createObjectURL(value)
    }
    return null
  }, [value])

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {label && <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</label>}
        {onOpenWebSearch && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenWebSearch()
            }}
            className="h-7 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#113BD0] dark:text-blue-400" />
            <span>Search Web Images</span>
          </button>
        )}
      </div>

      {previewUrl ? (
        <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Change File
            </button>
            {onOpenWebSearch && (
              <button
                type="button"
                onClick={onOpenWebSearch}
                className="px-3 py-1.5 rounded-lg bg-[#113BD0] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Globe className="w-3 h-3" />
                <span>Search Web</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center justify-center p-4 text-center transition-colors ${
            error ? 'border-rose-400 bg-rose-50/20' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 flex items-center justify-center mb-2">
            <ImageIcon className="w-5 h-5" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-slate-500" />
              <span>Upload File</span>
            </button>

            {onOpenWebSearch && (
              <button
                type="button"
                onClick={onOpenWebSearch}
                className="h-9 px-3.5 rounded-xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Search Web</span>
              </button>
            )}
          </div>

          <span className="text-[10px] text-slate-400">{helperText}</span>
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
    </div>
  )
}

export default ImageUpload

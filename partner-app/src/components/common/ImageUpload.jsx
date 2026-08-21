import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Sparkles, FolderOpen } from 'lucide-react'
import { compressImage } from '../../utils/imageCompressor'

export const ImageUpload = ({
  label,
  value,
  onChange,
  onOpenWebSearch,
  error,
  helperText = 'Upload dish photo or search web (JPEG/PNG/WebP, max 10MB)',
  className = '',
}) => {
  const fileInputRef = useRef(null)
  const [compressing, setCompressing] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
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
    e.stopPropagation()
    onChange(null)
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
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        {onOpenWebSearch && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenWebSearch()
            }}
            className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-900/30 dark:to-indigo-900/30 text-[#113BD0] dark:text-blue-300 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-200 dark:border-blue-800 text-[11px] font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#113BD0] dark:text-blue-400" />
            <span>Search Web Images</span>
          </button>
        )}
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
          previewUrl
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/60'
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
              className="h-32 w-auto max-w-full object-cover rounded-xl shadow-xs"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition-colors"
              >
                Change File
              </button>
              {onOpenWebSearch && (
                <button
                  type="button"
                  onClick={onOpenWebSearch}
                  className="px-3 py-1 rounded-lg bg-[#113BD0] text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Search Web</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1 right-1 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md z-10"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-2 w-full">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 flex items-center justify-center mx-auto">
              <ImageIcon className="w-5 h-5" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
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
                  className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#113BD0] to-[#1E3A8A] hover:from-[#0E2FA8] hover:to-[#172554] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Search Web</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
    </div>
  )
}

export default ImageUpload

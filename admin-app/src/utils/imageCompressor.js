/**
 * Client-side image compressor using HTML5 Canvas.
 * Automatically resizes & compresses high-res camera/web images down to crisp ~100-250KB WebP/JPEG files.
 * Ensures instant uploads even on slow or throttled (e.g. Fast 4G) connections.
 */
export const compressImage = async (
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = {}
) => {
  if (!file || !(file instanceof File || file instanceof Blob)) return file
  // Skip SVGs or non-image types
  if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Scale down proportionally if larger than maximum bounds
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Use JPEG/WebP for efficient compression
      const outputType = file.type === 'image/png' ? 'image/jpeg' : (file.type || 'image/jpeg')

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          // If original is already smaller than 300KB, use original
          if (blob.size >= file.size && file.size < 300 * 1024) {
            resolve(file)
            return
          }
          const baseName = (file.name || 'image').replace(/\.[^/.]+$/, '')
          const ext = outputType === 'image/jpeg' ? '.jpg' : '.webp'
          const compressedFile = new File([blob], `${baseName}${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

export default compressImage

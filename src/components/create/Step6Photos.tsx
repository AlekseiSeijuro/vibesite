'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useCreateSiteStore } from '@/store/createSiteStore'
import Button from '@/components/ui/Button'
import { ArrowLeft, Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface UploadedPhoto {
  id: string
  url: string
  preview: string
  uploading: boolean
  error?: string
}

export default function Step6Photos() {
  const { formData, updateFormData, prevStep, websiteId, setWebsiteId } =
    useCreateSiteStore()
  const router = useRouter()
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formDataObj = new FormData()
    formDataObj.append('file', file)
    if (websiteId) formDataObj.append('websiteId', websiteId)

    const res = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formDataObj,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Ошибка загрузки')
    }

    const data = await res.json()
    return data.url
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = 10 - photos.length
      const filesToProcess = acceptedFiles.slice(0, remaining)

      const newPhotos: UploadedPhoto[] = filesToProcess.map((file) => ({
        id: Math.random().toString(36).slice(2),
        url: '',
        preview: URL.createObjectURL(file),
        uploading: true,
      }))

      setPhotos((prev) => [...prev, ...newPhotos])

      // Загружаем параллельно
      await Promise.all(
        filesToProcess.map(async (file, i) => {
          const photoId = newPhotos[i].id
          try {
            const url = await uploadFile(file)
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photoId ? { ...p, url: url!, uploading: false } : p
              )
            )
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Ошибка загрузки'
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photoId
                  ? { ...p, uploading: false, error: message }
                  : p
              )
            )
            toast.error(`Не удалось загрузить ${file.name}`)
          }
        })
      )
    },
    [photos.length, websiteId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: photos.length >= 10,
    onDropRejected: (files) => {
      files.forEach((f) => {
        if (f.errors[0]?.code === 'file-too-large') {
          toast.error(`${f.file.name}: файл больше 10 МБ`)
        } else {
          toast.error(`${f.file.name}: неподдерживаемый формат`)
        }
      })
    },
  })

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id)
      if (photo?.preview) URL.revokeObjectURL(photo.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSubmit = async () => {
    const uploadedUrls = photos.filter((p) => p.url && !p.error).map((p) => p.url)

    if (photos.some((p) => p.uploading)) {
      toast.error('Дождитесь завершения загрузки фотографий')
      return
    }

    setSubmitting(true)

    try {
      const finalFormData = { ...formData, photo_urls: uploadedUrls }
      updateFormData({ photo_urls: uploadedUrls })

      // Сохраняем/создаём сайт в БД и запускаем генерацию
      const res = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: finalFormData, websiteId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Ошибка генерации')
      }

      const data = await res.json()
      toast.success('Сайт успешно создан!')
      router.push(`/dashboard/preview/${data.websiteId}`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка'
      toast.error(message)
      setSubmitting(false)
    }
  }

  const hasUploading = photos.some((p) => p.uploading)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Фотографии работ</h2>
      <p className="text-gray-500 text-sm mb-6">
        Загрузите 5–10 фото — ИИ подберёт цвета и оформление под ваши работы.
        Можно пропустить и добавить позже.
      </p>

      {/* Dropzone */}
      {photos.length < 10 && (
        <div
          {...getRootProps()}
          className={cn(
            'w-full p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors mb-4',
            isDragActive
              ? 'border-brand-400 bg-brand-50'
              : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">
            {isDragActive ? 'Отпустите файлы' : 'Перетащите фото или нажмите для выбора'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPEG, PNG, WebP — до 10 МБ каждый. Максимум {10 - photos.length} фото.
          </p>
        </div>
      )}

      {/* Превью загруженных фото */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={photo.preview}
                alt=""
                className={cn(
                  'w-full h-full object-cover',
                  photo.uploading && 'opacity-50'
                )}
              />

              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}

              {photo.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                  <span className="text-xs text-red-700 font-medium px-1 text-center">
                    Ошибка
                  </span>
                </div>
              )}

              {!photo.uploading && (
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-100 mb-6">
          <ImageIcon className="h-4 w-4 text-yellow-500 shrink-0" />
          <p className="text-xs text-yellow-700">
            Без фото сайт будет создан с заглушками — вы сможете добавить их позже
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={prevStep} disabled={submitting}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={hasUploading}
          className="flex-1"
        >
          {submitting ? 'Генерируем сайт...' : '✨ Создать сайт'}
        </Button>
      </div>
    </div>
  )
}

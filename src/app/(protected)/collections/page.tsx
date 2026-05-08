'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getUserCollections,
  createCollection,
  deleteCollection,
  addMovieToCollection,
  updateCollection,
} from '@/lib/firebase/collections'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Plus, Trash2, FolderOpen, Lock, Globe, ImagePlus } from 'lucide-react'
import type { CollectionDoc } from '@/types'

export default function CollectionsPage() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<(CollectionDoc & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!user) return
    const data = await getUserCollections(user.uid)
    setCollections(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return
    setCreating(true)
    try {
      let coverUrl = ''
      if (coverFile) {
        const storageRef = ref(storage, `collections/${user.uid}/${Date.now()}_${coverFile.name}`)
        await uploadBytes(storageRef, coverFile)
        coverUrl = await getDownloadURL(storageRef)
      }
      await createCollection(user.uid, { title: title.trim(), description, coverUrl, isPublic })
      setShowCreate(false)
      setTitle('')
      setDescription('')
      setIsPublic(false)
      setCoverFile(null)
      setCoverPreview(null)
      load()
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Удалить коллекцию?')) return
    setCollections((prev) => prev.filter((c) => c._id !== id))
    await deleteCollection(user.uid, id)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Коллекции</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Создать
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-zinc-500">
          <FolderOpen className="w-12 h-12 opacity-30" />
          <p className="text-sm">У вас пока нет коллекций</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div
              key={col._id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all hover:-translate-y-0.5"
            >
              {/* Cover */}
              <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                {col.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={col.coverUrl} alt={col.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-10 h-10 text-zinc-600" />
                  </div>
                )}
                {/* Delete overlay */}
                <button
                  onClick={() => handleDelete(col._id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-100 line-clamp-1">{col.title}</h3>
                  {col.isPublic ? (
                    <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                </div>
                {col.description && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{col.description}</p>
                )}
                <p className="text-xs text-zinc-600 mt-2">{col.movies?.length ?? 0} фильмов</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новая коллекция" size="md">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Cover upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-violet-500 cursor-pointer transition-colors flex items-center justify-center overflow-hidden"
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs">Добавить обложку</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

          <Input
            placeholder="Название коллекции *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            placeholder="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsPublic((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-violet-600' : 'bg-zinc-700'} relative`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-zinc-300">Публичная коллекция</span>
          </label>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button type="submit" loading={creating} disabled={!title.trim()}>Создать</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

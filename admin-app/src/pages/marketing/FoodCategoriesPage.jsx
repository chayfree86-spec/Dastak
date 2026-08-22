import React, { useState, useEffect } from 'react'
import {
  PlusCircle,
  Edit2,
  Trash2,
  ImageOff,
  UtensilsCrossed,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react'
import foodCategoriesApi from '../../api/foodCategories.api'
import apiClient from '../../api/client'
import { useApi } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Switch from '../../components/common/Switch'
import ImageUpload from '../../components/common/ImageUpload'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

const Thumb = ({ src }) => (
  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <ImageOff className="w-4 h-4 text-slate-400" />
    )}
  </div>
)

export const FoodCategoriesPage = () => {
  const toast = useToast()
  const { data: serverCategories, loading, retry } = useApi(
    () => foodCategoriesApi.getCategories(),
    [],
    { initialData: [] }
  )

  const [categoriesList, setCategoriesList] = useState([])
  const [modal, setModal] = useState(null) // { category } | {}
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Sync server categories into local ordered list
  useEffect(() => {
    if (Array.isArray(serverCategories)) {
      const sorted = [...serverCategories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setCategoriesList(sorted)
    }
  }, [serverCategories])

  const saveNewOrder = async (updatedList) => {
    setIsSavingOrder(true)
    try {
      const orders = updatedList.map((cat, idx) => ({
        id: cat.id,
        sort_order: idx + 1,
      }))

      if (typeof foodCategoriesApi?.reorderCategories === 'function') {
        await foodCategoriesApi.reorderCategories(orders)
      } else {
        await apiClient.post('/admin/marketing/food-categories/reorder', { orders })
      }

      toast.success('Sequence Saved', 'Category order updated and synced with customer app!')
      retry()
    } catch (err) {
      toast.error('Reorder Failed', err.message || 'Unable to update position order.')
      retry()
    } finally {
      setIsSavingOrder(false)
    }
  }

  // Move category Up (▲)
  const handleMoveUp = (index) => {
    if (index <= 0) return
    const updated = [...categoriesList]
    const [moved] = updated.splice(index, 1)
    updated.splice(index - 1, 0, moved)
    setCategoriesList(updated)
    saveNewOrder(updated)
  }

  // Move category Down (▼)
  const handleMoveDown = (index) => {
    if (index >= categoriesList.length - 1) return
    const updated = [...categoriesList]
    const [moved] = updated.splice(index, 1)
    updated.splice(index + 1, 0, moved)
    setCategoriesList(updated)
    saveNewOrder(updated)
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = [...categoriesList]
    const [moved] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, moved)

    setCategoriesList(updated)
    setDraggedIndex(null)
    setDragOverIndex(null)
    saveNewOrder(updated)
  }

  const handleToggle = async (cat) => {
    try {
      await foodCategoriesApi.toggleStatus(cat.id, !cat.is_active)
      toast.success(
        cat.is_active ? 'Category Hidden' : 'Category Active',
        `"${cat.name}" is now ${cat.is_active ? 'hidden from' : 'visible on'} the customer app.`
      )
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update status.')
    }
  }

  const handleDelete = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      await foodCategoriesApi.deleteCategory(confirm.id)
      toast.success('Deleted', 'Food category removed.')
      setConfirm(null)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to delete.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Food Categories & Positioning
            </h1>
            {isSavingOrder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#113BD0] dark:bg-blue-950 dark:text-blue-400 animate-pulse">
                Saving Order...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag, reorder, or use position buttons. Exactly this sequence is reflected on Customer Home screen chips.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={PlusCircle}
          onClick={() => setModal({})}
          className="shrink-0 font-black text-xs"
        >
          Add Category
        </Button>
      </div>

      {/* Info Tip Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#113BD0] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
            <strong>Custom Positioning Live:</strong> Position <strong>#1</strong> appears first on customer app horizontal category pills. Drag any card or use <strong>▲ / ▼</strong> buttons to re-rank.
          </p>
        </div>
        <span className="text-[11px] font-bold text-[#113BD0] dark:text-blue-400 shrink-0 hidden sm:block">
          {categoriesList.length} Categories
        </span>
      </div>

      {/* Category List with Drag-and-Drop & Move Controls */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
        {categoriesList.length === 0 && !loading && (
          <div className="p-12 text-center space-y-2">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-black text-slate-700 dark:text-slate-300">No categories found</p>
            <p className="text-xs text-slate-400">Click "Add Category" to create your first food chip.</p>
          </div>
        )}

        {categoriesList.map((cat, index) => {
          const isDragging = draggedIndex === index
          const isOver = dragOverIndex === index

          return (
            <div
              key={cat.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all select-none ${
                isDragging
                  ? 'opacity-40 bg-blue-50/50 dark:bg-blue-950/30 scale-[0.99]'
                  : isOver
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-t-2 border-b-2 border-[#113BD0]'
                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-750/50'
              }`}
            >
              {/* Left Details & Grip */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Drag Handle & Position Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing transition-colors"
                    title="Drag to reposition"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-xs text-[#113BD0] dark:text-blue-400 shrink-0 shadow-2xs">
                    #{index + 1}
                  </div>
                </div>

                <Thumb src={cat.image} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </h5>
                    {!cat.is_active && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono text-slate-500 dark:text-slate-400">/{cat.slug}</span>
                    {cat.search_query && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        search: {cat.search_query}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Reorder Buttons & Status Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                {/* Step Up / Down Positioning Buttons */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:text-[#113BD0] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Move Position Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === categoriesList.length - 1}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:text-[#113BD0] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Move Position Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                {/* Active / Hidden Switch */}
                <Switch
                  checked={cat.is_active}
                  onChange={() => handleToggle(cat)}
                  label={cat.is_active ? 'Active' : 'Hidden'}
                />

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => setModal({ category: cat })}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#113BD0] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setConfirm({ id: cat.id, label: cat.name })}
                  className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modal && (
        <CategoryModal
          category={modal.category}
          totalCount={categoriesList.length}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            retry()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={busy}
        type="danger"
        title="Delete Category?"
        message={`Remove "${confirm?.label}" from the customer home screen? This cannot be undone.`}
        confirmText="Yes, Delete"
      />
    </div>
  )
}

const CategoryModal = ({ category, totalCount = 0, onClose, onSaved }) => {
  const toast = useToast()
  const isEdit = !!category
  const [name, setName] = useState(category?.name || '')
  const [searchQuery, setSearchQuery] = useState(category?.search_query || '')
  const [sortOrder, setSortOrder] = useState(
    category?.sort_order != null ? String(category.sort_order) : String(totalCount + 1)
  )
  const [isActive, setIsActive] = useState(category ? category.is_active : true)
  const [image, setImage] = useState(category?.image || null)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e?.preventDefault()
    if (!name.trim()) {
      toast.warning('Name required', 'Please enter a category name.')
      return
    }
    setLoading(true)
    try {
      let imageUrl = typeof image === 'string' ? image : null
      if (image && typeof image !== 'string') {
        const res = await foodCategoriesApi.uploadImage(image)
        imageUrl = res?.data?.url || res?.url
      }
      const payload = {
        name: name.trim(),
        search_query: searchQuery.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
        image: imageUrl,
      }
      if (isEdit) {
        await foodCategoriesApi.updateCategory(category.id, payload)
        toast.success('Updated', 'Category updated successfully.')
      } else {
        await foodCategoriesApi.createCategory(payload)
        toast.success('Created', 'Category created successfully.')
      }
      onSaved()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save category.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Food Category' : 'Add Food Category'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Category Name"
          required
          placeholder="e.g. Biryani, Burgers & Rolls"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Search Keywords"
            placeholder="e.g. paneer, dal, sabzi"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            helperText="Matching keywords for customer filter"
          />
          <Input
            label="Position / Sort Rank (#)"
            type="number"
            min="1"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            helperText="1 = First chip on Home"
          />
        </div>
        <ImageUpload
          label="Category Icon"
          value={image}
          onChange={setImage}
          onRemove={() => setImage(null)}
          helperText="Upload custom image/icon for the category chip."
        />
        <div className="pt-1">
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label={isActive ? 'Active (visible to customers)' : 'Hidden'}
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Category
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default FoodCategoriesPage

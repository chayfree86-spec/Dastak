import React, { useState } from 'react'
import { PlusCircle, Edit2, Trash2, ImageOff, UtensilsCrossed, GripVertical } from 'lucide-react'
import foodCategoriesApi from '../../api/foodCategories.api'
import { useApi } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Switch from '../../components/common/Switch'
import ImageUpload from '../../components/common/ImageUpload'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

const Thumb = ({ src }) => (
  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
    {src ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" /> : <ImageOff className="w-4 h-4 text-slate-400" />}
  </div>
)

export const FoodCategoriesPage = () => {
  const toast = useToast()
  const { data: categories, loading, retry } = useApi(() => foodCategoriesApi.getCategories(), [], { initialData: [] })

  const [modal, setModal] = useState(null) // { category } | {}
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const list = categories || []

  const handleToggle = async (cat) => {
    try {
      await foodCategoriesApi.toggleStatus(cat.id, !cat.is_active)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Food Categories</h1>
          <p className="text-xs text-slate-400 mt-0.5">Category chips shown on the customer home screen. Drives the taxonomy — no hardcoded list.</p>
        </div>
        <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setModal({})}>Add Category</Button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60">
        {list.length === 0 && !loading && (
          <div className="p-10 text-center">
            <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No categories yet</p>
            <p className="text-xs text-slate-400 mt-1">Add one to populate the customer home screen.</p>
          </div>
        )}

        {list.map((cat) => (
          <div key={cat.id} className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <Thumb src={cat.image} />
              <div className="min-w-0">
                <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{cat.name}</h5>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-mono">/{cat.slug}</span>
                  {cat.search_query && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">search: {cat.search_query}</span>}
                  <span>#{cat.sort_order}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Switch checked={cat.is_active} onChange={() => handleToggle(cat)} label={cat.is_active ? 'Active' : 'Hidden'} />
              <button type="button" onClick={() => setModal({ category: cat })} className="p-1.5 rounded-lg text-slate-400 hover:text-[#113BD0] hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setConfirm({ id: cat.id, label: cat.name })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <CategoryModal
          category={modal.category}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); retry() }}
        />
      )}

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

const CategoryModal = ({ category, onClose, onSaved }) => {
  const toast = useToast()
  const isEdit = !!category
  const [name, setName] = useState(category?.name || '')
  const [searchQuery, setSearchQuery] = useState(category?.search_query || '')
  const [sortOrder, setSortOrder] = useState(category?.sort_order != null ? String(category.sort_order) : '0')
  const [isActive, setIsActive] = useState(category ? category.is_active : true)
  const [image, setImage] = useState(category?.image || null)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e?.preventDefault()
    if (!name.trim()) { toast.warning('Name required', 'Please enter a category name.'); return }
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
        toast.success('Updated', 'Category updated.')
      } else {
        await foodCategoriesApi.createCategory(payload)
        toast.success('Created', 'Category added.')
      }
      onSaved()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save category.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Food Category' : 'Add Food Category'} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Category Name" required placeholder="e.g. Biryani" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Search Keywords" placeholder="e.g. paneer, dal, sabzi" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} helperText="One or more keywords (space or comma separated). Tapping the chip finds items matching ANY of them." />
          <Input label="Sort Order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <ImageUpload label="Category Icon" value={image} onChange={setImage} onRemove={() => setImage(null)} helperText="Any image — shown as the chip icon." />
        <div className="pt-1">
          <Switch checked={isActive} onChange={setIsActive} label={isActive ? 'Active (visible to customers)' : 'Hidden'} />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}

export default FoodCategoriesPage

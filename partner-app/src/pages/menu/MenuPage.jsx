import React, { useMemo, useState } from 'react'
import {
  PlusCircle,
  Edit2,
  Trash2,
  FolderPlus,
  UtensilsCrossed,
  ImageOff,
  Filter,
  Search,
} from 'lucide-react'
import menuApi from '../../api/menu.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency } from '../../utils/formatters'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import ImageUpload from '../../components/common/ImageUpload'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import ErrorState from '../../components/common/ErrorState'
import { useToast } from '../../context/ToastContext'

/** Square image thumbnail that auto-fits ANY image size/ratio via object-cover */
const Thumb = ({ src, size = 'w-12 h-12', veg }) => (
  <div
    className={`${size} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`}
  >
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <ImageOff className={`w-4 h-4 ${veg ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
    )}
  </div>
)

export const MenuPage = () => {
  const toast = useToast()
  const {
    data: menuTree,
    loading,
    error,
    retry,
  } = useApi(() => menuApi.getMenuTree(), [], { initialData: [] })

  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [subFilter, setSubFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [catModal, setCatModal] = useState(null) // { parentId, category }
  const [itemModal, setItemModal] = useState(null) // { item }
  const [confirm, setConfirm] = useState(null) // { type, id, label }
  const [busy, setBusy] = useState(false)

  const tree = menuTree || []

  // Flatten every item, tagging its owning category
  const allItems = useMemo(() => {
    const rows = []
    tree.forEach((c) => {
      ;(c.items || []).forEach((i) =>
        rows.push({ ...i, catId: c.id, categoryName: c.category || c.name })
      )
      ;(c.subcategories || []).forEach((s) =>
        (s.items || []).forEach((i) =>
          rows.push({
            ...i,
            catId: s.id,
            categoryName: `${c.category || c.name} › ${s.category || s.name}`,
          })
        )
      )
    })
    return rows
  }, [tree])

  // Category filter options (top-level only)
  const categoryFilterOptions = useMemo(
    () => [
      { value: 'ALL', label: 'All Categories' },
      ...tree.map((c) => ({ value: c.id, label: c.category || c.name })),
    ],
    [tree]
  )

  const selectedTop =
    categoryFilter !== 'ALL' ? tree.find((c) => c.id === Number(categoryFilter) || c.id === categoryFilter) : null

  // Sub-category filter options depend on the chosen category
  const subFilterOptions = useMemo(() => {
    if (!selectedTop) return [{ value: 'ALL', label: 'All Sub-categories' }]
    return [
      { value: 'ALL', label: 'All Sub-categories' },
      ...(selectedTop.subcategories || []).map((s) => ({
        value: s.id,
        label: s.category || s.name,
      })),
    ]
  }, [selectedTop])

  // Which category ids match the current category + sub-category filter
  const allowedIds = useMemo(() => {
    if (categoryFilter === 'ALL') return null
    if (subFilter !== 'ALL') return [Number(subFilter), subFilter]
    return [
      selectedTop.id,
      ...(selectedTop.subcategories || []).map((s) => s.id),
    ]
  }, [categoryFilter, subFilter, selectedTop])

  const filteredItems = allItems
    .filter((i) => !allowedIds || allowedIds.includes(i.catId))
    .filter((i) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        i.name.toLowerCase().includes(q) ||
        (i.short_code && i.short_code.toLowerCase().includes(q))
      )
    })

  // Most specific selected category for edit/delete
  const activeCategory = useMemo(() => {
    if (subFilter !== 'ALL' && selectedTop) {
      const sub = (selectedTop.subcategories || []).find(
        (s) => s.id === Number(subFilter) || s.id === subFilter
      )
      return sub ? { ...sub, isSub: true, parent_id: selectedTop.id } : null
    }
    return selectedTop ? { ...selectedTop, isSub: false } : null
  }, [subFilter, selectedTop])

  const onCategoryChange = (val) => {
    setCategoryFilter(val)
    setSubFilter('ALL')
  }

  const handleToggleAvail = async (item) => {
    try {
      await menuApi.toggleAvailability(item.id, !item.is_available)
      toast.success(
        item.is_available ? 'Marked Out of Stock' : 'Marked In Stock',
        `"${item.name}" availability updated.`
      )
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update availability.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      if (confirm.type === 'item') {
        await menuApi.deleteItem(confirm.id)
        toast.success('Deleted', 'Menu item removed.')
      } else {
        await menuApi.deleteCategory(confirm.id)
        toast.success('Deleted', 'Category and its items removed.')
        setCategoryFilter('ALL')
        setSubFilter('ALL')
      }
      setConfirm(null)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to delete.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* 1. Header + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
          Live Menu Catalog
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FolderPlus}
            onClick={() => setCatModal({ parentId: null })}
          >
            Add Category
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setItemModal({})}
            className="shadow-sm"
          >
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* 2. Search + Category + Sub-category filters card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              SEARCH ITEM
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items by name..."
                className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6] transition-all"
              />
            </div>
          </div>

          {/* Filter dropdowns row */}
          <div className="flex flex-wrap items-end gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 pb-2.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter</span>
            </div>
            <div className="w-48">
              <CustomSelect
                label="Category"
                value={categoryFilter}
                onChange={onCategoryChange}
                options={categoryFilterOptions}
              />
            </div>
            <div className="w-48">
              <CustomSelect
                label="Sub-category"
                value={subFilter}
                onChange={setSubFilter}
                options={subFilterOptions}
                disabled={!selectedTop || (selectedTop.subcategories || []).length === 0}
              />
            </div>

            {activeCategory && (
              <div className="flex items-center gap-1 pb-1">
                {!activeCategory.isSub && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={FolderPlus}
                    onClick={() => setCatModal({ parentId: activeCategory.id })}
                  >
                    Sub-category
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCatModal({
                      parentId: activeCategory.parent_id ?? null,
                      category: activeCategory,
                    })
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirm({
                      type: 'category',
                      id: activeCategory.id,
                      label: activeCategory.category || activeCategory.name,
                    })
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Count footer */}
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSkeleton count={5} />}
      {error && <ErrorState title="Error loading menu" message={error} onRetry={retry} />}

      {/* 3. Flat Menu Item List matching Admin Style */}
      {!loading && !error && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 shadow-xs overflow-hidden">
          {filteredItems.length === 0 && (
            <div className="p-10 text-center">
              <UtensilsCrossed className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {search.trim() ? 'No items match your search' : 'No items here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Use “Add Menu Item” to create one.</p>
            </div>
          )}

          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Thumb src={item.image} veg={item.is_veg} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center shrink-0 ${
                        item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </h5>
                    {item.short_code && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-mono text-[9px] font-black tracking-wider uppercase shrink-0">
                        {item.short_code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      {item.categoryName}
                    </span>
                    <span>Prep: {item.prep_time || '15 mins'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.discount_price || item.price)}
                  </span>
                  {item.discount_price && Number(item.discount_price) < Number(item.price) && (
                    <span className="text-[10px] text-slate-400 line-through block">
                      {formatCurrency(item.price)}
                    </span>
                  )}
                </div>

                <span
                  className={`hidden sm:inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border w-24 shrink-0 select-none ${
                    item.is_available
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/30'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {item.is_available ? 'Available' : 'Sold Out'}
                </span>

                <Switch
                  checked={item.is_available}
                  onChange={() => handleToggleAvail(item)}
                />

                <button
                  type="button"
                  onClick={() => setItemModal({ item })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Edit item"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirm({ type: 'item', id: item.id, label: item.name })
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal (Add / Edit Category & Sub-category) */}
      {catModal && (
        <CategoryModal
          parentId={catModal.parentId}
          category={catModal.category}
          parentOptions={tree.map((c) => ({ value: c.id, label: c.category || c.name }))}
          onClose={() => setCatModal(null)}
          onSaved={() => {
            setCatModal(null)
            retry()
          }}
        />
      )}

      {/* Item Modal (Add / Edit Menu Item) */}
      {itemModal && (
        <ItemModal
          tree={tree}
          item={itemModal.item}
          onClose={() => setItemModal(null)}
          onSaved={(keepOpen) => {
            if (!keepOpen) setItemModal(null)
            retry()
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirmDelete}
        loading={busy}
        type="danger"
        title={confirm?.type === 'item' ? 'Delete Item?' : 'Delete Category?'}
        message={
          confirm?.type === 'item'
            ? `Remove "${confirm?.label}" from the menu? This cannot be undone.`
            : `Delete "${confirm?.label}" along with all its items and sub-categories?`
        }
        confirmText="Yes, Delete"
      />
    </div>
  )
}

/** Category Modal */
const CategoryModal = ({ parentId, category, parentOptions, onClose, onSaved }) => {
  const toast = useToast()
  const isEdit = !!category
  const [name, setName] = useState(category?.category || category?.name || '')
  const [parent, setParent] = useState(parentId || 'NONE')
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
        const res = await menuApi.uploadImage(image)
        imageUrl = res?.data?.url || res?.url
      }
      const payload = { name: name.trim(), image: imageUrl }
      if (isEdit) {
        await menuApi.updateCategory(category.id, payload)
        toast.success('Updated', 'Category updated.')
      } else {
        const pid = parent && parent !== 'NONE' ? Number(parent) : undefined
        await menuApi.createCategory({ ...payload, parent_id: pid })
        toast.success('Created', pid ? 'Sub-category added.' : 'Category added.')
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
      title={isEdit ? 'Edit Category' : parentId ? 'Add Sub-Category' : 'Add Category'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Category Name"
          required
          placeholder="e.g. Beverages"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!isEdit && !parentId && (
          <CustomSelect
            label="Parent Category (optional — leave as none for a top category)"
            value={parent}
            onChange={setParent}
            options={[
              { value: 'NONE', label: 'None (Top-level Category)' },
              ...(parentOptions || []),
            ]}
          />
        )}
        <ImageUpload
          label="Category Image (optional)"
          value={image}
          onChange={setImage}
          helperText="Any image — it auto-fits."
        />
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

/** Item Modal (Add / Edit Menu Item with exact Admin features) */
const ItemModal = ({ tree, item, onClose, onSaved }) => {
  const toast = useToast()
  const isEdit = !!item

  // Resolve current category + sub-category from category_id
  const initial = useMemo(() => {
    if (!item) return { cat: tree[0]?.id ?? '', sub: 'NONE' }
    for (const c of tree) {
      if (c.id === item.category_id) return { cat: c.id, sub: 'NONE' }
      const s = (c.subcategories || []).find((x) => x.id === item.category_id)
      if (s) return { cat: c.id, sub: s.id }
    }
    return { cat: tree[0]?.id ?? '', sub: 'NONE' }
  }, [item, tree])

  const [categoryId, setCategoryId] = useState(initial.cat)
  const [subId, setSubId] = useState(initial.sub)
  const [name, setName] = useState(item?.name || '')
  const [shortCode, setShortCode] = useState(item?.short_code || '')
  const [price, setPrice] = useState(String(item?.price || item?.base_price || ''))
  const [discount, setDiscount] = useState(
    item?.discount_price ? String(item.discount_price) : ''
  )
  const [isVeg, setIsVeg] = useState(item?.is_veg ?? true)
  const [prepTime, setPrepTime] = useState(
    item?.prep_time ? String(parseInt(item.prep_time)) : '15'
  )
  const [description, setDescription] = useState(item?.description || '')
  const [image, setImage] = useState(item?.image || null)
  const [loading, setLoading] = useState(false)
  const [lastAdded, setLastAdded] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [lang, setLang] = useState(() => localStorage.getItem('dastak_item_lang') || 'HI')

  const handleLangChange = (newLang) => {
    setLang(newLang)
    localStorage.setItem('dastak_item_lang', newLang)
    setSuggestions([])
  }

  const fetchTransliteration = async (word) => {
    if (!word || word.trim().length === 0) {
      setSuggestions([])
      return
    }
    try {
      const res = await fetch(
        `https://inputtools.google.com/request?text=${encodeURIComponent(
          word
        )}&itc=hi-t-i0-und&num=4&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
      )
      const data = await res.json()
      if (data && data[0] === 'SUCCESS') {
        const candidates = data[1]?.[0]?.[1] || []
        setSuggestions(candidates)
      }
    } catch (err) {
      console.error('Transliteration error', err)
    }
  }

  const handleNameChange = (e) => {
    const val = e.target.value
    setName(val)

    if (lang !== 'HI') return

    const selectionStart = e.target.selectionStart
    const textBeforeCursor = val.substring(0, selectionStart)
    const words = textBeforeCursor.split(/\s+/)
    const lastWord = words[words.length - 1]

    if (/[a-zA-Z]/.test(lastWord)) {
      fetchTransliteration(lastWord)
    } else {
      setSuggestions([])
    }
  }

  const applySuggestion = (sug) => {
    const input = document.getElementById('item-name-input')
    if (!input) return

    const val = name
    const selectionStart = input.selectionStart
    const textBeforeCursor = val.substring(0, selectionStart)
    const textAfterCursor = val.substring(selectionStart)

    const words = textBeforeCursor.split(/\s+/)
    words[words.length - 1] = sug

    const newTextBefore = words.join(' ') + ' '
    setName(newTextBefore + textAfterCursor)
    setSuggestions([])

    setTimeout(() => {
      input.focus()
      input.setSelectionRange(newTextBefore.length, newTextBefore.length)
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (lang !== 'HI') return
    if (e.key === ' ' || e.keyCode === 32) {
      if (suggestions.length > 0) {
        e.preventDefault()
        applySuggestion(suggestions[0])
      }
    }
  }

  const categoryOptions = tree.map((c) => ({
    value: c.id,
    label: c.category || c.name,
  }))
  const currentCat = tree.find(
    (c) => c.id === Number(categoryId) || c.id === categoryId
  )
  const subOptions = [
    { value: 'NONE', label: 'None (directly under category)' },
    ...((currentCat?.subcategories || []).map((s) => ({
      value: s.id,
      label: s.category || s.name,
    }))),
  ]

  const onCategoryChange = (val) => {
    setCategoryId(val)
    setSubId('NONE')
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    if (!name.trim()) {
      toast.warning('Name required', 'Please enter an item name.')
      return
    }
    const targetCategoryId =
      subId && subId !== 'NONE' ? Number(subId) : Number(categoryId)
    if (!targetCategoryId) {
      toast.warning('Category required', 'Please add / select a category first.')
      return
    }
    if (!price) {
      toast.warning('Price required', 'Please enter a price.')
      return
    }

    setLoading(true)
    try {
      let imageUrl = typeof image === 'string' ? image : null
      if (image && typeof image !== 'string') {
        const res = await menuApi.uploadImage(image)
        imageUrl = res?.data?.url || res?.url
      }
      const payload = {
        name: name.trim(),
        category_id: targetCategoryId,
        price: Number(price),
        discount_price: discount ? Number(discount) : null,
        is_veg: isVeg,
        prep_time: prepTime ? Number(prepTime) : null,
        description: description || null,
        image: imageUrl,
        short_code: shortCode.trim() || null,
      }

      if (isEdit) {
        await menuApi.updateItem(item.id, payload)
        toast.success('Updated', `${name} updated.`)
        onSaved(false)
      } else {
        await menuApi.createItem(payload)
        toast.success('Added', `${name} added to menu.`)
        setLastAdded({ name: name.trim(), price: price, shortCode: shortCode.trim() })
        // Clear fields to keep modal open for fast entry
        setName('')
        setShortCode('')
        setPrice('')
        setDiscount('')
        setDescription('')
        setImage(null)
        onSaved(true)
      }
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save item.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Menu Item' : 'Add Menu Item'}
      subtitle="Item image is shown to customers and delivery partners."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {lastAdded && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Last Item Added:</span>{' '}
              {lastAdded.name} ({formatCurrency(lastAdded.price)})
              {lastAdded.shortCode && (
                <span className="ml-1.5 font-mono font-bold bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded text-[10px]">
                  #{lastAdded.shortCode}
                </span>
              )}
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Success
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between h-6 mb-1.5">
              <label
                htmlFor="item-name-input"
                className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"
              >
                Item Name <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => handleLangChange('EN')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                    lang === 'EN'
                      ? 'bg-[#2845D6] text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-300 hover:text-slate-800'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('HI')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                    lang === 'HI'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-300 hover:text-slate-800'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
            <Input
              id="item-name-input"
              required
              placeholder={lang === 'HI' ? 'उदा: बादाम टी' : 'e.g. Badam Tea'}
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {lang === 'HI' && suggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mr-1 select-none">
                  Suggestions:
                </span>
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySuggestion(sug)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-[#2845D6] hover:text-white border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
                  >
                    {sug}
                  </button>
                ))}
                <span className="text-[9px] text-slate-400 select-none ml-auto hidden sm:inline">
                  (Space to insert first)
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center h-6 mb-1.5">
              <label
                htmlFor="item-short-code-input"
                className="text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Short Code
              </label>
            </div>
            <Input
              id="item-short-code-input"
              placeholder="e.g. MC01"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomSelect
            label="Category"
            value={categoryId}
            onChange={onCategoryChange}
            options={categoryOptions}
          />
          <CustomSelect
            label="Sub-category"
            value={subId}
            onChange={setSubId}
            options={subOptions}
            disabled={(currentCat?.subcategories || []).length === 0}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AmountInput
            label="Price (₹)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <AmountInput
            label="Discount Price (₹)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <Input
            label="Prep Time (mins)"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
          />
        </div>

        <Input
          label="Description (optional)"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <ImageUpload
          label="Item Image"
          value={image}
          onChange={setImage}
          helperText="Any size/format — auto-fits everywhere."
        />

        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Food Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsVeg(true)}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                isVeg
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </span>
              Vegetarian (Veg)
            </button>
            <button
              type="button"
              onClick={() => setIsVeg(false)}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                !isVeg
                  ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 ring-2 ring-rose-600/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              </span>
              Non-Vegetarian (Non-Veg)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel / Close
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="shadow-sm">
            Save Item
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default MenuPage

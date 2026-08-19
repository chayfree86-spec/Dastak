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
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
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
const Thumb = ({ src, size = 'w-16 h-16 sm:w-20 sm:h-20', veg }) => (
  <div
    className={`${size} rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs`}
  >
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <UtensilsCrossed
          className={`w-6 h-6 ${
            veg ? 'text-emerald-500/70' : 'text-rose-500/70'
          }`}
        />
      </div>
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
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false)
  const [inStockOnlyFilter, setInStockOnlyFilter] = useState(false)

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
        rows.push({
          ...i,
          catId: c.id,
          parentCatId: c.id,
          categoryName: c.category || c.name,
        })
      )
      ;(c.subcategories || []).forEach((s) =>
        (s.items || []).forEach((i) =>
          rows.push({
            ...i,
            catId: s.id,
            parentCatId: c.id,
            categoryName: `${c.category || c.name} › ${s.category || s.name}`,
          })
        )
      )
    })
    return rows
  }, [tree])

  // Category filter dropdown options
  const categoryFilterOptions = useMemo(
    () => [
      { value: 'ALL', label: `All Categories (${allItems.length})` },
      ...tree.map((c) => {
        const catCount = allItems.filter(
          (i) => i.parentCatId === c.id || i.catId === c.id
        ).length
        return {
          value: c.id,
          label: `${c.category || c.name} (${catCount})`,
        }
      }),
    ],
    [tree, allItems]
  )

  const selectedCategoryObj = useMemo(() => {
    if (categoryFilter === 'ALL') return null
    return tree.find((c) => c.id === Number(categoryFilter) || c.id === categoryFilter)
  }, [categoryFilter, tree])

  // Sub-category filter dropdown options
  const subFilterOptions = useMemo(() => {
    if (!selectedCategoryObj) return [{ value: 'ALL', label: 'All Sub-categories' }]
    return [
      { value: 'ALL', label: 'All Sub-categories' },
      ...(selectedCategoryObj.subcategories || []).map((s) => {
        const subCount = allItems.filter((i) => i.catId === s.id).length
        return {
          value: s.id,
          label: `${s.category || s.name} (${subCount})`,
        }
      }),
    ]
  }, [selectedCategoryObj, allItems])

  // Filtered items based on Category, Subcategory, Search, Veg-only, In-Stock
  const filteredItems = useMemo(() => {
    return allItems
      .filter((i) => {
        if (categoryFilter === 'ALL') return true
        if (subFilter !== 'ALL') {
          return i.catId === Number(subFilter) || i.catId === subFilter
        }
        if (selectedCategoryObj) {
          const subIds = (selectedCategoryObj.subcategories || []).map((s) => s.id)
          return (
            i.catId === selectedCategoryObj.id ||
            i.parentCatId === selectedCategoryObj.id ||
            subIds.includes(i.catId)
          )
        }
        return i.catId === Number(categoryFilter) || i.catId === categoryFilter
      })
      .filter((i) => {
        if (vegOnlyFilter && !i.is_veg) return false
        if (inStockOnlyFilter && !i.is_available) return false
        return true
      })
      .filter((i) => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return (
          i.name.toLowerCase().includes(q) ||
          (i.short_code && i.short_code.toLowerCase().includes(q)) ||
          (i.categoryName && i.categoryName.toLowerCase().includes(q))
        )
      })
  }, [allItems, categoryFilter, subFilter, selectedCategoryObj, vegOnlyFilter, inStockOnlyFilter, search])

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
    <div className="space-y-4 sm:space-y-5 w-full pb-8">
      {/* 1. Mobile-First Header & Fast Action CTAs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Menu Catalog
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
              Manage items, prices, and live kitchen availability.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0 border border-slate-200/80 dark:border-slate-700 select-none">
            {allItems.length} {allItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* 2 Fast Action Buttons (48px Touch-friendly) */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={() => setCatModal({ parentId: null })}
            className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer select-none"
          >
            <FolderPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>+ Category</span>
          </button>

          <button
            type="button"
            onClick={() => setItemModal({})}
            className="h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* 2. Proper Dropdown Lists on Top & Search Bar Below */}
      <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3">
        {/* Row A: Category & Subcategory Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <CustomSelect
              label="Category"
              value={categoryFilter}
              onChange={onCategoryChange}
              options={categoryFilterOptions}
            />
          </div>
          <div>
            <CustomSelect
              label="Sub-category"
              value={subFilter}
              onChange={setSubFilter}
              options={subFilterOptions}
              disabled={!selectedCategoryObj || (selectedCategoryObj.subcategories || []).length === 0}
            />
          </div>
        </div>

        {/* Row B: Search Bar below Dropdowns with Veg & Stock filter chips */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items by name, code or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#2845D6] focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Veg & Stock Filter Chips */}
          <div className="flex items-center justify-between gap-2 select-none flex-wrap">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Showing {filteredItems.length} of {allItems.length} items
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVegOnlyFilter((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  vegOnlyFilter
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-xs border border-emerald-600 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-emerald-600" />
                </span>
                <span>Veg Only</span>
              </button>

              <button
                type="button"
                onClick={() => setInStockOnlyFilter((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  inStockOnlyFilter
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>In Stock</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState title="Error loading menu" message={error} onRetry={retry} />}

      {/* 4. Mobile Menu Items List / Grid */}
      {!loading && !error && (
        <div className="space-y-3 sm:space-y-4">
          {filteredItems.length === 0 && (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <UtensilsCrossed className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {search.trim() ? 'No items match your search' : 'No items in this category'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Tap “+ Add Item” to create a new dish.</p>
            </div>
          )}

          {filteredItems.map((item) => {
            const isVeg = item.is_veg !== false
            const hasDiscount =
              item.discount_price && Number(item.discount_price) < Number(item.price)

            return (
              <div
                key={item.id}
                className={`rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between ${
                  !item.is_available
                    ? 'border-slate-200/80 dark:border-slate-700/80 opacity-90'
                    : 'border-slate-200/90 dark:border-slate-700'
                }`}
              >
                {/* Item Body: Thumb + Info + Price */}
                <div className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <Thumb src={item.image} veg={isVeg} />

                    <div className="min-w-0 space-y-1">
                      {/* Veg indicator & Title */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center shrink-0 ${
                            isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>

                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                          {item.name}
                        </h4>

                        {item.short_code && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-mono text-[9px] font-black uppercase shrink-0">
                            #{item.short_code}
                          </span>
                        )}
                      </div>

                      {/* Category Pill & Prep Time */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                          {item.categoryName}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.prep_time || 15}m prep
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Highlighted Price */}
                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {formatCurrency(item.discount_price || item.price)}
                    </div>
                    {hasDiscount && (
                      <span className="text-[11px] text-slate-400 line-through block">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer: Quick Availability Switch & Edit/Delete buttons */}
                <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                  {/* Left: Quick In-Stock Switch with large touch area */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[36px]">
                    <Switch
                      checked={item.is_available}
                      onChange={() => handleToggleAvail(item)}
                    />
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        item.is_available
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </label>

                  {/* Right: Edit & Delete Action Buttons (Icon-only square 40x40 touch-friendly) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemModal({ item })}
                      className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 flex items-center justify-center shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all select-none cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({ type: 'item', id: item.id, label: item.name })
                      }
                      className="h-10 w-10 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 transition-all select-none cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
          placeholder="e.g. Beverages / Chai"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!isEdit && !parentId && (
          <CustomSelect
            label="Parent Category (optional)"
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
          helperText="Any image — auto-fits."
        />
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-98 transition-all"
          >
            {loading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Item Modal (Add / Edit Menu Item) */
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
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Last Added:</span>{' '}
              {lastAdded.name} ({formatCurrency(lastAdded.price)})
              {lastAdded.shortCode && (
                <span className="ml-1.5 font-mono font-bold bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded text-[10px]">
                  #{lastAdded.shortCode}
                </span>
              )}
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Added
            </span>
          </div>
        )}

        {/* Row 1: Item Name & Short Code */}
        <div className="space-y-3">
          <div>
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
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700 shadow-xs">
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
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Category & Sub-category (2 Columns on mobile) */}
        <div className="grid grid-cols-2 gap-2.5">
          <CustomSelect
            label="Category *"
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

        {/* Row 3: Price & Discount Price (2 Columns on mobile) */}
        <div className="grid grid-cols-2 gap-2.5">
          <AmountInput
            label="Price (₹) *"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <AmountInput
            label="Discount Price (₹)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>

        {/* Row 4: Prep Time & Short Code (2 Columns on mobile) */}
        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Prep Time (mins)"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
          />
          <Input
            label="Short Code"
            id="item-short-code-input"
            placeholder="e.g. MC01"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
          />
        </div>

        {/* Row 5: Food Type (Veg / Non-Veg - 2 Columns) */}
        <div className="space-y-1.5 pt-0.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Food Type</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsVeg(true)}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-xs font-bold transition-all ${
                isVeg
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setIsVeg(false)}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-xs font-bold transition-all ${
                !isVeg
                  ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 ring-2 ring-rose-600/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              </span>
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Row 6: Description */}
        <Input
          label="Description (optional)"
          placeholder="Brief dish description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Row 7: Item Image Upload */}
        <ImageUpload
          label="Item Image (optional)"
          value={image}
          onChange={setImage}
          helperText="Auto-fits everywhere."
        />

        {/* Row 8: Action Buttons (Sticky/Clean 48px touch buttons) */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Item' : 'Save Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default MenuPage

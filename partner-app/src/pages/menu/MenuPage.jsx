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
import WebImageSearchModal from '../../components/common/WebImageSearchModal'
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
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        loading="eager"
        fetchpriority="high"
        decoding="async"
      />
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
      { value: 'ALL', label: `All Categories (${tree.length})` },
      ...tree.map((c) => {
        const catCount = allItems.filter(
          (i) => i.parentCatId === c.id || i.catId === c.id
        ).length
        return {
          value: c.id,
          label: `${c.category || c.name} (${catCount} ${catCount === 1 ? 'item' : 'items'})`,
        }
      }),
    ],
    [tree, allItems]
  )

  const selectedCategoryObj = useMemo(() => {
    if (categoryFilter === 'ALL') return null
    return tree.find((c) => c.id === Number(categoryFilter) || c.id === categoryFilter)
  }, [categoryFilter, tree])

  // Active subcategory object if selected
  const activeSubObj = useMemo(() => {
    if (subFilter === 'ALL') return null
    for (const cat of tree) {
      const sub = (cat.subcategories || []).find((s) => s.id === Number(subFilter) || s.id === subFilter)
      if (sub) return { ...sub, parent_id: cat.id, parent_name: cat.category || cat.name }
    }
    return null
  }, [subFilter, tree])

  // Sub-category filter dropdown options
  const subFilterOptions = useMemo(() => {
    if (!selectedCategoryObj) {
      const allSubs = []
      tree.forEach((c) => {
        (c.subcategories || []).forEach((s) => {
          const subCount = allItems.filter((i) => i.catId === s.id).length
          allSubs.push({
            value: s.id,
            label: `${s.category || s.name} (${c.category || c.name}) (${subCount} ${subCount === 1 ? 'item' : 'items'})`,
          })
        })
      })
      return [{ value: 'ALL', label: `All Sub-categories (${allSubs.length})` }, ...allSubs]
    }
    return [
      { value: 'ALL', label: `All Sub-categories (${(selectedCategoryObj.subcategories || []).length})` },
      ...(selectedCategoryObj.subcategories || []).map((s) => {
        const subCount = allItems.filter((i) => i.catId === s.id).length
        return {
          value: s.id,
          label: `${s.category || s.name} (${subCount} ${subCount === 1 ? 'item' : 'items'})`,
        }
      }),
    ]
  }, [selectedCategoryObj, tree, allItems])

  // Filtered items based on Category, Subcategory, Search, Veg-only, In-Stock
  const filteredItems = useMemo(() => {
    return allItems
      .filter((i) => {
        if (subFilter !== 'ALL') {
          return i.catId === Number(subFilter) || i.catId === subFilter
        }
        if (categoryFilter !== 'ALL' && selectedCategoryObj) {
          const subIds = (selectedCategoryObj.subcategories || []).map((s) => s.id)
          return (
            i.catId === selectedCategoryObj.id ||
            i.parentCatId === selectedCategoryObj.id ||
            subIds.includes(i.catId)
          )
        }
        return true
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

  const [manageCatsModal, setManageCatsModal] = useState(false)

  const handleToggleCategoryActive = async (categoryId, currentStatus) => {
    try {
      await menuApi.updateCategory(categoryId, { is_active: !currentStatus })
      toast.success(
        !currentStatus ? 'Category Activated' : 'Category Hidden',
        'Category visibility updated.'
      )
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update category status.')
    }
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
      {/* 1. Header & Actions Bar (Unified Row 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Menu Catalog
            </h2>
            <span className="px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200/80 dark:border-slate-700 select-none">
              {filteredItems.length === allItems.length
                ? `${allItems.length} Items`
                : `${filteredItems.length} of ${allItems.length} Items`}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
            Manage items, prices, categories, and live kitchen stock availability.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setManageCatsModal(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer select-none"
            title="View all categories, active/deactive and subcategory trees"
          >
            <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Manage Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setCatModal({ parentId: null })}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer select-none"
            title="Create a new top-level category"
          >
            <FolderPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>+ Category</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setCatModal({
                parentId: selectedCategoryObj?.id || tree[0]?.id || null,
              })
            }
            className="h-10 px-3 rounded-xl border border-blue-200 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 text-[#113BD0] dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer select-none"
            title="Create a new sub-category"
          >
            <FolderPlus className="w-4 h-4 text-[#113BD0] dark:text-blue-400" />
            <span>+ Sub-category</span>
          </button>

          <button
            type="button"
            onClick={() => setItemModal({})}
            className="h-10 px-4 rounded-xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Compact Filter & Search Toolbar (Unified Row 2) */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, code or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#113BD0] focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown + Category Action Buttons (Edit / Delete / +Sub) */}
        <div className="flex items-center gap-1 w-full md:w-auto">
          <div className="w-full md:w-44 lg:w-52 shrink-0">
            <CustomSelect
              value={categoryFilter}
              onChange={onCategoryChange}
              options={categoryFilterOptions}
              placeholder="All Categories"
            />
          </div>

          {/* Quick Edit/Delete/+Sub for active Category */}
          {selectedCategoryObj && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setCatModal({ parentId: selectedCategoryObj.id })}
                className="h-10 px-2 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer select-none"
                title={`Add Sub-category inside ${selectedCategoryObj.category || selectedCategoryObj.name}`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">+ Sub</span>
              </button>

              <button
                type="button"
                onClick={() => setCatModal({ parentId: null, category: selectedCategoryObj })}
                className="h-10 w-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#113BD0] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer select-none"
                title={`Edit Category "${selectedCategoryObj.category || selectedCategoryObj.name}"`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirm({
                    type: 'category',
                    id: selectedCategoryObj.id,
                    label: selectedCategoryObj.category || selectedCategoryObj.name,
                  })
                }
                className="h-10 w-8.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer select-none"
                title={`Delete Category "${selectedCategoryObj.category || selectedCategoryObj.name}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Sub-category Dropdown + Sub-category Actions (Edit / Delete) */}
        <div className="flex items-center gap-1 w-full md:w-auto">
          <div className="w-full md:w-40 lg:w-48 shrink-0">
            <CustomSelect
              value={subFilter}
              onChange={setSubFilter}
              options={subFilterOptions}
              placeholder="All Sub-categories"
              disabled={subFilterOptions.length <= 1}
            />
          </div>

          {/* Quick Edit/Delete for active Sub-category */}
          {activeSubObj && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setCatModal({
                    parentId: activeSubObj.parent_id,
                    category: activeSubObj,
                  })
                }
                className="h-10 w-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#113BD0] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer select-none"
                title={`Edit Sub-category "${activeSubObj.category || activeSubObj.name}"`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirm({
                    type: 'category',
                    id: activeSubObj.id,
                    label: activeSubObj.category || activeSubObj.name,
                  })
                }
                className="h-10 w-8.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer select-none"
                title={`Delete Sub-category "${activeSubObj.category || activeSubObj.name}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Filter Chips (Veg & In Stock) */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setVegOnlyFilter((prev) => !prev)}
            className={`h-10 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shrink-0 ${
              vegOnlyFilter
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
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
            className={`h-10 flex items-center gap-1 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shrink-0 ${
              inStockOnlyFilter
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>In Stock</span>
          </button>

          {(search || categoryFilter !== 'ALL' || subFilter !== 'ALL' || vegOnlyFilter || inStockOnlyFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategoryFilter('ALL')
                setSubFilter('ALL')
                setVegOnlyFilter(false)
                setInStockOnlyFilter(false)
              }}
              className="h-10 px-2.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState title="Error loading menu" message={error} onRetry={retry} />}

      {/* 4. Menu Items Responsive Grid (1 col on mobile/PWA, 2 on tablet, 3 on desktop, 4 on wide) */}
      {!loading && !error && (
        <div>
          {filteredItems.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <UtensilsCrossed className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {search.trim() ? 'No items match your search' : 'No items in this category'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Tap “+ Add Item” to create a new dish.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const isVeg = item.is_veg !== false
                const hasDiscount =
                  item.discount_price && Number(item.discount_price) < Number(item.price)

                const formattedPrepTime = item.prep_time
                  ? (typeof item.prep_time === 'string' && item.prep_time.includes('min')
                      ? item.prep_time
                      : `${parseInt(item.prep_time)} mins`)
                  : '15 mins'

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between ${
                      !item.is_available
                        ? 'border-slate-200/80 dark:border-slate-700/80 opacity-90'
                        : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Item Body: Thumb + Info + Price */}
                    <div className="p-3.5 sm:p-4 flex items-start gap-3 flex-1">
                      {/* Thumbnail */}
                      <Thumb src={item.image} veg={isVeg} size="w-16 h-16 sm:w-18 sm:h-18" />

                      {/* Details & Price */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between h-full space-y-1">
                        <div>
                          {/* Veg indicator, Title & Short Code */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
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

                              <h4
                                className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate"
                                title={item.name}
                              >
                                {item.name}
                              </h4>
                            </div>

                            {item.short_code && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-mono text-[9px] font-bold uppercase shrink-0">
                                #{item.short_code}
                              </span>
                            )}
                          </div>

                          {/* Category Pill & Prep Time */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                              {item.categoryName}
                            </span>
                            <span className="flex items-center gap-0.5 font-medium shrink-0">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formattedPrepTime}
                            </span>
                          </div>

                          {/* Description */}
                          {item.description && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 pt-1.5">
                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {formatCurrency(item.discount_price || item.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer: Quick Availability Switch & Edit/Delete buttons */}
                    <div className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                      {/* Quick In-Stock Switch */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Switch
                          checked={item.is_available}
                          onChange={() => handleToggleAvail(item)}
                        />
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            item.is_available
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {item.is_available ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </label>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setItemModal({ item })}
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all select-none cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({ type: 'item', id: item.id, label: item.name })
                          }
                          className="h-8 w-8 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 transition-all select-none cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Category Manager Modal (Hierarchical View of All Categories & Subcategories) */}
      {manageCatsModal && (
        <CategoryManagerModal
          tree={tree}
          allItems={allItems}
          onClose={() => setManageCatsModal(false)}
          onAddCategory={() => setCatModal({ parentId: null })}
          onAddSubCategory={(parentId) => setCatModal({ parentId })}
          onEditCategory={(parentId, category) => setCatModal({ parentId, category })}
          onDeleteCategory={(id, label) => setConfirm({ type: 'category', id, label })}
          onToggleActive={handleToggleCategoryActive}
        />
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

/** Category Manager Modal (Full Tree & Toggle/Edit/Delete in one view) */
const CategoryManagerModal = ({
  tree = [],
  allItems = [],
  onClose,
  onAddCategory,
  onAddSubCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleActive,
}) => {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Manage Categories & Sub-categories"
      subtitle="View, toggle active status, add sub-categories, edit or delete categories."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {tree.length} {tree.length === 1 ? 'Category' : 'Categories'} Total
          </span>
          <button
            type="button"
            onClick={onAddCategory}
            className="h-8 px-3 rounded-lg bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New Category</span>
          </button>
        </div>

        {tree.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No categories found</p>
            <button
              type="button"
              onClick={onAddCategory}
              className="mt-2 text-xs font-bold text-[#113BD0] hover:underline"
            >
              + Create your first category
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {tree.map((cat) => {
              const catItemCount = allItems.filter(
                (i) => i.parentCatId === cat.id || i.catId === cat.id
              ).length
              const subcategories = cat.subcategories || []

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs"
                >
                  {/* Category Header Row */}
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-blue-200/60 dark:border-blue-800/40">
                        {cat.image ? (
                          <img src={cat.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {cat.category || cat.name}
                          </h4>
                          {cat.is_active === false && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>{catItemCount} items</span>
                          <span>•</span>
                          <span>{subcategories.length} sub-categories</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none" title="Toggle active / hidden status">
                        <Switch
                          checked={cat.is_active !== false}
                          onChange={() => onToggleActive(cat.id, cat.is_active !== false)}
                        />
                        <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                          {cat.is_active !== false ? 'Active' : 'Hidden'}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => onAddSubCategory(cat.id)}
                        className="h-8 px-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Add Sub-category"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">+ Sub</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditCategory(null, cat)}
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#113BD0] hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id, cat.category || cat.name)}
                        className="h-8 w-8 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-categories List */}
                  {subcategories.length > 0 && (
                    <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60">
                      {subcategories.map((sub) => {
                        const subItemCount = allItems.filter((i) => i.catId === sub.id).length
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 pl-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/40 gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-300 dark:text-slate-600 font-mono text-xs select-none">↳</span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {sub.category || sub.name}
                              </span>
                              {sub.is_active === false && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase">
                                  Hidden
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                                {subItemCount} items
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <Switch
                                  checked={sub.is_active !== false}
                                  onChange={() => onToggleActive(sub.id, sub.is_active !== false)}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => onEditCategory(cat.id, sub)}
                                className="h-7 w-7 rounded-lg text-slate-500 hover:text-[#113BD0] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
                                title="Edit Sub-category"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteCategory(sub.id, sub.category || sub.name)}
                                className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all cursor-pointer"
                                title="Delete Sub-category"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

/** Category Modal */
const CategoryModal = ({ parentId, category, parentOptions, onClose, onSaved }) => {
  const toast = useToast()
  const isEdit = !!category
  const isSubCategory = isEdit ? !!category.parent_id : !!parentId
  const [name, setName] = useState(category?.category || category?.name || '')
  const [parent, setParent] = useState(parentId || category?.parent_id || 'NONE')
  const [image, setImage] = useState(category?.image || null)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e?.preventDefault()
    if (!name.trim()) {
      toast.warning('Name required', 'Please enter a name.')
      return
    }
    setLoading(true)
    try {
      let imageUrl = typeof image === 'string' ? image : null
      if (image && typeof image !== 'string') {
        const res = await menuApi.uploadImage(image)
        imageUrl = res?.data?.data?.url || res?.data?.url || res?.url || null
      }
      const pid = parent && parent !== 'NONE' ? Number(parent) : null
      const payload = { name: name.trim(), image: imageUrl, parent_id: pid }
      if (isEdit) {
        await menuApi.updateCategory(category.id, payload)
        toast.success('Updated', `${isSubCategory ? 'Sub-category' : 'Category'} updated.`)
      } else {
        await menuApi.createCategory(payload)
        toast.success('Created', pid ? 'Sub-category added.' : 'Category added.')
      }
      onSaved()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save category.')
    } finally {
      setLoading(false)
    }
  }

  const modalTitle = isEdit
    ? (isSubCategory ? 'Edit Sub-Category' : 'Edit Category')
    : (parentId ? 'Add Sub-Category' : 'Add Category')

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      subtitle={isSubCategory ? 'Sub-categories help group items under a main category.' : 'Top-level department for your menu items.'}
      maxWidth="max-w-md"
      zIndex="z-[10005]"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label={isSubCategory ? 'Sub-Category Name' : 'Category Name'}
          required
          placeholder={isSubCategory ? 'e.g. Kadak Chai, Cold Coffee' : 'e.g. Beverages, Fast Food'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <CustomSelect
          label="Parent Category (optional for sub-grouping)"
          value={parent}
          onChange={setParent}
          options={[
            { value: 'NONE', label: 'None (Top-level Category)' },
            ...(parentOptions || []),
          ]}
        />
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
            className="h-11 sm:h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-11 sm:h-12 rounded-xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Save Category'}
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
  const [showWebSearch, setShowWebSearch] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelectWebImage = async (webImageUrl) => {
    // 1. Instantly show in Main Modal image preview!
    setImage(webImageUrl)
    try {
      let res
      if (typeof menuApi?.uploadImage === 'function') {
        res = await menuApi.uploadImage(webImageUrl)
      } else {
        res = await apiClient.post('/partner/menu/upload-image', { image_url: webImageUrl })
      }
      const localUrl = res?.data?.data?.url || res?.data?.url || res?.url
      if (localUrl) {
        setImage(localUrl)
        toast.success('Image Downloaded', 'Image saved permanently to your server.')
      }
    } catch (err) {
      console.warn('Background server download warning:', err)
      // Keep webImageUrl as image so user doesn't lose their selection
      setImage(webImageUrl)
    }
  }
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
        imageUrl = res?.data?.data?.url || res?.data?.url || res?.url || null
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
      zIndex="z-[10005]"
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
                      ? 'bg-[#113BD0] text-white shadow-2xs'
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
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-[#113BD0] hover:text-white border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
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
          onOpenWebSearch={() => setShowWebSearch(true)}
          helperText="Upload dish photo or search web."
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
            className="h-12 rounded-xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Item' : 'Save Item'}
          </button>
        </div>
      </form>

      {/* Web Food Image Search Modal */}
      <WebImageSearchModal
        isOpen={showWebSearch}
        initialQuery={name}
        onClose={() => setShowWebSearch(false)}
        onSelectImage={handleSelectWebImage}
        zIndex="z-[10010]"
      />
    </Modal>
  )
}

export default MenuPage

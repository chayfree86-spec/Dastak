import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Plus,
  Home,
  Briefcase,
  Trash2,
  Edit3,
  Check,
  Star,
  Navigation,
  Sparkles,
  Building,
  AlertTriangle,
  User,
  Phone,
} from 'lucide-react'
import { useLocationContext } from '../../context/LocationContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LocationPickerModal from '../../components/common/LocationPickerModal'
import EmptyState from '../../components/common/EmptyState'

export const SavedAddressesPage = () => {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const toast = useToast()
  const {
    addresses,
    activeAddress,
    selectAddress,
    makeDefaultAddress,
    updateAddressItem,
    removeAddress,
  } = useLocationContext()

  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    addressId: null,
    addressName: '',
  })

  // Open Edit Modal with pre-filled address details
  const handleOpenEdit = (e, addr) => {
    e.stopPropagation()
    setEditingAddress({
      id: addr.id,
      customer_name: addr.customer_name || 'Customer',
      customer_phone: addr.customer_phone || '',
      address: addr.address || '',
      landmark: addr.landmark || '',
      type: addr.type || 'Home',
      is_default: Boolean(addr.is_default),
      latitude: addr.latitude || 26.456,
      longitude: addr.longitude || 80.339,
      city: addr.city || 'Kanpur',
    })
    setEditModalOpen(true)
  }

  // Save changes from Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingAddress) return

    await updateAddressItem(editingAddress.id, editingAddress)
    toast.success(lang === 'hi' ? 'पता अपडेट हुआ' : 'Address Updated', lang === 'hi' ? 'डिलीवरी लोकेशन विवरण सहेजा गया।' : 'Delivery location details saved successfully.')
    setEditModalOpen(false)
    setEditingAddress(null)
  }

  const handleSetDefault = async (e, addr) => {
    e.stopPropagation()
    await makeDefaultAddress(addr.id)
    toast.success(lang === 'hi' ? 'डिफ़ॉल्ट पता अपडेट हुआ' : 'Default Address Updated', `${addr.address} ${lang === 'hi' ? 'अब आपका डिफ़ॉल्ट पता है।' : 'is now your default address.'}`)
  }

  const handleDeletePrompt = (e, addr) => {
    e.stopPropagation()
    setDeleteConfirmModal({
      isOpen: true,
      addressId: addr.id,
      addressName: addr.address || addr.customer_name || 'Address',
    })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmModal.addressId) {
      await removeAddress(deleteConfirmModal.addressId)
      toast.success(lang === 'hi' ? 'पता हटा दिया गया' : 'Address Deleted', lang === 'hi' ? 'पता सूची से हटा दिया गया है।' : 'The address has been removed.')
    }
    setDeleteConfirmModal({ isOpen: false, addressId: null, addressName: '' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2845D6] dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'वापस' : 'Back'}</span>
        </button>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setLocationModalOpen(true)}
          className="font-bold text-xs shadow-md shadow-blue-600/20"
        >
          {t.addAddress || (lang === 'hi' ? 'नया पता जोड़ें' : 'Add Address')}
        </Button>
      </div>

      {/* Header Info */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <MapPin className="w-7 h-7 text-[#F97316]" />
          <span>{t.savedAddresses}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {lang === 'hi'
            ? 'डिफ़ॉल्ट पता सेट करें, फ्लैट/लैंडमार्क विवरण अपडेट करें या हटाएं'
            : 'Set default address, edit apartment/landmark details, or delete locations'}
        </p>
      </div>

      {/* 1. Active Delivery Address Banner */}
      {activeAddress && (
        <div className="p-5 rounded-3xl bg-blue-50/70 dark:bg-slate-900 border-2 border-[#2845D6] dark:border-blue-500 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="p-3 rounded-2xl bg-[#2845D6] text-white shrink-0 shadow-md">
                <Home className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#2845D6] text-white px-2.5 py-0.5 rounded-md">
                    {lang === 'hi' ? 'सक्रिय डिलीवरी लोकेशन' : 'ACTIVE DELIVERY LOCATION'}
                  </span>
                  {activeAddress.is_default && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      <span>{lang === 'hi' ? 'डिफ़ॉल्ट' : 'Default'}</span>
                    </span>
                  )}
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">
                    {activeAddress.customer_name || (lang === 'hi' ? 'डिलीवरी का पता' : 'My Delivery Address')}
                  </h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {activeAddress.address}
                </p>
                {activeAddress.landmark && (
                  <span className="text-amber-700 dark:text-amber-300 font-bold block text-[11px]">
                    🚩 {lang === 'hi' ? 'लैंडमार्क:' : 'Landmark:'} {activeAddress.landmark}
                  </span>
                )}
                {activeAddress.latitude && activeAddress.longitude && (
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    GPS: {Number(activeAddress.latitude).toFixed(4)}, {Number(activeAddress.longitude).toFixed(4)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl shrink-0 border border-emerald-200 dark:border-emerald-800">
              {lang === 'hi' ? '✓ सक्रिय' : '✓ In Use'}
            </span>
          </div>

          {/* Quick Actions for Active Address */}
          <div className="pt-2 border-t border-blue-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleOpenEdit(e, activeAddress)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2845D6]" />
                <span>{lang === 'hi' ? 'संपादित करें' : 'Edit Details'}</span>
              </button>

              {!activeAddress.is_default && (
                <button
                  type="button"
                  onClick={(e) => handleSetDefault(e, activeAddress)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-amber-700 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-700/60 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{lang === 'hi' ? 'डिफ़ॉल्ट बनाएं' : 'Set Default'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#2845D6] text-white font-bold hover:bg-[#1E3A8A] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Change Location</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Saved Addresses List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
          <span>Saved Address Book ({addresses.length})</span>
        </div>

        {addresses.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm">
              No Additional Saved Addresses
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Use GPS or Map Search to save frequently used locations (Home, Office, Village).
            </p>
          </div>
        ) : (
          addresses.map((addr) => {
            const isSelected =
              activeAddress?.id === addr.id ||
              activeAddress?.address === addr.address
            const isDefault = Boolean(addr.is_default)

            return (
              <div
                key={addr.id}
                onClick={() => {
                  selectAddress(addr)
                  toast.success('Active Address Set', addr.address)
                }}
                className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 text-xs ${
                  isSelected
                    ? 'border-[#2845D6] ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {addr.type === 'Work' ? (
                        <Briefcase className="w-5 h-5" />
                      ) : (
                        <Home className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">
                          {addr.customer_name || addr.type || 'Saved Location'}
                        </h4>
                        {isDefault && (
                          <span className="text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300 dark:border-amber-700/60">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Default</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {addr.type || 'Home'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 font-medium">
                        {addr.address}
                      </p>
                      {addr.landmark && (
                        <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold block">
                          🚩 {addr.landmark}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#2845D6] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Bottom Action Strip: Edit, Set Default, Delete */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(e, addr)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Address Details"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#2845D6]" />
                      <span>Edit</span>
                    </button>

                    {/* Set Default Button */}
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefault(e, addr)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-amber-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Make this your default delivery address"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Set Default</span>
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeletePrompt(e, addr)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Delete</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 3. Edit Address Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingAddress(null)
        }}
        title="Edit Address Details"
        subtitle="Update flat number, landmark, or contact info"
        maxWidth="max-w-md"
      >
        {editingAddress && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                Delivery Address / Street
              </label>
              <textarea
                rows={2}
                value={editingAddress.address}
                onChange={(e) =>
                  setEditingAddress((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={editingAddress.landmark}
                  onChange={(e) =>
                    setEditingAddress((prev) => ({ ...prev, landmark: e.target.value }))
                  }
                  placeholder="Near Temple / School"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  Address Type
                </label>
                <div className="flex items-center gap-1.5">
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setEditingAddress((prev) => ({ ...prev, type: t }))
                      }
                      className={`flex-1 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        editingAddress.type === t
                          ? 'bg-[#2845D6] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={editingAddress.customer_name}
                  onChange={(e) =>
                    setEditingAddress((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  placeholder="Your Name"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={editingAddress.customer_phone}
                  onChange={(e) =>
                    setEditingAddress((prev) => ({ ...prev, customer_phone: e.target.value }))
                  }
                  placeholder="10-digit mobile"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
                />
              </div>
            </div>

            {/* Set as Default Checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editingAddress.is_default}
                onChange={(e) =>
                  setEditingAddress((prev) => ({ ...prev, is_default: e.target.checked }))
                }
                className="w-4 h-4 rounded text-[#2845D6] focus:ring-[#2845D6]"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Set as my Default Delivery Address
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditModalOpen(false)
                  setEditingAddress(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Check}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 4. Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() =>
          setDeleteConfirmModal({ isOpen: false, addressId: null, addressName: '' })
        }
        title="Delete Saved Address?"
        subtitle="Are you sure you want to remove this delivery location?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-black block">Permanent Removal</span>
              <p className="text-[11px] opacity-90 mt-0.5 truncate">
                {deleteConfirmModal.addressName}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDeleteConfirmModal({ isOpen: false, addressId: null, addressName: '' })
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleConfirmDelete}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  )
}

export default SavedAddressesPage

import React, { useState, useRef, useEffect } from 'react'
import { Modal } from '../../components/common/Modal'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import ImageUpload from '../../components/common/ImageUpload'
import { useToast } from '../../context/ToastContext'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import restaurantsApi from '../../api/restaurants.api'

export const RestaurantFormModal = ({
  isOpen,
  onClose,
  restaurant = null,
  onSaved,
}) => {
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Delhi NCR')
  const [commission, setCommission] = useState('15')
  const [settlementCycle, setSettlementCycle] = useState('WEEKLY')
  const [minOrder, setMinOrder] = useState('150')
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('7')
  const [isActive, setIsActive] = useState(true)
  const [isVegOnly, setIsVegOnly] = useState(false)
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const toast = useToast()
  const formRef = useRef(null)

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '')
      setOwnerName(restaurant.owner_name || '')
      setMobile(restaurant.mobile || '')
      setEmail(restaurant.email || '')
      setAddress(restaurant.address || '')
      setCity(restaurant.city || 'Delhi NCR')
      setCommission(String(restaurant.commission || '15'))
      setSettlementCycle(restaurant.settlement_cycle || 'WEEKLY')
      setMinOrder(String(restaurant.min_order || '150'))
      setDeliveryRadiusKm(String(restaurant.delivery_radius_km || '7'))
      setIsActive(restaurant.status === 'ACTIVE')
      setIsVegOnly(!!restaurant.is_veg_only)
    } else {
      setName('')
      setOwnerName('')
      setMobile('')
      setEmail('')
      setAddress('')
      setCommission('15')
      setSettlementCycle('WEEKLY')
      setMinOrder('150')
      setDeliveryRadiusKm('7')
      setIsActive(true)
      setIsVegOnly(false)
      setImage(null)
    }
    setErrors({})
  }, [restaurant, isOpen])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrors({})

    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Restaurant name is required.'
    if (!ownerName.trim()) newErrors.ownerName = 'Owner name is required.'
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required.'
    if (!commission) newErrors.commission = 'Commission is required.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        name,
        owner_name: ownerName,
        mobile,
        email,
        address,
        city,
        commission: Number(commission),
        settlement_cycle: settlementCycle,
        min_order: Number(minOrder),
        delivery_radius_km: Number(deliveryRadiusKm),
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        is_veg_only: isVegOnly,
      }

      if (restaurant?.id) {
        await restaurantsApi.updateRestaurant(restaurant.id, payload)
        toast.success('Restaurant Updated', `${name} details updated successfully.`)
      } else {
        await restaurantsApi.createRestaurant(payload)
        toast.success('Restaurant Added', `${name} has been onboarded successfully.`)
      }

      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      toast.error('Operation Failed', err.message || 'Unable to save restaurant.')
    } finally {
      setLoading(false)
    }
  }

  useKeyboardNav(formRef, { autoFocusFirst: true, onSubmit: handleSubmit })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={restaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
      subtitle="Configure partner restaurant details, location, and commission structure."
      maxWidth="max-w-2xl"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Restaurant Name"
            required
            placeholder="e.g. Biryani Central"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="Owner / Contact Person"
            required
            placeholder="e.g. Rajesh Sharma"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            error={errors.ownerName}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Number"
            required
            placeholder="e.g. 9876543210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            error={errors.mobile}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. contact@biryani.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Input
          label="Full Address"
          placeholder="Shop No, Street, Landmark, Area"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Commission (%)"
            type="number"
            required
            min="0"
            max="100"
            placeholder="15"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            error={errors.commission}
          />
          <CustomSelect
            label="Settlement Cycle"
            value={settlementCycle}
            onChange={setSettlementCycle}
            options={[
              { value: 'DAILY', label: 'Daily Settlement' },
              { value: 'WEEKLY', label: 'Weekly (Every Monday)' },
              { value: 'MONTHLY', label: 'Monthly' },
            ]}
          />
          <AmountInput
            label="Minimum Order"
            placeholder="150.00"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Input
            label="Delivery Radius (KM)"
            type="number"
            min="1"
            max="50"
            value={deliveryRadiusKm}
            onChange={(e) => setDeliveryRadiusKm(e.target.value)}
          />
          <ImageUpload
            label="Restaurant Logo / Storefront Photo"
            value={image}
            onChange={setImage}
            onRemove={() => setImage(null)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2 pb-1 border-t border-slate-100 dark:border-slate-700/60">
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="Active on Platform"
            description="Allow restaurant to take customer orders"
          />
          <Switch
            checked={isVegOnly}
            onChange={setIsVegOnly}
            label="Pure Veg Outlet"
            description="Mark as 100% vegetarian"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {restaurant ? 'Update Restaurant' : 'Onboard Restaurant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default RestaurantFormModal

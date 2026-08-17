import React, { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  Bike,
  ShieldCheck,
  Star,
  Package,
  Calendar,
  CreditCard,
  Edit2,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatters'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import deliveryApi from '../../api/delivery.api'
import { useToast } from '../../context/ToastContext'

export const ProfilePage = () => {
  const { user, riderProfile, refreshProfile, updateProfileState } = useAuth()
  const toast = useToast()

  const [vehicleNumber, setVehicleNumber] = useState(
    riderProfile?.vehicle_number || ''
  )
  const [vehicleType, setVehicleType] = useState(
    riderProfile?.vehicle_type || 'MOTORCYCLE'
  )
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const rating = Number(riderProfile?.rating || 4.9).toFixed(1)
  const totalDeliveries = riderProfile?.total_deliveries || 0

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await deliveryApi.updateProfile({
        vehicle_number: vehicleNumber.trim(),
        vehicle_type: vehicleType,
      })
      updateProfileState({ vehicle_number: vehicleNumber, vehicle_type: vehicleType })
      toast.success('Profile Saved', 'Vehicle and rider details updated.')
      setEditing(false)
      if (refreshProfile) refreshProfile()
    } catch (err) {
      toast.error('Update Failed', err.message || 'Could not update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20 shrink-0">
            {user?.name?.charAt(0) || 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {user?.name || 'Rider Name'}
              </h2>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                {user?.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dastak Delivery Partner Fleet
            </p>
          </div>
        </div>

        {/* Rating & Lifetime Deliveries Badge */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-center min-w-[70px]">
            <div className="flex items-center justify-center gap-1 font-black text-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{rating}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">
              Rating
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 text-center min-w-[70px]">
            <div className="font-black text-sm">{totalDeliveries}</div>
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">
              Trips
            </span>
          </div>
        </div>
      </div>

      {/* 2. Rider Details & Vehicle Configuration */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            Rider & Vehicle Information
          </h3>
          {!editing && (
            <Button
              variant="outline"
              size="xs"
              icon={Edit2}
              onClick={() => setEditing(true)}
            >
              Edit Vehicle
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Registered Mobile Number"
              icon={Phone}
              value={user?.mobile || ''}
              disabled
            />
            <Input
              label="Fleet Email"
              icon={Mail}
              value={user?.email || ''}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Vehicle Registration Plate Number"
              icon={Bike}
              placeholder="e.g. UP-78-AB-1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              disabled={!editing}
              required
            />
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Vehicle Type
              </label>
              <select
                disabled={!editing}
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2845D6] disabled:bg-slate-50 dark:disabled:bg-slate-800"
              >
                <option value="MOTORCYCLE">Motorcycle / Bike</option>
                <option value="SCOOTER">Scooter / Scooty</option>
                <option value="ELECTRIC_VEHICLE">EV Bike / Scooter</option>
                <option value="BICYCLE">Bicycle</option>
              </select>
            </div>
          </div>

          {editing && (
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={CheckCircle2}
                loading={loading}
              >
                Save Details
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* 3. Account ID & Joining Date Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Rider ID: #RIDER-{user?.id || 7}</span>
        <span>Joined {formatDate(user?.created_at || '2026-08-14')}</span>
      </div>
    </div>
  )
}

export default ProfilePage

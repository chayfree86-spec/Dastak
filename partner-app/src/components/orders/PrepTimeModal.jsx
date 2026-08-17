import React, { useState } from 'react'
import { Clock, ChefHat, Check } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

export const PrepTimeModal = ({ isOpen, onClose, order, onConfirm, loading }) => {
  const [selectedMinutes, setSelectedMinutes] = useState(20)
  const [customTime, setCustomTime] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const presetTimes = [10, 15, 20, 30, 45, 60]

  const handleSelectPreset = (mins) => {
    setSelectedMinutes(mins)
    setIsCustom(false)
    setCustomTime('')
  }

  const handleCustomChange = (e) => {
    const val = e.target.value
    setCustomTime(val)
    if (val && !isNaN(val)) {
      setSelectedMinutes(parseInt(val, 10))
    }
  }

  const handleConfirm = () => {
    const mins = isCustom ? parseInt(customTime, 10) || 20 : selectedMinutes
    onConfirm(order, mins)
  }

  if (!order) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accept Order & Set Kitchen Time"
      subtitle={`Select preparation time for Order #${order.order_number}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2845D6] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Estimated Cooking Time</h4>
            <p className="text-[11px] text-slate-500">
              The customer and rider will be informed about when food is ready.
            </p>
          </div>
        </div>

        {/* Prep Time Quick Selector Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {presetTimes.map((mins) => {
            const isSelected = !isCustom && selectedMinutes === mins
            return (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectPreset(mins)}
                className={`p-3.5 rounded-2xl border font-black text-center transition-all cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'bg-[#2845D6] text-white border-[#2845D6] ring-2 ring-blue-500/20 shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg block leading-tight">{mins}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  Mins
                </span>
              </button>
            )
          })}
        </div>

        {/* Custom Input */}
        <div className="pt-2">
          <div
            onClick={() => setIsCustom(true)}
            className={`p-3 rounded-2xl border transition-all ${
              isCustom ? 'border-[#2845D6] ring-2 ring-blue-500/20 bg-white' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Custom Prep Time:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="180"
                  placeholder="25"
                  value={customTime}
                  onFocus={() => setIsCustom(true)}
                  onChange={handleCustomChange}
                  className="w-20 p-1.5 px-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none focus:border-[#2845D6]"
                />
                <span className="text-xs font-bold text-slate-400">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Check}
            loading={loading}
            onClick={handleConfirm}
            className="flex-1 shadow-md shadow-blue-500/20"
          >
            Confirm & Send to Kitchen
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PrepTimeModal

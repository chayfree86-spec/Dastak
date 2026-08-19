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
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2845D6] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Estimated Cooking Time</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-lg block leading-tight">{mins}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
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
              isCustom
                ? 'border-[#2845D6] ring-2 ring-blue-500/20 bg-white dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Custom Prep Time:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="180"
                  placeholder="25"
                  value={customTime}
                  onFocus={() => setIsCustom(true)}
                  onChange={handleCustomChange}
                  className="w-20 p-1.5 px-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2845D6]"
                />
                <span className="text-xs font-bold text-slate-400">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons (Touch-friendly 48px height) */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center active:scale-98 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer select-none disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm & Accept</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PrepTimeModal

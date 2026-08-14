import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Store,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Percent,
  Wallet,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  BarChart3,
  Settings as SettingsIcon,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Edit2,
} from 'lucide-react'
import restaurantsApi from '../../api/restaurants.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Switch from '../../components/common/Switch'
import RestaurantFormModal from './RestaurantFormModal'
import { useToast } from '../../context/ToastContext'

export const RestaurantDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { data: restaurant, loading, error, retry } = useApi(
    () => restaurantsApi.getRestaurantDetails(id),
    [id],
    {
      initialData: {
        id: id || '1',
        name: 'Biryani Central',
        owner_name: 'Rajesh Sharma',
        mobile: '9876543210',
        email: 'contact@biryanicentral.in',
        address: 'Plot 42, Sector 18, Commercial Belt, Near Metro Station',
        city: 'Delhi NCR',
        rating: 4.6,
        total_reviews: 320,
        status: 'ACTIVE',
        is_online: true,
        commission: 15,
        settlement_cycle: 'WEEKLY',
        min_order: 150.00,
        delivery_radius_km: 8,
        timing: '11:00 AM - 11:30 PM',
        weekly_off: 'None (Open All Days)',
        is_veg_only: false,
        total_orders: 1420,
        lifetime_sales: 789400.00,
        pending_settlement: 24500.00,
      },
    }
  )

  const { data: menuData, loading: menuLoading } = useApi(
    () => restaurantsApi.getRestaurantMenu(id),
    [id],
    {
      initialData: [
        {
          category: 'Biryani Specials',
          items: [
            { id: 'M1', name: 'Hyderabadi Dum Biryani', is_veg: false, price: 340.00, discount_price: 299.00, is_available: true, prep_time: '25 mins', variants: ['Half', 'Full'], addons: ['Extra Raita', 'Mirchi Ka Salan'] },
            { id: 'M2', name: 'Lucknowi Paneer Biryani', is_veg: true, price: 280.00, discount_price: 260.00, is_available: true, prep_time: '20 mins', variants: ['Regular', 'Large'], addons: ['Extra Gravy'] },
            { id: 'M3', name: 'Kolkata Chicken Biryani', is_veg: false, price: 360.00, discount_price: 360.00, is_available: false, prep_time: '30 mins', variants: ['Standard'], addons: ['Extra Boiled Egg'] },
          ],
        },
        {
          category: 'Starters & Kebabs',
          items: [
            { id: 'M4', name: 'Chicken Tikka Kebab (6 Pcs)', is_veg: false, price: 290.00, discount_price: 270.00, is_available: true, prep_time: '18 mins', variants: [], addons: ['Mint Chutney'] },
            { id: 'M5', name: 'Dahi Ke Kebab (4 Pcs)', is_veg: true, price: 220.00, discount_price: 220.00, is_available: true, prep_time: '15 mins', variants: [], addons: [] },
          ],
        },
      ],
    }
  )

  const { data: ordersData, loading: ordersLoading } = useApi(
    () => restaurantsApi.getRestaurantOrders(id, { limit: 5 }),
    [id],
    {
      initialData: [
        { id: 'D4829', customer: 'Aarav Sharma', amount: 640.00, status: 'NEW', time: new Date().toISOString() },
        { id: 'D4815', customer: 'Deepak Rao', amount: 820.00, status: 'DELIVERED', time: new Date(Date.now() - 3600000).toISOString() },
        { id: 'D4790', customer: 'Kunal Kapoor', amount: 490.00, status: 'DELIVERED', time: new Date(Date.now() - 86400000).toISOString() },
      ],
    }
  )

  const handleToggleOnline = async (val) => {
    try {
      await restaurantsApi.toggleStatus(id, { is_online: val })
      toast.success('Store State Updated', `Restaurant is now ${val ? 'Online' : 'Offline'}.`)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to toggle store state.')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Store },
    { id: 'menu', label: 'Menu & Items', icon: UtensilsCrossed },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'earnings', label: 'Earnings & Commission', icon: Wallet },
    { id: 'settlements', label: 'Settlements', icon: Clock },
    { id: 'reports', label: 'Performance', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/restaurants')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </button>
      </div>

      {/* Restaurant Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2845D6]/10 text-[#2845D6] dark:bg-blue-900/40 dark:text-blue-400 text-2xl font-black flex items-center justify-center shadow-xs">
            {restaurant?.name?.charAt(0) || 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{restaurant?.name}</h2>
              <StatusBadge status={restaurant?.status} size="xs" />
              <StatusBadge status={restaurant?.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />
              {restaurant?.is_veg_only && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Pure Veg
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {restaurant?.rating || '4.5'} ({restaurant?.total_reviews || 0} reviews)
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {restaurant?.city}
              </span>
              <span>&bull;</span>
              <span>Commission: <strong>{restaurant?.commission}%</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Store State:</span>
            <button
              type="button"
              onClick={() => handleToggleOnline(!restaurant?.is_online)}
              className={`font-bold ${restaurant?.is_online ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              {restaurant?.is_online ? 'OPEN' : 'CLOSED'}
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Edit2}
            onClick={() => setEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact & Owner</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block">Owner Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{restaurant?.owner_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatPhone(restaurant?.mobile)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{restaurant?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Operating Specs</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block">Address:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{restaurant?.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Operating Hours:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{restaurant?.timing}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Radius:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{restaurant?.delivery_radius_km} KM</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Commercial Terms</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block">Dastak Commission:</span>
                <span className="text-base font-black text-[#2845D6] dark:text-blue-400">{restaurant?.commission}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Settlement Cycle:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{restaurant?.settlement_cycle}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Minimum Order Amount:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(restaurant?.min_order)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Menu */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Menu Catalog</h3>
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Add Menu Item
            </Button>
          </div>

          {menuData?.map((cat, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span>{cat.category}</span>
                <span className="text-xs font-semibold text-slate-400">({cat.items.length} items)</span>
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {cat.items.map((item) => (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center mt-1 shrink-0 ${
                          item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Prep: {item.prep_time}</span>
                          {item.variants.length > 0 && (
                            <>
                              <span>&bull;</span>
                              <span>Variants: {item.variants.join(', ')}</span>
                            </>
                          )}
                          {item.addons.length > 0 && (
                            <>
                              <span>&bull;</span>
                              <span>Add-ons: {item.addons.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.discount_price || item.price)}
                        </span>
                        {item.discount_price && item.discount_price < item.price && (
                          <span className="text-[10px] text-slate-400 line-through block">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </div>

                      <Switch
                        checked={item.is_available}
                        onChange={() => {}}
                        label={item.is_available ? 'Available' : 'Sold Out'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Orders */}
      {activeTab === 'orders' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Restaurant Orders</h3>
          <DataTable
            columns={[
              { key: 'id', header: 'Order ID', render: (r) => <span className="font-mono font-bold text-[#2845D6]">#{r.id}</span> },
              { key: 'customer', header: 'Customer' },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
              { key: 'time', header: 'Time', render: (r) => <span className="text-slate-400">{formatDateTime(r.time)}</span> },
            ]}
            data={ordersData || []}
            loading={ordersLoading}
            emptyTitle="No orders yet"
          />
        </div>
      )}

      {/* Tab 4: Earnings */}
      {activeTab === 'earnings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Gross Sales</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(restaurant?.lifetime_sales)}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Dastak Commission</span>
            <div className="text-2xl font-black text-[#2845D6] dark:text-blue-400 mt-2">
              {formatCurrency((restaurant?.lifetime_sales || 0) * ((restaurant?.commission || 15) / 100))}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Settlement</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(restaurant?.pending_settlement)}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <RestaurantFormModal
        isOpen={editModalOpen}
        restaurant={restaurant}
        onClose={() => setEditModalOpen(false)}
        onSaved={retry}
      />
    </div>
  )
}

export default RestaurantDetails

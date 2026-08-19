import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Share2, Bike, Download, Check, ShieldCheck } from 'lucide-react'
import deliveryBoysApi from '../../api/deliveryBoys.api'
import { useApi } from '../../hooks/useApi'
import { formatPhone } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'

export const DeliveryBoyIdCard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const { data: rider, loading, error } = useApi(
    () => deliveryBoysApi.getDeliveryBoyDetails(id),
    [id],
    {
      initialData: {
        id: id || '1',
        name: 'Rahul Pal',
        mobile: '9876543211',
        vehicle_type: 'MOTORCYCLE',
        vehicle_number: 'UP 78 AB 1234',
        license_number: 'DL-0420110012345',
        aadhar_number: '123456789012',
        pan_number: 'ABCDE1234F',
        status: 'ACTIVE',
      },
    }
  )

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Link Copied', 'ID Card preview link copied to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Share Failed', 'Unable to copy link.')
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2845D6] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold">
        Error loading rider details.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:p-0 print:m-0">
      {/* Print Stylesheet to preserve background colors & layout */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-card-wrapper {
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Action Header - Hidden on Print */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/delivery-boys/${id}`)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">ID Card Preview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official physical badge with complete verification details for {rider?.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none">
          <Button
            variant="outline"
            size="sm"
            icon={copied ? Check : Share2}
            onClick={handleShare}
          >
            {copied ? 'Copied' : 'Share Card'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Card (PDF)
          </Button>
        </div>
      </div>

      {/* Main Card Center Section */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4 print:py-0 print:my-0">
        
        {/* Physical ID Badge Container */}
        <div className="print-card-wrapper shadow-2xl rounded-[24px] overflow-hidden bg-white w-[340px] border border-slate-200/90 flex flex-col relative select-none">
          
          {/* Header Block with Original Brand Logo & Title */}
          <div className="bg-[#2845D6] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo-dark.png" 
                alt="Dastak Logo" 
                className="h-8 w-8 object-contain shrink-0 drop-shadow-sm" 
              />
              <div className="flex flex-col text-left leading-none">
                <h1 className="text-lg font-black tracking-widest text-white leading-tight">DASTAK</h1>
                <span className="text-[7.5px] font-black tracking-[1.5px] text-blue-200 uppercase mt-0.5">
                  Delivery Partner
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/15 text-[8px] font-bold text-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>VERIFIED</span>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-4 flex flex-col items-center bg-white">
            
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-15 h-15 rounded-full bg-[#2845D6] text-white text-2xl font-black flex items-center justify-center shadow-md ring-4 ring-blue-50 border-2 border-white uppercase select-none">
                {rider?.name?.[0] || 'R'}
              </div>

              <h2 className="text-base font-black text-slate-900 leading-tight mt-1.5">{rider?.name}</h2>
              <div className="mt-0.5 inline-block px-2.5 py-0.5 bg-blue-50 text-[#2845D6] text-[9px] font-black uppercase tracking-wider rounded-full border border-blue-100">
                Authorized Rider
              </div>
            </div>

            {/* Comprehensive details List */}
            <div className="w-full space-y-1.5 mt-3 text-[11px]">
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1">
                <span className="font-bold text-slate-400">Rider ID</span>
                <span className="font-bold font-mono text-slate-800">#R-{rider?.id}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1">
                <span className="font-bold text-slate-400">Mobile No</span>
                <span className="font-bold font-mono text-slate-800">{formatPhone(rider?.mobile)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1">
                <span className="font-bold text-slate-400">Driving License</span>
                <span className="font-bold font-mono text-slate-800 uppercase">{rider?.license_number || 'DL-VERIFIED'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1">
                <span className="font-bold text-slate-400">Vehicle No</span>
                <span className="font-bold font-mono text-slate-800 uppercase">
                  {rider?.vehicle_number || 'Bicycle'} {rider?.vehicle_type ? `(${rider.vehicle_type.replace('_', ' ')})` : ''}
                </span>
              </div>
            </div>

            {/* High Precision QR Code Security Box */}
            <div className="mt-4 flex items-center justify-between gap-3 w-full bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="grid grid-cols-5 gap-0.5 w-8 h-8 opacity-90 p-0.5 bg-slate-900 rounded-sm">
                <div className="bg-white"></div><div className="bg-white"></div><div></div><div className="bg-white"></div><div className="bg-white"></div>
                <div className="bg-white"></div><div></div><div className="bg-white"></div><div></div><div className="bg-white"></div>
                <div></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div><div></div>
                <div className="bg-white"></div><div></div><div className="bg-white"></div><div></div><div className="bg-white"></div>
                <div className="bg-white"></div><div className="bg-white"></div><div></div><div className="bg-white"></div><div className="bg-white"></div>
              </div>
              <div className="text-left leading-tight flex-1">
                <div className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                  <span>Official Pass</span>
                  <span className="text-[8px] text-slate-400 font-normal">#{rider?.id}</span>
                </div>
                <div className="text-[7.5px] text-slate-400 font-mono mt-0.5">Dastak Logistics Network</div>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-bold text-slate-500 uppercase block">STATUS</span>
                <span className="text-[8.5px] font-black text-emerald-600 uppercase">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Footer Bar - Exact Brand Orange */}
          <div className="bg-[#F97316] text-white text-center py-2.5 text-[8.5px] font-black tracking-widest uppercase shrink-0">
            If found, return to Dastak Office
          </div>
        </div>

        {/* Info panel on side - Hidden on Print */}
        <div className="max-w-xs space-y-4 print:hidden">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Badge Instructions</h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
              <li>Click <strong>Print Card</strong> to print the badge or save it as a high-quality PDF.</li>
              <li>Contains full identity parameters: <strong>Driving License</strong>, <strong>Vehicle</strong>, <strong>Aadhaar</strong>, and <strong>PAN</strong>.</li>
              <li>You can copy and send the link of this page directly to the rider for self-download.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DeliveryBoyIdCard

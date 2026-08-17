import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import CustomSelect from '../../components/common/CustomSelect'
import Button from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import deliveryBoysApi from '../../api/deliveryBoys.api'

export const DeliveryBoyFormModal = ({ isOpen, onClose, rider, onSaveSuccess }) => {
  const toast = useToast()
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Form Fields
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [aadharNumber, setAadharNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [bankUpiId, setBankUpiId] = useState('')

  // Document hardcopies paths
  const [aadharPath, setAadharPath] = useState('')
  const [panPath, setPanPath] = useState('')
  const [licensePath, setLicensePath] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState({ aadhar: false, pan: false, license: false })

  useEffect(() => {
    if (rider) {
      setName(rider.name || '')
      setMobile(rider.mobile || '')
      setEmail(rider.email || '')
      setPassword('')
      setLoginPin('')
      setVehicleType(rider.vehicle_type || 'MOTORCYCLE')
      setVehicleNumber(rider.vehicle_number || '')
      setLicenseNumber(rider.license_number || '')
      setAadharNumber(rider.aadhar_number || '')
      setPanNumber(rider.pan_number || '')
      setBankAccountName(rider.bank_account_name || '')
      setBankAccountNumber(rider.bank_account_number || '')
      setBankIfsc(rider.bank_ifsc || '')
      setBankUpiId(rider.bank_upi_id || '')
      setAadharPath(rider.aadhar_path || '')
      setPanPath(rider.pan_path || '')
      setLicensePath(rider.license_path || '')
    } else {
      setName('')
      setMobile('')
      setEmail('')
      setPassword('')
      setLoginPin('')
      setVehicleType('MOTORCYCLE')
      setVehicleNumber('')
      setLicenseNumber('')
      setAadharNumber('')
      setPanNumber('')
      setBankAccountName('')
      setBankAccountNumber('')
      setBankIfsc('')
      setBankUpiId('')
      setAadharPath('')
      setPanPath('')
      setLicensePath('')
    }
    setErrors({})
  }, [rider, isOpen])

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc((prev) => ({ ...prev, [type]: true }))
    const formData = new FormData()
    formData.append('document', file)

    try {
      const res = await deliveryBoysApi.uploadDocument(formData)
      if (res.data?.data?.path) {
        const path = res.data.data.path
        if (type === 'aadhar') setAadharPath(path)
        if (type === 'pan') setPanPath(path)
        if (type === 'license') setLicensePath(path)
        toast.success('Document Uploaded', 'Document copy uploaded successfully.')
      }
    } catch (err) {
      toast.error('Upload Failed', err.message || 'Unable to upload document copy.')
    } finally {
      setUploadingDoc((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrors({})

    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Rider name is required.'
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required.'
    if (!licenseNumber.trim()) newErrors.licenseNumber = 'Driving license number is required.'
    if (aadharNumber && aadharNumber.length !== 12) newErrors.aadharNumber = 'Aadhaar must be exactly 12 digits.'
    if (panNumber && panNumber.length !== 10) newErrors.panNumber = 'PAN number must be exactly 10 characters.'

    if (loginPin && !/^\d{4,6}$/.test(loginPin)) newErrors.loginPin = 'PIN must be 4 to 6 numeric digits.'
    if (password && password.length < 6) newErrors.password = 'Password must be at least 6 characters.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Validation Error', 'Please check highlighted fields.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name,
        mobile,
        email: email || null,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber || null,
        license_number: licenseNumber || null,
        aadhar_number: aadharNumber || null,
        pan_number: panNumber || null,
        aadhar_path: aadharPath || null,
        pan_path: panPath || null,
        license_path: licensePath || null,
        bank_account_name: bankAccountName || null,
        bank_account_number: bankAccountNumber || null,
        bank_ifsc: bankIfsc || null,
        bank_upi_id: bankUpiId || null,
      }
      if (password.trim()) payload.password = password.trim()
      if (loginPin.trim()) payload.login_pin = loginPin.trim()

      if (rider?.id) {
        await deliveryBoysApi.updateDeliveryBoy(rider.id, payload)
        toast.success('Rider Updated', `${name} details updated successfully.`)
      } else {
        await deliveryBoysApi.createDeliveryBoy(payload)
        toast.success('Rider Onboarded', `${name} added to the fleet successfully.`)
      }
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to save rider details.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-focus and keyboard traversal
  useEffect(() => {
    if (!isOpen) return
    const firstInput = formRef.current?.querySelector('input')
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault()
        const inputs = Array.from(
          formRef.current?.querySelectorAll('input, select, textarea, button[type="submit"]') || []
        )
        const idx = inputs.indexOf(e.target)
        if (idx > -1 && idx < inputs.length - 1) {
          inputs[idx + 1].focus()
        }
      }
    }

    const formEl = formRef.current
    formEl?.addEventListener('keydown', handleKeyDown)
    return () => {
      formEl?.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rider ? 'Edit Delivery Partner' : 'Onboard Delivery Partner'}
      subtitle="Enter rider information, vehicle credentials, ID proofs, and settlement bank details."
      maxWidth="max-w-2xl"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col max-h-[78vh] sm:max-h-[82vh] -m-1">
        {/* Scrollable inputs container */}
        <div className="overflow-y-auto px-1.5 py-1 space-y-5 flex-1 pr-2 max-h-[calc(78vh-70px)] sm:max-h-[calc(82vh-70px)]">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <Input
                label="Mobile Number (Login ID)"
                required
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                error={errors.mobile}
              />
            </div>
            <Input
              label="Email Address (Login ID)"
              type="email"
              placeholder="e.g. ramesh@dastak.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Section 1.5: Login Credentials */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 pb-1.5 flex items-center justify-between">
              <span>App Login Credentials</span>
              <span className="text-[9px] font-normal text-slate-400 lowercase">(email + password / mobile + 4-6 digit pin)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={rider ? "New Password" : "Email Login Password"}
                type="password"
                placeholder={rider ? "•••••••• (leave blank to keep current)" : "Min 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <Input
                label={rider ? "Mobile Login PIN" : "Mobile Login PIN (4-6 digits)"}
                type="password"
                placeholder={rider ? "e.g. 1234 (leave blank to keep current)" : "4 to 6 numeric digits"}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                error={errors.loginPin}
              />
            </div>
          </div>

          {/* Section 2: Vehicle details */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
              Vehicle & License details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CustomSelect
                label="Vehicle Type"
                value={vehicleType}
                onChange={setVehicleType}
                options={[
                  { value: 'MOTORCYCLE', label: 'Motorcycle' },
                  { value: 'EV_SCOOTER', label: 'EV Scooter' },
                  { value: 'BICYCLE', label: 'Bicycle' },
                  { value: 'THREE_WHEELER', label: 'Auto Rickshaw' },
                ]}
              />
              <Input
                label="Vehicle Plate Number"
                placeholder="e.g. UP 32 AB 9999"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
              <div className="space-y-1">
                <Input
                  label="Driving License No"
                  required
                  placeholder="e.g. DL-1234567890123"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  error={errors.licenseNumber}
                />
                <div className="mt-1">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">DL Hardcopy (Image/PDF)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="upload-license-file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'license')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('upload-license-file').click()}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                      disabled={uploadingDoc.license}
                    >
                      {uploadingDoc.license ? 'Uploading...' : licensePath ? 'Change Copy' : 'Upload Copy'}
                    </button>
                    {licensePath && (
                      <span className="text-[9px] text-emerald-600 font-bold font-mono truncate max-w-[120px]" title={licensePath}>
                        ✓ Uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Verification IDs */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
              Government Identity Proofs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  label="Aadhaar Card Number"
                  placeholder="12-digit number"
                  maxLength={12}
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                  error={errors.aadharNumber}
                />
                <div className="mt-1">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Aadhaar Hardcopy (Image/PDF)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="upload-aadhar-file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'aadhar')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('upload-aadhar-file').click()}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                      disabled={uploadingDoc.aadhar}
                    >
                      {uploadingDoc.aadhar ? 'Uploading...' : aadharPath ? 'Change Copy' : 'Upload Copy'}
                    </button>
                    {aadharPath && (
                      <span className="text-[9px] text-emerald-600 font-bold font-mono truncate max-w-[120px]" title={aadharPath}>
                        ✓ Uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Input
                  label="PAN Card Number"
                  placeholder="10-character alphanumeric"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  error={errors.panNumber}
                />
                <div className="mt-1">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">PAN Hardcopy (Image/PDF)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="upload-pan-file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'pan')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('upload-pan-file').click()}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                      disabled={uploadingDoc.pan}
                    >
                      {uploadingDoc.pan ? 'Uploading...' : panPath ? 'Change Copy' : 'Upload Copy'}
                    </button>
                    {panPath && (
                      <span className="text-[9px] text-emerald-600 font-bold font-mono truncate max-w-[120px]" title={panPath}>
                        ✓ Uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Bank Account details */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
              Payout Bank details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Account Holder Name"
                placeholder="As in bank passbook"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
              <Input
                label="Bank Account Number"
                placeholder="e.g. 123456789012"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="IFSC Code"
                placeholder="11-character IFSC"
                maxLength={11}
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
              />
              <Input
                label="UPI ID for Instant Payout"
                placeholder="e.g. ramesh@okaxis"
                value={bankUpiId}
                onChange={(e) => setBankUpiId(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Pinned action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {rider ? 'Update Rider details' : 'Onboard Rider'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default DeliveryBoyFormModal

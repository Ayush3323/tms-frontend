// import { useState, useEffect } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { tenantsApi } from '../api/tenantEndpoint'

// export default function TenantDetailPage() {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const qc = useQueryClient()
//   const isNew = !id

//   const [formData, setFormData] = useState({
//     company_name: '',
//     trading_name: '',
//     primary_contact_person: '',
//     primary_contact_email: '',
//     primary_contact_phone: '',
//     registered_address: {
//       line1: '',
//       city: '',
//       country: '',
//       postal_code: ''
//     },
//     business_type: '',
//     company_size: '',
//     status: '',
//     verification_status: ''
//   })

//   // Fetch tenant data if editing
//   const { data: tenant, isLoading } = useQuery({
//     queryKey: ['tenant', id],
//     queryFn: () => tenantsApi.get(id),
//     enabled: !isNew,
//     staleTime: 5 * 60 * 1000,
//   })

//   // Set form data when tenant is loaded
//   useEffect(() => {
//     if (tenant) {
//       setFormData({
//         company_name: tenant.company_name || '',
//         trading_name: tenant.trading_name || '',
//         primary_contact_person: tenant.primary_contact_person || '',
//         primary_contact_email: tenant.primary_contact_email || '',
//         primary_contact_phone: tenant.primary_contact_phone || '',
//         registered_address: {
//           line1: tenant.registered_address?.line1 || '',
//           city: tenant.registered_address?.city || '',
//           country: tenant.registered_address?.country || '',
//           postal_code: tenant.registered_address?.postal_code || ''
//         },
//         business_type: tenant.business_type || '',
//         company_size: tenant.company_size || '',
//         status: tenant.status || '',
//        verification_status: tenant.verification_status || ''
//       })
//     }
//   }, [tenant])

//   // Create mutation
//   const createMutation = useMutation({
//     mutationFn: (data) => tenantsApi.create(data),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['tenants'] })
//       navigate('/admin/dashboard/tenants')
//     },
//     onError: (error) => {
//       console.error('Error creating tenant:', error)
//       alert('Failed to create tenant: ' + (error.response?.data?.message || error.message))
//     }
//   })

//   // Update mutation
//   const updateMutation = useMutation({
//     mutationFn: (data) => tenantsApi.update(id, data),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['tenant', id] })
//       qc.invalidateQueries({ queryKey: ['tenants'] })
//       navigate('/admin/dashboard/tenants')
//     },
//     onError: (error) => {
//       console.error('Error updating tenant:', error)
//       alert('Failed to update tenant: ' + (error.response?.data?.message || error.message))
//     }
//   })

//   const handleChange = (e) => {
//     const { name, value } = e.target
    
//     if (name.startsWith('address.')) {
//       const field = name.replace('address.', '')
//       setFormData(prev => ({
//         ...prev,
//         registered_address: {
//           ...prev.registered_address,
//           [field]: value
//         }
//       }))
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: value
//       }))
//     }
//   }

//   const handleSubmit = (e) => {
//     e.preventDefault()
    
//     if (isNew) {
//       createMutation.mutate(formData)
//     } else {
//       updateMutation.mutate(formData)
//     }
//   }

//   const isPending = createMutation.isPending || updateMutation.isPending

//   if (!isNew && isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-gray-500">Loading tenant...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <button
//             onClick={() => navigate('/admin/dashboard/tenants')}
//             className="text-sm text-gray-500 hover:text-gray-700 mb-1"
//           >
//             ← Back to Tenants
//           </button>
//           <h1 className="text-2xl font-bold text-gray-900">
//             {isNew ? 'Create New Tenant' : 'Edit Tenant'}
//           </h1>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
//         {/* Company Information */}
//         <div className="space-y-4">
//           <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Company Information</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Company Name *
//               </label>
//               <input
//                 type="text"
//                 name="company_name"
//                 value={formData.company_name}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Trading Name
//               </label>
//               <input
//                 type="text"
//                 name="trading_name"
//                 value={formData.trading_name}
//                 onChange={handleChange}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Business Type
//               </label>
//               <select
//                 name="business_type"
//                 value={formData.business_type}
//                 onChange={handleChange}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Type</option>
//                 <option value="LOGISTICS">Logistics</option>
//                 <option value="TRANSPORT">Transport</option>
//                 <option value="FREIGHT">Freight</option>
//                 <option value="COURIER">Courier</option>
//                 <option value="OTHER">Other</option>
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Company Size
//               </label>
//               <select
//                 name="company_size"
//                 value={formData.company_size}
//                 onChange={handleChange}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Size</option>
//                 <option value="SMALL">Small</option>
//                 <option value="MEDIUM">Medium</option>
//                 <option value="LARGE">Large</option>
//                 <option value="ENTERPRISE">Enterprise</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Contact Information */}
//         <div className="space-y-4">
//           <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Contact Person *
//               </label>
//               <input
//                 type="text"
//                 name="primary_contact_person"
//                 value={formData.primary_contact_person}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Email *
//               </label>
//               <input
//                 type="email"
//                 name="primary_contact_email"
//                 value={formData.primary_contact_email}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone *
//               </label>
//               <input
//                 type="tel"
//                 name="primary_contact_phone"
//                 value={formData.primary_contact_phone}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>
        
//         {/* Status & Verification */}
// <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//   <div>
//     <label className="block text-sm font-medium text-gray-700 mb-1">
//       Status
//     </label>
//     <select
//       name="status"
//       value={formData.status}
//       onChange={handleChange}
//       className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//     >
//       <option value="">Select Status</option>
//       <option value="ACTIVE">Active</option>
//       <option value="PENDING_VERIFICATION">Pending Verification</option>
//       <option value="SUSPENDED">Suspended</option>
//     </select>
//   </div>

//   <div>
//     <label className="block text-sm font-medium text-gray-700 mb-1">
//       Verification
//     </label>
//     <select
//       name="verification_status"
//       value={formData.verification_status}
//       onChange={handleChange}
//       className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//     >
//       <option value="">Select Verification</option>
//       <option value="PENDING">Pending</option>
//       <option value="VERIFIED">Verified</option>
//       <option value="REJECTED">Rejected</option>
//     </select>
//   </div>

// </div>
//         {/* Address */}
//         <div className="space-y-4">
//           <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Registered Address</h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Address Line 1 *
//               </label>
//               <input
//                 type="text"
//                 name="address.line1"
//                 value={formData.registered_address.line1}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 City *
//               </label>
//               <input
//                 type="text"
//                 name="address.city"
//                 value={formData.registered_address.city}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Country *
//               </label>
//               <input
//                 type="text"
//                 name="address.country"
//                 value={formData.registered_address.country}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Postal Code *
//               </label>
//               <input
//                 type="text"
//                 name="address.postal_code"
//                 value={formData.registered_address.postal_code}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-end gap-3 pt-4">
//           <button
//             type="button"
//             onClick={() => navigate('/admin/dashboard/tenants')}
//             className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={isPending}
//             className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//           >
//             {isPending ? 'Saving...' : isNew ? 'Create Tenant' : 'Save Changes'}
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }




import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsApi } from '../api/tenantEndpoint'

export default function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = !id

  const [formData, setFormData] = useState({
    company_name: '',
    trading_name: '',
    primary_contact_person: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    registered_address: {
      line1: '',
      city: '',
      country: '',
      postal_code: ''
    },
    business_type: '',
    company_size: '',
    status: '',
    verification_status: '',
    admin_password:''
  })

  // Fetch tenant data if editing
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantsApi.get(id),
    enabled: !isNew,
    staleTime: 0,
  })

  // Set form data when tenant is loaded
  useEffect(() => {
    if (tenant) {
      setFormData({
        company_name: tenant.company_name || '',
        trading_name: tenant.trading_name || '',
        primary_contact_person: tenant.primary_contact_person || '',
        primary_contact_email: tenant.primary_contact_email || '',
        primary_contact_phone: tenant.primary_contact_phone || '',
        registered_address: {
          line1: tenant.registered_address?.line1 || '',
          city: tenant.registered_address?.city || '',
          country: tenant.registered_address?.country || '',
          postal_code: tenant.registered_address?.postal_code || ''
        },
        business_type: tenant.business_type || '',
        company_size: tenant.company_size || '',
        status: tenant.status || '',
        verification_status: tenant.verification_status || '',
        admin_password:tenant.admin_password || ''

      })
    }
  }, [tenant])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => tenantsApi.create(data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['tenants'],      type: 'active' })
      qc.refetchQueries({ queryKey: ['tenant-stats'], type: 'active' })
      navigate('/admin/dashboard/tenants')
    },
    onError: (error) => {
      console.error('Error creating tenant:', error)
      alert('Failed to create tenant: ' + (error.response?.data?.message || error.message))
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => tenantsApi.update(id, data),
    onSuccess: () => {
      // ✅ FIX: refetch immediately so list shows updated status/verification
      qc.refetchQueries({ queryKey: ['tenants'],      type: 'active' })
      qc.refetchQueries({ queryKey: ['tenant-stats'], type: 'active' })
      qc.refetchQueries({ queryKey: ['tenant', id],   type: 'active' })
      navigate('/admin/dashboard/tenants')
    },
    onError: (error) => {
      console.error('Error updating tenant:', error)
      alert('Failed to update tenant: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('address.')) {
      const field = name.replace('address.', '')
      setFormData(prev => ({
        ...prev,
        registered_address: {
          ...prev.registered_address,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isNew) {
      createMutation.mutate(formData)
    } else {
      updateMutation.mutate(formData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading tenant...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard/tenants')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            ← Back to Tenants
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Create New Tenant' : 'Edit Tenant'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        
        {/* Company Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Company Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
              <input
                type="text"
                name="trading_name"
                value={formData.trading_name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="LOGISTICS">Logistics</option>
                <option value="TRANSPORT">Transport</option>
                <option value="FREIGHT">Freight</option>
                <option value="COURIER">Courier</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select
                name="company_size"
                value={formData.company_size}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Size</option>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
              <input
                type="text"
                name="primary_contact_person"
                value={formData.primary_contact_person}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="primary_contact_email"
                value={formData.primary_contact_email}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                name="primary_contact_phone"
                value={formData.primary_contact_phone}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status & Verification */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Status & Verification</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
              <select
                name="verification_status"
                value={formData.verification_status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Verification</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Registered Address</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
              <input
                type="text"
                name="address.line1"
                value={formData.registered_address.line1}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                name="address.city"
                value={formData.registered_address.city}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                name="address.country"
                value={formData.registered_address.country}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
              <input
                type="text"
                name="address.postal_code"
                value={formData.registered_address.postal_code}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="text"
                name="admin_password"
                value={formData.admin_password}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard/tenants')}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isNew ? 'Create Tenant' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

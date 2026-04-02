import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Phone, FileText,
  ClipboardList, Info as LucideInfo, History, Wallet,
  Loader2, AlertCircle, ChevronRight, Edit2, Trash2
} from 'lucide-react';
import { useCustomer, useDeleteCustomer } from '../../../queries/customers/customersQuery';
import { Badge, SectionHeader } from '../../Vehicles/Common/VehicleCommon';
import { CustomerFormModal } from '../CustomerFormModal';
import {
  CustomerOverview, CustomerAddresses, CustomerContacts,
  CustomerDocuments, CustomerContracts, CustomerNotes,
  CustomerCreditHistoryView
} from '../CustomerSubComponents';

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: Building2 },
  { id: 'ADDRESSES', label: 'Addresses', icon: MapPin },
  { id: 'CONTACTS', label: 'Contacts', icon: Phone },
  { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
  { id: 'CONTRACTS', label: 'Contracts', icon: ClipboardList },
  { id: 'NOTES', label: 'Notes', icon: LucideInfo },
  { id: 'CREDIT', label: 'Credit History', icon: History },
];

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab')?.toUpperCase() || 'OVERVIEW';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId.toLowerCase() });
  };
  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const deleteMutation = useDeleteCustomer();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => navigate('/tenant/dashboard/customers')
      });
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
        <span className="text-sm font-medium">Loading customer details...</span>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-red-400">
        <AlertCircle size={36} />
        <p className="text-sm font-semibold">Failed to load customer</p>
        <p className="text-xs text-gray-400">{error?.message || 'Error occurred while fetching'}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl mt-1">Retry</button>
      </div>
    </div>
  );

  if (!customer) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'OVERVIEW': return <CustomerOverview customer={customer} />;
      case 'ADDRESSES': return <CustomerAddresses customerId={id} />;
      case 'CONTACTS': return <CustomerContacts customerId={id} portalUser={customer.portal_user} />;
      case 'DOCUMENTS': return <CustomerDocuments customerId={id} />;
      case 'CONTRACTS': return <CustomerContracts customerId={id} />;
      case 'NOTES': return <CustomerNotes customerId={id} />;
      case 'CREDIT': return <CustomerCreditHistoryView customerId={id} currentLimit={customer.credit_limit} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto p-6 space-y-6">

        {/* Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => navigate('/tenant/dashboard/customers')}
              className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
              <ArrowLeft size={14} /> Customers
            </button>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-semibold text-[#172B4D]">{customer.legal_name}</span>
          </div>

          {isEditModalOpen && (
            <CustomerFormModal
              initial={customer}
              onClose={() => setIsEditModalOpen(false)}
              onSuccess={refetch}
            />
          )}
        </div>

        {/* Customer Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0052CC] shrink-0">
                <Building2 size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#172B4D] leading-tight capitalize">
                  {customer.legal_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-gray-100 text-gray-600 border-transparent font-mono uppercase text-[10px]">
                    {customer.customer_code}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                    {customer.customer_type}
                  </Badge>
                  <Badge className={customer.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                    {customer.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#172B4D] bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[500px]">
          <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-[12px] font-bold whitespace-nowrap border-b-2 transition-all
                  ${activeTab === tab.id
                    ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/30'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, Layers, 
  ChevronRight, Loader2, AlertCircle, 
  Hash, Scale, Maximize, Shield, 
  MapPin, Clock, Edit2, AlertTriangle, Thermometer
} from 'lucide-react';
import { useCargoDetail, useTripDetail, useOrderDetail } from '../../queries/orders/ordersQuery';
import { EditCargoModal } from './CargoModals';

// --- Shared Components ---
const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${className}`}>
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={18} className="text-[#0052CC]" />
    <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wider">{title}</h3>
  </div>
);

const InfoCard = ({ label, value, icon: Icon, accent = false }) => (
  <div className={`p-4 rounded-xl border transition-all ${accent ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className={`text-sm font-bold truncate ${accent ? 'text-blue-700' : 'text-[#172B4D]'}`}>{value || '—'}</p>
      </div>
    </div>
  </div>
);

// --- Main COMPONENT ---
export default function CargoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: item, isLoading, isError, error } = useCargoDetail(id);
  const { data: trip } = useTripDetail(item?.trip || item?.trip_id);
  const { data: order } = useOrderDetail(trip?.order || trip?.order_id);

  const handleBack = () => navigate('/tenant/dashboard/orders/cargo');

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (isError || !item) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#172B4D]">Cargo Item Not Found</h2>
      <button onClick={handleBack} className="mt-4 text-[#0052CC] font-bold hover:underline">Back to Cargo</button>
    </div>
  );

  const TYPE_COLORS = {
    HAZMAT: 'bg-red-50 text-red-600 border-red-100',
    PERISHABLE: 'bg-teal-50 text-teal-600 border-teal-100',
    FRAGILE: 'bg-amber-50 text-amber-600 border-amber-100',
    GENERAL: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full space-y-6">
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={handleBack} className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline transition-all">
            <ArrowLeft size={14} /> Cargo Inventory
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{item.item_code || item.id.slice(-8)}</span>
        </div>

        {/* Header Summary */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">


            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex items-start justify-between gap-4 text-left">
                <div>
                  <h1 className="text-2xl font-black text-[#172B4D] flex items-center gap-3">
                    {item.description || 'Unnamed Cargo Item'}
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200 uppercase tracking-wider">{item.item_code || item.id.slice(-6)}</span>
                  </h1>
                  <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    Commodity: {item.commodity_type || 'General Goods'} · Quantity: {item.quantity || 1}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge className={TYPE_COLORS[item.cargo_type] || TYPE_COLORS.GENERAL}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {item.cargo_type || 'General'}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                      <Package size={10} />
                      {item.cargo_type || 'GENERAL'}
                    </Badge>
                    {item.is_fragile && <Badge className="bg-amber-50 text-amber-600 border-amber-100">Fragile</Badge>}
                    {item.is_perishable && <Badge className="bg-teal-50 text-teal-600 border-teal-100">Perishable</Badge>}
                    {item.insurance_required && <Badge className="bg-purple-50 text-purple-600 border-purple-100">Insured</Badge>}
                  </div>
                </div>
                 <div>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 text-sm font-black text-[#0052CC] bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                  >
                    <Edit2 size={14} className="inline mr-2" /> Edit Item
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <InfoCard label="Weight" value={`${item.weight_kg || '—'} kg`} icon={Scale} accent />
                <InfoCard label="Volume" value={`${item.volume_cbm || '—'} m³`} icon={Layers} />
                <InfoCard label="Status" value={item.status} icon={Clock} />
                <InfoCard label="Stock Code" value={item.item_code} icon={Hash} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physical specs */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
             <SectionHeader icon={Maximize} title="Physical Dimensions" />
             <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Length</p>
                  <p className="text-lg font-black text-[#172B4D]">{item.length_cm} <span className="text-[10px] text-gray-400">cm</span></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Width</p>
                  <p className="text-lg font-black text-[#172B4D]">{item.width_cm} <span className="text-[10px] text-gray-400">cm</span></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Height</p>
                  <p className="text-lg font-black text-[#172B4D]">{item.height_cm} <span className="text-[10px] text-gray-400">cm</span></p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Stackable" value={item.stackable ? 'Yes' : 'No'} icon={Layers} />
                <InfoCard label="Orientation" value={item.orientation} icon={MapPin} />
             </div>
          </div>

          {/* Context & Requirements */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
             <SectionHeader icon={Shield} title="Shipping Context" />
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-blue-600" />
                    <div className="text-left">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Linked Trip</p>
                       <p className="text-sm font-bold text-blue-700">{trip?.trip_number || 'Unlinked'}</p>
                    </div>
                  </div>
                  {trip && <button onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)} className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><ArrowLeft className="rotate-180" size={16} /></button>}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Hash size={20} className="text-gray-400" />
                    <div className="text-left">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lorry Receipt (LR)</p>
                       <p className="text-sm font-bold text-gray-700">{order?.lr_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {item.hazardous_class && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-600" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Hazardous Classification</p>
                      <p className="text-sm font-bold text-red-700">Class {item.hazardous_class}</p>
                    </div>
                  </div>
                )}

                {item.is_perishable && (
                   <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-3 text-left">
                      <Thermometer size={20} className="text-teal-600" />
                      <div>
                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Temp Requirement</p>
                        <p className="text-sm font-bold text-teal-700">{item.temperature_range || 'Not Specified'}</p>
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>

      </div>
      
      {item && (
        <EditCargoModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          item={item} 
        />
      )}
    </div>
  );
}

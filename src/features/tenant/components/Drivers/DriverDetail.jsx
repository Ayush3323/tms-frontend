import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle,
  IdCard, Phone, Mail, MapPin, Calendar,
  FileText, ShieldAlert, GraduationCap,
  Stethoscope, BarChart2, AlertTriangle,
  CalendarCheck, Truck, Wallet, PauseCircle,
  PlayCircle, Pencil, ChevronRight
} from 'lucide-react';
import { useDriverDetail, useUpdateDriver } from '../../queries/drivers/driverCoreQuery';

// ── Style Maps ────────────────────────────────────────────────────────

const STATUS_STYLES = {
  ACTIVE:     { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  INACTIVE:   { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border border-gray-200' },
  ON_LEAVE:   { dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  SUSPENDED:  { dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  TERMINATED: { dot: 'bg-gray-600',   text: 'text-gray-700',   bg: 'bg-gray-100 border border-gray-300' },
};

const LICENSE_COLORS = {
  HMV:           'bg-purple-50 text-purple-700 border border-purple-200',
  LMV:           'bg-blue-50 text-blue-700 border border-blue-200',
  TRANSPORT:     'bg-orange-50 text-orange-700 border border-orange-200',
  MMV:           'bg-teal-50 text-teal-700 border border-teal-200',
  LEARNER:       'bg-yellow-50 text-yellow-700 border border-yellow-200',
  INTERNATIONAL: 'bg-green-50 text-green-700 border border-green-200',
};

const DRIVER_TYPE_COLORS = {
  PERMANENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  CONTRACT:  'bg-orange-50 text-orange-700 border border-orange-200',
  TEMPORARY: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  PART_TIME: 'bg-gray-50 text-gray-600 border border-gray-200',
};

// ── Helpers ───────────────────────────────────────────────────────────

const getExpiryColor = (dateStr) => {
  if (!dateStr) return 'text-gray-400';
  const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'text-red-600 font-semibold';
  if (diffDays < 90) return 'text-orange-500 font-semibold';
  return 'text-green-600 font-semibold';
};

const getDriverName = (driver) => {
  if (!driver) return '—';
  if (driver.first_name && driver.last_name)
    return `${driver.first_name} ${driver.last_name}`;
  return driver.employee_id;
};

const getInitials = (driver) => {
  if (!driver) return '??';
  if (driver.first_name && driver.last_name)
    return `${driver.first_name[0]}${driver.last_name[0]}`.toUpperCase();
  return driver.employee_id?.slice(0, 2).toUpperCase() ?? '??';
};

// ── Small reusable components ─────────────────────────────────────────

// Detail field — label + value
const DF = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-semibold text-[#172B4D] ${mono ? 'font-mono text-[#0052CC]' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

// Section header inside tab
const SectionHeader = ({ title }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
);

// ── Tab Definitions ───────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',   icon: IdCard },
  { id: 'documents',   label: 'Documents',  icon: FileText },
  { id: 'emergency',   label: 'Emergency',  icon: ShieldAlert },
  { id: 'training',    label: 'Training',   icon: GraduationCap },
  { id: 'medical',     label: 'Medical',    icon: Stethoscope },
  { id: 'performance', label: 'Performance',icon: BarChart2 },
  { id: 'incidents',   label: 'Incidents',  icon: AlertTriangle },
  { id: 'attendance',  label: 'Attendance', icon: CalendarCheck },
  { id: 'vehicle',     label: 'Vehicle',    icon: Truck },
  { id: 'salary',      label: 'Salary',     icon: Wallet },
];

// ── Overview Tab ──────────────────────────────────────────────────────
const OverviewTab = ({ driver }) => (
  <div className="space-y-6">

    {/* Quick Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Experience',  value: driver.years_of_experience != null ? `${driver.years_of_experience} yrs` : '—', color: 'text-[#0052CC]' },
        { label: 'Joined Date', value: driver.joined_date ?? '—',  color: 'text-gray-700' },
        { label: 'Exit Date',   value: driver.exit_date ?? '-', color: driver.exit_date ? 'text-red-500' : 'text-green-600' },
        { label: 'Created',     value: driver.created_at ? new Date(driver.created_at).toLocaleDateString('en-IN') : '—', color: 'text-gray-700' },
      ].map(s => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
          <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>

    {/* License Info */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <SectionHeader title="License Information" />
      </div>
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
        <DF label="License Number"     value={driver.license_number}    mono />
        <DF label="License Type"       value={driver.license_type_display ?? driver.license_type} />
        <DF label="Expiry Date"
          value={
            <span className={getExpiryColor(driver.license_expiry)}>
              {driver.license_expiry ?? '—'}
            </span>
          }
        />
        <DF label="Issuing Authority"  value={driver.license_issuing_authority} />
      </div>
    </div>

    {/* Employment Info */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <SectionHeader title="Employment Details" />
      </div>
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
        <DF label="Employee ID"   value={driver.employee_id}  mono />
        <DF label="Driver Type"   value={driver.driver_type_display ?? driver.driver_type} />
        <DF label="Status"        value={driver.status_display ?? driver.status} />
        <DF label="Joined Date"   value={driver.joined_date} />
      </div>
    </div>

    {/* User Info — backend fix hone pe auto fill hoga */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <SectionHeader title="Personal Information" />
      </div>
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
        <DF label="First Name"     value={driver.first_name} />
        <DF label="Last Name"      value={driver.last_name} />
        <DF label="Phone"          value={driver.phone} />
        <DF label="Email"          value={driver.email} />
        <DF label="Date of Birth"  value={driver.date_of_birth} />
        <DF label="Gender"         value={driver.gender} />
      </div>
    </div>

  </div>
);

// ── Placeholder Tab ───────────────────────────────────────────────────
// Documents, Emergency etc. — baad mein build karenge
const ComingSoonTab = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
    <div className="text-4xl mb-3 opacity-30">🚧</div>
    <p className="text-sm font-semibold">{label} tab — coming soon</p>
    <p className="text-xs mt-1">Yeh tab baad mein build hoga</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────
const DriverDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: driver, isLoading, isError, error } = useDriverDetail(id);
  const updateDriver = useUpdateDriver(id);

  const handleStatusToggle = () => {
    const newStatus = driver.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateDriver.mutate({ status: newStatus });
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin text-[#0052CC]" />
          <span className="text-sm">Loading driver...</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm font-medium text-red-500">Failed to load driver</p>
        <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
        <button
          onClick={() => navigate('/tenant/dashboard/drivers')}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]"
        >
          Back to Drivers
        </button>
      </div>
    );
  }

  const st = STATUS_STYLES[driver.status] ?? STATUS_STYLES.INACTIVE;

  return (
    <div className="p-6 space-y-5 bg-[#F8FAFC] min-h-screen">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button
          onClick={() => navigate('/tenant/dashboard/drivers')}
          className="flex items-center gap-1 hover:text-[#0052CC] transition-colors font-medium"
        >
          <ArrowLeft size={14} /> Drivers
        </button>
        <ChevronRight size={13} />
        <span className="text-[#172B4D] font-semibold">{getDriverName(driver)}</span>
      </div>

      {/* ── Hero Card ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-5 flex-wrap">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-xl bg-[#0052CC] flex flex-col items-center justify-center text-white flex-shrink-0">
            <span className="text-2xl font-black leading-none">{getInitials(driver)}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-70">Driver</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-[#172B4D]">{getDriverName(driver)}</h1>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {driver.status_display ?? driver.status}
              </span>
              <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${LICENSE_COLORS[driver.license_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {driver.license_type_display ?? driver.license_type}
              </span>
              <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${DRIVER_TYPE_COLORS[driver.driver_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {driver.driver_type_display ?? driver.driver_type}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <IdCard size={12} className="text-gray-400" />
                <span className="font-mono font-semibold">{driver.employee_id}</span>
              </span>
              {driver.phone && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone size={12} className="text-gray-400" /> {driver.phone}
                </span>
              )}
              {driver.email && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail size={12} className="text-gray-400" /> {driver.email}
                </span>
              )}
              {driver.joined_date && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={12} className="text-gray-400" /> Joined: {driver.joined_date}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 items-end">
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
              <Pencil size={13} /> Edit Driver
            </button>
            {driver.status === 'ACTIVE' && (
              <button
                onClick={handleStatusToggle}
                disabled={updateDriver.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <PauseCircle size={13} /> Suspend
              </button>
            )}
            {driver.status === 'SUSPENDED' && (
              <button
                onClick={handleStatusToggle}
                disabled={updateDriver.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
              >
                <PlayCircle size={13} /> Activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Tab Bar */}
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all border-b-2 whitespace-nowrap
                    ${isActive
                      ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/50'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'overview'    && <OverviewTab driver={driver} />}
          {activeTab === 'documents'   && <ComingSoonTab label="Documents" />}
          {activeTab === 'emergency'   && <ComingSoonTab label="Emergency Contacts" />}
          {activeTab === 'training'    && <ComingSoonTab label="Training Records" />}
          {activeTab === 'medical'     && <ComingSoonTab label="Medical Records" />}
          {activeTab === 'performance' && <ComingSoonTab label="Performance Metrics" />}
          {activeTab === 'incidents'   && <ComingSoonTab label="Incidents" />}
          {activeTab === 'attendance'  && <ComingSoonTab label="Attendance" />}
          {activeTab === 'vehicle'     && <ComingSoonTab label="Vehicle Assignments" />}
          {activeTab === 'salary'      && <ComingSoonTab label="Salary Structures" />}
        </div>
      </div>

    </div>
  );
};

export default DriverDetail;
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle,
  IdCard, Phone, Mail, Calendar,
  FileText, ShieldAlert, GraduationCap,
  Stethoscope, BarChart2, AlertTriangle,
  CalendarCheck, Truck, Wallet, PauseCircle,
  PlayCircle, Pencil, ChevronRight, X, ChevronDown, Save
} from 'lucide-react';
import { useDriverDetail, useUpdateDriver } from '../../queries/drivers/driverCoreQuery';
import DocumentsTab from './tabs/DocumentsTab';
import EmergencyTab from './tabs/EmergencyContactsTab';
import TrainingTab from './tabs/TrainingRecordsTab';
import MedicalTab from './tabs/MedicalRecordsTab';
import PerformanceTab from './tabs/PerformanceMetricsTab';
import IncidentsTab from './tabs/IncidentsTab';
import AttendanceTab from './tabs/AttendanceTab';
import VehicleTab from './tabs/VehicleAssignmentsTab';
import SalaryTab from './tabs/SalaryStructureTab';

import Label from './common/Label';
import Input from './common/Input';
import Select from './common/Select';
import ModalWrapper from './common/ModalWrapper';
import StatusBadge from './common/StatusBadge';
import { LoadingState, ErrorState } from './common/StateFeedback';

import {
  STATUS_STYLES,
  LICENSE_COLORS,
  DRIVER_TYPE_COLORS,
  LICENSE_TYPES,
  DRIVER_TYPES,
  DRIVER_STATUS_OPTIONS as DRIVER_STATUSES,
  GENDER_OPTIONS as GENDERS
} from './common/constants';
import { getDriverName, cleanObject, getExpiryColor } from './common/utils';

// Constants handled via common/constants.js

const EditDriverModal = ({ driver, onClose }) => {
  const updateDriver = useUpdateDriver();
  const u = driver.user ?? {};

  const [form, setForm] = useState({
    // user fields
    first_name: u.first_name ?? '',
    middle_name: u.middle_name ?? '',
    last_name: u.last_name ?? '',
    phone: u.phone ?? '',
    email: u.email ?? '',
    date_of_birth: u.date_of_birth ?? '',
    gender: u.gender ?? '',
    // driver fields
    license_number: driver.license_number ?? '',
    license_type: driver.license_type ?? '',
    license_expiry: driver.license_expiry ?? '',
    license_issuing_authority: driver.license_issuing_authority ?? '',
    driver_type: driver.driver_type ?? '',
    status: driver.status ?? 'ACTIVE',
    joined_date: driver.joined_date ?? '',
    years_of_experience: driver.years_of_experience ?? '',
  });
  const [error, setError] = useState('');

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.first_name || !form.last_name) return setError('First and last name are required.');

    const { first_name, middle_name, last_name, phone, email, date_of_birth, gender, ...driverFields } = form;

    updateDriver.mutate({
      id: driver.id,
      data: {
        ...cleanObject(driverFields),
        user: cleanObject({ first_name, middle_name, last_name, phone, email, date_of_birth, gender }),
      },
    }, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update driver.'),
    });
  };

  return (
    <ModalWrapper
      title="Edit Driver"
      description="Update driver information"
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={updateDriver.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {updateDriver.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}

        {/* Personal Info */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Personal Information</p>
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>First Name</Label><Input value={form.first_name} onChange={set('first_name')} placeholder="e.g. Rajesh" /></div>
            <div><Label required>Last Name</Label><Input value={form.last_name} onChange={set('last_name')} placeholder="e.g. Kumar" /></div>
            <div className="col-span-2"><Label>Middle Name</Label><Input value={form.middle_name} onChange={set('middle_name')} placeholder="e.g. Kumar" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={set('phone')} placeholder="e.g. +919876543210" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} placeholder="e.g. driver@example.com" /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} /></div>
            <div><Label>Gender</Label>
              <Select value={form.gender} onChange={set('gender')}>
                <option value="">— Select —</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </div>
          </div>
        </div>

        {/* License Info */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">License Information</p>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>License Number</Label><Input value={form.license_number} onChange={set('license_number')} placeholder="e.g. DL-01-20200001234" /></div>
            <div><Label>License Type</Label>
              <Select value={form.license_type} onChange={set('license_type')}>
                <option value="">— Select —</option>
                {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.license_expiry} onChange={set('license_expiry')} /></div>
            <div><Label>Issuing Authority</Label><Input value={form.license_issuing_authority} onChange={set('license_issuing_authority')} placeholder="e.g. RTO Delhi" /></div>
          </div>
        </div>

        {/* Employment Info */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Employment Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Driver Type</Label>
              <Select value={form.driver_type} onChange={set('driver_type')}>
                <option value="">— Select —</option>
                {DRIVER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onChange={set('status')}>
                {DRIVER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
            </div>
            <div><Label>Joined Date</Label><Input type="date" value={form.joined_date} onChange={set('joined_date')} /></div>
            <div><Label>Years of Experience</Label><Input type="number" min="0" step="1" value={form.years_of_experience} onChange={set('years_of_experience')} placeholder="e.g. 5" /></div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// getDriverName and getExpiryColor handled via common/utils.js

const getInitials = (driver) => {
  if (!driver) return '??';
  const u = driver.user ?? driver;
  if (u.first_name && u.last_name)
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  return driver.employee_id?.slice(0, 2).toUpperCase() ?? '??';
};

const DF = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-semibold text-[#172B4D] ${mono ? 'font-mono text-[#0052CC]' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

const SectionHeader = ({ title }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: IdCard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'performance', label: 'Performance', icon: BarChart2 },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'vehicle', label: 'Vehicle', icon: Truck },
  { id: 'salary', label: 'Salary', icon: Wallet },
];

const OverviewTab = ({ driver }) => (
  <div className="space-y-6">

    {/* Personal Info — 5 fields → grid-cols-5 */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <SectionHeader title="Personal Information" />
      </div>
      <div className="p-5 grid grid-cols-5 gap-5">
        <DF label="Name" value={getDriverName(driver)} />
        <DF label="Phone" value={driver.user?.phone ?? driver.phone} />
        <DF label="Email" value={driver.user?.email ?? driver.email} />
        <DF label="Date of Birth" value={driver.user?.date_of_birth ?? driver.date_of_birth} />
        <DF label="Gender" value={driver.user?.gender ?? driver.gender} />
      </div>
    </div>

    {/* License Info — 4 fields → grid-cols-4 */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <SectionHeader title="License Information" />
      </div>
      <div className="p-5 grid grid-cols-5 gap-5">
        <DF label="License Number" value={driver.license_number} mono />
        <DF label="License Type" value={driver.license_type_display ?? driver.license_type} />
        <DF label="Expiry Date"
          value={
            <span className={getExpiryColor(driver.license_expiry)}>
              {driver.license_expiry ?? '—'}
            </span>
          }
        />
        <DF label="Issuing Authority" value={driver.license_issuing_authority} />
      </div>
    </div>

    {/* Employment Info — 5 fields → grid-cols-5 */}
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <SectionHeader title="Employment Details" />
      </div>
      <div className="p-5 grid grid-cols-5 gap-5">
        <DF label="Employee ID" value={driver.employee_id} mono />
        <DF label="Driver Type" value={driver.driver_type_display ?? driver.driver_type} />
        <DF label="Status" value={driver.status_display ?? driver.status} />
        <DF label="Joined Date" value={driver.joined_date} />
        <DF label="Experience" value={driver.years_of_experience != null ? `${driver.years_of_experience} yrs` : '—'} />
      </div>
    </div>

  </div>
);

const ComingSoonTab = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
    <div className="text-4xl mb-3 opacity-30">🚧</div>
    <p className="text-sm font-semibold">{label} tab — coming soon</p>
    <p className="text-xs mt-1">Yeh tab baad mein build hoga</p>
  </div>
);

const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  const { data: driver, isLoading, isError, error } = useDriverDetail(id);
  const updateDriver = useUpdateDriver();

  const handleStatusToggle = () => {
    const newStatus = driver.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateDriver.mutate({ id: driver.id, data: { status: newStatus } });
  };

  if (isLoading) return <LoadingState message="Loading driver..." />;

  if (isError) return (
    <ErrorState
      message="Failed to load driver"
      error={error?.response?.data?.detail || error?.message}
      onRetry={() => navigate('/tenant/dashboard/drivers')}
    />
  );

  const st = STATUS_STYLES[driver.status] ?? STATUS_STYLES.INACTIVE;

  return (
    <div className="p-6 space-y-5 bg-[#F8FAFC] min-h-screen">
      {editOpen && <EditDriverModal driver={driver} onClose={() => setEditOpen(false)} />}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button onClick={() => navigate('/tenant/dashboard/drivers')}
          className="flex items-center gap-1 hover:text-[#0052CC] transition-colors font-medium">
          <ArrowLeft size={14} /> Drivers
        </button>
        <ChevronRight size={13} />
        <span className="text-[#172B4D] font-semibold">{getDriverName(driver)}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-xl bg-[#0052CC] flex flex-col items-center justify-center text-white shrink-0">
            <span className="text-2xl font-black leading-none">{getInitials(driver)}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-70">Driver</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-[#172B4D]">{getDriverName(driver)}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge
                label={driver.status_display ?? driver.status}
                styles={STATUS_STYLES[driver.status]}
              />
              <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${LICENSE_COLORS[driver.license_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {driver.license_type_display ?? driver.license_type}
              </span>
              <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${DRIVER_TYPE_COLORS[driver.driver_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {driver.driver_type_display ?? driver.driver_type}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <IdCard size={12} className="text-gray-400" />
                <span className="font-mono font-semibold">{driver.employee_id}</span>
              </span>
              {(driver.user?.phone ?? driver.phone) && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone size={12} className="text-gray-400" /> {driver.user?.phone ?? driver.phone}
                </span>
              )}
              {(driver.user?.email ?? driver.email) && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail size={12} className="text-gray-400" /> {driver.user?.email ?? driver.email}
                </span>
              )}
              {driver.joined_date && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={12} className="text-gray-400" /> Joined: {driver.joined_date}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {activeTab === 'overview' && (
              <button onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
                <Pencil size={13} /> Edit Driver
              </button>
            )}
            {driver.status === 'ACTIVE' && (
              <button onClick={handleStatusToggle} disabled={updateDriver.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50">
                <PauseCircle size={13} /> Suspend
              </button>
            )}
            {driver.status === 'SUSPENDED' && (
              <button onClick={handleStatusToggle} disabled={updateDriver.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50">
                <PlayCircle size={13} /> Activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all border-b-2 whitespace-nowrap
                    ${isActive
                      ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/50'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}>
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-5">
          {activeTab === 'overview' && <OverviewTab driver={driver} />}
          {activeTab === 'documents' && <DocumentsTab driverId={driver.id} />}
          {activeTab === 'emergency' && <EmergencyTab driverId={driver.id} />}
          {activeTab === 'training' && <TrainingTab driverId={driver.id} />}
          {activeTab === 'medical' && <MedicalTab driverId={driver.id} />}
          {activeTab === 'performance' && <PerformanceTab driverId={driver.id} />}
          {activeTab === 'incidents' && <IncidentsTab driverId={driver.id} />}
          {activeTab === 'attendance' && <AttendanceTab driverId={driver.id} />}
          {activeTab === 'vehicle' && <VehicleTab driverId={driver.id} />}
          {activeTab === 'salary' && <SalaryTab driverId={driver.id} />}
        </div>
      </div>

    </div>
  );
};

export default DriverDetail;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, RefreshCw, Eye, EyeOff,
  ChevronDown, Loader2, AlertCircle,
  IdCard, ArrowUpDown, ArrowUp, ArrowDown,
  X, User, Car,
} from 'lucide-react';
import { useDrivers, useRegisterDriver } from '../../queries/drivers/driverCoreQuery';

import Label from './common/Label';
import Input from './common/Input';
import Select from './common/Select';
import ModalWrapper from './common/ModalWrapper';
import StatusBadge from './common/StatusBadge';
import { LoadingState, ErrorState, EmptyState, GenericTableShimmer } from './common/StateFeedback';

import {
  LICENSE_TYPES,
  DRIVER_TYPES,
  DRIVER_STATUS_OPTIONS as DRIVER_STATUS,
  GENDER_OPTIONS,
  STATUS_STYLES,
  LICENSE_COLORS,
  DRIVER_TYPE_COLORS,
} from './common/constants';
import { getDriverName, cleanObject, getExpiryColor, formatError, getInitials, getAvatarColor } from './common/utils';

// ── Constants handled via centralized common/constants.js ─────────────

// getDriverName handled via common/utils.js

const SortIcon = ({ field, ordering }) => {
  if (ordering === field) return <ArrowUp size={12} className="text-[#0052CC]" />;
  if (ordering === `-${field}`) return <ArrowDown size={12} className="text-[#0052CC]" />;
  return <ArrowUpDown size={12} className="text-gray-300" />;
};

const SectionTitle = ({ Icon, title, subtitle }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-[#0052CC]/10 flex items-center justify-center">
      <Icon size={14} className="text-[#0052CC]" />
    </div>
    <div>
      <p className="text-sm font-black text-[#172B4D]">{title}</p>
      {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// ── ADD DRIVER MODAL START ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
const AddDriverModal = ({ onClose }) => {
  const [userForm, setUserForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    phone: '', middle_name: '', date_of_birth: '', gender: '',
  });
  const [driverForm, setDriverForm] = useState({
    license_number: '', license_type: '', license_expiry: '',
    license_issuing_authority: '', driver_type: 'PERMANENT',
    years_of_experience: '', joined_date: '', status: 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const registerDriver = useRegisterDriver();
  const setUser = (f) => (e) => setUserForm(p => ({ ...p, [f]: e.target.value }));
  const setDriver = (f) => (e) => setDriverForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    const phoneRegex = /^[6-9]\d{9}$/;

    // 1. Basic Required Fields
    if (!userForm.first_name || !userForm.last_name) return setError('First and last name are required.');
    if (!userForm.email)      return setError('Email is required.');
    if (!userForm.password)   return setError('Password is required.');
    
    // 2. Name Length Validation (Max 100)
    if (userForm.first_name.length > 100) return setError('First name cannot exceed 100 characters.');
    if (userForm.last_name.length > 100) return setError('Last name cannot exceed 100 characters.');
    if (userForm.middle_name && userForm.middle_name.length > 100) return setError('Middle name cannot exceed 100 characters.');

    // 3. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) return setError('Please enter a valid email address.');

    // 4. Phone Validation (Optional but validate if filled)
    let p = userForm.phone.replace(/\s+/g, '');
    if (p) {
      if (p.startsWith('+91')) p = p.slice(3);
      if (!phoneRegex.test(p)) return setError("Enter valid 10-digit phone number");
      p = `+91${p}`;
    }

    // 5. Age Validation (18+)
    if (userForm.date_of_birth) {
      const birthDate = new Date(userForm.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) return setError('Driver must be at least 18 years old.');
    }

    if (!driverForm.license_number) return setError('License number is required.');
    if (!driverForm.license_type)   return setError('License type is required.');
    if (!driverForm.license_expiry) return setError('License expiry date is required.');
    if (!driverForm.joined_date)    return setError('Joined date is required.');

    // Auto-generate username from email prefix + short unique suffix
    const emailPrefix = userForm.email.split('@')[0];
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const generatedUsername = `${emailPrefix}_${uniqueSuffix}`.substring(0, 100);

    registerDriver.mutate({
      driver: cleanObject({
        ...driverForm,
        years_of_experience: driverForm.years_of_experience === '' ? 0 : parseInt(driverForm.years_of_experience, 10)
      }),
      user: cleanObject({ ...userForm, phone: p, username: generatedUsername }),
    }, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Register New Driver"
      description="Creates user account + driver profile in one step"
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={registerDriver.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {registerDriver.isPending ? <><Loader2 size={14} className="animate-spin" /> Registering...</> : <><Plus size={14} /> Register Driver</>}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        {/* User Info */}
        <div>
          <SectionTitle Icon={User} title="User Information" subtitle="Login credentials and personal details" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>First Name</Label><Input placeholder="e.g. John" value={userForm.first_name} onChange={setUser('first_name')} /></div>
            <div><Label required>Last Name</Label><Input placeholder="e.g. Smith" value={userForm.last_name} onChange={setUser('last_name')} /></div>
            <div><Label>Middle Name</Label><Input placeholder="e.g. Kumar" value={userForm.middle_name} onChange={setUser('middle_name')} /></div>
            <div><Label required>Email</Label><Input type="email" placeholder="e.g. john@company.com" value={userForm.email} onChange={setUser('email')} /></div>
            <div><Label required>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={userForm.password}
                  onChange={setUser('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div><Label>Phone</Label><Input placeholder="e.g. 9876543210 (Optional)" value={userForm.phone} onChange={setUser('phone')} /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={userForm.date_of_birth} onChange={setUser('date_of_birth')} /></div>
            <div><Label>Gender</Label>
              <Select value={userForm.gender} onChange={setUser('gender')}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g.replaceAll('_', ' ')}</option>)}
              </Select>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100" />
        {/* Driver Info */}
        <div>
          <SectionTitle Icon={Car} title="Driver Information" subtitle="License and employment details" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>License Number</Label><Input placeholder="e.g. MH-01-20200012345" value={driverForm.license_number} onChange={setDriver('license_number')} /></div>
            <div><Label required>License Type</Label>
              <Select value={driverForm.license_type} onChange={setDriver('license_type')}>
                <option value="">Select type</option>
                {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label required>Expiry Date</Label><Input type="date" value={driverForm.license_expiry} onChange={setDriver('license_expiry')} /></div>
            <div className="col-span-2"><Label>Issuing Authority</Label><Input placeholder="e.g. RTO Delhi (Optional)" value={driverForm.license_issuing_authority} onChange={setDriver('license_issuing_authority')} /></div>
            <div><Label>Driver Type</Label>
              <Select value={driverForm.driver_type} onChange={setDriver('driver_type')}>
                {DRIVER_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
              </Select>
            </div>
            <div><Label>Years of Experience</Label><Input type="number" min="0" placeholder="e.g. 5" value={driverForm.years_of_experience} onChange={setDriver('years_of_experience')} /></div>
            <div><Label required>Joined Date</Label><Input type="date" value={driverForm.joined_date} onChange={setDriver('joined_date')} /></div>
            <div><Label>Status</Label>
              <Select value={driverForm.status} onChange={setDriver('status')}>
                {DRIVER_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
// ─────────────────────────────────────────────────────────────────────
// ── ADD DRIVER MODAL END ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Main Component ────────────────────────────────────────────────────
const DriversList = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType] = useState('');
  const [licFilter, setLic] = useState('');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [ordering, setOrdering] = useState('-id');
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);  // ← Add Driver modal
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useDrivers({
    page: currentPage,
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { driver_type: typeFilter }),
    ...(licFilter && { license_type: licFilter }),
    ...(search && { search }),
    ...(joinedFrom && { joined_date__gte: joinedFrom }),
    ...(joinedTo && { joined_date__lte: joinedTo }),
    ...(ordering && { ordering }),
  });

  const drivers = data?.results ?? [];
  const total = data?.count ?? drivers.length;
  const active = drivers.filter(d => d.status === 'ACTIVE').length;
  const inactive = drivers.filter(d => d.status === 'INACTIVE').length;
  const suspended = drivers.filter(d => d.status === 'SUSPENDED').length;

  const handleSort = (field) => {
    setOrdering(prev => prev === field ? `-${field}` : field);
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setType(''); setLic('');
    setJoinedFrom(''); setJoinedTo(''); setOrdering(''); setCurrentPage(1);
  };

  const SortableTH = ({ label, field }) => (
    <th
      onClick={() => handleSort(field)}
      className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-[#0052CC] select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon field={field} ordering={ordering} />
      </div>
    </th>
  );

  const COLUMNS = [
    {
      header: 'Driver',
      sortField: 'employee_id',
      render: d => {
        const name = getDriverName(d);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] tracking-wider bg-blue-50 text-[#0052CC] border border-blue-100 font-syne">
              {getInitials(name)}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-[13px] leading-none">{name}</div>
              <div className="text-[11px] text-gray-400 font-mono mt-1 uppercase">{d.employee_id}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'License No.',
      render: d => (
        <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          {d.license_number ?? '—'}
        </span>
      ),
    },
    {
      header: 'License Type',
      render: d => (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-100">
          {d.license_type_display ?? d.license_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Driver Type',
      render: d => (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200">
          {d.driver_type_display ?? d.driver_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'License Expiry',
      render: d => (
        <span className={`text-[12px] font-mono ${getExpiryColor(d.license_expiry)}`}>
          {d.license_expiry ?? '—'}
        </span>
      ),
    },
    {
      header: 'Experience',
      render: d => (
        <span className="text-gray-600 font-medium text-[12px]">
          {d.years_of_experience != null ? `${d.years_of_experience} yrs` : '—'}
        </span>
      ),
    },
    {
      header: 'Joined',
      sortField: 'joined_date',
      render: d => (
        <span className="text-gray-600 font-medium text-[12px]">{d.joined_date ?? '—'}</span>
      ),
    },
    {
      header: 'Status',
      render: d => (
        <StatusBadge
          label={d.status_display ?? d.status}
          styles={STATUS_STYLES[d.status]}
        />
      ),
    },
    {
      header: 'Actions',
      render: d => (
        <button
          onClick={() => navigate(`/tenant/dashboard/drivers/${d.id}`)}
          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all font-sans"
        >
          <Eye size={12} /> View
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* ── Add Driver Modal ── */}
      {addOpen && (
        <AddDriverModal onClose={() => setAddOpen(false)} />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Drivers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered drivers — click{' '}
            <span className="text-[#0052CC] font-semibold">View</span> for complete profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} /> Export
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Driver
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">

        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Drivers:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
                <span className="text-[18px] font-black text-orange-500">{inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Suspended:</span>
                <span className="text-[18px] font-black text-red-500">{suspended}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Filters Row 1 ── */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
          <div className="flex gap-3 items-center flex-wrap flex-1">
            <div className="relative min-w-40">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee ID, license number..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50 font-medium transition-all"
              />
            </div>
            {[
              { val: statusFilter, set: setStatus, opts: DRIVER_STATUS, ph: 'All Status' },
              { val: typeFilter, set: setType, opts: DRIVER_TYPES, ph: 'All Types' },
              { val: licFilter, set: setLic, opts: LICENSE_TYPES, ph: 'All Licenses' },
            ].map(({ val, set, opts, ph }) => (
              <div key={ph} className="relative">
                <select
                  value={val}
                  onChange={e => { set(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer font-medium transition-all"
                >
                  <option value="">{ph}</option>
                  {opts.map(o => <option key={o} value={o}>{o.replaceAll('_', ' ')}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ))}
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 bg-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Joined:</span>
              <input
                type="date"
                value={joinedFrom}
                onChange={e => setJoinedFrom(e.target.value)}
                className="px-2 py-1.5 text-sm bg-transparent border-none focus:ring-0 text-gray-600 font-medium cursor-pointer"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={joinedTo}
                onChange={e => setJoinedTo(e.target.value)}
                className="px-2 py-1.5 text-sm bg-transparent border-none focus:ring-0 text-gray-600 font-medium cursor-pointer"
              />
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
            >
              <RefreshCw size={13} /> Reset
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Previous
            </button>
            <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
              {currentPage}
            </div>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!data?.next || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Next
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <GenericTableShimmer 
            rows={10} 
            columns={[
              { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-40', type: 'multiline', subWidth: 'w-16' }, // Name/ID
              { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32', type: 'badge' }, // License No
              { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-28', type: 'badge' }, // License Type
              { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-28', type: 'badge' }, // Driver Type
              { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Expiry
              { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Exp
              { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Joined
              { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Status
              { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-24', align: 'right', type: 'action' }, // Actions
            ]}
          />
        )}

        {/* Error */}
        {isError && (
          <ErrorState
            message="Failed to load drivers"
            error={error?.response?.data?.detail || error?.message}
            onRetry={() => refetch()}
          />
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            {drivers.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {COLUMNS.map(c => (
                      c.sortField
                        ? <SortableTH key={c.header} label={c.header} field={c.sortField} />
                        : <th key={c.header} className="px-4 py-4">{c.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {drivers.map(d => (
                    <tr key={d.id} className="hover:bg-[#f7f9ff] transition-colors group">
                      {COLUMNS.map(c => (
                        <td key={c.header} className="px-4 py-3 whitespace-nowrap align-middle">
                          {c.render(d)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon={IdCard}
                title="No drivers found"
                description="Click Add Driver to register a new one"
              />
            )}
          </div>
        )}
        {/* Footer */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white shrink-0">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{drivers.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> drivers
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversList;
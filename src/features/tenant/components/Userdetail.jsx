import React, { useState } from 'react';
import { Search, RotateCcw, Plus, Trash2, Edit, X, User as UserIcon, Mail, Lock, Phone, Activity, Shield, Clock, Power, ShieldAlert, Monitor } from 'lucide-react';
import { 
  useLockUser, useUnlockUser, useUserSessions, useUserActivityLog, useAssignRoles
} from '../queries/users/userActionQuery';
import {useUsers, useDeleteUser, useUpdateUser, useCreateUser } from '../queries/users/userQuery';
import { useRoles } from '../queries/users/rolesPermissionsQuery';
import { useRevokeSession } from '../queries/users/sessionsQuery';

// Subcomponents for cleaner modularity inside the modal
const UserSessionsTab = ({ userId }) => {
  const { data: sessions, isLoading, isError } = useUserSessions(userId);
  const revokeMutation = useRevokeSession();

  if (isLoading) return <div className="p-4 text-center text-gray-500 animate-pulse">Loading sessions...</div>;
  if (isError) return <div className="p-4 text-center text-red-500">Failed to load sessions.</div>;
  if (!sessions || sessions.length === 0) return <div className="p-4 text-center text-gray-500">No active sessions found.</div>;

  return (
    <div className="space-y-3">
      {sessions.map(session => (
        <div key={session.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div>
            <p className="text-sm font-bold text-[#172B4D]">{session.device_info || 'Unknown Device'}</p>
            <p className="text-xs text-gray-400">IP: {session.ip_address} • Last active: {new Date(session.last_active).toLocaleString()}</p>
          </div>
          <button 
            onClick={() => revokeMutation.mutate(session.id)}
            disabled={revokeMutation.isPending}
            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded hover:bg-red-100 transition-colors"
          >
            Revoke
          </button>
        </div>
      ))}
    </div>
  );
};

const UserActivityTab = ({ userId }) => {
  const { data: activities, isLoading, isError } = useUserActivityLog(userId, { limit: 10 });

  if (isLoading) return <div className="p-4 text-center text-gray-500 animate-pulse">Loading activities...</div>;
  if (isError) return <div className="p-4 text-center text-red-500">Failed to load activities.</div>;
  if (!activities || activities.results?.length === 0) return <div className="p-4 text-center text-gray-500">No recent activity.</div>;

  return (
    <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.75 before:w-0.5 before:bg-gray-100">
      {activities.results?.map((log, idx) => (
        <div key={idx} className="relative flex gap-4 pr-4">
          <div className="w-8 h-8 bg-blue-50 border-2 border-white rounded-full flex items-center justify-center text-[#0052CC] z-10 shrink-0">
            <Activity size={14} />
          </div>
          <div className="pt-1.5 pb-3">
            <p className="text-sm font-bold text-[#172B4D]">{log.action}</p>
            <p className="text-xs text-gray-500 mt-0.5">{log.details || 'No additional details'}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(log.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Userdetail = () => {
  const { data: usersData, isLoading, isError, error } = useUsers({ page: 1 });
  const { data: rolesData } = useRoles();
  
  const deleteMutation = useDeleteUser();
  const updateMutation = useUpdateUser();
  const createMutation = useCreateUser();
  const lockMutation = useLockUser();
  const unlockMutation = useUnlockUser();
  const assignRoleMutation = useAssignRoles();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'sessions', 'activities'
  const [formErrors, setFormErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    phone: '',
    role: ''
  });

  const stats = [
    { label: "TOTAL USERS", value: usersData?.count || 0, sub: "All registered users", border: "border-blue-100" },
    { label: "ACTIVE DIRECTORY", value: usersData?.results?.filter(u => !u.is_locked)?.length || 0, sub: "Currently Unlocked", border: "border-green-100" },
    { label: "LOCKED ACCOUNTS", value: usersData?.results?.filter(u => u.is_locked)?.length || 0, sub: "Requires attention", border: "border-red-100" }
  ];

  const users = usersData?.results || [];
  const roles = rolesData?.results || [];

  const handleOpenModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setActiveTab('profile'); // Reset tab on open
    if (type === 'edit' && user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        role: user.roles?.[0]?.id || ''
      });
    } else if (type === 'create') {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        phone: '',
        role: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedUser(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) errors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) errors.email = "Please enter a valid email address";
    if (formData.phone && !/^\+?[0-9\s\-()]{10,15}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (modalType === 'create') {
      const { role, ...payload } = formData;
      if (!payload.phone) delete payload.phone;
      
      createMutation.mutate(payload, { 
        onSuccess: (data) => {
          if (role && data?.id) {
            assignRoleMutation.mutate({ id: data.id, role_ids: [role] });
          }
          handleCloseModal();
        } 
      });
    } else if (modalType === 'edit') {
      const payload = { ...formData };
      const role = payload.role;
      delete payload.role;
      delete payload.username;
      delete payload.password;
      delete payload.email;
      if (!payload.phone) delete payload.phone;

      updateMutation.mutate({ id: selectedUser.id, payload }, { 
        onSuccess: () => {
          if (role) {
            assignRoleMutation.mutate({ id: selectedUser.id, role_ids: [role] });
          }
          handleCloseModal();
        } 
      });
    }
  };
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleLock = (user) => {
    if (user.is_locked) unlockMutation.mutate(user.id);
    else lockMutation.mutate({ id: user.id, payload: { reason: "Admin requested lock" } });
  };

  // Shimmer Components
  const ShimmerRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div><div className="h-3 bg-gray-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
      <td className="px-6 py-4"><div className="flex gap-2 justify-end"><div className="h-8 w-8 bg-gray-100 rounded"></div><div className="h-8 w-8 bg-gray-100 rounded"></div></div></td>
    </tr>
  );

  const ShimmerCard = () => (
    <div className="bg-white p-6 rounded-xl border-b-4 border-gray-50 shadow-sm animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-16 mb-4"></div>
      <div className="h-8 bg-gray-300 rounded w-10 mb-2"></div>
      <div className="h-3 bg-gray-100 rounded w-24"></div>
    </div>
  );

  return (
    <main className="p-8 bg-[#F4F5F7] min-h-screen relative">
      {/* Page Title Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">Tenant Users</h2>
          <p className="text-gray-500 text-sm">Manage user accounts, roles, permissions, and security</p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="bg-[#0052CC] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-colors shadow-sm"
        >
          <Plus size={18} /> New User
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isLoading
          ? Array(3).fill(0).map((_, i) => <ShimmerCard key={i} />)
          : stats.map((stat, i) => (
            <div key={i} className={`bg-white p-6 rounded-xl border-b-4 ${stat.border} shadow-sm transition-transform hover:scale-[1.02]`}>
              <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${stat.textColor || 'text-[#172B4D]'}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
            </div>
          ))
        }
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 font-medium">
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <ShimmerRow key={i} />)
              ) : isError ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-red-500">Error: {error.message}</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={`transition-colors group ${user.is_locked ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleOpenModal('view', user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.is_locked ? 'bg-red-100 text-red-600' : 'bg-[#0052CC] text-white'}`}>
                          {user.first_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold transition-colors ${user.is_locked ? 'text-red-700' : 'text-[#172B4D] group-hover:text-[#0052CC]'}`}>
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_locked ? (
                        <span className="bg-red-50 text-red-600 flex items-center gap-1 w-max text-[10px] font-bold px-2 py-1 rounded border border-red-100"><ShieldAlert size={10} /> LOCKED</span>
                      ) : (
                        <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded border border-green-100">ACTIVE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-gray-400 font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          title={user.is_locked ? "Unlock User" : "Lock User"}
                          onClick={() => handleToggleLock(user)}
                          className={`p-1.5 rounded border transition-colors ${user.is_locked ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-orange-500 border-orange-200 hover:bg-orange-50'}`}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', user)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500 border border-red-100 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-xl font-bold text-[#172B4D]">
                {modalType === 'create' ? 'Create New User' : modalType === 'edit' ? 'Update User' : 'User Details'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {modalType === 'view' ? (
                <div className="flex flex-col min-h-full">
                  {/* Top Profile Banner */}
                  <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-5 shrink-0">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm ${selectedUser?.is_locked ? 'bg-red-500' : 'bg-[#0052CC]'}`}>
                      {selectedUser?.first_name?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-bold text-[#172B4D]">{selectedUser?.first_name} {selectedUser?.last_name}</h4>
                        {selectedUser?.is_locked && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">LOCKED</span>}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">@{selectedUser?.username}</p>
                    </div>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="bg-white border-b border-gray-100 px-6 flex gap-6 shrink-0">
                    <button onClick={() => setActiveTab('profile')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Profile Info</button>
                    <button onClick={() => setActiveTab('sessions')} className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'sessions' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Monitor size={14} /> Active Sessions</button>
                    <button onClick={() => setActiveTab('activities')} className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'activities' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Clock size={14} /> Activity Log</button>
                  </div>

                  {/* Tab Panes */}
                  <div className="p-6">
                    {activeTab === 'profile' && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-8 animate-in fade-in">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={12}/> Email Address</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1.5">{selectedUser?.email}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Phone size={12}/> Phone Number</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1.5">{selectedUser?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Shield size={12}/> Assigned Role</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1.5">{selectedUser?.role?.name || 'Standard User'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Created</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1.5">{new Date(selectedUser?.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {activeTab === 'sessions' && <UserSessionsTab userId={selectedUser?.id} />}
                    {activeTab === 'activities' && <UserActivityTab userId={selectedUser?.id} />}
                  </div>
                </div>
              ) : (
                <form id="adminForm" onSubmit={handleSubmit} className="p-6 space-y-5 bg-white m-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172B4D]">First Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="text"
                          name="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all cursor-text"
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172B4D]">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all cursor-text"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172B4D]">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">@</span>
                      <input
                        type="text"
                        name="username"
                        required
                        disabled={modalType === 'edit'}
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                        placeholder="johndoe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172B4D]">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC] transition-all cursor-text`}
                        placeholder="john@tenant.com"
                      />
                    </div>
                    {formErrors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.email}</p>}
                  </div>

                  {modalType === 'create' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172B4D]">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="password"
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172B4D] flex items-center gap-1">Role <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] cursor-pointer"
                      >
                        <option value="">Select a role...</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172B4D] flex items-center gap-1">Phone <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC] transition-all`}
                          placeholder="+1 234 567 890"
                        />
                      </div>
                      {formErrors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.phone}</p>}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 shrink-0">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors">
                {modalType === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalType !== 'view' && (
                <button
                  type="submit"
                  form="adminForm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {modalType === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </main>
  );
};

export default Userdetail;


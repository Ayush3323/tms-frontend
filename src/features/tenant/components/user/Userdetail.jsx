import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Plus, User, Mail, Lock, Phone, X, Edit, Calendar, UserCircle2, ShieldAlert, CheckCircle2, Unlock } from 'lucide-react';
import { useUsers, useUpdateUser, useCreateUser, useUser } from '../../queries/users/userQuery';
import { useLockUser, useUnlockUser } from '../../queries/users/userActionQuery';
import { useEffect } from 'react';

const UserDetail = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: usersData, isLoading, isError, error } = useUsers({
    page: currentPage,
    page_size: 10,
    search: debouncedSearch
  });
  const updateMutation = useUpdateUser();
  const createMutation = useCreateUser();
  const lockMutation = useLockUser();
  const unlockMutation = useUnlockUser();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockFormData, setLockFormData] = useState({
    reason: 'Account locked by administrator',
    duration_minutes: 30
  });

  // Fetch full user details when a user is selected
  const { data: fullUserData, isLoading: isUserLoading } = useUser(selectedUser?.id);

  const [formErrors, setFormErrors] = useState({});
  const [lastSyncedId, setLastSyncedId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'MALE',
    account_type: 'EMPLOYEE',
    status: 'ACTIVE'
  });

  const users = usersData?.results || [];
  const activeUsersCount = users.filter(u => u.status === 'ACTIVE').length;

  const stats = [
    { label: "TOTAL USERS", value: usersData?.count || 0, sub: "All registered users", border: "border-gray-100" },
    { label: "ACTIVE", value: activeUsersCount, sub: "Active accounts", border: "border-green-100", textColor: "text-green-500" },
  ];

  const handleOpenModal = (type, user = null) => {
    setLastSyncedId(null); // Reset sync tracker
    setModalType(type);
    setSelectedUser(user);
    if (type === 'edit' && user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || 'MALE',
        account_type: user.account_type || 'EMPLOYEE',
        status: user.status || 'ACTIVE',
        password: '',
        password_confirm: ''
      });
    } else if (type === 'create') {
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '',
        gender: 'MALE',
        account_type: 'EMPLOYEE',
        status: 'ACTIVE'
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Update form data when full user data loads (for Edit mode)
  // We do this during render to avoid the "cascading renders" warning from useEffect
  if (modalType === 'edit' && fullUserData && fullUserData.id === selectedUser?.id && lastSyncedId !== fullUserData.id) {
    setLastSyncedId(fullUserData.id);
    setFormData(prev => ({
      ...prev,
      username: fullUserData.username || prev.username,
      middle_name: fullUserData.middle_name || prev.middle_name,
      date_of_birth: fullUserData.date_of_birth || prev.date_of_birth,
      gender: fullUserData.gender || prev.gender,
      phone: fullUserData.phone || prev.phone,
      email: fullUserData.email || prev.email,
      first_name: fullUserData.first_name || prev.first_name,
      last_name: fullUserData.last_name || prev.last_name,
      account_type: fullUserData.account_type || prev.account_type,
      status: fullUserData.status || prev.status
    }));
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedUser(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (formErrors.non_field_errors) {
      setFormErrors(prev => ({ ...prev, non_field_errors: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/; // Exactly 10 digits

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.username) {
      errors.username = "Username is required";
    }

    if (!formData.first_name) {
      errors.first_name = "First name is required";
    }

    if (!formData.last_name) {
      errors.last_name = "Last name is required";
    }

    if (modalType === 'create') {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      }

      if (!formData.password_confirm) {
        errors.password_confirm = "Confirmation is required";
      } else if (formData.password !== formData.password_confirm) {
        errors.password_confirm = "Passwords do not match";
      }
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits";
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();

      if (dob > today) {
        errors.date_of_birth = "Date of birth cannot be in the future";
      } else {
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 15) {
          errors.date_of_birth = "User must be at least 15 years old";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleErrorResponse = (err) => {
    // 1. Handle structured field errors (e.g., from DRF 400 Bad Request)
    if (typeof err === 'object' && err !== null && !err.message) {
      const processedErrors = {};
      Object.keys(err).forEach(key => {
        processedErrors[key] = Array.isArray(err[key]) ? err[key][0] : err[key];
      });
      setFormErrors(processedErrors);
      return;
    }

    // 2. Handle string errors or generic Error objects (e.g. 500 or DB constraints)
    const errorMsg = err.message || (typeof err === 'string' ? err : "An unexpected error occurred");

    // Auto-detect specific DB constraints or general 500 errors as "username already exists" for creation
    if (
      errorMsg.includes('users_username_key') ||
      (errorMsg.includes('username') && (errorMsg.includes('already exists') || errorMsg.includes('unique constraint'))) ||
      (modalType === 'create' && (errorMsg.includes('Internal Server Error') || errorMsg.includes('500') || errorMsg === "An error occurred on the server"))
    ) {
      setFormErrors({ username: "This username is already taken. Please choose another one." });
    } else if (errorMsg.includes('users_email_key') || (errorMsg.includes('email') && (errorMsg.includes('already exists') || errorMsg.includes('unique constraint')))) {
      setFormErrors({ email: "This email address is already registered." });
    } else {
      setFormErrors({ non_field_errors: errorMsg });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Prepare data by removing empty optional fields to prevent backend validation errors
    const submissionData = { ...formData };
    ['date_of_birth', 'phone', 'middle_name'].forEach(field => {
      if (submissionData[field] === '') {
        delete submissionData[field];
      }
    });

    if (modalType === 'create') {
      createMutation.mutate(submissionData, {
        onSuccess: () => handleCloseModal(),
        onError: (err) => handleErrorResponse(err)
      });
    } else if (modalType === 'edit') {
      if (!submissionData.password) {
        delete submissionData.password;
        delete submissionData.password_confirm;
      }

      updateMutation.mutate({ id: selectedUser.id, data: submissionData }, {
        onSuccess: () => handleCloseModal(),
        onError: (err) => handleErrorResponse(err)
      });
    }
  };

  const handleToggleLock = (user) => {
    const isLocked = user.status === 'SUSPENDED' || user.status === 'LOCKED';
    setSelectedUser(user);

    if (isLocked) {
      if (window.confirm(`Are you sure you want to unlock ${user.first_name}?`)) {
        unlockMutation.mutate(user.id);
      }
    } else {
      setLockFormData({
        reason: 'Account locked by administrator',
        duration_minutes: 30
      });
      setIsLockModalOpen(true);
    }
  };

  const handleLockSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    lockMutation.mutate({
      id: selectedUser.id,
      payload: {
        reason: lockFormData.reason,
        duration_minutes: parseInt(lockFormData.duration_minutes)
      }
    }, {
      onSuccess: () => {
        setIsLockModalOpen(false);
        setSelectedUser(null);
      }
    });
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
    <main className="p-6 bg-[#F4F5F7] flex-1 min-h-0 flex flex-col relative overflow-hidden">
      {/* Page Title Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">Tenant Users</h2>
          <p className="text-gray-500 text-sm">Manage users, roles and account access</p>
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
          ? Array(2).fill(0).map((_, i) => <ShimmerCard key={i} />)
          : stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-200 w-full max-w-[240px]">
              <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1.5 uppercase">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${stat.textColor || 'text-[#172B4D]'}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{stat.sub}</p>
            </div>
          ))
        }
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
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
              disabled={!usersData?.next || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Next
            </button>
          </div>
        </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left relative">
          <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
            <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <th className="px-6 py-4">User Name</th>
              <th className="px-6 py-4">Role / Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {isLoading ? (
              Array(10).fill(0).map((_, i) => <ShimmerRow key={i} />)
            ) : isError ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-red-500">Error: {error?.message || "Something went wrong"}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500 font-medium">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => handleOpenModal('view', user)}
                  >
                    <p className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="bg-blue-50 text-[#0052CC] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 w-fit">{user.account_type || 'EMPLOYEE'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' :
                      user.status === 'INACTIVE' ? 'bg-gray-50 text-gray-600 border-gray-100' :
                        (user.status === 'SUSPENDED' || user.status === 'LOCKED') ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-red-50 text-red-600 border-red-100'
                      }`}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleToggleLock(user)}
                        title={(user.status === 'SUSPENDED' || user.status === 'LOCKED') ? 'Unlock User' : 'Lock User'}
                        className={`p-1.5 rounded border transition-colors ${(user.status === 'SUSPENDED' || user.status === 'LOCKED')
                          ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                          : 'hover:bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                      >
                        {(user.status === 'SUSPENDED' || user.status === 'LOCKED') ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                      <button
                        onClick={() => handleOpenModal('edit', user)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
        <div className="text-sm text-gray-500">
          Showing <span className="font-bold text-[#172B4D]">{users.length}</span> of <span className="font-bold text-[#172B4D]">{usersData?.count || 0}</span> users
        </div>

      </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <h3 className="text-xl font-bold text-[#172B4D]">
                {modalType === 'create' ? 'Create New User' : modalType === 'edit' ? 'Update User' : 'User Details'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {modalType === 'view' ? (
                <div className="space-y-6">
                  {isUserLoading && !fullUserData ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="w-10 h-10 border-4 border-blue-100 border-t-[#0052CC] rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-400 font-medium">Fetching profile details...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 bg-[#0052CC] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {(fullUserData || selectedUser)?.first_name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#172B4D]">
                            {(fullUserData || selectedUser)?.first_name} {(fullUserData || selectedUser)?.middle_name ? (fullUserData || selectedUser).middle_name + ' ' : ''}{(fullUserData || selectedUser)?.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">@{(fullUserData || selectedUser)?.username || 'No username'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1">{(fullUserData || selectedUser)?.email}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1">{(fullUserData || selectedUser)?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gender</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1">{(fullUserData || selectedUser)?.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date of Birth</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1">{(fullUserData || selectedUser)?.date_of_birth || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Type</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1">{(fullUserData || selectedUser)?.account_type}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                          <p className="text-sm font-semibold text-[#172B4D] mt-1">{(fullUserData || selectedUser)?.status}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
                  {/* Global Errors */}
                  {formErrors.non_field_errors && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                      <ShieldAlert size={16} />
                      {formErrors.non_field_errors}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">First Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="text"
                          name="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.first_name ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                          placeholder="John"
                        />
                      </div>
                      {formErrors.first_name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.first_name}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Middle Name</label>
                      <input
                        type="text"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC]"
                        placeholder="Quincy"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Last Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 border ${formErrors.last_name ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                        placeholder="Doe"
                      />
                      {formErrors.last_name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.last_name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Username <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">@</span>
                        <input
                          type="text"
                          name="username"
                          required
                          disabled={modalType === 'edit'}
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full pl-8 pr-4 py-2 bg-gray-50 border ${formErrors.username ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC] disabled:bg-gray-100 disabled:cursor-not-allowed`}
                          placeholder="johndoe"
                        />
                      </div>
                      {formErrors.username && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.username}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                          placeholder="john@example.com"
                        />
                      </div>
                      {formErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.email}</p>}
                    </div>
                  </div>

                  {modalType === 'create' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.password ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                            placeholder="••••••••"
                          />
                        </div>
                        {formErrors.password && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.password}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Confirm Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input
                            type="password"
                            name="password_confirm"
                            required
                            value={formData.password_confirm}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.password_confirm ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                            placeholder="••••••••"
                          />
                        </div>
                        {formErrors.password_confirm && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.password_confirm}</p>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Phone Number (10 digits)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          maxLength={10}
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                          placeholder="1234567890"
                        />
                      </div>
                      {formErrors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.phone}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Date of Birth (Min 15 yrs)</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${formErrors.date_of_birth ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC]`}
                        />
                      </div>
                      {formErrors.date_of_birth && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.date_of_birth}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Gender</label>
                      <div className="relative">
                        <UserCircle2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] appearance-none"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Account Type</label>
                      <select
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC]"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="CONTRACTOR">Contractor</option>
                        <option value="CUSTOMER">Customer</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC]"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              {modalType === 'view' && (
                <button
                  onClick={() => {
                    handleCloseModal();
                    navigate(`/tenant/dashboard/users/${(fullUserData || selectedUser)?.id}`);
                  }}
                  className="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md"
                >
                  View Profile
                </button>
              )}
              {modalType !== 'view' && (
                <button
                  type="submit"
                  form="userForm"
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
      {/* Lock User Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-xl font-bold text-[#172B4D]">Lock User Account</h3>
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLockSubmit} className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-red-800">You are locking {selectedUser?.first_name}'s account</p>
                  <p className="text-xs text-red-600 mt-1">This user will be unable to log in until the lock period expires or they are manually unlocked.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Lock Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={lockFormData.duration_minutes}
                  onChange={(e) => setLockFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                />
                <p className="text-[10px] text-gray-400">Common values: 30, 60, 1440 (1 day), 10080 (1 week)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Reason for Locking</label>
                <textarea
                  required
                  rows="3"
                  value={lockFormData.reason}
                  onChange={(e) => setLockFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 resize-none"
                  placeholder="e.g. Suspicious activity detected"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lockMutation.isPending}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-100 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {lockMutation.isPending && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  Lock Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserDetail;

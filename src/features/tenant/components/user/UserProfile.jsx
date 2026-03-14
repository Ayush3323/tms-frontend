import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser, useUpdateUser, useDeleteUser } from '../../queries/users/userQuery';
import { useRoles } from '../../queries/users/rolesPermissionsQuery';
import { useRevokeSession } from '../../queries/users/sessionsQuery';
import { useAssignRoles, useUserSessions, useUserActivityLog } from '../../queries/users/userActionQuery';
import { X, User, Mail, Phone, Calendar, UserCircle2, ShieldAlert, Trash2, Users, ChevronDown, ChevronUp, Check, Monitor, Smartphone, History, Activity } from 'lucide-react';

const UserProfile = () => {
  const { userid } = useParams();
  const navigate = useNavigate();

  // Fetch full user details using the provided API
  const { data: user, isLoading, isError, error } = useUser(userid);
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const assignRolesMutation = useAssignRoles();
  const revokeSessionMutation = useRevokeSession();
  const queryClient = useQueryClient();
  
  const handleRevokeSession = (sessionId) => {
    if (window.confirm("Are you sure you want to revoke this session?")) {
      revokeSessionMutation.mutate(sessionId, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["userSessions", userid] });
          window.alert(data?.message || "Session revoked successfully");
        }
      });
    }
  };

  const { data: sessions, isLoading: sessionsLoading } = useUserSessions(userid);
  const { data: activityData, isLoading: activityLoading } = useUserActivityLog(userid, { page_size: 5 });
  const activityLogs = activityData?.results || [];

  const { data: rolesData } = useRoles({ page_size: 100 });
  const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.results || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'edit_personal' or 'edit_account'
  const [formErrors, setFormErrors] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'MALE',
    account_type: 'EMPLOYEE',
    status: 'ACTIVE',
    is_staff: false,
    is_verified: false,
    role_id: []
  });
  const [showAllSessions, setShowAllSessions] = useState(false);

  const handleOpenModal = (type) => {
    setModalType(type);
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
      is_staff: user.is_staff || false,
      is_verified: user.is_verified || false,
      role_id: [] // We'll manage this separately for now or track current roles if available
    });
    setFormErrors({});
    setIsRoleDropdownOpen(false);
    setIsModalOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    if (modalType === 'edit_personal') {
      if (!formData.email) {
        errors.email = "Email is required";
      } else if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }

      if (!formData.first_name) {
        errors.first_name = "First name is required";
      }

      if (!formData.last_name) {
        errors.last_name = "Last name is required";
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
    }

    if (modalType === 'edit_account') {
      if (!formData.username) {
        errors.username = "Username is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleErrorResponse = (err) => {
    // If it's a validation error object (status 400)
    if (typeof err === 'object' && err !== null && !err.message) {
      const processedErrors = {};
      let hasVisibleError = false;

      Object.keys(err).forEach(key => {
        const value = Array.isArray(err[key]) ? err[key][0] : err[key];
        processedErrors[key] = value;
        hasVisibleError = true;
      });

      // If we have errors but they might not be attached to visible fields, 
      // or if it's a general validation error that isn't 'non_field_errors'
      if (hasVisibleError && !processedErrors.non_field_errors) {
        // Find the first available error to show as a general message if needed
        const firstKey = Object.keys(err)[0];
        const firstError = Array.isArray(err[firstKey]) ? err[firstKey][0] : err[firstKey];

        // If the error is for a field not in our current view, add it to non_field_errors
        if (firstKey === 'role_ids' || firstKey === 'role_id') {
          processedErrors.non_field_errors = `Role Assignment Error: ${firstError}`;
        }
      }

      setFormErrors(processedErrors);
      return;
    }

    // Handle string errors or Error objects
    const errorMsg = err.message || (typeof err === 'string' ? err : "An unexpected error occurred");

    // Check for specific unique constraint errors
    if (errorMsg.includes('users_username_key') || (errorMsg.includes('username') && (errorMsg.includes('already exists') || errorMsg.includes('unique constraint')))) {
      setFormErrors({ username: "This username is already taken. Please choose another one." });
    } else if (errorMsg.includes('users_email_key') || (errorMsg.includes('email') && (errorMsg.includes('already exists') || errorMsg.includes('unique constraint')))) {
      setFormErrors({ email: "This email address is already registered." });
    } else if (errorMsg === "An error occurred on the server") {
      setFormErrors({ non_field_errors: "The server encountered an issue processing your request. Please ensure all required fields are correctly filled." });
    } else {
      setFormErrors({ non_field_errors: errorMsg });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (modalType === 'assign_roles') {
      // Match the updated API signature which now uses 'role_id'
      assignRolesMutation.mutate({ id: userid, role_id: formData.role_id }, {
        onSuccess: () => {
          handleCloseModal();
          // Optional: You might want to refresh user data here if roles are part of the user object
        },
        onError: (err) => handleErrorResponse(err)
      });
      return;
    }

    updateMutation.mutate({ id: user.id, data: formData }, {
      onSuccess: () => handleCloseModal(),
      onError: (err) => handleErrorResponse(err)
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteMutation.mutate(user.id, {
        onSuccess: () => {
          navigate('/tenant/dashboard/users');
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex flex-col items-center justify-center">
        <p className="text-red-500 font-bold mb-4">Error loading user profile: {error?.message}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex flex-col items-center justify-center">
        <p className="text-gray-500 font-bold mb-4">User not found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  // Calculate initials
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username ? user.username.substring(0, 2).toUpperCase() : 'U';
  };

  const fullName = `${user.first_name || ''} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name || ''}`.trim();

  return (
    <div className="bg-[#f6f8fb] min-h-screen font-sans text-slate-900 pb-12">
      <style>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .card {
          background-color: #ffffff;
          border: 1px solid #e6e8ec;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .btn-primary {
          background-color: #2563eb;
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-blue { background-color: #dbeafe; color: #1e40af; }
        .badge-green { background-color: #d1fae5; color: #065f46; }
        .badge-red { background-color: #fee2e2; color: #991b1b; }
        .badge-gray { background-color: #f3f4f6; color: #4b5563; }
        
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        
        .label-text {
          font-size: 0.8125rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .value-text {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #111827;
        }
        .table-container {
          overflow-x: auto;
        }
        .custom-table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
        }
        .custom-table th {
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #6b7280;
          border-bottom: 1px solid #e6e8ec;
        }
        .custom-table td {
          padding: 1rem;
          font-size: 0.875rem;
          border-bottom: 1px solid #f3f4f6;
        }
      `}</style>

      {/* BEGIN: MainContainer */}
      <main className="page-container">
        {/* BEGIN: HeaderSection */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" data-purpose="header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Go Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-500 text-sm">Manage user information, roles, and security</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenModal('assign_roles')}
              className="btn-primary flex items-center gap-2"
              type="button"
            >
              <Users size={18} /> Assign Roles
            </button>
          </div>
        </header>
        {/* END: HeaderSection */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BEGIN: LeftColumn (Profile Overview) */}
          <section className="lg:col-span-1">
            {/* Profile Overview Card */}
            <div className="card flex flex-col items-center text-center" data-purpose="profile-overview">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl mb-4 border-4 border-white shadow-sm">
                {getInitials()}
              </div>
              <h2 className="text-xl font-bold mb-1">{fullName || user.username}</h2>
              <p className="text-gray-500 text-sm mb-4">@{user.username}</p>

              <div className="flex gap-2 mb-6">
                <span className="badge badge-blue">{user.account_type || 'EMPLOYEE'}</span>
                <span className={`badge ${user.status === 'ACTIVE' ? 'badge-green' :
                    user.status === 'INACTIVE' ? 'badge-gray' :
                      'badge-red'
                  }`}>
                  {user.status || 'ACTIVE'}
                </span>
              </div>

              <div className="w-full border-t border-gray-100 pt-6 space-y-4 text-left">
                <div data-purpose="quick-info-item">
                  <p className="label-text">Email Address</p>
                  <p className="value-text">{user.email || 'N/A'}</p>
                </div>
                <div data-purpose="quick-info-item">
                  <p className="label-text">Phone Number</p>
                  <p className="value-text">{user.phone || 'N/A'}</p>
                </div>
                <div data-purpose="quick-info-item">
                  <p className="label-text">Verified Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.is_verified ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm font-medium text-red-600">Unverified</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all group disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 size={16} className="text-red-500 group-hover:text-white transition-colors" />
                    )}
                    Delete User
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2 text-center italic">This action is permanent and cannot be reversed.</p>
                </div>
              </div>
            </div>

            {/* Security Warning (Conditional Placeholder) */}
            <div className="card border-amber-200 bg-amber-50" data-purpose="security-warning">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Security Check Required</h3>
                  <p className="text-xs text-amber-700 mt-1">This user has not verified their primary phone or email address. Certain actions may be restricted.</p>
                </div>
              </div>
            </div>
          </section>
          {/* END: LeftColumn */}

          {/* BEGIN: RightColumn (Details) */}
          <section className="lg:col-span-2">
            {/* Personal Information Card */}
            <div className="card" data-purpose="personal-info">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Personal Information</h3>
                <button onClick={() => handleOpenModal('edit_personal')} className="text-brand-primary text-sm font-medium hover:underline text-blue-600">Edit</button>
              </div>
              <div className="profile-grid">
                <div>
                  <p className="label-text">First Name</p>
                  <p className="value-text">{user.first_name || '-'}</p>
                </div>
                <div>
                  <p className="label-text">Middle Name</p>
                  <p className="value-text">{user.middle_name || '-'}</p>
                </div>
                <div>
                  <p className="label-text">Last Name</p>
                  <p className="value-text">{user.last_name || '-'}</p>
                </div>
                <div>
                  <p className="label-text">Date of Birth</p>
                  <p className="value-text">{user.date_of_birth || '-'}</p>
                </div>
                <div>
                  <p className="label-text">Gender</p>
                  <p className="value-text capitalize">{user.gender?.toLowerCase() || '-'}</p>
                </div>
              </div>
            </div>

            {/* Account Settings Card */}
            <div className="card" data-purpose="account-settings">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Account Settings</h3>
                <button onClick={() => handleOpenModal('edit_account')} className="text-brand-primary text-sm font-medium hover:underline text-blue-600">Manage</button>
              </div>
              <div className="profile-grid">
                <div>
                  <p className="label-text">Username</p>
                  <p className="value-text">{user.username || '-'}</p>
                </div>
                <div>
                  <p className="label-text">Account Type</p>
                  <p className="value-text">{user.account_type || '-'}</p>
                </div>
                <div>
                  <p className="label-text">Is Staff</p>
                  <p className="value-text">{user.is_staff ? 'True' : 'False'}</p>
                </div>
                <div>
                  <p className="label-text">Reporting Manager</p>
                  <p className="value-text text-gray-400 font-normal italic">Not assigned</p>
                </div>
              </div>
            </div>

            {/* Roles Section */}
            <div className="card" data-purpose="roles-section">
              <h3 className="font-bold text-gray-800 mb-4">Roles &amp; Permissions</h3>
              <div className="bg-gray-50 rounded-lg p-8 border border-dashed border-gray-300 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No roles assigned yet</p>
                <p className="text-sm text-gray-400 mb-4">Grant permissions to this user by assigning a system role.</p>
                <button onClick={() => handleOpenModal('assign_roles')} className="btn-primary text-sm" type="button">Assign Roles</button>
              </div>
            </div>

            {/* User Sessions Card */}
            <div className="card" data-purpose="user-sessions">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">User Sessions</h3>
                {sessions?.length > 0 && (
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {sessions.length} Active
                  </span>
                )}
              </div>
              <div className="table-container">
                <table className="custom-table" id="user-sessions-table">
                  <thead>
                    <tr>
                      <th>Login Time</th>
                      <th>Device / Type</th>
                      <th>IP Address</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsLoading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8">
                          <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        </td>
                      </tr>
                    ) : sessions?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-400 italic">No active sessions found</td>
                      </tr>
                    ) : (
                      (showAllSessions ? sessions : sessions.slice(0, 5)).map(session => (
                        <tr key={session.id}>
                          <td className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {new Date(session.login_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(session.login_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {session.device_type === 'DESKTOP' ? <Monitor size={14} className="text-gray-400" /> : <Smartphone size={14} className="text-gray-400" />}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{session.device_type || 'Unknown'}</span>
                                <span className="text-[10px] text-gray-400">{session.session_type || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-gray-500 font-mono text-xs">{session.ip_address || '0.0.0.0'}</td>
                          <td>
                            <button
                              disabled={revokeSessionMutation.isPending}
                              onClick={() => handleRevokeSession(session.id)}
                              className="px-3 py-1.5 bg-red-400 text-white rounded-lg text-[10px] font-bold hover:bg-red-500 transition-all flex items-center gap-2 mx-auto shadow-md active:scale-95 disabled:bg-gray-400"
                            >
                              {revokeSessionMutation.isPending ? (
                                <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <X size={12} />
                              )}
                              Revoke Session
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {sessions?.length > 5 && (
                <div className="mt-4 text-center border-t border-gray-50 pt-3">
                  <button 
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="text-blue-600 text-sm font-bold hover:underline"
                  >
                    {showAllSessions ? 'Show Less' : `View All (${sessions.length})`}
                  </button>
                </div>
              )}
            </div>

            {/* Activity Logs Card */}
            <div className="card" data-purpose="activity-logs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <History size={18} className="text-gray-400" />
                  Activity Logs
                </h3>
              </div>
              <div className="space-y-4">
                {activityLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg">No recent activity recorded</div>
                ) : (
                  <div className="flow-root">
                    <ul role="list" className="-mb-8">
                      {activityLogs.map((activity, idx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {idx !== activityLogs.length - 1 ? (
                              <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-6 ring-white ${
                                  activity.activity_type === 'LOGIN' ? 'bg-green-100' :
                                  activity.activity_type === 'LOGOUT' ? 'bg-gray-100' :
                                  'bg-blue-100'
                                }`}>
                                  {activity.activity_type === 'LOGIN' ? <Check size={14} className="text-green-600" /> :
                                   <Activity size={14} className="text-blue-600" />}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900 font-medium">
                                    {activity.description}
                                  </p>
                                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span>{activity.ip_address}</span>
                                    <span>&bull;</span>
                                    <span className="truncate max-w-[200px]">{activity.user_agent}</span>
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-xs text-gray-400">
                                  <time dateTime={activity.created_at}>
                                    {new Date(activity.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-6 text-center border-t border-gray-50 pt-4">
                <button className="text-blue-600 text-sm font-bold hover:underline">View Full Activity History</button>
              </div>
            </div>
          </section>
          {/* END: RightColumn */}
        </div>
      </main>
      {/* END: MainContainer */}

      {/* Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <h3 className="text-xl font-bold text-[#172B4D]">
                {modalType === 'edit_personal' ? 'Edit Personal Information' :
                  modalType === 'edit_account' ? 'Manage Account Settings' :
                    'Assign User Roles'}
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
              <form id="userUpdateForm" onSubmit={handleSubmit} className="space-y-4">
                {/* Global Errors */}
                {formErrors.non_field_errors && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    <ShieldAlert size={16} />
                    {formErrors.non_field_errors}
                  </div>
                )}

                {modalType === 'edit_personal' && (
                  <>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </>
                )}

                {modalType === 'edit_account' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Username <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">@</span>
                          <input
                            type="text"
                            name="username"
                            required
                            disabled
                            value={formData.username}
                            onChange={handleInputChange}
                            className={`w-full pl-8 pr-4 py-2 bg-gray-50 border ${formErrors.username ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#0052CC] disabled:bg-gray-100 disabled:cursor-not-allowed`}
                            placeholder="johndoe"
                          />
                        </div>
                        {formErrors.username && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.username}</p>}
                        <p className="text-[10px] text-gray-400 ml-1">Username cannot be changed</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Is Staff</label>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            name="is_staff"
                            checked={formData.is_staff}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                          />
                          <span className="text-sm text-gray-700">Grant staff permissions</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Verified Status</label>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            name="is_verified"
                            checked={formData.is_verified}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                          />
                          <span className="text-sm text-gray-700">Mark account as verified</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Reporting Manager</label>
                        <select
                          disabled
                          className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm disabled:cursor-not-allowed"
                        >
                          <option value="">Not assigned</option>
                        </select>
                        <p className="text-[10px] text-gray-400 ml-1">Manager assignment coming soon</p>
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'assign_roles' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-700">
                      <div className="p-2 bg-white rounded-lg h-fit">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Role Assignment</p>
                        <p className="text-xs opacity-80">Select one or more roles to assign permissions to this user. This will control what they can see and do in the system.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600">Select Roles</label>

                      <div className="relative" ref={dropdownRef}>
                        {/* Dropdown Trigger */}
                        <div
                          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:border-gray-300 transition-all select-none"
                        >
                          <span className={formData.role_id.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                            {formData.role_id.length === 0
                              ? 'Select roles...'
                              : formData.role_id.length === roles.length
                                ? 'All roles selected'
                                : `${formData.role_id.length} role(s) selected`}
                          </span>
                          {isRoleDropdownOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </div>

                        {/* Dropdown Menu */}
                        {isRoleDropdownOpen && (
                          <div className="absolute z-110 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-62.5 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Select All Option */}
                            <div
                              onClick={() => {
                                if (roles.length > 0 && formData.role_id.length === roles.length) {
                                  setFormData(prev => ({ ...prev, role_id: [] }));
                                } else {
                                  setFormData(prev => ({ ...prev, role_id: roles.map(r => r.id) }));
                                }
                              }}
                              className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors select-none"
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${roles.length > 0 && formData.role_id.length === roles.length
                                  ? 'bg-[#0052CC] border-[#0052CC]'
                                  : 'border-gray-300 bg-white'
                                }`}>
                                {roles.length > 0 && formData.role_id.length === roles.length && <Check size={14} className="text-white" />}
                              </div>
                              <span className="text-sm font-bold text-gray-700">Select all</span>
                            </div>

                            {/* Individual Role Options */}
                            <div className="py-1">
                              {roles.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center">No roles available</div>
                              ) : (
                                roles.map(role => (
                                  <div
                                    key={role.id}
                                    onClick={() => {
                                      const isSelected = formData.role_id.includes(role.id);
                                      if (isSelected) {
                                        setFormData(prev => ({
                                          ...prev,
                                          role_id: prev.role_id.filter(id => id !== role.id)
                                        }));
                                      } else {
                                        setFormData(prev => ({
                                          ...prev,
                                          role_id: [...prev.role_id, role.id]
                                        }));
                                      }
                                    }}
                                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors select-none"
                                  >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.role_id.includes(role.id)
                                        ? 'bg-[#0052CC] border-[#0052CC]'
                                        : 'border-gray-300 bg-white'
                                      }`}>
                                      {formData.role_id.includes(role.id) && <Check size={14} className="text-white" />}
                                    </div>
                                    <div className="flex flex-col text-left">
                                      <span className="text-sm text-gray-700 font-medium">
                                        {role.name || role.role_name || role.display_name || role.username || role.id || 'Unnamed Role'}
                                      </span>
                                      {(role.description || role.email) && (
                                        <p className="text-[10px] text-gray-400 line-clamp-1">
                                          {role.description || role.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="userUpdateForm"
                disabled={updateMutation.isPending || assignRolesMutation.isPending}
                className="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(updateMutation.isPending || assignRolesMutation.isPending) && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {modalType === 'assign_roles' ? 'Assign Roles' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

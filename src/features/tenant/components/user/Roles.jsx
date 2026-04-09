import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Shield, ShieldCheck, ShieldAlert, X, Eye, Info, Lock, Key, Plus, Trash2, Layout, Settings, FileText, Globe } from 'lucide-react';
import { useRoles, useRole, useRolePermissions, useCreateRole, useDeleteRole, usePermissions, useAssignPermissions } from '../../queries/users/rolesPermissionsQuery';

const Roles = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: rolesData, isLoading, isError, error } = useRoles({
    page: currentPage,
    page_size: 20,
    search: debouncedSearch
  });

  const totalPages = Math.ceil((rolesData?.count || 0) / 20) || 1;

  const getPaginationRange = () => {
    const range = [];
    range.push(1);
    if (currentPage > 2) range.push('...');
    if (currentPage !== 1) range.push(currentPage);
    if (totalPages > currentPage + 1) range.push('...');
    if (totalPages > currentPage && totalPages !== 1) range.push(totalPages);
    return range;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const { data: fullRoleData, isLoading: isRoleLoading } = useRole(selectedRoleId);
  const { data: permissionsData, isLoading: isPermissionsLoading } = useRolePermissions(selectedRoleId);
  const { data: allAvailablePermissionsData } = usePermissions({ page_size: 100 });
  const createRoleMutation = useCreateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignPermissions();

  const [isAssigningMode, setIsAssigningMode] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    role_name: '',
    role_code: '',
    role_description: ''
  });
  const [createFormErrors, setCreateFormErrors] = useState({});

  const roles = rolesData?.results || [];
  const systemRolesCount = roles.filter(r => r.is_system_role).length;

  const stats = [
    { label: "TOTAL ROLES", value: rolesData?.count || 0, sub: "All defined roles", border: "border-gray-100" },
    { label: "SYSTEM ROLES", value: systemRolesCount, sub: "Pre-defined by system", border: "border-blue-100", textColor: "text-blue-500" },
  ];

  const handleOpenViewModal = (role) => {
    setSelectedRoleId(role.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoleId(null);
    setIsAssigningMode(false);
    setSelectedPermissionIds([]);
  };

  // Helper to group permissions by resource type
  const groupedPermissions = React.useMemo(() => {
    const rawPerms =
      (Array.isArray(permissionsData) ? permissionsData : (permissionsData?.permissions || permissionsData?.results)) ||
      (Array.isArray(fullRoleData?.permissions) ? fullRoleData?.permissions : []) ||
      [];

    if (!rawPerms || !Array.isArray(rawPerms) || rawPerms.length === 0) return {};

    return rawPerms.reduce((acc, perm) => {
      const resource = perm.resource_type || perm.resource || 'General';
      if (!acc[resource]) acc[resource] = [];
      acc[resource].push(perm);
      return acc;
    }, {});
  }, [permissionsData, fullRoleData]);

  // Initializing selected permission IDs when entering assignment mode
  const handleToggleAssignMode = () => {
    if (!isAssigningMode) {
      const currentPerms =
        (Array.isArray(permissionsData) ? permissionsData : (permissionsData?.permissions || permissionsData?.results)) ||
        (Array.isArray(fullRoleData?.permissions) ? fullRoleData?.permissions : []) ||
        [];
      setSelectedPermissionIds(currentPerms.map(p => p.id));
    }
    setIsAssigningMode(!isAssigningMode);
  };

  const handleTogglePermission = (id) => {
    setSelectedPermissionIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSavePermissions = () => {
    assignPermissionsMutation.mutate({
      id: selectedRoleId,
      data: { permission_ids: selectedPermissionIds }
    }, {
      onSuccess: () => {
        setIsAssigningMode(false);
        // Toast logic could go here
      }
    });
  };

  const getResourceIcon = (resource) => {
    switch (resource.toLowerCase()) {
      case 'user': return <User size={14} />;
      case 'role': return <Shield size={14} />;
      case 'tenant': return <Layout size={14} />;
      case 'setting': return <Settings size={14} />;
      default: return <Key size={14} />;
    }
  };

  const handleOpenCreateModal = () => {
    setCreateFormData({
      role_name: '',
      role_code: '',
      role_description: ''
    });
    setCreateFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormErrors({});
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
    if (createFormErrors[name]) {
      setCreateFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createFormData.role_name.trim()) errors.role_name = "Role name is required";
    if (!createFormData.role_code.trim()) errors.role_code = "Role code is required";

    // Auto-formatting role code: UPPERCASE and snake_case
    if (createFormData.role_code && !/^[A-Z0-0_]+$/.test(createFormData.role_code)) {
      // We could auto-fix it here or just show an error. Let's just show an error for strictness.
      // Actually, many systems auto-transform it. Let's just warn if it has spaces.
      if (/\s/.test(createFormData.role_code)) {
        errors.role_code = "Role code should not contain spaces (use underscores)";
      }
    }

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    createRoleMutation.mutate(createFormData, {
      onSuccess: () => {
        handleCloseCreateModal();
        // Toast or success message could go here
      },
      onError: (err) => {
        const errorMsg = err.message || "";

        // Map common backend error signals (500s or generic server errors) to 'already exists' 
        // since duplicate role codes usually trigger internal server errors in this architecture.
        if (
          errorMsg.includes('500') ||
          errorMsg.includes('Internal Server Error') ||
          errorMsg.toLowerCase().includes('server error') ||
          errorMsg.includes('An error occurred on the server')
        ) {
          setCreateFormErrors({
            role_code: "This role code already exists. Please choose a unique role code."
          });
        } else if (err.response?.data) {
          setCreateFormErrors(err.response.data);
        } else {
          setCreateFormErrors({ non_field_errors: errorMsg || "An unexpected error occurred" });
        }
      }
    });
  };

  const handleDeleteRole = (role) => {
    if (role.is_system_role) {
      window.alert("System roles cannot be deleted.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${role.role_name}"? This action cannot be undone.`)) {
      deleteRoleMutation.mutate(role.id, {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (err) => {
          window.alert(err.message || "Failed to delete role");
        }
      });
    }
  };

  // Shimmer Components
  const ShimmerRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48 mb-2"></div><div className="h-3 bg-gray-100 rounded w-32"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-100 rounded ml-auto"></div></td>
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
    <div className="p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden flex flex-col relative font-sans text-slate-900">
      {/* Page Title & Search Section */}
      <div className="flex items-center mb-8">
        <div className="w-1/4">
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight uppercase">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm tracking-tight">Manage user access levels</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search roles by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}

      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-28"></div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>
          ) : (
            stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}:</span>
                <span className={`text-[18px] font-black ${stat.textColor || 'text-[#172B4D]'}`}>{stat.value}</span>
              </div>
            ))
          )}
          <div className="flex items-center justify-end gap-2 ml-auto">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#0747A6] transition-all active:scale-95 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>New Role</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-6 ml-auto justify-between h-15 border-b border-gray-50">
            {/* Quick Filters Placeholder */}
            <div className="flex items-center gap-3 px-5 py-2">
            </div>

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block " />

            <div className="flex items-center gap-2 px-5 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
              >
                Prev
              </button>

              <div className="flex items-center gap-1.5">
                {getPaginationRange().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-1 text-gray-400 font-bold select-none text-xs">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-[#0052CC] text-white shadow-md shadow-blue-100'
                            : 'bg-white border border-gray-100 text-[#172B4D] hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || !rolesData?.next || isLoading}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Roles Table */}
        <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl mt-0">
          <table className="w-full text-left relative">
            <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Role Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => <ShimmerRow key={i} />)
              ) : isError ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-red-500">Error: {error?.message || "Something went wrong"}</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">No roles found.</td></tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenViewModal(role)}>
                      <p className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{role.role_name}</p>
                      <p className="text-xs text-gray-400 font-mono uppercase tracking-tight">{role.role_code}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{role.role_description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${role.is_system_role
                        ? 'bg-purple-50 text-purple-600 border-purple-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {role.is_system_role ? <Lock size={10} /> : <Shield size={10} />}
                        {role.role_type || (role.is_system_role ? 'SYSTEM' : 'CUSTOM')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${role.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                        {role.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenViewModal(role)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-bold text-[#172B4D]">{roles.length}</span> of <span className="font-bold text-[#172B4D]">{rolesData?.count || 0}</span> items
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <h3 className="text-xl font-bold text-[#172B4D]">Role Details</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 max-h-[75vh] overflow-y-auto bg-gray-50/30">
              {(isRoleLoading || (isPermissionsLoading && !permissionsData)) ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-[#0052CC] rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Loading Role Profile...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Role Identity Card */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-5">
                    <div className="w-16 h-16 bg-linear-to-br from-[#0052CC] to-[#0747A6] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xl font-extrabold text-[#172B4D]">{fullRoleData?.role_name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${fullRoleData?.is_system_role
                          ? 'bg-purple-50 text-purple-600 border-purple-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {fullRoleData?.is_system_role ? 'System Essential' : 'Custom Defined'}
                        </span>
                        {fullRoleData?.is_active && (
                          <span className="bg-green-50 text-green-600 text-[10px] font-black px-2 py-0.5 rounded border border-green-100 uppercase tracking-tighter">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-1 font-bold tracking-widest opacity-70 italic">{fullRoleData?.role_code}</p>
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{fullRoleData?.role_description || 'This role provides a set of permissions for specific system access and user management levels.'}</p>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="w-6 h-px bg-gray-200"></div>
                        Access Capabilities ({
                          (Array.isArray(permissionsData) ? permissionsData.length : (permissionsData?.permissions?.length || permissionsData?.results?.length)) ||
                          fullRoleData?.permissions?.length ||
                          0
                        })
                        <div className="w-6 h-px bg-gray-200"></div>
                      </h5>
                    </div>

                    {Object.keys(groupedPermissions).length === 0 ? (
                      <div className="p-12 bg-white border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <ShieldAlert className="text-gray-200" size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No active permissions detected</p>
                        <p className="text-xs text-gray-300 mt-1 max-w-50">This role currently has no specific permissions assigned to its profile.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {Object.entries(groupedPermissions).map(([resource, perms]) => (
                          <div key={resource} className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                              <div className="p-1 bg-gray-100 text-gray-500 rounded-md">
                                {getResourceIcon(resource)}
                              </div>
                              <h6 className="text-xs font-extrabold text-[#172B4D] uppercase tracking-wider">{resource} Management</h6>
                              <div className="flex-1 h-px bg-linear-to-r from-gray-100 to-transparent"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {perms.map((perm) => (
                                <div key={perm.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 transition-all group">
                                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-[#0052CC] group-hover:text-white transition-colors">
                                    <Key size={12} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-[#172B4D] leading-tight truncate">
                                      {perm.permission_name || perm.name || 'Unnamed Permission'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-mono text-gray-400 font-bold">{perm.permission_code}</span>
                                      <span className="text-[8px] px-1.5 py-px bg-gray-100 text-gray-500 rounded-full font-black tracking-widest leading-none">
                                        {perm.action}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manage Permissions Interface (Conditional) */}
                  {isAssigningMode && (
                    <div className="bg-white rounded-2xl border-2 border-[#0052CC]/20 shadow-xl shadow-blue-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                      <div className="px-5 py-4 bg-linear-to-r from-[#0052CC] to-[#0747A6] text-white flex items-center justify-between">
                        <div>
                          <h6 className="text-sm font-black uppercase tracking-widest">Assign Permissions</h6>
                          <p className="text-[10px] text-blue-100 font-bold opacity-80 uppercase tracking-tighter">Select capabilities for this role</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={12} />
                            <input
                              type="text"
                              placeholder="Find permission..."
                              value={permissionSearchTerm}
                              onChange={(e) => setPermissionSearchTerm(e.target.value)}
                              className="pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs placeholder:text-blue-200/50 focus:outline-none focus:bg-white/20 transition-all w-48"
                            />
                          </div>
                          <button onClick={() => setIsAssigningMode(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 max-h-96 overflow-y-auto space-y-4 bg-gray-50/50">
                        {Object.entries(
                          (allAvailablePermissionsData?.results || allAvailablePermissionsData || [])
                            .filter(p =>
                              (p.permission_name || p.name || '').toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                              (p.permission_code || '').toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                              (p.resource_type || '').toLowerCase().includes(permissionSearchTerm.toLowerCase())
                            )
                            .reduce((acc, p) => {
                              const res = p.resource_type || 'General';
                              if (!acc[res]) acc[res] = [];
                              acc[res].push(p);
                              return acc;
                            }, {})
                        ).map(([resource, perms]) => (
                          <div key={resource} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <div className="p-1 bg-white border border-gray-100 text-gray-400 rounded-md">
                                {getResourceIcon(resource)}
                              </div>
                              <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{resource}</h6>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {perms.map(p => (
                                <label
                                  key={p.id}
                                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group ${selectedPermissionIds.includes(p.id)
                                    ? 'bg-blue-50 border-[#0052CC] shadow-sm shadow-blue-100'
                                    : 'bg-white border-gray-50 hover:border-gray-200 hover:bg-gray-100/50'
                                    }`}
                                >
                                  <div className="relative flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissionIds.includes(p.id)}
                                      onChange={() => handleTogglePermission(p.id)}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedPermissionIds.includes(p.id) ? 'bg-[#0052CC] border-[#0052CC]' : 'bg-white border-gray-200 group-hover:border-gray-300'
                                      }`}>
                                      {selectedPermissionIds.includes(p.id) && <Plus size={14} className="text-white rotate-45" />}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[11px] font-bold leading-none truncate ${selectedPermissionIds.includes(p.id) ? 'text-[#0052CC]' : 'text-gray-700'}`}>
                                      {p.permission_name || p.name}
                                    </p>
                                    <p className="text-[8px] font-mono text-gray-400 mt-1 uppercase font-black tracking-widest">{p.action}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-5 py-4 bg-white border-t border-gray-100 flex items-center justify-between shadow-2xl shadow-blue-900/10">
                        <p className="text-xs text-gray-500 font-bold">
                          <span className="text-[#0052CC]">{selectedPermissionIds.length}</span> Permissions Selected
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsAssigningMode(false)}
                            className="text-xs font-black text-gray-400 uppercase tracking-widest px-4 py-2 hover:text-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSavePermissions}
                            disabled={assignPermissionsMutation.isPending}
                            className="bg-[#0052CC] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#0747A6] transition-all flex items-center gap-2"
                          >
                            {assignPermissionsMutation.isPending ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : 'Confirm Assignment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
              {fullRoleData && !fullRoleData.is_system_role && (
                <button
                  onClick={() => handleDeleteRole(fullRoleData)}
                  disabled={deleteRoleMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all group"
                >
                  {deleteRoleMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 size={16} className="text-red-400 group-hover:text-red-600" />
                  )}
                  Delete Role
                </button>
              )}
              <div className="flex-1 flex justify-end gap-3">
                {fullRoleData && !isAssigningMode && (
                  <button
                    onClick={handleToggleAssignMode}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-[#0052CC] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 group"
                  >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    Assign Permissions
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="px-8 py-2.5 bg-[#0052CC] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#0747A6] transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-[#172B4D]">Create New Role</h3>
              <button
                onClick={handleCloseCreateModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="px-6 py-6 space-y-4">
                {createFormErrors.non_field_errors && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert size={14} />
                    {createFormErrors.non_field_errors}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Role Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="role_name"
                    value={createFormData.role_name}
                    onChange={handleCreateInputChange}
                    placeholder="e.g. Sales Manager"
                    className={`w-full px-4 py-2.5 bg-gray-50 border ${createFormErrors.role_name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all`}
                    required
                  />
                  {createFormErrors.role_name && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase italic">{createFormErrors.role_name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Role Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="role_code"
                    value={createFormData.role_code}
                    onChange={(e) => {
                      // Auto-transforming to uppercase and underscores as common in role codes
                      const val = e.target.value.toUpperCase().replace(/\s/g, '_');
                      handleCreateInputChange({ target: { name: 'role_code', value: val } });
                    }}
                    placeholder="E.G. SALES_MANAGER"
                    className={`w-full px-4 py-2.5 bg-gray-50 border ${createFormErrors.role_code ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all`}
                    required
                  />
                  <p className="text-[9px] text-gray-400 font-medium">Unique identifier (UPPERCASE_SNAKE_CASE)</p>
                  {createFormErrors.role_code && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase italic">{createFormErrors.role_code}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
                  <textarea
                    name="role_description"
                    value={createFormData.role_description}
                    onChange={handleCreateInputChange}
                    placeholder="Describe the responsibilities of this role..."
                    rows="3"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="px-6 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createRoleMutation.isPending ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Role'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
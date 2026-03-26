import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Key, Layout, RotateCcw, Search, Settings, Shield, User, X } from 'lucide-react';
import {
  useCurrentUser,
  usePermission,
  usePermissions,
  useUserPermissions,
} from '../../queries/users/rolesPermissionsQuery';

const PAGE_SIZE = 10;

const normalizePermission = (permission, source = 'all') => ({
  ...permission,
  id: permission?.id || permission?.permission_code || permission?.code,
  permission_name: permission?.permission_name || permission?.name || 'Unnamed Permission',
  permission_code: permission?.permission_code || permission?.code || 'N/A',
  resource_type: permission?.resource_type || permission?.resource || 'General',
  action: permission?.action || 'ACCESS',
  description: permission?.description || '',
  granted_by_role: permission?.granted_by_role || null,
  source,
});

const Permission = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('mine');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: permissionsData, isLoading: isAllPermissionsLoading, isError: isAllPermissionsError, error: allPermissionsError } =
    usePermissions({
      page: currentPage,
      page_size: PAGE_SIZE,
      search: debouncedSearch,
    });

  const { data: currentUser, isLoading: isCurrentUserLoading, isError: isCurrentUserError, error: currentUserError } = useCurrentUser();
  const {
    data: userPermissionsData,
    isLoading: isUserPermissionsLoading,
    isError: isUserPermissionsError,
    error: userPermissionsError,
  } = useUserPermissions(currentUser?.id);

  const selectedPermissionId =
    selectedPermission?.source === 'all' && selectedPermission?.id ? selectedPermission.id : null;
  const { data: fullPermissionData, isLoading: isPermissionLoading } = usePermission(selectedPermissionId);

  const allPermissions = useMemo(
    () => (permissionsData?.results || []).map((permission) => normalizePermission(permission, 'all')),
    [permissionsData]
  );

  const myPermissions = useMemo(
    () => (userPermissionsData?.permissions || []).map((permission) => normalizePermission(permission, 'mine')),
    [userPermissionsData]
  );

  const filteredMyPermissions = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    if (!normalizedSearch) return myPermissions;

    return myPermissions.filter((permission) =>
      [
        permission.permission_name,
        permission.permission_code,
        permission.resource_type,
        permission.action,
        permission.granted_by_role,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [debouncedSearch, myPermissions]);

  const paginatedMyPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredMyPermissions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredMyPermissions]);

  const isShowingMine = viewMode === 'mine';
  const visiblePermissions = isShowingMine ? paginatedMyPermissions : allPermissions;
  const totalPermissionsCount = isShowingMine ? filteredMyPermissions.length : permissionsData?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalPermissionsCount / PAGE_SIZE));
  const resourceSource = isShowingMine ? filteredMyPermissions : allPermissions;

  const isLoading = isShowingMine
    ? isCurrentUserLoading || isUserPermissionsLoading
    : isAllPermissionsLoading;
  const isError = isShowingMine ? isCurrentUserError || isUserPermissionsError : isAllPermissionsError;
  const error = isShowingMine ? currentUserError || userPermissionsError : allPermissionsError;

  const stats = [
    {
      label: isShowingMine ? 'MY PERMISSIONS' : 'TOTAL PERMISSIONS',
      value: totalPermissionsCount,
      sub: isShowingMine ? 'Effective access on your account' : 'All access capabilities',
      border: 'border-gray-100',
    },
    {
      label: 'UNIQUE RESOURCES',
      value: new Set(resourceSource.map((permission) => permission.resource_type)).size,
      sub: isShowingMine ? 'Modules you can access' : 'System resource categories',
      border: 'border-blue-100',
      textColor: 'text-blue-500',
    },
  ];

  const modalPermission = fullPermissionData
    ? normalizePermission(fullPermissionData, 'all')
    : selectedPermission;
  const isMinePermissionModal = modalPermission?.source === 'mine';

  const handleOpenViewModal = (permission) => {
    setSelectedPermission(permission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPermission(null);
  };

  const getResourceIcon = (resource) => {
    switch (resource?.toLowerCase()) {
      case 'user':
        return <User size={14} />;
      case 'role':
        return <Shield size={14} />;
      case 'tenant':
        return <Layout size={14} />;
      case 'setting':
        return <Settings size={14} />;
      default:
        return <Key size={14} />;
    }
  };

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
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight uppercase">System Permissions</h1>
          <p className="text-gray-500 text-sm tracking-tight">Access & capabilities catalog</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder={isShowingMine ? 'Search your permissions...' : 'Search all permissions...'}
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
            <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => { setViewMode('mine'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${isShowingMine ? 'bg-[#0052CC] text-white shadow-sm' : 'text-gray-500 hover:text-[#172B4D]'
                  }`}
              >
                My Permissions
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('all'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${!isShowingMine ? 'bg-[#0052CC] text-white shadow-sm' : 'text-gray-500 hover:text-[#172B4D]'
                  }`}
              >
                All Permissions
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-6 ml-auto justify-between h-15 border-b border-gray-50">
            {/* Quick Filters Placeholder */}
            <div className="flex items-center gap-3 px-5 py-2">
            </div>

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block " />

            <div className="flex items-center justify-between gap-3 px-5 py-2">
              <button
                onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage((previousPage) => previousPage + 1)}
                disabled={isShowingMine ? currentPage >= totalPages || isLoading : !permissionsData?.next || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="flex-1 min-h-0 overflow-auto bg-white rounded-xl mt-0">
          <table className="w-full text-left relative">
            <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Permission Name</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">{isShowingMine ? 'Granted By' : 'Action Type'}</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                Array(PAGE_SIZE).fill(0).map((_, index) => <ShimmerRow key={index} />)
              ) : isError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-red-500">
                    Error: {error?.message || 'Something went wrong'}
                  </td>
                </tr>
              ) : visiblePermissions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">
                    {isShowingMine ? 'No permissions are currently assigned to your account.' : 'No permissions found.'}
                  </td>
                </tr>
              ) : (
                visiblePermissions.map((permission) => (
                  <tr key={`${permission.source}-${permission.id}`} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenViewModal(permission)}>
                      <p className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{permission.permission_name}</p>
                      <p className="text-xs text-gray-400 font-mono uppercase tracking-tight">{permission.permission_code}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-2 uppercase tracking-widest leading-none">
                        <span className="p-1 bg-gray-100 rounded text-gray-400">
                          {getResourceIcon(permission.resource_type)}
                        </span>
                        {permission.resource_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isShowingMine ? (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-100 bg-amber-50 text-amber-600 uppercase tracking-widest">
                          {permission.granted_by_role || 'Direct Access'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 uppercase tracking-widest">
                          {permission.action}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenViewModal(permission)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200 transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
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
            Showing <span className="font-bold text-[#172B4D]">{visiblePermissions.length}</span> of{' '}
            <span className="font-bold text-[#172B4D]">{totalPermissionsCount}</span> items
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-xl font-bold text-[#172B4D]">Permission Details</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-8">
              {selectedPermissionId && isPermissionLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-[#0052CC] rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Profiling Capability...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-linear-to-br from-[#0052CC] to-[#0747A6] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                      <Key size={32} />
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-[#172B4D] leading-tight">{modalPermission?.permission_name}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-1 font-bold tracking-widest uppercase">{modalPermission?.permission_code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Resource Type</label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-500 border border-gray-100">
                          {getResourceIcon(modalPermission?.resource_type)}
                        </div>
                        <p className="text-sm font-black text-[#172B4D] uppercase">{modalPermission?.resource_type || 'General'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {isMinePermissionModal ? 'Granted By' : 'Action Allowed'}
                      </label>
                      <div className="mt-2 text-sm font-black text-blue-600 bg-blue-50/50 border border-blue-100 px-3 py-1 rounded-lg inline-block uppercase tracking-wider">
                        {isMinePermissionModal ? modalPermission?.granted_by_role || 'Direct Access' : modalPermission?.action || 'Access'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Definition</label>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      {modalPermission?.description ||
                        `Granting this permission allows the user to perform ${modalPermission?.action || 'actions'} within the ${modalPermission?.resource_type || 'specified system'} modules.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={handleCloseModal}
                className="px-8 py-2.5 bg-[#172B4D] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#000000] transition-all active:scale-95 shadow-lg"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permission;
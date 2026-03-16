import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Shield, ShieldCheck, ShieldAlert, X, Eye, Info, Lock, Key, Layout, Settings, FileText, Globe } from 'lucide-react';
import { usePermissions, usePermission } from '../../queries/users/rolesPermissionsQuery';

const Permission = () => {
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

  const { data: permissionsData, isLoading, isError, error } = usePermissions({ 
    page: currentPage, 
    page_size: 10,
    search: debouncedSearch 
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState(null);
  
  const { data: fullPermissionData, isLoading: isPermissionLoading } = usePermission(selectedPermissionId);

  const permissions = permissionsData?.results || [];

  const stats = [
    { label: "TOTAL PERMISSIONS", value: permissionsData?.count || 0, sub: "All access capabilities", border: "border-gray-100" },
    { label: "UNIQUE RESOURCES", value: new Set(permissions.map(p => p.resource_type)).size, sub: "System resource categories", border: "border-blue-100", textColor: "text-blue-500" },
  ];

  const handleOpenViewModal = (permission) => {
    setSelectedPermissionId(permission.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPermissionId(null);
  };

  const getResourceIcon = (resource) => {
    switch (resource?.toLowerCase()) {
      case 'user': return <Settings size={14} />;
      case 'role': return <Shield size={14} />;
      case 'tenant': return <Layout size={14} />;
      case 'setting': return <Settings size={14} />;
      default: return <Key size={14} />;
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
    <main className="p-8 bg-[#F4F5F7] min-h-screen relative">
      {/* Page Title Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">System Permissions</h2>
          <p className="text-gray-500 text-sm">Fine-grained access control capabilities</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isLoading
          ? Array(2).fill(0).map((_, i) => <ShimmerCard key={i} />)
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
              <input 
                type="text" 
                placeholder="Search permissions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100" 
              />
            </div>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 font-medium"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Permission Name</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => <ShimmerRow key={i} />)
              ) : isError ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-red-500">Error: {error?.message || "Something went wrong"}</td></tr>
              ) : permissions.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">No permissions found.</td></tr>
              ) : (
                permissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenViewModal(perm)}>
                      <p className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{perm.permission_name || perm.name}</p>
                      <p className="text-xs text-gray-400 font-mono uppercase tracking-tight">{perm.permission_code || perm.code}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-2 uppercase tracking-widest leading-none">
                            <span className="p-1 bg-gray-100 rounded text-gray-400">
                                {getResourceIcon(perm.resource_type)}
                            </span>
                            {perm.resource_type || 'General'}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 uppercase tracking-widest`}>
                        {perm.action || 'ACCESS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenViewModal(perm)}
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

        {/* Pagination Section */}
        <div className="flex items-center justify-between mt-6 px-4 py-4 border-t border-gray-50 bg-white">
          <div className="text-sm text-gray-500">
            Showing <span className="font-bold text-[#172B4D]">{permissions.length}</span> of <span className="font-bold text-[#172B4D]">{permissionsData?.count || 0}</span> permissions
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
              {currentPage}
            </div>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!permissionsData?.next || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-xl font-bold text-[#172B4D]">Permission Details</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-8">
              {isPermissionLoading ? (
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
                      <h4 className="text-xl font-extrabold text-[#172B4D] leading-tight">{fullPermissionData?.permission_name || fullPermissionData?.name}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-1 font-bold tracking-widest uppercase">{fullPermissionData?.permission_code || fullPermissionData?.code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Resource Type</label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-500 border border-gray-100">
                            {getResourceIcon(fullPermissionData?.resource_type)}
                        </div>
                        <p className="text-sm font-black text-[#172B4D] uppercase">{fullPermissionData?.resource_type || 'General'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Action Allowed</label>
                      <div className="mt-2 text-sm font-black text-blue-600 bg-blue-50/50 border border-blue-100 px-3 py-1 rounded-lg inline-block uppercase tracking-wider">
                        {fullPermissionData?.action || 'Access'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Definition</label>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      {fullPermissionData?.description || `Granting this permission allows the user to perform ${fullPermissionData?.action || 'actions'} within the ${fullPermissionData?.resource_type || 'specified system'} modules.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
    </main>
  );
};

export default Permission;
import React from 'react';
import { Search, RotateCcw, Plus, Eye, UserX, UserCheck, ShieldAlert, Trash2, Edit } from 'lucide-react';
import { useAdmins, useDeleteAdmin, useUpdateAdmin } from '../queries/adminsQuery';

const AdminDetail = () => {
  const { data: adminsData, isLoading, isError, error } = useAdmins(1);
  const deleteMutation = useDeleteAdmin();
  const updateMutation = useUpdateAdmin();

  // Assuming adminsData structure: { count, active_count, pending_count, suspended_count, results: [...] }
  // Falling back to dummy values if API doesn't provide them yet
  const stats = [
    { label: "TOTAL ADMINS", value: adminsData?.count || 0, sub: "All registered", border: "border-gray-100" },
    { label: "ACTIVE", value: adminsData?.active_count || 0, sub: "Currently active", border: "border-green-100", textColor: "text-green-600" },
    { label: "PENDING", value: adminsData?.pending_count || 0, sub: "Awaiting approval", border: "border-orange-100", textColor: "text-orange-500" },
    { label: "SUSPENDED", value: adminsData?.suspended_count || 0, sub: "Access restricted", border: "border-red-100", textColor: "text-red-600" },
  ];

  const admins = adminsData?.results || [];

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (admin) => {
    const newStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateMutation.mutate({ id: admin.id, status: newStatus });
  };

  // Shimmer UI Component
  const ShimmerRow = () => (
    <tr className="animate-pulse border-b border-gray-50">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div><div className="h-3 bg-gray-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-14"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
      <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20"></div></td>
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
    <main className="p-8 bg-[#F4F5F7] min-h-screen">
      {/* Page Title Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">Platform Admins</h2>
          <p className="text-gray-500 text-sm">Manage administrative access and roles</p>
        </div>
        <button className="bg-[#0052CC] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-colors shadow-sm">
          <Plus size={18} /> New Admin
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <ShimmerCard key={i} />)
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
              <input type="text" placeholder="Search admins..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <select className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 outline-none">
              <option>All Roles</option>
            </select>
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
                <th className="px-6 py-4">Admin Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <ShimmerRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-red-500 font-medium">
                    Failed to load admins: {error.message}
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-medium">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#172B4D]">{admin.first_name} {admin.last_name}</p>
                      <p className="text-xs text-gray-400">@{admin.username}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-[#0052CC] text-[10px] font-bold px-2 py-1 rounded border border-blue-100">{admin.role || 'ADMIN'}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${admin.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium">{admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          title={admin.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          className={`p-1.5 rounded border transition-colors ${admin.status === 'ACTIVE' ? 'hover:bg-orange-50 text-orange-500 border-orange-100' : 'hover:bg-green-50 text-green-500 border-green-100'}`}
                        >
                          {admin.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 border border-gray-200"><Edit size={14} /></button>
                        <button
                          onClick={() => handleDelete(admin.id)}
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
    </main>
  );
};

export default AdminDetail;

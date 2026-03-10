import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDomainsQuery } from '../queries/domainQuery';
import { useTenants } from '../queries/tenantQuery';

/* ══════════════════════════════════════════════
   SKELETON ROW
══════════════════════════════════════════════ */
function SkeletonRow() {
  return (
    <tr>
      {[200, 120, 80].map((w, i) => (
        <td key={i} className="py-3 px-6 border-b border-gray-50">
          <div
            className="h-3.5 bg-gray-100 rounded-md animate-pulse"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ══════════════════════════════════════════════
   PRIMARY BADGE
══════════════════════════════════════════════ */
function PrimaryBadge({ domain }) {
  if (domain.is_primary) {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold
                       bg-green-100 text-green-700">
        ⭐ PRIMARY
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-bold
                     bg-gray-100 text-gray-500">
      ☆ SECONDARY
    </span>
  );
}

/* ══════════════════════════════════════════════
   DOMAIN ROW
══════════════════════════════════════════════ */
function DomainRow({ domain, tenantMap }) {
  const tenantName = tenantMap[domain.tenant] || domain.tenant?.slice(0, 8) + '…';

  return (
    <tr className="hover:bg-gray-50 transition-colors group">

      {/* Domain */}
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-[#172B4D] font-mono">
          {domain.domain}
        </span>
      </td>

      {/* Tenant */}
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500 font-medium">{tenantName}</span>
      </td>

      {/* Primary */}
      <td className="px-6 py-4">
        <PrimaryBadge domain={domain} />
      </td>

      {/* Actions — sirf View */}
      
    </tr>
  );
}

/* ══════════════════════════════════════════════
   DOMAINS PAGE
══════════════════════════════════════════════ */
export default function DomainDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTenantId = searchParams.get('tenant') || '';

  const [searchQuery,  setSearchQuery]  = useState('');
  const [tenantFilter, setTenantFilter] = useState(urlTenantId);

  const debounceRef = useRef(null);

  const queryParams = {
    ...(tenantFilter && { tenant: tenantFilter }),
    ...(searchQuery  && { search: searchQuery  }),
  };

  const { data, isLoading, isError, isFetching } = useDomainsQuery(queryParams);
  const { data: tenantsData } = useTenants({});

  const tenantMap = {};
  tenantsData?.results?.forEach((t) => { tenantMap[t.id] = t.company_name; });

  const selectedTenantName = tenantFilter
    ? (tenantMap[tenantFilter] || 'Tenant')
    : null;

  const domains    = data?.results ?? [];
  const totalCount = data?.count   ?? 0;

  const handleSearch = useCallback((value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(value), 350);
  }, []);

  const handleTenantFilter = (tenantId) => {
    setTenantFilter(tenantId);
    if (tenantId) setSearchParams({ tenant: tenantId });
    else          setSearchParams({});
  };

  return (
    <main className="p-8 bg-[#F4F5F7] min-h-screen">

      {/* ── Page Title ── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#172B4D]">
            {selectedTenantName ? `${selectedTenantName} — Domains` : 'Domains'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isFetching && !isLoading
              ? 'Refreshing…'
              : `${totalCount} domain${totalCount !== 1 ? 's' : ''} found`}
          </p>
        </div>
        {/* Add Domain button hataya ✅ */}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-50 flex items-center bg-white">
          <div className="flex gap-3 items-center">

            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by domain name…"
                defaultValue={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg
                           text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Tenant Filter */}
            <select
              className="bg-gray-50 border border-gray-200 text-gray-600 text-sm
                         rounded-lg px-3 py-2 outline-none"
              value={tenantFilter}
              onChange={(e) => handleTenantFilter(e.target.value)}
            >
              <option value="">All Tenants</option>
              {tenantsData?.results?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.company_name}
                </option>
              ))}
            </select>

            {/* Clear Filter */}
            {tenantFilter && (
              <button
                onClick={() => handleTenantFilter('')}
                className="text-gray-500 text-sm font-medium hover:text-gray-700"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Primary</th>
                
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 text-sm">

              {/* Loading */}
              {isLoading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

              {/* Error */}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-red-500 font-medium">
                    ⚠️ Failed to load domains. Please try again.
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!isLoading && !isError && domains.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="text-2xl mb-2">🌐</div>
                    <div className="text-sm font-semibold text-gray-500">No domains found</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {tenantFilter
                        ? 'This tenant has no domains yet.'
                        : 'No domains exist yet.'}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data */}
              {!isLoading && !isError && domains.map((domain) => (
                <DomainRow
                  key={domain.id}
                  domain={domain}
                  tenantMap={tenantMap}
                />
              ))}

            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
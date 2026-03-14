import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../queries/users/userQuery';

const UserProfile = () => {
  const { userid } = useParams();
  const navigate = useNavigate();

  // Fetch full user details using the provided API
  const { data: user, isLoading, isError, error } = useUser(userid);

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
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-500 text-sm">Manage user information, roles, and security</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" type="button">Assign Roles</button>
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
                <span className={`badge ${
                  user.status === 'ACTIVE' ? 'badge-green' : 
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
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-sm font-medium text-red-600">Unverified</span>
                  </div>
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
                <button className="text-brand-primary text-sm font-medium hover:underline text-blue-600">Edit</button>
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
                <button className="text-brand-primary text-sm font-medium hover:underline text-blue-600">Manage</button>
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
                <button className="btn-primary text-sm" type="button">Assign Roles</button>
              </div>
            </div>

            {/* Recent Logins Table */}
            <div className="card" data-purpose="login-history">
              <h3 className="font-bold text-gray-800 mb-4">Recent Logins</h3>
              <div className="table-container">
                <table className="custom-table" id="recent-logins-table">
                  <thead>
                    <tr>
                      <th>Login Time</th>
                      <th>Device</th>
                      <th>IP Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="whitespace-nowrap">Oct 24, 2023, 09:45 AM</td>
                      <td>Chrome / Windows</td>
                      <td>192.168.1.45</td>
                      <td><span className="text-green-600 font-semibold">Success</span></td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap">Oct 23, 2023, 02:20 PM</td>
                      <td>Mobile App / iOS</td>
                      <td>103.44.21.10</td>
                      <td><span className="text-green-600 font-semibold">Success</span></td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap">Oct 21, 2023, 11:15 AM</td>
                      <td>Safari / MacOS</td>
                      <td>103.44.21.10</td>
                      <td><span className="text-red-600 font-semibold">Failed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <button className="text-blue-600 text-sm font-medium hover:underline">View All Activities</button>
              </div>
            </div>
          </section>
          {/* END: RightColumn */}
        </div>
      </main>
      {/* END: MainContainer */}
    </div>
  );
};

export default UserProfile;

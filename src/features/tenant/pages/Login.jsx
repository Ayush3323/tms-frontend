import React, { useEffect, useState } from 'react';
import { useLogin } from '../queries/loginQuery';
import { useNavigate } from 'react-router-dom';
import banner from '../../../assets/banner.avif';
import {
  getTenantContext,
  resolveTenantContext,
  subscribeTenantContext,
} from '../context/tenantContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [tenantState, setTenantState] = useState(getTenantContext());
  const navigate = useNavigate();

  const { mutate: login, isPending, isError, error } = useLogin();

  useEffect(() => {
    const remembered = localStorage.getItem("remembered_email");
    if (remembered) setEmail(remembered);
    const pref = localStorage.getItem("auth_storage");
    if (pref === "session") setRememberMe(false);

    const unsub = subscribeTenantContext((next) => setTenantState(next));
    resolveTenantContext().catch(() => {
      // handled via tenantState error UI
    });
    return unsub;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tenantState?.data?.id) return;
    login(
      { email, password, rememberMe },
      {
        onSuccess: () => {
          navigate('/tenant/dashboard');
        }
      }
    );
  };

  const companyName = tenantState?.data?.trading_name || tenantState?.data?.company_name || "Tenant";
  const logoLetter = companyName?.charAt(0)?.toUpperCase() || "T";

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">

        {/* Left Side - Login Form */}
        <div className="w-full flex items-center">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-xl">
                {logoLetter}
              </div>
              <h2 className="text-gray-500 text-xs font-semibold tracking-widest uppercase mt-6">{companyName}</h2>
              <h1 className="text-gray-900 text-2xl font-bold mt-2">Tenant Login</h1>
              <p className="text-gray-500 text-sm mt-2">Sign in to manage your fleet.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
            {/* email Field */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                Remember me
              </label>
            </div>

            {tenantState?.status === "loading" && (
              <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                Resolving tenant from domain...
              </div>
            )}

            {tenantState?.status === "error" && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                Unable to resolve tenant for this domain. Use a valid tenant domain or set <code>tenant_domain</code> query param locally.
              </div>
            )}

            {/* Error Message */}
            {isError && (
              <div className="text-red-500 text-sm mt-2">
                {error?.response?.data?.message || "Invalid credentials. Please try again."}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isPending || tenantState?.status === "loading" || !tenantState?.data?.id}
              className={`w-full py-3 rounded-lg text-white font-semibold text-base transition-all duration-200
                ${isPending || tenantState?.status === "loading" || !tenantState?.data?.id
                  ? 'bg-violet-300 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 active:scale-[0.98]'
                }`}
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>
          </div>
        </div>

        {/* Right Side - Banner Image */}
        <div className="hidden lg:flex items-center justify-center p-4">
          <div className="w-full relative rounded-3xl overflow-hidden shadow-sm border border-gray-200 bg-white">
            <img
              src={banner}
              alt="Alpha Transport Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/20 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

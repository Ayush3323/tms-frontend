import React, { useState } from 'react';
import { useLogin } from '../queries/loginQuery';
import { useNavigate } from 'react-router-dom';
import banner from '../../../assets/banner.avif';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { mutate: login, isPending, isError, error } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(
      { username, password },
      {
        onSuccess: () => {
          navigate('/admin/dashboard');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0a19] flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Login Form */}
        <div className="max-w-md w-full mx-auto lg:mx-0">
          {/* Logo Section */}
          <div className="mb-10">
            <div className="bg-[#1e1b2e] w-16 h-16 rounded-md flex items-center justify-center mb-6 border border-gray-700">
              <span className="text-purple-400 font-bold text-2xl">A</span>
            </div>
            <h2 className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-1">Alpha Transport</h2>
            <h1 className="text-white text-3xl font-bold mt-4">Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none"
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

            {/* Error Message */}
            {isError && (
              <div className="text-red-500 text-sm mt-2">
                {error?.response?.data?.message || "Invalid credentials. Please try again."}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isPending}
              className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition-all duration-300
                ${isPending
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-[#b68ef5] hover:bg-[#a176e8] active:scale-[0.98]'
                }`}
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Right Side - Banner Image */}
        <div className="hidden lg:flex items-center justify-center p-4">
          <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-purple-900/20">
            <img
              src={banner}
              alt="Alpha Transport Banner"
              className="w-full h-auto object-cover opacity-100"
            />
            {/* Optional Overlay to match the dark aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f0a19]/40 to-transparent pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

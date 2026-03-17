import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useChangePassword, useResetPassword } from '../../queries/users/userActionQuery';

const SettingsModal = ({ isOpen, onClose, userEmail }) => {
  const [activeTab, setActiveTab] = useState('change'); // 'change' or 'reset'
  const changePasswordMutation = useChangePassword();
  const resetPasswordMutation = useResetPassword();

  const [changeFormData, setChangeFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: ''
  });

  const [resetFormData, setResetFormData] = useState({
    email: userEmail || ''
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setChangeFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleResetInput = (e) => {
    const { name, value } = e.target;
    setResetFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!changeFormData.old_password) newErrors.old_password = 'Old password is required';
    if (!changeFormData.new_password) newErrors.new_password = 'New password is required';
    if (changeFormData.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters';
    if (changeFormData.new_password !== changeFormData.new_password_confirm) {
      newErrors.new_password_confirm = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    changePasswordMutation.mutate({
      old_password: changeFormData.old_password,
      new_password: changeFormData.new_password,
      new_password_confirm: changeFormData.new_password_confirm
    }, {
      onSuccess: () => {
        setSuccessMessage('Password changed successfully!');
        setChangeFormData({ old_password: '', new_password: '', new_password_confirm: '' });
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 2000);
      },
      onError: (err) => {
        // Extract field-specific errors from backend structure if available
        if (err?.error?.details) {
          const detailErrors = {};
          Object.entries(err.error.details).forEach(([key, value]) => {
            detailErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setErrors(detailErrors);
        } else {
          setErrors({ non_field_errors: err?.message || err?.error?.message || 'Failed to change password' });
        }
      }
    });
  };

  const handleResetRequest = (e) => {
    e.preventDefault();
    if (!resetFormData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    resetPasswordMutation.mutate({ email: resetFormData.email }, {
      onSuccess: () => {
        setSuccessMessage('Password reset email sent successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 2000);
      },
      onError: (err) => {
        setErrors({ non_field_errors: err?.response?.data?.message || err.message || 'Failed to send reset email' });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-[#0052CC]">
              <Lock size={18} />
            </div>
            <h3 className="text-xl font-bold text-[#172B4D]">Security Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setActiveTab('change'); setErrors({}); setSuccessMessage(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'change' ? 'text-[#0052CC] border-b-2 border-[#0052CC] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Change Password
          </button>
          <button
            onClick={() => { setActiveTab('reset'); setErrors({}); setSuccessMessage(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'reset' ? 'text-[#0052CC] border-b-2 border-[#0052CC] bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Reset Request
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-600 animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} />
              <p className="text-sm font-bold">{successMessage}</p>
            </div>
          )}

          {errors.non_field_errors && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <p className="text-sm font-bold">{errors.non_field_errors}</p>
            </div>
          )}

          {activeTab === 'change' ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Old Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    name="old_password"
                    value={changeFormData.old_password}
                    onChange={handleChangeInput}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${errors.old_password ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.old_password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.old_password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    name="new_password"
                    value={changeFormData.new_password}
                    onChange={handleChangeInput}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${errors.new_password ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.new_password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.new_password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    name="new_password_confirm"
                    value={changeFormData.new_password_confirm}
                    onChange={handleChangeInput}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${errors.new_password_confirm ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.new_password_confirm && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.new_password_confirm}</p>}
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full bg-[#0052CC] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0747A6] transition-all shadow-lg shadow-blue-100 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {changePasswordMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Update Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  We will send a password reset link to your registered email address. Please follow the instructions in the email.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={resetFormData.email}
                    onChange={handleResetInput}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0052CC] transition-all`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-white text-[#172B4D] border border-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {resetPasswordMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                ) : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <p className="text-[10px] text-gray-400 font-medium">
            Protected by Advanced Security Protocol
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

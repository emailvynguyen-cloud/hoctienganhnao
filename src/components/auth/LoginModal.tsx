import React, { useState } from 'react';
import { UserRole, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Lock, Mail, Key, Sparkles, UserCheck, Shield, Crown, Info, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emailOrUsername || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    const user = StorageEngine.authenticateUser(emailOrUsername, password);
    if (user) {
      StorageEngine.setCurrentUser(user);
      onLoginSuccess(user);
      onClose();
    } else {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!');
    }
  };

  const handleQuickLogin = (role: 'super_admin' | 'admin' | 'teacher') => {
    const users = StorageEngine.getUsers();
    const targetUser = users.find((u) => u.role === role) || users[0];
    if (targetUser) {
      StorageEngine.setCurrentUser(targetUser);
      onLoginSuccess(targetUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Background Pastel Decor Blob */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950 p-1 mx-auto shadow-md border border-purple-200">
            <img src="/logo.jpg" alt="Ms. Vy Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Đăng Nhập Bộ Phận Quản Lý & Giáo Viên
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Hệ thống Theo dõi Học tập MS. VY ENGLISH
          </p>
        </div>

        {/* Student Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 text-xs text-pink-900 dark:text-pink-200 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <p>
            <strong>Học viên không cần đăng nhập!</strong> Mỗi học viên được cung cấp một <strong>đường link riêng biệt</strong> dẫn trực tiếp tới bảng học tập cá nhân.
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-purple-200 uppercase tracking-wider mb-1.5">
              Email / Tên Đăng Nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="superadmin / admin / teacher..."
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-purple-200 uppercase tracking-wider mb-1.5">
              Mật Khẩu
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/20"
          >
            Đăng Nhập Hệ Thống
          </button>
        </form>

        {/* Quick Demo Selectors */}
        <div className="border-t border-purple-100 dark:border-purple-800 pt-4 space-y-2">
          <span className="block text-[11px] font-bold text-center text-slate-400 uppercase tracking-wider">
            Nút Thử Đăng Nhập Nhanh (Demo)
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('super_admin')}
              className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-black text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Super Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-[11px] font-black text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Quản Trị</span>
            </button>

            <button
              onClick={() => handleQuickLogin('teacher')}
              className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-[11px] font-black text-center transition flex flex-col items-center justify-center space-y-1"
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Giáo Viên</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

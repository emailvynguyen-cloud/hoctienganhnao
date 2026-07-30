import React, { useState } from 'react';
import { UserRole, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Lock, Mail, Key, Sparkles, UserCheck, Shield, Crown, Info, X, LogIn } from 'lucide-react';

interface LoginModalProps {
  isOpen?: boolean;
  canClose?: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  canClose = true,
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

  const handleQuickLogin = (emailInput: string, passInput: string) => {
    setEmailOrUsername(emailInput);
    setPassword(passInput);
    const user = StorageEngine.authenticateUser(emailInput, passInput);
    if (user) {
      StorageEngine.setCurrentUser(user);
      onLoginSuccess(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 p-6 sm:p-8 space-y-6 relative overflow-hidden text-slate-800 dark:text-white">
        
        {/* Background Pastel Decor Blob */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Optional Close Button (Only if allowed) */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950 p-1 mx-auto shadow-md border border-purple-200">
            <img src="/logo.jpg" alt="Ms. Vy Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Đăng Nhập Vào Hệ Thống Quản Lý
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Vui lòng đăng nhập tài khoản của bạn để truy cập đúng phân quyền
          </p>
        </div>

        {/* Student Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 text-xs text-pink-900 dark:text-pink-200 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Học viên không cần đăng nhập!</strong> Học viên sử dụng <strong>đường link cá nhân riêng</strong> do trung tâm gửi để truy cập trực tiếp.
          </p>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider block text-center">
            ⚡ Đăng Nhập Nhanh Theo Vai Trò Demo:
          </span>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-extrabold">
            <button
              onClick={() => handleQuickLogin('superadmin@msvyenglish.edu.vn', 'admin123')}
              className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 transition flex flex-col items-center text-center shadow-2xs"
            >
              <Crown className="w-4 h-4 text-amber-500 mb-0.5" />
              <span>Super Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@msvyenglish.edu.vn', 'admin123')}
              className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-300 transition flex flex-col items-center text-center shadow-2xs"
            >
              <Shield className="w-4 h-4 text-pink-600 mb-0.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('alex.smith@msvyenglish.edu.vn', 'teacher123')}
              className="p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300 transition flex flex-col items-center text-center shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-sky-600 mb-0.5" />
              <span>Giáo Viên</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-purple-200 uppercase tracking-wider mb-1.5">
              Email / Tên Đăng Nhập
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Nhập email hoặc tên tài khoản..."
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
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/20 flex items-center justify-center"
          >
            <LogIn className="w-4 h-4 mr-1.5" /> Đăng Nhập Hệ Thống
          </button>
        </form>

      </div>
    </div>
  );
};

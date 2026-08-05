import React, { useState } from 'react';
import { UserRole, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import logoImg from '../../assets/logo.jpg';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* Background Pastel Decor Blob */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* HEADER - Fixed Top */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 p-1 shadow-md border border-purple-200 shrink-0">
              <img
                src={logoImg}
                alt="Ms. Vy Logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== window.location.origin + '/logo.jpg' && target.src !== '/logo.jpg') {
                    target.src = '/logo.jpg';
                  } else {
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='25' fill='%23ec4899'/%3E%3Ctext x='50' y='65' font-size='45' font-weight='900' fill='white' text-anchor='middle'%3EVY%3C/text%3E%3C/svg%3E";
                  }
                }}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Đăng Nhập Hệ Thống
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Đăng nhập phân hệ quản trị / giáo viên
              </p>
            </div>
          </div>

          {canClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BODY CONTENT - Scrollable */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-medium min-h-0">
          {/* Student Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 text-xs text-pink-900 dark:text-pink-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Học viên không cần đăng nhập!</strong> Học viên sử dụng <strong>đường link cá nhân riêng</strong> do trung tâm gửi để truy cập trực tiếp.
            </p>
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/20 flex items-center justify-center cursor-pointer"
            >
              <LogIn className="w-4 h-4 mr-1.5" /> Đăng Nhập Hệ Thống
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-900 dark:text-white">
        
        {/* HEADER - Fixed Top */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-0.5 shadow-2xs border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden">
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
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Đăng Nhập Hệ Thống
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Đăng nhập phân hệ quản trị / giáo viên
              </p>
            </div>
          </div>

          {canClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* BODY CONTENT - Scrollable */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-medium min-h-0">
          {/* Student Notice Banner */}
          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 text-xs text-rose-900 dark:text-rose-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed font-normal">
              <strong className="font-semibold">Học viên không cần đăng nhập!</strong> Học viên sử dụng <strong className="font-semibold">đường link cá nhân riêng</strong> do trung tâm gửi để truy cập trực tiếp.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email / Tên Đăng Nhập
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Nhập email hoặc tên tài khoản..."
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 font-normal transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mật Khẩu
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 font-normal transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs transition shadow-2xs flex items-center justify-center cursor-pointer"
            >
              <LogIn className="w-4 h-4 mr-1.5" /> Đăng Nhập Hệ Thống
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

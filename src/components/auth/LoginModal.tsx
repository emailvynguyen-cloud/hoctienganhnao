import React, { useState } from 'react';
import { UserRole, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import logoImg from '../../assets/logo.jpg';
import { Lock, Mail, Key, Sparkles, UserCheck, Shield, Crown, Info, X, LogIn, ArrowRight, AlertCircle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
  const [studentCode, setStudentCode] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = studentCode.trim();
    const cleanCode = cleanInput.replace(/\s+/g, '').toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Vui lòng nhập Mã học viên của bạn!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const students = StorageEngine.getStudents() || [];
      const matchedStudent = students.find((s) => {
        if (!s || s.status === 'soft_deleted') return false;
        const matchCode = s.studentCode && s.studentCode.trim().replace(/\s+/g, '').toUpperCase() === cleanCode;
        const matchHash = s.publicHash && s.publicHash.trim().replace(/\s+/g, '').toUpperCase() === cleanCode;
        const matchId = s.id && s.id.trim().replace(/\s+/g, '').toUpperCase() === cleanCode;
        const matchEmail = s.email && s.email.trim().toLowerCase() === cleanInput.toLowerCase();
        const matchPhone = s.phone && s.phone.trim().replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '');
        return matchCode || matchHash || matchId || matchEmail || matchPhone;
      });

      if (!matchedStudent) {
        setErrorMsg('Mã học viên không hợp lệ. Vui lòng kiểm tra lại mã của bạn.');
        setIsSubmitting(false);
        return;
      }

      if (matchedStudent.studentCodeStatus === 'DISABLED') {
        setErrorMsg('Mã học viên này hiện không hoạt động. Vui lòng liên hệ giáo viên.');
        setIsSubmitting(false);
        return;
      }

      // Save student session & portal URL
      StorageEngine.setCurrentStudentSession(matchedStudent.id);
      const targetUrl = `/student/${matchedStudent.publicHash || matchedStudent.id}`;
      StorageEngine.setLastStudentPortalUrl(targetUrl);

      setIsSubmitting(false);
      window.location.href = targetUrl;
    }, 250);
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-900 dark:text-white">
        
        {/* HEADER - Fixed Top */}
        <div className="p-5 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 border-b border-pink-100 dark:border-slate-800 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-0.5 shadow-md border border-pink-200 dark:border-slate-700 shrink-0 overflow-hidden">
              <img
                src={logoImg}
                alt="Veronica English"
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
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Veronica English
              </h2>
              <p className="text-xs font-bold text-pink-600 dark:text-pink-400">
                {activeTab === 'student' ? 'Chào mừng bạn đến với lớp học!' : 'Phân hệ Đội ngũ & Quản trị'}
              </p>
            </div>
          </div>

          {canClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* TABS SWITCHER */}
        <div className="flex border-b border-pink-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1.5 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm border border-pink-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>🎒 Học Viên (Mã học viên)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'staff'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>🔑 Giáo Viên / Admin</span>
          </button>
        </div>

        {/* BODY CONTENT - Scrollable */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 font-normal min-h-0">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-900 dark:text-rose-200 flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: STUDENT CODE LOGIN */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-2 flex items-center justify-between">
                  <span>Mã học viên *</span>
                  <span className="text-[11px] font-medium text-pink-600 dark:text-pink-400">Ví dụ: HV7K29</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã học viên của bạn..."
                    className="w-full p-4 rounded-2xl border-2 border-pink-300 focus:border-pink-500 dark:border-slate-700 dark:focus:border-pink-500 bg-white dark:bg-slate-800 text-base font-black tracking-wider uppercase text-center placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-900/40 shadow-inner transition duration-150"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-base shadow-lg hover:shadow-xl transform active:scale-98 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang kiểm tra...</span>
                  </span>
                ) : (
                  <>
                    <span>Vào học</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: STAFF LOGIN (TEACHER / ADMIN / SUPER ADMIN) */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  Email / Tên Đăng Nhập *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Nhập email hoặc tên tài khoản..."
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 font-normal transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  Mật Khẩu *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 font-normal transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition shadow-md flex items-center justify-center cursor-pointer border border-transparent"
              >
                <LogIn className="w-4.5 h-4.5 mr-2" /> Đăng Nhập Quản Trị / Giáo Viên
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

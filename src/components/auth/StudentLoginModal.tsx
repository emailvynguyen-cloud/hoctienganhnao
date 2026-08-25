import React, { useState } from 'react';
import { Student } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { CloudSyncEngine } from '../../lib/cloudSync';
import { normalizeStudentKey } from '../../lib/obfuscate';
import logoImg from '../../assets/logo.jpg';
import { LogIn, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface StudentLoginModalProps {
  isOpen?: boolean;
  onStudentLoginSuccess: (student: Student) => void;
  onSwitchToStaffLogin?: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen = true,
  onStudentLoginSuccess,
  onSwitchToStaffLogin,
}) => {
  const [studentCode, setStudentCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = studentCode.trim();
    const cleanKey = normalizeStudentKey(cleanInput);
    if (!cleanKey && !cleanInput) {
      setErrorMsg('Vui lòng nhập Mã học viên của bạn!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Force fresh pull from Supabase Cloud DB before validating code to ensure cross-device consistency
      await CloudSyncEngine.pullInitialCloudData();
    } catch (e) {
      console.warn('[LOGIN][SYNC] Cloud pull before login failed:', e);
    }

    const students = StorageEngine.getStudents() || [];
    const matchedStudent = students.find((s) => {
      if (!s || s.status === 'soft_deleted') return false;
      const matchCode = s.studentCode && normalizeStudentKey(s.studentCode) === cleanKey;
      const matchName = s.name && normalizeStudentKey(s.name) === cleanKey;
      const matchHash = s.publicHash && normalizeStudentKey(s.publicHash) === cleanKey;
      const matchId = s.id && normalizeStudentKey(s.id) === cleanKey;
      const matchEmail = s.email && s.email.trim().toLowerCase() === cleanInput.toLowerCase();
      const matchPhone = s.phone && s.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, '');
      return matchCode || matchName || matchHash || matchId || matchEmail || (matchPhone && cleanInput.replace(/\D/g, '').length >= 6);
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

    // Save student session & last portal URL
    StorageEngine.setCurrentStudentSession(matchedStudent.id);
    StorageEngine.setLastStudentPortalUrl(`/student/${matchedStudent.publicHash || matchedStudent.id}`);

    setIsSubmitting(false);
    onStudentLoginSuccess(matchedStudent);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 text-slate-800 dark:text-white relative">
        
        {/* LOGO & BRANDING HEADER */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-400 via-rose-500 to-purple-500 p-1 shadow-lg mx-auto transform hover:scale-105 transition duration-200">
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
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Veronica English
            </h1>
            <p className="text-xs sm:text-sm font-extrabold text-pink-600 dark:text-pink-400 mt-1">
              "Chào mừng bạn đến với lớp học!"
            </p>
          </div>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start space-x-2.5 shadow-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* STUDENT LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
                <span>Đang kiểm tra mã...</span>
              </span>
            ) : (
              <>
                <span>Vào học</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* FOOTER SWITCH TO STAFF LOGIN */}
        {onSwitchToStaffLogin && (
          <div className="pt-2 text-center border-t border-pink-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onSwitchToStaffLogin}
              className="text-xs font-bold text-slate-500 hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-400 transition cursor-pointer"
            >
              🔑 Giáo viên / Admin đăng nhập tại đây ↗
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

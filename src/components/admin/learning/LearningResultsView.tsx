import React, { useState } from 'react';
import { User, StudentTestAttempt } from '../../../types';
import { RotateCcw, ShieldAlert, CheckCircle2, XCircle, Search, Filter, Lock } from 'lucide-react';

interface LearningResultsViewProps {
  currentUser?: User | null;
}

export const LearningResultsView: React.FC<LearningResultsViewProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isTeacher = currentUser?.role === 'teacher';

  const [searchQuery, setSearchQuery] = useState('');
  const [resetModalAttempt, setResetModalAttempt] = useState<StudentTestAttempt | null>(null);
  const [resetReason, setResetReason] = useState('');

  const sampleAttempts: StudentTestAttempt[] = [
    {
      id: 'att_01',
      studentId: 'std_01',
      studentCode: 'STUDENT01',
      studentName: 'Lê Minh Anh',
      chapterTestId: 'ct_ch1_v1',
      testVersion: 1,
      score: 9,
      maxScore: 10,
      percentage: 90,
      isPassed: true,
      timeSpentSeconds: 420,
      status: 'completed',
      submittedAt: new Date().toISOString(),
    },
    {
      id: 'att_02',
      studentId: 'std_02',
      studentCode: 'STUDENT02',
      studentName: 'Nguyễn Hoàng Nam',
      chapterTestId: 'ct_ch1_v1',
      testVersion: 1,
      score: 5,
      maxScore: 10,
      percentage: 50,
      isPassed: false,
      timeSpentSeconds: 600,
      status: 'completed',
      submittedAt: new Date().toISOString(),
    },
  ];

  const [attemptsList, setAttemptsList] = useState<StudentTestAttempt[]>(sampleAttempts);

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalAttempt || !resetReason.trim()) {
      alert('Vui lòng nhập lý do reset bài kiểm tra.');
      return;
    }

    setAttemptsList((prev) =>
      prev.map((att) =>
        att.id === resetModalAttempt.id
          ? {
              ...att,
              status: 'reset',
              resetBy: currentUser?.displayName || 'Super Admin',
              resetAt: new Date().toISOString(),
              resetReason: resetReason.trim(),
            }
          : att
      )
    );

    alert(`Đã reset lượt làm bài thi cho học viên ${resetModalAttempt.studentName}. Lịch sử audit log đã được ghi nhận.`);
    setResetModalAttempt(null);
    setResetReason('');
  };

  const filtered = attemptsList.filter(
    (a) =>
      a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>📊 Bảng Thống Kê Kết Quả Học Viên</span>
            {isTeacher && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                READ-ONLY
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi điểm bài kiểm tra Chapter Test & lịch sử nộp bài của toàn bộ trung tâm.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên hoặc Mã học viên..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs font-bold"
          />
        </div>
      </div>

      {/* ATTEMPTS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-4">Học Viên</th>
                <th className="p-4">Mã HV</th>
                <th className="p-4">Phiên Bản</th>
                <th className="p-4">Điểm Số</th>
                <th className="p-4">Tỷ Lệ</th>
                <th className="p-4">Kết Quả</th>
                <th className="p-4">Thời Gian</th>
                <th className="p-4">Trạng Thái</th>
                {isSuperAdmin && <th className="p-4 text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{att.studentName}</td>
                  <td className="p-4 font-mono font-bold text-pink-600">{att.studentCode}</td>
                  <td className="p-4">v{att.testVersion}</td>
                  <td className="p-4 font-bold">{att.score} / {att.maxScore}</td>
                  <td className="p-4 font-black">{att.percentage}%</td>
                  <td className="p-4">
                    {att.isPassed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> PASSED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-[10px] font-black inline-flex items-center">
                        <XCircle className="w-3 h-3 mr-1" /> FAILED
                      </span>
                    )}
                  </td>
                  <td className="p-4">{Math.round(att.timeSpentSeconds / 60)} phút</td>
                  <td className="p-4">
                    {att.status === 'reset' ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Đã Reset ({att.resetReason})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Completed
                      </span>
                    )}
                  </td>
                  {isSuperAdmin && (
                    <td className="p-4 text-right">
                      {att.status !== 'reset' && (
                        <button
                          onClick={() => setResetModalAttempt(att)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] transition inline-flex items-center cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Reset Lượt Làm
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESET ATTEMPT AUDIT MODAL (SUPER ADMIN ONLY) */}
      {resetModalAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              <span>Reset Lượt Làm Chapter Test</span>
            </h3>

            <p className="text-xs text-slate-500 font-medium">
              Bạn đang thực hiện reset bài làm cho học viên <strong>{resetModalAttempt.studentName}</strong> ({resetModalAttempt.studentCode}).
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nhập Lý Do Reset (Bắt buộc lưu Audit Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Ví dụ: Học viên bị sự cố mạng trong khi thi..."
                  className="w-full p-3 rounded-xl border text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalAttempt(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md"
                >
                  Xác Nhận Reset & Ghi Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

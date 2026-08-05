import React, { useState } from 'react';
import { Student, StudentAbsenceRecord, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { formatSessionDate } from '../../lib/dateUtils';
import { Calendar, Plus, Edit3, Trash2, X, CheckCircle2, AlertCircle, Clock, Save, UserCheck, ShieldCheck } from 'lucide-react';

interface StudentAbsenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentUser?: User | null;
  onRefreshData: () => void;
}

export const StudentAbsenceManagerModal: React.FC<StudentAbsenceManagerModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  onRefreshData,
}) => {
  const isAuthorized = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [isMakeupCompleted, setIsMakeupCompleted] = useState<boolean>(false);

  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editMakeup, setEditMakeup] = useState<boolean>(false);

  if (!isOpen || !student) return null;

  const absencesList: StudentAbsenceRecord[] = student.absences || [];

  const handleAddAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      alert('Chỉ Super Admin và Giáo viên mới có quyền thêm buổi nghỉ!');
      return;
    }
    if (!date) {
      alert('Vui lòng chọn Ngày nghỉ!');
      return;
    }

    StorageEngine.addStudentAbsence(student.id, date, reason, isMakeupCompleted, currentUser);
    setIsAddFormOpen(false);
    setDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setIsMakeupCompleted(false);
    alert(`Đã ghi nhận buổi nghỉ ngày ${formatSessionDate(date)} cho học viên ${student.name}!`);
    onRefreshData();
  };

  const handleStartEdit = (abs: StudentAbsenceRecord) => {
    setEditingAbsenceId(abs.id);
    setEditDate(abs.date);
    setEditReason(abs.reason || '');
    setEditMakeup(!!abs.isMakeupCompleted);
  };

  const handleSaveEdit = (absenceId: string) => {
    if (!isAuthorized) return;
    if (!editDate) {
      alert('Vui lòng chọn Ngày nghỉ!');
      return;
    }

    StorageEngine.updateStudentAbsence(student.id, absenceId, editDate, editReason, editMakeup, currentUser);
    setEditingAbsenceId(null);
    alert('Đã cập nhật chỉnh sửa buổi nghỉ thành công!');
    onRefreshData();
  };

  const handleDeleteAbsence = (abs: StudentAbsenceRecord) => {
    if (!isAuthorized) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa buổi nghỉ ngày ${formatSessionDate(abs.date)} của em ${student.name}?`)) {
      StorageEngine.deleteStudentAbsence(student.id, abs.id, currentUser);
      alert('Đã xóa buổi nghỉ khỏi danh sách!');
      onRefreshData();
    }
  };

  const totalAbsences = absencesList.length;
  const makeupCount = absencesList.filter((a) => a.isMakeupCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-400 to-pink-500 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src={resolveAvatarUrl(student.avatar)}
              alt={student.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
              }}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-white/40 shadow-xs"
            />
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight uppercase">
                QUẢN LÝ BUỔI NGHỈ • {student.name}
              </h3>
              <span className="text-[11px] opacity-90 font-medium block">
                SĐT: {student.phone || 'Chưa có'} • SĐT Phụ huynh: {student.parentPhone || 'Chưa có'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-amber-50/70 dark:bg-slate-800/80 border-b border-amber-100 dark:border-slate-800 text-center shrink-0">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block uppercase">Số Buổi Đã Nghỉ</span>
            <span className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400">
              {totalAbsences} Buổi
            </span>
          </div>

          <div className="space-y-0.5 border-x border-amber-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block uppercase">Đã Học Bù</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {makeupCount} Buổi
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-pink-900 dark:text-pink-300 block uppercase">Số Buổi Còn Lại</span>
            <span className="text-base sm:text-lg font-black text-pink-600 dark:text-pink-400">
              {student.remainingSessions} Buổi
            </span>
          </div>
        </div>

        {/* Action Header: Add Absence Button */}
        {isAuthorized && (
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-amber-500" /> Lịch Sử Đã Ghi Nhận ({absencesList.length} lần)
            </span>

            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> {isAddFormOpen ? 'Hủy Thêm' : 'Thêm Buổi Nghỉ Mới'}
            </button>
          </div>
        )}

        {/* Add Absence Inline Form */}
        {isAddFormOpen && isAuthorized && (
          <form onSubmit={handleAddAbsence} className="p-4 bg-amber-50/90 dark:bg-slate-800 border-b border-amber-200 dark:border-slate-700 space-y-3 shrink-0 animate-fadeIn text-xs">
            <h4 className="font-black text-xs text-amber-950 dark:text-amber-300 uppercase flex items-center">
              ➕ Nhập Thông Tin Buổi Nghỉ Mới Cho Học Viên {student.name}:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Ngày Nghỉ Học *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Lý Do Nghỉ (Không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bị sốt, gia đình có việc bận..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 font-medium text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-amber-900 dark:text-amber-200">
                <input
                  type="checkbox"
                  checked={isMakeupCompleted}
                  onChange={(e) => setIsMakeupCompleted(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-400 cursor-pointer"
                />
                <span>Đã xếp/hoàn thành học bù cho buổi nghỉ này</span>
              </label>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Lưu Buổi Nghỉ
              </button>
            </div>
          </form>
        )}

        {/* Absences List Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 text-xs">
          {absencesList.length > 0 ? (
            absencesList.map((abs) => {
              const isEditingThis = editingAbsenceId === abs.id;

              if (isEditingThis) {
                return (
                  <div key={abs.id} className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-400 space-y-3">
                    <h5 className="font-black text-amber-900 dark:text-amber-200 uppercase">
                      ✏️ Chỉnh Sửa Buổi Nghỉ Ngày {formatSessionDate(abs.date)}:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full p-2 rounded-xl border border-amber-300 font-bold bg-white dark:bg-slate-900"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Lý do nghỉ..."
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full p-2 rounded-xl border border-amber-300 font-medium bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 font-bold text-amber-900">
                        <input
                          type="checkbox"
                          checked={editMakeup}
                          onChange={(e) => setEditMakeup(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>Đã hoàn thành học bù</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingAbsenceId(null)}
                          className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSaveEdit(abs.id)}
                          className="px-3.5 py-1 rounded-xl bg-emerald-600 text-white font-extrabold shadow-xs"
                        >
                          Lưu Cập Nhật
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={abs.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-amber-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                        🗓️ Ngày: {formatSessionDate(abs.date)}
                      </span>
                      {abs.isMakeupCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Đã Học Bù
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          Chưa Học Bù
                        </span>
                      )}
                    </div>
                    {abs.reason && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        📝 Lý do: {abs.reason}
                      </p>
                    )}
                    {abs.createdByUserName && (
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Ghi nhận bởi: {abs.createdByUserName} • {abs.createdAt ? abs.createdAt.split('T')[0] : ''}
                      </span>
                    )}
                  </div>

                  {isAuthorized && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleStartEdit(abs)}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold transition flex items-center cursor-pointer"
                        title="Chỉnh sửa buổi nghỉ"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-amber-700" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteAbsence(abs)}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold transition flex items-center cursor-pointer"
                        title="Xóa buổi nghỉ"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium space-y-1">
              <p>Chưa có thông tin buổi nghỉ nào được ghi nhận cho học viên này.</p>
              <p className="text-[11px] text-emerald-600 font-bold">Học viên đi học đầy đủ và đúng hạn!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
};

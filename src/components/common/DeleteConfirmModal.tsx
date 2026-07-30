import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemType: 'class' | 'student' | 'teacher' | 'student_from_class';
  itemName: string;
  itemDetail?: string;
  warningMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemType,
  itemName,
  itemDetail,
  warningMessage,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getTypeLabel = () => {
    switch (itemType) {
      case 'class':
        return 'Lớp Học';
      case 'student':
        return 'Học Viên Vĩnh Viễn';
      case 'student_from_class':
        return 'Học Viên Ra Khỏi Lớp';
      case 'teacher':
        return 'Tài Khoản Giáo Viên';
      default:
        return 'Dữ Liệu';
    }
  };

  const defaultWarning =
    itemType === 'student'
      ? 'Toàn bộ dữ liệu bài tập, lịch sử học tập và học phí của học viên này sẽ bị xóa khỏi hệ thống!'
      : itemType === 'class'
      ? 'Toàn bộ phân công của lớp học này sẽ bị hủy. Các buổi học và bài tập liên quan sẽ bị ảnh hưởng.'
      : itemType === 'teacher'
      ? 'Tài khoản giáo viên này sẽ không thể đăng nhập vào hệ thống nữa. Các lớp học do giáo viên phụ trách sẽ được bàn giao về cho Ms. Vy.'
      : 'Học viên sẽ bị gỡ ra khỏi danh sách lớp học hiện tại.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-300 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-slate-800 dark:text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="flex items-center space-x-3.5 border-b border-rose-100 dark:border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-black shrink-0 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-950 uppercase tracking-wider">
              ⚠️ CẢNH BÁO BẢO MẬT SUPER ADMIN
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
              {title || `Xác Nhận Xóa ${getTypeLabel()}`}
            </h3>
          </div>
        </div>

        {/* Target Item Display Card */}
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700 space-y-1.5">
          <span className="text-[11px] font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
            Đối tượng thực hiện xóa:
          </span>
          <p className="text-base font-black text-slate-900 dark:text-white underline decoration-rose-400">
            {itemName}
          </p>
          {itemDetail && (
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {itemDetail}
            </p>
          )}
        </div>

        {/* Warning Description */}
        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-amber-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{warningMessage || defaultWarning}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
          >
            Hủy Bỏ (An Toàn)
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md transition flex items-center cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> 🗑️ Đồng Ý Xóa
          </button>
        </div>

      </div>
    </div>
  );
};

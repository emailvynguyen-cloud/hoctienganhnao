import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { BookOpen, ShieldCheck, Edit3, Save, X, CheckCircle2, Sparkles } from 'lucide-react';

interface ClassRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onRefreshData?: () => void;
}

export const ClassRulesModal: React.FC<ClassRulesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshData,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [rulesText, setRulesText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const currentRules = StorageEngine.getClassRules();
      setRulesText(currentRules);
      setEditValue(currentRules);
      setIsEditing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveRules = () => {
    if (!isSuperAdmin) return;
    if (!editValue || !editValue.trim()) {
      alert('Nội quy không được để rỗng!');
      return;
    }

    StorageEngine.saveClassRules(editValue.trim(), currentUser);
    setRulesText(editValue.trim());
    setIsEditing(false);
    alert('Đã cập nhật Nội quy trung tâm thành công! Mọi thay đổi đã được đồng bộ thời gian thực đến tất cả học viên.');
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] relative text-slate-800 dark:text-white">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-xs">
              📋
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight uppercase">
                NỘI QUY TRUNG TÂM MS. VY ENGLISH
              </h3>
              <span className="text-[11px] opacity-90 font-medium block">
                Quy định học tập, điểm danh, bài tập & hoàn thành khóa học
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

        {/* Action Toolbar for Super Admin */}
        {isSuperAdmin && (
          <div className="px-6 py-2.5 bg-pink-50 dark:bg-slate-800/80 border-b border-pink-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-pink-900 dark:text-pink-300 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-pink-600" /> Quyền Super Admin: Quản lý & Cập nhật nội quy
            </span>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveRules}
                  className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs transition flex items-center"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Lưu Thay Đổi
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditValue(rulesText);
                  setIsEditing(true);
                }}
                className="px-3.5 py-1 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold shadow-xs transition flex items-center cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> ✏️ Chỉnh Sửa Nội Quy
              </button>
            )}
          </div>
        )}

        {/* Modal Body: Rules Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 leading-relaxed text-xs sm:text-sm font-medium">
          {isEditing ? (
            <div className="space-y-2">
              <label className="block font-black text-pink-900 dark:text-pink-300 text-xs">
                Chỉnh sửa văn bản Nội quy (Hỗ trợ xuống dòng và đánh số thứ tự):
              </label>
              <textarea
                rows={14}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50/20 dark:bg-slate-800 text-xs font-mono leading-relaxed"
                placeholder="Nhập nội quy lớp học tại đây..."
              />
            </div>
          ) : (
            <div className="bg-pink-50/40 dark:bg-slate-800/50 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 whitespace-pre-wrap font-sans space-y-2 text-slate-800 dark:text-slate-100">
              {rulesText}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 mr-2 text-yellow-200" /> ĐÃ HIỂU & ĐỒNG Ý
          </button>
        </div>

      </div>
    </div>
  );
};

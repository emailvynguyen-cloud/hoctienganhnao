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

        {/* Modal Body: Structured Rules Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 leading-relaxed text-xs sm:text-sm font-medium">
          {(() => {
            const classRules = StorageEngine.getSystemRules().filter(
              (r) => r.type === 'class_rule' && r.isActive
            );

            if (classRules.length === 0) {
              return (
                <div className="p-8 rounded-3xl bg-pink-50/40 dark:bg-slate-800/50 border border-pink-100 dark:border-slate-800 text-center space-y-2">
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                    Trung tâm chưa cập nhật nội quy lớp học.
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Vui lòng quay lại sau hoặc liên hệ giáo viên phụ trách để biết thêm thông tin chi tiết.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {classRules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="bg-pink-50/40 dark:bg-slate-800/50 p-4 rounded-2xl border border-pink-100 dark:border-slate-800 space-y-1 text-slate-800 dark:text-slate-100"
                  >
                    <h4 className="font-extrabold text-xs text-pink-950 dark:text-pink-200 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-pink-200 text-pink-900 text-[10px] font-black flex items-center justify-center mr-2 shrink-0">
                        {rule.order || idx + 1}
                      </span>
                      {rule.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed font-normal whitespace-pre-wrap">
                      {rule.content}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
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

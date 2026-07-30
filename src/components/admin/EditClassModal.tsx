import React, { useState } from 'react';
import { Class } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Edit3, X } from 'lucide-react';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: Class;
  otherTeachersList: { id: string; name: string; email?: string }[];
  onRefreshData: () => void;
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  otherTeachersList,
  onRefreshData,
}) => {
  const [className, setClassName] = useState(targetClass.className || '');
  const [code, setCode] = useState(targetClass.code || '');
  const [teacherName, setTeacherName] = useState(targetClass.teacherName || 'Ms. Vy');
  const [schedule, setSchedule] = useState(targetClass.schedule || '');
  const [courseName, setCourseName] = useState(targetClass.courseName || '');
  const [zoomLink, setZoomLink] = useState(targetClass.zoomLink || '');
  const [startSessionNumber, setStartSessionNumber] = useState(targetClass.startSessionNumber || 1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !code) {
      alert('Vui lòng điền đầy đủ Tên Lớp và Mã Lớp!');
      return;
    }

    const selectedTeacherObj = otherTeachersList.find((t) => t.name === teacherName);
    const teacherId = teacherName.toLowerCase().includes('vy') ? 'u_super_admin' : (selectedTeacherObj?.id || 'u_admin');

    StorageEngine.updateClass({
      ...targetClass,
      className,
      code,
      teacherName,
      teacherId,
      schedule,
      courseName,
      zoomLink,
      startSessionNumber: Number(startSessionNumber) || 1,
    });

    alert(`Đã cập nhật thông tin lớp học "${className}" thành công!`);
    onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative text-slate-800 dark:text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">✏️ Chỉnh Sửa Thông Tin Lớp Học</h3>
            <p className="text-xs text-slate-500 font-medium">Quyền Super Admin: Cập nhật tên, giáo viên, lịch học & giáo trình</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Tên Lớp Học (*)</label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Mã Lớp Học (*)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Giáo Viên Phụ Trách (*)</label>
              <select
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold cursor-pointer"
              >
                <option value="Ms. Vy">👑 Ms. Vy (Super Admin / Điều Hành)</option>
                {otherTeachersList.map((t) => (
                  <option key={t.id} value={t.name}>
                    👩‍🏫 {t.name} ({t.email || 'Giáo viên'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Giáo Trình Học</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Lịch Học Hàng Tuần</label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Ví dụ: T2 - T4 - T6 (18:00 - 19:30)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Buổi Bắt Đầu Tính Số</label>
              <input
                type="number"
                min="1"
                value={startSessionNumber}
                onChange={(e) => setStartSessionNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Link Zoom Học Online</label>
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black shadow-md transition cursor-pointer"
            >
              💾 Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Student, Class } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Edit3, X, DollarSign, BookOpen } from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classes: Class[];
  onRefreshData: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  onRefreshData,
}) => {
  const [name, setName] = useState(student.name || '');
  const [phone, setPhone] = useState(student.phone || '');
  const [email, setEmail] = useState(student.email || '');
  const [selectedClassId, setSelectedClassId] = useState(student.classIds?.[0] || classes[0]?.id || '');
  const [remainingSessions, setRemainingSessions] = useState(student.remainingSessions || 0);
  const [packageSessionCount, setPackageSessionCount] = useState(student.packageSessionCount || 8);
  const [tuitionPackagePrice, setTuitionPackagePrice] = useState(student.tuitionPackagePrice || 2000000);
  const [internalNotes, setInternalNotes] = useState(student.internalNotes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Vui lòng điền Họ và tên học viên!');
      return;
    }

    StorageEngine.updateStudent({
      ...student,
      name,
      phone,
      email,
      classIds: selectedClassId ? [selectedClassId] : student.classIds,
      remainingSessions: Number(remainingSessions) || 0,
      packageSessionCount: Number(packageSessionCount) || 8,
      tuitionPackagePrice: Number(tuitionPackagePrice) || 2000000,
      internalNotes,
    });

    StorageEngine.updateStudentInternalNotes(student.id, internalNotes);

    alert(`Đã cập nhật thông tin học viên & ghi chú nội bộ cho "${name}" thành công!`);
    onRefreshData();
    onClose();
  };

  const handleCreateAuthAccount = () => {
    const result = StorageEngine.createStudentUserAccount({
      ...student,
      name,
      phone,
      email,
    });
    alert(result.message);
    onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-300 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative text-slate-800 dark:text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-black">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">✏️ Chỉnh Sửa Thông Tin Học Viên & Học Phí</h3>
            <p className="text-xs text-slate-500 font-medium">Quyền Super Admin: Điều chỉnh thông tin cá nhân & gói học phí hiện tại</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Họ Và Tên Học Viên (*)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-sky-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Số Điện Thoại (Tùy chọn)</label>
              <input
                type="text"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-sky-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Lớp Học Trực Thuộc</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-sky-50/30 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} ({cls.code}) - GV: {cls.teacherName}
                </option>
              ))}
            </select>
          </div>

          {/* TUITION PACKAGE ADJUSTMENT BOX */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center uppercase tracking-wider">
              <DollarSign className="w-4 h-4 mr-1 text-amber-600" /> 💳 Điều Chỉnh Gói Học Phí Hiện Tại:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 text-[11px] font-extrabold block">Số Buổi Còn Lại</label>
                <input
                  type="number"
                  min="0"
                  value={remainingSessions}
                  onChange={(e) => setRemainingSessions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 text-[11px] font-extrabold block">Gói Số Buổi</label>
                <input
                  type="number"
                  min="1"
                  value={packageSessionCount}
                  onChange={(e) => setPackageSessionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 text-[11px] font-extrabold block">Giá Tiền Gói (VNĐ)</label>
                <input
                  type="number"
                  step="100000"
                  value={tuitionPackagePrice}
                  onChange={(e) => setTuitionPackagePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Email (Tùy chọn)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-sky-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* PRIVATE INTERNAL STUDENT NOTES (ADMIN & TEACHER ONLY) */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-2">
            <label className="text-slate-900 dark:text-slate-200 font-black text-xs flex items-center">
              <span>🔒 Ghi Chú Nội Bộ Học Viên (Chỉ GV & Admin xem được, tuyệt đối ẩn với Học viên):</span>
            </label>
            <textarea
              rows={3}
              placeholder="Nhập lưu ý về thái độ học tập, ý thức, thông tin trao đổi với phụ huynh..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* EXPLICIT AUTH ACCOUNT CREATION SECTION */}
          <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-slate-800/80 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black text-purple-950 dark:text-purple-300 block">Tài Khoản Đăng Nhập App:</span>
              <p className="text-[11px] text-slate-500 font-medium">Tách biệt dữ liệu hồ sơ và tài khoản authentication.</p>
            </div>
            <button
              type="button"
              onClick={handleCreateAuthAccount}
              className="px-3.5 py-2 rounded-xl bg-purple-200 hover:bg-purple-300 text-purple-950 font-black text-xs transition border border-purple-300 shrink-0 cursor-pointer shadow-2xs"
            >
              🔑 Tạo Tài Khoản Đăng Nhập
            </button>
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black shadow-md transition cursor-pointer"
            >
              💾 Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

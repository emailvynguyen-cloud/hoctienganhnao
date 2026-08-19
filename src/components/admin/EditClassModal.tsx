import React, { useState, useEffect } from 'react';
import { Class } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { DraftStorage } from '../../lib/draftStorage';
import { DraftPromptBanner } from '../common/AddSessionModal';
import { Edit3, X, Clock, Plus, Trash2 } from 'lucide-react';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: Class;
  otherTeachersList: { id: string; name: string; email?: string }[];
  onRefreshData: () => void;
}

const HOURS_24_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'
];

function parseExistingScheduleToSlots(scheduleStr: string) {
  if (!scheduleStr) {
    return [
      { id: 'slot_1', day: 'T2' as const, startTime: '18:00', endTime: '19:30' },
      { id: 'slot_2', day: 'T4' as const, startTime: '18:00', endTime: '19:30' },
      { id: 'slot_3', day: 'T6' as const, startTime: '18:00', endTime: '19:30' },
    ];
  }

  const daysMap: { key: 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN'; patterns: RegExp }[] = [
    { key: 'T2', patterns: /T2|THỨ 2|THỨ HAI/i },
    { key: 'T3', patterns: /T3|THỨ 3|THỨ BA/i },
    { key: 'T4', patterns: /T4|THỨ 4|THỨ TƯ/i },
    { key: 'T5', patterns: /T5|THỨ 5|THỨ NĂM/i },
    { key: 'T6', patterns: /T6|THỨ 6|THỨ SÁU/i },
    { key: 'T7', patterns: /T7|THỨ 7|THỨ BẢY/i },
    { key: 'CN', patterns: /CN|CHỦ NHẬT/i },
  ];

  const parts = scheduleStr.split(',');
  const slots: { id: string; day: 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN'; startTime: string; endTime: string }[] = [];

  parts.forEach((part, index) => {
    const rangeMatch = part.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
    const startTime = rangeMatch ? rangeMatch[1].padStart(5, '0') : '18:00';
    const endTime = rangeMatch ? rangeMatch[2].padStart(5, '0') : '19:30';

    daysMap.forEach(({ key, patterns }) => {
      if (patterns.test(part)) {
        slots.push({
          id: `slot_${index}_${key}`,
          day: key,
          startTime,
          endTime,
        });
      }
    });
  });

  if (slots.length > 0) return slots;

  const globalMatch = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  const startTime = globalMatch ? globalMatch[1].padStart(5, '0') : '18:00';
  const endTime = globalMatch ? globalMatch[2].padStart(5, '0') : '19:30';

  daysMap.forEach(({ key, patterns }) => {
    if (patterns.test(scheduleStr)) {
      slots.push({
        id: `slot_${key}`,
        day: key,
        startTime,
        endTime,
      });
    }
  });

  return slots.length > 0
    ? slots
    : [
        { id: 'slot_1', day: 'T2' as const, startTime: '18:00', endTime: '19:30' },
        { id: 'slot_2', day: 'T4' as const, startTime: '18:00', endTime: '19:30' },
        { id: 'slot_3', day: 'T6' as const, startTime: '18:00', endTime: '19:30' },
      ];
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  otherTeachersList,
  onRefreshData,
}) => {
  const allUsers = StorageEngine.getUsers() || [];
  const adminUsers = allUsers.filter((u) => u && (u.role === 'admin' || u.role === 'super_admin'));

  const [adminId, setAdminId] = useState(targetClass.adminId || adminUsers[0]?.uid || 'u_admin');
  const [adminName, setAdminName] = useState(targetClass.adminName || adminUsers[0]?.displayName || 'Admin Trực Thuộc');
  const [className, setClassName] = useState(targetClass.className || '');
  const [code, setCode] = useState(targetClass.code || '');
  const [teacherName, setTeacherName] = useState(targetClass.teacherName || 'Ms. Vy');
  const [schedule, setSchedule] = useState(targetClass.schedule || '');
  const [scheduleSlots, setScheduleSlots] = useState<{ id: string; day: 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN'; startTime: string; endTime: string }[]>(() => {
    return parseExistingScheduleToSlots(targetClass.schedule || '');
  });
  const [courseName, setCourseName] = useState(targetClass.courseName || '');
  const [zoomLink, setZoomLink] = useState(targetClass.zoomLink || '');
  const [startSessionNumber, setStartSessionNumber] = useState(targetClass.startSessionNumber || 1);
  const [teacherPayRatePerSession, setTeacherPayRatePerSession] = useState<number>(
    typeof targetClass.teacherPayRatePerSession === 'number' ? targetClass.teacherPayRatePerSession : 150000
  );
  const [status, setStatus] = useState<'active' | 'archived' | 'completed' | 'paused'>(
    targetClass.status || 'active'
  );
  const [scheduleEffectiveFrom, setScheduleEffectiveFrom] = useState<string>(
    targetClass.scheduleEffectiveFrom || targetClass.startDate || new Date().toISOString().split('T')[0]
  );

  const draftKey = `edit_class_${targetClass.id}`;

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      DraftStorage.saveDraft(draftKey, {
        className,
        code,
        status,
        adminId,
        teacherName,
        schedule,
        scheduleEffectiveFrom,
        courseName,
        zoomLink,
        startSessionNumber,
        teacherPayRatePerSession,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [isOpen, draftKey, className, code, status, adminId, teacherName, schedule, scheduleEffectiveFrom, courseName, zoomLink, startSessionNumber, teacherPayRatePerSession]);

  const handleRestoreDraft = (data: any) => {
    if (!data) return;
    if (data.className) setClassName(data.className);
    if (data.code) setCode(data.code);
    if (data.status) setStatus(data.status);
    if (data.adminId) setAdminId(data.adminId);
    if (data.teacherName) setTeacherName(data.teacherName);
    if (data.schedule) setSchedule(data.schedule);
    if (data.scheduleEffectiveFrom) setScheduleEffectiveFrom(data.scheduleEffectiveFrom);
    if (data.courseName) setCourseName(data.courseName);
    if (data.zoomLink !== undefined) setZoomLink(data.zoomLink);
    if (data.startSessionNumber) setStartSessionNumber(data.startSessionNumber);
    if (data.teacherPayRatePerSession) setTeacherPayRatePerSession(data.teacherPayRatePerSession);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !code) {
      alert('Vui lòng điền đầy đủ Tên Lớp và Mã Lớp!');
      return;
    }

    const selectedTeacherObj = otherTeachersList.find((t) => t.name === teacherName);
    const teacherId = teacherName.toLowerCase().includes('vy') ? 'u_super_admin' : (selectedTeacherObj?.id || 'u_admin');
    const selectedAdminObj = adminUsers.find((a) => a.uid === adminId);
    const resolvedAdminName = selectedAdminObj ? selectedAdminObj.displayName : adminName;

    StorageEngine.updateClass({
      ...targetClass,
      status,
      className,
      code,
      adminId,
      adminName: resolvedAdminName,
      teacherName,
      teacherId,
      schedule,
      scheduleEffectiveFrom,
      courseName,
      zoomLink,
      startSessionNumber: Number(startSessionNumber) || 1,
      teacherPayRatePerSession: typeof teacherPayRatePerSession === 'number' && !isNaN(teacherPayRatePerSession) ? teacherPayRatePerSession : 0,
    });

    DraftStorage.clearDraft(draftKey);
    alert(`Đã cập nhật thông tin lớp học "${className}" & gán Admin "${resolvedAdminName}" phụ trách thành công!`);
    onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* HEADER - Fixed Top */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">✏️ Chỉnh Sửa Thông Tin Lớp Học</h3>
              <p className="text-xs text-slate-500 font-medium">Quyền Super Admin: Cập nhật tên, giáo viên, lịch học & giáo trình</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTAINER - Scrollable Body & Fixed Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          
          {/* BODY CONTENT - Scrollable */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-semibold">
            <DraftPromptBanner draftKey={draftKey} onRestore={handleRestoreDraft} />
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
                <label className="text-slate-700 dark:text-slate-300 font-extrabold block">👑 Admin Phụ Trách Lớp Học (*)</label>
                <select
                  value={adminId}
                  onChange={(e) => {
                    setAdminId(e.target.value);
                    const selectedObj = adminUsers.find((a) => a.uid === e.target.value);
                    if (selectedObj) setAdminName(selectedObj.displayName);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold cursor-pointer"
                >
                  {adminUsers.map((a) => (
                    <option key={a.uid} value={a.uid}>
                      👑 {a.displayName} ({a.email}) - {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-extrabold block">📦 Trạng Thái Lớp Học</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold cursor-pointer"
                >
                  <option value="active">🟢 Đang Hoạt Động (Active)</option>
                  <option value="archived">📦 Đã Lưu Trữ / Bảo Lưu (Archived)</option>
                  <option value="paused">⏸️ Tạm Ngưng (Paused)</option>
                  <option value="completed">✅ Đã Hoàn Thành (Completed)</option>
                </select>
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

            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 space-y-1">
              <label className="text-sky-900 dark:text-sky-300 font-black block text-xs">
                💰 Bậc Lương Cho Từng Buổi Dạy Của Giáo Viên (VNĐ / Buổi Học) (Nhập 0 nếu là lớp miễn phí/demo) (*)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={teacherPayRatePerSession}
                onChange={(e) => setTeacherPayRatePerSession(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-sky-300 bg-white dark:bg-slate-900 font-mono font-black text-slate-900 dark:text-white text-xs"
                placeholder="Nhập bậc lương (VD: 150000 hoặc 0)"
              />
              <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold block">
                Bậc lương này sẽ dùng để tự động tính tổng thu nhập/lương cho giáo viên {teacherName}. Nhập 0 VND nếu lớp không phát sinh lương.
              </span>
            </div>

            {/* MULTI SCHEDULE SLOTS PICKER */}
            <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-slate-800/70 border border-pink-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-800 dark:text-slate-200 font-extrabold flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-pink-600" /> Chọn Các Giờ Dạy Trong Tuần:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newSlot = { id: `slot_${Date.now()}`, day: 'T2' as const, startTime: '18:00', endTime: '19:30' };
                    const updated = [...scheduleSlots, newSlot];
                    setScheduleSlots(updated);
                    setSchedule(updated.map((s) => `${s.day} (${s.startTime} - ${s.endTime})`).join(', '));
                  }}
                  className="px-2.5 py-1 rounded-xl bg-pink-200 hover:bg-pink-300 text-pink-950 font-black text-[11px] transition flex items-center shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> + Thêm Giờ Dạy Khác
                </button>
              </div>

              <div className="space-y-2">
                {scheduleSlots.map((slot, idx) => (
                  <div key={slot.id} className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-pink-200/80">
                    <select
                      value={slot.day}
                      onChange={(e) => {
                        const updated = [...scheduleSlots];
                        updated[idx] = { ...updated[idx], day: e.target.value as any };
                        setScheduleSlots(updated);
                        setSchedule(updated.map((s) => `${s.day} (${s.startTime} - ${s.endTime})`).join(', '));
                      }}
                      className="px-2 py-1 rounded-lg border border-pink-200 bg-pink-50/50 font-bold text-slate-800 text-xs"
                    >
                      <option value="T2">Thứ 2 (T2)</option>
                      <option value="T3">Thứ 3 (T3)</option>
                      <option value="T4">Thứ 4 (T4)</option>
                      <option value="T5">Thứ 5 (T5)</option>
                      <option value="T6">Thứ 6 (T6)</option>
                      <option value="T7">Thứ 7 (T7)</option>
                      <option value="CN">Chủ Nhật (CN)</option>
                    </select>

                    <select
                      value={slot.startTime}
                      onChange={(e) => {
                        const updated = [...scheduleSlots];
                        updated[idx] = { ...updated[idx], startTime: e.target.value };
                        setScheduleSlots(updated);
                        setSchedule(updated.map((s) => `${s.day} (${s.startTime} - ${s.endTime})`).join(', '));
                      }}
                      className="px-2 py-1 rounded-lg border border-pink-200 bg-white font-mono text-xs text-slate-800 font-bold cursor-pointer"
                    >
                      {HOURS_24_OPTIONS.map((time) => (
                        <option key={`start_${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                    <span className="font-bold text-pink-400">-</span>
                    <select
                      value={slot.endTime}
                      onChange={(e) => {
                        const updated = [...scheduleSlots];
                        updated[idx] = { ...updated[idx], endTime: e.target.value };
                        setScheduleSlots(updated);
                        setSchedule(updated.map((s) => `${s.day} (${s.startTime} - ${s.endTime})`).join(', '));
                      }}
                      className="px-2 py-1 rounded-lg border border-pink-200 bg-white font-mono text-xs text-slate-800 font-bold cursor-pointer"
                    >
                      {HOURS_24_OPTIONS.map((time) => (
                        <option key={`end_${time}`} value={time}>{time}</option>
                      ))}
                    </select>

                    {scheduleSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = scheduleSlots.filter((_, i) => i !== idx);
                          setScheduleSlots(updated);
                          setSchedule(updated.map((s) => `${s.day} (${s.startTime} - ${s.endTime})`).join(', '));
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa khung giờ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-slate-600 dark:text-slate-400 text-[11px] font-bold block">Chuỗi lịch hiển thị tổng hợp:</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Ví dụ: T2 - T4 - T6 (18:00 - 19:30)"
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
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
          </div>

          {/* FOOTER - Fixed Bottom */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3 shrink-0">
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

import React, { useRef, useState, useEffect } from 'react';
import { Class, User } from '../../types';
import { X, Download, Camera, Check, Sparkles, Filter } from 'lucide-react';

interface TimetableImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  currentUser?: User | null;
  teacherTabs: { id: string; name: string }[];
  activeTeacherId: string;
}

const DAYS = [
  { key: 'T2', label: 'Thứ 2' },
  { key: 'T3', label: 'Thứ 3' },
  { key: 'T4', label: 'Thứ 4' },
  { key: 'T5', label: 'Thứ 5' },
  { key: 'T6', label: 'Thứ 6' },
  { key: 'T7', label: 'Thứ 7' },
  { key: 'CN', label: 'Chủ Nhật' },
];

const SHIFTS = [
  { key: 'morning', label: 'CA SÁNG (05:00 - 12:00)', startMin: 5 * 60, endMin: 12 * 60, icon: '🌅' },
  { key: 'afternoon', label: 'CA CHIỀU (12:00 - 18:00)', startMin: 12 * 60, endMin: 18 * 60, icon: '☀️' },
  { key: 'evening', label: 'CA TỐI (18:00 - 24:00)', startMin: 18 * 60, endMin: 24 * 60, icon: '🌙' },
];

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  let str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM') || str.includes('CH');
  const isAM = str.includes('AM') || str.includes('SA');
  str = str.replace(/[A-Z]/g, '').trim();

  const parts = str.split(':');
  if (parts.length < 2) return 0;
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

function parseScheduleTimeRange(scheduleStr: string, dayKey: string): { startMin: number; endMin: number; label: string } | null {
  if (!scheduleStr) return null;
  const schedUpper = scheduleStr.toUpperCase();
  const dayAliases: Record<string, string[]> = {
    'T2': ['T2', 'THỨ 2', 'THỨ HAI'],
    'T3': ['T3', 'THỨ 3', 'THỨ BA'],
    'T4': ['T4', 'THỨ 4', 'THỨ TƯ'],
    'T5': ['T5', 'THỨ 5', 'THỨ NĂM'],
    'T6': ['T6', 'THỨ 6', 'THỨ SÁU'],
    'T7': ['T7', 'THỨ 7', 'THỨ BẢY'],
    'CN': ['CN', 'CHỦ NHẬT'],
  };

  const aliases = dayAliases[dayKey] || [dayKey];

  for (const alias of aliases) {
    const idx = schedUpper.indexOf(alias);
    if (idx !== -1) {
      const subStr = scheduleStr.slice(idx, idx + 45);
      const match = subStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
      if (match) {
        const startStr = match[1];
        const endStr = match[2];
        const startMin = parseTimeToMinutes(startStr);
        let endMin = parseTimeToMinutes(endStr);
        if (endMin === 0 && endStr === '00:00') endMin = 24 * 60;
        return { startMin, endMin, label: `${startStr} - ${endStr}` };
      }
    }
  }

  const globalMatch = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (!globalMatch) return null;

  const startStr = globalMatch[1];
  const endStr = globalMatch[2];
  const startMin = parseTimeToMinutes(startStr);
  let endMin = parseTimeToMinutes(endStr);
  if (endMin === 0 && endStr === '00:00') endMin = 24 * 60;
  return { startMin, endMin, label: `${startStr} - ${endStr}` };
}

export const TimetableImageExportModal: React.FC<TimetableImageExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  currentUser,
  teacherTabs,
  activeTeacherId,
}) => {
  const [selectedFilterTeacher, setSelectedFilterTeacher] = useState<string>(activeTeacherId || 'all');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter classes according to selected teacher
  const filteredClasses = classes.filter((cls) => {
    if (!cls || cls.status === 'archived') return false;
    if (selectedFilterTeacher === 'all') return true;
    if (selectedFilterTeacher === 'u_super_admin') {
      return !cls.teacherName || cls.teacherName.toLowerCase().includes('vy') || cls.teacherId === 'u_super_admin';
    }
    return cls.teacherId === selectedFilterTeacher || (cls.teacherName && cls.teacherName === teacherTabs.find((t) => t.id === selectedFilterTeacher)?.name);
  });

  // Get classes for shift & day sorted chronologically
  const getClassesForSlot = (dayKey: string, shift: typeof SHIFTS[0]) => {
    const list = filteredClasses.filter((cls) => {
      if (!cls || !cls.schedule) return false;
      const schedUpper = cls.schedule.toUpperCase();
      const matchesDay =
        (dayKey === 'T2' && (schedUpper.includes('T2') || schedUpper.includes('THỨ 2') || schedUpper.includes('THỨ HAI'))) ||
        (dayKey === 'T3' && (schedUpper.includes('T3') || schedUpper.includes('THỨ 3') || schedUpper.includes('THỨ BA'))) ||
        (dayKey === 'T4' && (schedUpper.includes('T4') || schedUpper.includes('THỨ 4') || schedUpper.includes('THỨ TƯ'))) ||
        (dayKey === 'T5' && (schedUpper.includes('T5') || schedUpper.includes('THỨ 5') || schedUpper.includes('THỨ NĂM'))) ||
        (dayKey === 'T6' && (schedUpper.includes('T6') || schedUpper.includes('THỨ 6') || schedUpper.includes('THỨ SÁU'))) ||
        (dayKey === 'T7' && (schedUpper.includes('T7') || schedUpper.includes('THỨ 7') || schedUpper.includes('THỨ BẢY'))) ||
        (dayKey === 'CN' && (schedUpper.includes('CN') || schedUpper.includes('CHỦ NHẬT')));

      if (!matchesDay) return false;

      const range = parseScheduleTimeRange(cls.schedule, dayKey);
      if (!range) return true;

      // check conflict with shift
      return range.startMin < shift.endMin && shift.startMin < range.endMin;
    });

    // CHRONOLOGICAL SORTING BY START TIME MINS -> END TIME MINS -> CLASS NAME
    return list.sort((a, b) => {
      const rangeA = parseScheduleTimeRange(a.schedule, dayKey);
      const rangeB = parseScheduleTimeRange(b.schedule, dayKey);
      const startA = rangeA ? rangeA.startMin : 0;
      const startB = rangeB ? rangeB.startMin : 0;
      if (startA !== startB) return startA - startB;

      const endA = rangeA ? rangeA.endMin : 0;
      const endB = rangeB ? rangeB.endMin : 0;
      if (endA !== endB) return endA - endB;

      return (a.className || '').localeCompare(b.className || '', 'vi');
    });
  };

  const handleExportImage = (format: 'png' | 'jpeg') => {
    setIsExporting(true);

    try {
      const element = previewRef.current;
      if (!element) return;

      const width = 1200;
      const height = 900;
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // 2x High-DPI Retina
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.scale(2, 2);

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#fdf2f8');
      bgGrad.addColorStop(0.5, '#fff1f2');
      bgGrad.addColorStop(1, '#f0f9ff');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Header Banner Box
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(244, 114, 182, 0.2)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(30, 25, width - 60, 85, 20);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Title & Subtitle
      ctx.fillStyle = '#9d174d';
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('🌸 MS. VY ENGLISH CENTER — THỜI KHÓA BIỂU HỌC THEO TUẦN', 50, 62);

      ctx.fillStyle = '#475569';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      const teacherNameFilter = teacherTabs.find((t) => t.id === selectedFilterTeacher)?.name || 'Toàn bộ Trung tâm';
      ctx.fillText(`Lịch học dành cho Học viên • Giáo viên: ${teacherNameFilter} • Cập nhật tự động`, 50, 88);

      // Render Day Columns Header
      const colWidth = (width - 160) / 7;
      const startX = 140;
      const startY = 130;

      DAYS.forEach((day, index) => {
        const x = startX + index * colWidth;

        // Day header card
        ctx.fillStyle = '#fce7f3';
        ctx.beginPath();
        ctx.roundRect(x + 3, startY, colWidth - 6, 40, 12);
        ctx.fill();

        ctx.fillStyle = '#831843';
        ctx.font = '900 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(day.label, x + colWidth / 2, startY + 25);
      });

      // Render Shifts & Grid Content
      let currentY = startY + 50;
      const shiftHeight = 220;

      SHIFTS.forEach((shift) => {
        // Shift Header Left Cell
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(30, currentY, 100, shiftHeight - 10, 16);
        ctx.fill();

        ctx.fillStyle = '#9d174d';
        ctx.font = '900 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${shift.icon} ${shift.key === 'morning' ? 'SÁNG' : shift.key === 'afternoon' ? 'CHIỀU' : 'TỐI'}`, 80, currentY + 35);

        ctx.fillStyle = '#64748b';
        ctx.font = '700 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(shift.key === 'morning' ? '05:00-12:00' : shift.key === 'afternoon' ? '12:00-18:00' : '18:00-24:00', 80, currentY + 55);

        DAYS.forEach((day, dIdx) => {
          const x = startX + dIdx * colWidth;
          const slotClasses = getClassesForSlot(day.key, shift);

          if (slotClasses.length > 0) {
            let cardY = currentY;
            const cardHeight = Math.min((shiftHeight - 15) / slotClasses.length, 65);

            slotClasses.forEach((cls, cIdx) => {
              const range = parseScheduleTimeRange(cls.schedule, day.key);
              const timeLabel = range ? range.label : 'Theo lịch';

              // Pastel Class Card
              const colors = [
                { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', timeBg: '#fce7f3' },
                { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', timeBg: '#e0f2fe' },
                { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', timeBg: '#d1fae5' },
                { bg: '#fffbeb', border: '#fde68a', text: '#b45309', timeBg: '#fef3c7' },
                { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', timeBg: '#f3e8ff' },
              ];

              const color = colors[(cIdx + dIdx) % colors.length];

              ctx.fillStyle = color.bg;
              ctx.strokeStyle = color.border;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(x + 4, cardY, colWidth - 8, cardHeight - 6, 12);
              ctx.fill();
              ctx.stroke();

              // Class Name
              ctx.fillStyle = color.text;
              ctx.font = '900 12px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'left';

              const titleText = cls.className.length > 15 ? cls.className.substring(0, 14) + '…' : cls.className;
              ctx.fillText(titleText, x + 12, cardY + 22);

              // Time badge
              ctx.fillStyle = color.timeBg;
              ctx.beginPath();
              ctx.roundRect(x + 10, cardY + 30, colWidth - 20, 18, 6);
              ctx.fill();

              ctx.fillStyle = color.text;
              ctx.font = '800 10px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`⏰ ${timeLabel}`, x + colWidth / 2, cardY + 43);

              cardY += cardHeight;
            });
          } else {
            // Empty Slot Display
            ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x + 4, currentY, colWidth - 8, shiftHeight - 15, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 11px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Trống ca', x + colWidth / 2, currentY + shiftHeight / 2 - 5);
          }
        });

        currentY += shiftHeight;
      });

      // Footer Watermark
      ctx.fillStyle = '#64748b';
      ctx.font = '700 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Website Học Tập Tiếng Anh Ms. Vy — Trải nghiệm học tập cá nhân hóa & chuyên nghiệp', width / 2, height - 15);

      // Convert to image download link
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
      const link = document.createElement('a');
      link.download = `ThoiKhoaBieu_MsVyEnglish_${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating timetable image:', err);
      alert('Không thể tạo hình ảnh thời khóa biểu. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 p-6 sm:p-8 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 relative text-slate-800 dark:text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white flex items-center justify-center font-black text-xl shadow-md">
              📸
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Xuất Thời Khóa Biểu Thành Ảnh (PNG/JPG)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tạo ảnh poster lịch học pastel chuẩn đẹp, ngắn gọn để gửi Học viên / Phụ huynh
              </p>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-pink-500" />
            <select
              value={selectedFilterTeacher}
              onChange={(e) => setSelectedFilterTeacher(e.target.value)}
              className="px-3 py-2 rounded-xl border border-pink-200 bg-pink-50/50 font-extrabold text-xs text-pink-950 dark:bg-slate-800 dark:text-white cursor-pointer"
            >
              <option value="all">🌸 Toàn Bộ Trung Tâm</option>
              {teacherTabs.map((t) => (
                <option key={t.id} value={t.id}>
                  👩‍🏫 {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Poster Preview Card */}
        <div
          ref={previewRef}
          className="p-6 rounded-3xl bg-gradient-to-br from-pink-50/80 via-rose-50/50 to-sky-50/80 dark:from-slate-950 dark:to-slate-900 border-2 border-pink-200 dark:border-slate-800 space-y-4 shadow-sm overflow-x-auto"
        >
          {/* Poster Top Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-pink-700 dark:text-pink-300 block uppercase tracking-wider">
                🌸 MS. VY ENGLISH CENTER — THỜI KHÓA BIỂU LỊCH HỌC
              </span>
              <p className="text-[11px] text-slate-500 font-semibold">
                Lịch học hiển thị tự động theo thời gian bắt đầu (từ 05:00 đến 24:00)
              </p>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-950 dark:text-pink-200 font-extrabold text-xs border border-pink-300 shrink-0">
              {teacherTabs.find((t) => t.id === selectedFilterTeacher)?.name || 'Toàn bộ trung tâm'}
            </span>
          </div>

          {/* Poster Grid Layout */}
          <div className="grid grid-cols-8 gap-2 min-w-[700px] text-xs">
            {/* Day Header Column */}
            <div className="p-2 font-black text-[11px] text-slate-400 text-center uppercase tracking-wider flex items-center justify-center">
              Ca Dạy / Giờ
            </div>

            {DAYS.map((day) => (
              <div key={day.key} className="p-2.5 rounded-xl bg-pink-200/80 dark:bg-pink-950/60 text-pink-950 dark:text-pink-200 font-black text-center text-xs border border-pink-300 shadow-2xs">
                {day.label}
              </div>
            ))}

            {/* Shift Rows */}
            {SHIFTS.map((shift) => (
              <React.Fragment key={shift.key}>
                {/* Shift Label Box */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs">
                  <span className="text-lg">{shift.icon}</span>
                  <span className="font-black text-xs text-pink-950 dark:text-pink-200 block">
                    {shift.key === 'morning' ? 'SÁNG' : shift.key === 'afternoon' ? 'CHIỀU' : 'TỐI'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">{shift.key === 'morning' ? '05:00-12:00' : shift.key === 'afternoon' ? '12:00-18:00' : '18:00-24:00'}</span>
                </div>

                {/* Day Slots for this Shift */}
                {DAYS.map((day) => {
                  const slotClasses = getClassesForSlot(day.key, shift);

                  return (
                    <div key={day.key} className="p-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-pink-100 dark:border-slate-800 min-h-[90px] flex flex-col space-y-1.5 justify-start">
                      {slotClasses.length > 0 ? (
                        slotClasses.map((cls) => {
                          const range = parseScheduleTimeRange(cls.schedule, day.key);
                          const timeLabel = range ? range.label : 'Lịch học';

                          return (
                            <div
                              key={cls.id}
                              className="p-2 rounded-xl bg-pink-100/90 dark:bg-pink-950/80 border border-pink-300 dark:border-pink-800 space-y-1 shadow-2xs"
                            >
                              <span className="font-black text-[11px] text-pink-950 dark:text-pink-100 block truncate">
                                {cls.className}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900 text-pink-900 dark:text-pink-300 font-mono font-black text-[9px] block text-center border border-pink-200">
                                ⏰ {timeLabel}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-slate-400 italic">Trống ca</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {downloadSuccess ? (
            <span className="text-xs font-black text-emerald-600 flex items-center">
              <Check className="w-4 h-4 mr-1 text-emerald-500" /> Đã xuất và tải ảnh xuống máy thành công!
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              💡 Ảnh tự động được tối ưu chuẩn 2x High-DPI sắc nét khi gửi phụ huynh.
            </span>
          )}

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleExportImage('jpeg')}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs transition border border-amber-300 cursor-pointer shadow-2xs flex items-center justify-center"
            >
              🖼️ Tải Ảnh JPG
            </button>

            <button
              onClick={() => handleExportImage('png')}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs transition shadow-md cursor-pointer flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1.5" /> 📸 Tải Ảnh PNG (Sắc Nét)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

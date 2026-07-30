import React, { useState } from 'react';
import { Class, Student, Session, HomeworkSubmission, User } from '../../types';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import {
  Calendar,
  Clock,
  Video,
  User as UserIcon,
  PlusCircle,
  BookOpen,
  X,
  Sparkles,
  AlertTriangle,
  Award,
  Crown,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  Plus,
} from 'lucide-react';

interface WeeklyTimetableProps {
  classes: Class[];
  students: Student[];
  sessions: Session[];
  homeworkSubmissions?: HomeworkSubmission[];
  currentUser?: User | null;
  effectiveRole?: string;
  onOpenAddSession: (classId?: string) => void;
  onSelectClass?: (cls: Class) => void;
  onSelectStudent?: (std: Student) => void;
  onUpdateClassSchedule?: (classId: string, newSchedule: string) => void;
}

// DEFAULT TIME SLOTS (CAN BE EDITED / ADDED MANUALLY)
const DEFAULT_TIME_SLOTS = [
  '05:00-07:00',
  '07:00-08:30',
  '08:30-09:30',
  '09:30-10:30',
  '10:30-12:00',
  '12:00-14:00',
  '14:00-15:00',
  '15:00-16:30',
  '16:30-18:00',
  '18:00-19:30',
  '19:30-21:00',
];

const DAYS_OF_WEEK = [
  { key: 'T2', name: 'Thứ 2', full: 'Thứ Hai', bg: 'from-pink-500/10 to-rose-500/5', badge: 'bg-pink-100 text-pink-900 border-pink-200' },
  { key: 'T3', name: 'Thứ 3', full: 'Thứ Ba', bg: 'from-amber-500/10 to-yellow-500/5', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  { key: 'T4', name: 'Thứ 4', full: 'Thứ Tư', bg: 'from-emerald-500/10 to-teal-500/5', badge: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  { key: 'T5', name: 'Thứ 5', full: 'Thứ Năm', bg: 'from-sky-500/10 to-blue-500/5', badge: 'bg-sky-100 text-sky-900 border-sky-200' },
  { key: 'T6', name: 'Thứ 6', full: 'Thứ Sáu', bg: 'from-purple-500/10 to-indigo-500/5', badge: 'bg-purple-100 text-purple-900 border-purple-200' },
  { key: 'T7', name: 'Thứ 7', full: 'Thứ Bảy', bg: 'from-indigo-500/10 to-violet-500/5', badge: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  { key: 'CN', name: 'Chủ Nhật', full: 'Chủ Nhật', bg: 'from-rose-500/10 to-red-500/5', badge: 'bg-rose-100 text-rose-900 border-rose-200' },
];

// TIME RANGE PARSER & EXACT OVERLAP CONFLICT DETECTOR
// Interval A [startA, endA] and B [startB, endB] conflict IF AND ONLY IF (startA < endB && startB < endA).
// If endA === startB (e.g. 08:00-09:00 and 09:00-10:00), they touch at 09:00 -> NO CONFLICT!
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function parseScheduleTimeRange(scheduleStr: string): { startMin: number; endMin: number; label: string } | null {
  if (!scheduleStr) return null;
  // Match HH:MM - HH:MM or HH:MM-HH:MM pattern inside parentheses or raw
  const match = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;

  const startStr = match[1];
  const endStr = match[2];
  const startMin = parseTimeToMinutes(startStr);
  const endMin = parseTimeToMinutes(endStr);

  return {
    startMin,
    endMin,
    label: `${startStr} - ${endStr}`,
  };
}

function checkTimeConflict(rangeA: { startMin: number; endMin: number }, rangeB: { startMin: number; endMin: number }): boolean {
  // Overlap condition: startA < endB AND startB < endA
  return rangeA.startMin < rangeB.endMin && rangeB.startMin < rangeA.endMin;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  classes,
  students,
  sessions,
  homeworkSubmissions = [],
  currentUser,
  effectiveRole,
  onOpenAddSession,
  onSelectClass,
  onSelectStudent,
  onUpdateClassSchedule,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin' && effectiveRole !== 'admin' && effectiveRole !== 'teacher' && effectiveRole !== 'student';
  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role === 'super_admin' && effectiveRole === 'admin');
  const isTeacher = currentUser?.role === 'teacher' || effectiveRole === 'teacher';

  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [newSlotInput, setNewSlotInput] = useState<string>('');
  const [isAddingSlot, setIsAddingSlot] = useState<boolean>(false);
  const [editingClassForSchedule, setEditingClassForSchedule] = useState<Class | null>(null);
  const [customScheduleInput, setCustomScheduleInput] = useState<string>('');

  // EXTRACT TEACHERS FOR TABS
  // Filter active (non-archived) classes
  const activeClasses = (classes || []).filter((c) => c && c.status !== 'archived');
  const archivedClasses = (classes || []).filter((c) => c && c.status === 'archived');

  const teacherMap = new Map<string, { id: string; name: string }>();
  // Always ensure Ms. Vy is the first teacher tab
  teacherMap.set('u_super_admin', { id: 'u_super_admin', name: 'Ms. Vy' });

  activeClasses.forEach((cls) => {
    if (cls.teacherName && !cls.teacherName.toLowerCase().includes('vy')) {
      const key = cls.teacherId || cls.teacherName;
      if (!teacherMap.has(key)) {
        teacherMap.set(key, { id: key, name: cls.teacherName });
      }
    }
  });

  const teacherTabs = Array.from(teacherMap.values());

  // Determine active teacher tab
  const [activeTeacherId, setActiveTeacherId] = useState<string>('u_super_admin');

  // If currentUser is teacher, force active tab to teacher's own schedule
  const effectiveTeacherTab = isTeacher
    ? (teacherTabs.find((t) => t.name === currentUser?.displayName || t.id === currentUser?.uid)?.id || 'u_super_admin')
    : activeTeacherId;

  const currentTeacherObj = teacherTabs.find((t) => t.id === effectiveTeacherTab) || teacherTabs[0];

  // Filter classes for the active teacher tab
  const teacherClasses = activeClasses.filter((c) => {
    if (currentTeacherObj.id === 'u_super_admin' || currentTeacherObj.name.toLowerCase().includes('vy')) {
      return !c.teacherName || c.teacherName.toLowerCase().includes('vy') || c.teacherId === 'u_super_admin';
    }
    return c.teacherId === currentTeacherObj.id || c.teacherName === currentTeacherObj.name;
  });

  // HELPER: Map classes to specific Day & Time Slot
  const getClassesForSlotAndDay = (dayKey: string, slotStr: string) => {
    const slotRange = parseScheduleTimeRange(slotStr);
    if (!slotRange) return [];

    return teacherClasses.filter((cls) => {
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

      const clsRange = parseScheduleTimeRange(cls.schedule);
      if (!clsRange) return true; // If time not specified, show in slot

      return checkTimeConflict(slotRange, clsRange);
    });
  };

  // CHECK FOR CONFLICTS IN A SPECIFIC DAY FOR ACTIVE TEACHER
  const getConflictsForDay = (dayKey: string) => {
    const dayClasses = teacherClasses.filter((cls) => {
      if (!cls || !cls.schedule) return false;
      const schedUpper = cls.schedule.toUpperCase();
      return (
        (dayKey === 'T2' && (schedUpper.includes('T2') || schedUpper.includes('THỨ 2'))) ||
        (dayKey === 'T3' && (schedUpper.includes('T3') || schedUpper.includes('THỨ 3'))) ||
        (dayKey === 'T4' && (schedUpper.includes('T4') || schedUpper.includes('THỨ 4'))) ||
        (dayKey === 'T5' && (schedUpper.includes('T5') || schedUpper.includes('THỨ 5'))) ||
        (dayKey === 'T6' && (schedUpper.includes('T6') || schedUpper.includes('THỨ 6'))) ||
        (dayKey === 'T7' && (schedUpper.includes('T7') || schedUpper.includes('THỨ 7'))) ||
        (dayKey === 'CN' && (schedUpper.includes('CN') || schedUpper.includes('CHỦ NHẬT')))
      );
    });

    const conflicts: { classA: Class; classB: Class }[] = [];
    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const rangeA = parseScheduleTimeRange(dayClasses[i].schedule);
        const rangeB = parseScheduleTimeRange(dayClasses[j].schedule);
        if (rangeA && rangeB && checkTimeConflict(rangeA, rangeB)) {
          conflicts.push({ classA: dayClasses[i], classB: dayClasses[j] });
        }
      }
    }
    return conflicts;
  };

  // CALCULATE STATUS BADGES FOR A CLASS CARD
  const getClassStatusBadges = (cls: Class) => {
    const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(cls.id));
    const classSubs = (homeworkSubmissions || []).filter((s) => s && s.classId === cls.id);
    const pendingSubs = classSubs.filter((s) => !s.isTeacherFeedbackChecked && s.feedbackStatus !== 'COMPLETED');

    const badges = [];

    // 1. Pending Homework Submissions
    if (pendingSubs.length > 0) {
      badges.push({
        icon: '📚',
        tooltip: `Có ${pendingSubs.length} bài tập về nhà chưa chấm`,
        color: 'bg-rose-100 text-rose-800 border-rose-200',
      });
    }

    // 2. Unpaid Tuition or 0 remaining sessions
    const unpaidStudents = classStudents.filter((s) => (s.remainingSessions || 0) <= 0);
    if (unpaidStudents.length > 0) {
      badges.push({
        icon: '💰',
        tooltip: `${unpaidStudents.length} học viên hết/chưa đóng học phí`,
        color: 'bg-amber-100 text-amber-800 border-amber-200',
      });
    }

    // 3. Low Remaining Sessions (<= 2)
    const lowSessionStudents = classStudents.filter((s) => (s.remainingSessions || 0) > 0 && (s.remainingSessions || 0) <= 2);
    if (lowSessionStudents.length > 0) {
      badges.push({
        icon: '⚠️',
        tooltip: `${lowSessionStudents.length} học viên sắp hết số buổi học (<= 2 buổi)`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      });
    }

    // 4. Archived / Paused Class
    if (cls.status === 'archived' || cls.status === 'paused') {
      badges.push({
        icon: '⏸️',
        tooltip: 'Lớp học đang bảo lưu / lưu trữ',
        color: 'bg-slate-100 text-slate-800 border-slate-200',
      });
    }

    // 5. No Active Students
    if (classStudents.length === 0) {
      badges.push({
        icon: '❌',
        tooltip: 'Lớp học chưa có học viên đăng ký',
        color: 'bg-red-100 text-red-800 border-red-200',
      });
    }

    // 6. Top Diligent Stars
    const topStarsCount = classStudents.filter((s) => (s.stars || 0) >= 15).length;
    if (topStarsCount > 0) {
      badges.push({
        icon: '⭐',
        tooltip: `Lớp có ${topStarsCount} học viên đạt Top chăm chỉ tuần`,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      });
    }

    return badges;
  };

  const handleAddSlot = () => {
    if (newSlotInput && !timeSlots.includes(newSlotInput)) {
      setTimeSlots([...timeSlots, newSlotInput]);
      setNewSlotInput('');
      setIsAddingSlot(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* HEADER BAR WITH NOTION / GOOGLE CALENDAR AESTHETICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Thời Khóa Biểu Lịch Học Theo Tuần
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Thiết kế dạng Grid trực quan • Phân chia theo từng Giáo viên phụ trách
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {(isSuperAdmin || isAdmin) && (
            <button
              onClick={() => setIsAddingSlot(!isAddingSlot)}
              className="px-4 py-2.5 rounded-2xl bg-pink-100 text-pink-950 border border-pink-200 hover:bg-pink-200 font-extrabold text-xs transition flex items-center shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> + Khung Giờ
            </button>
          )}

          <button
            onClick={() => onOpenAddSession()}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-md transition flex items-center shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> + Thêm Buổi Học
          </button>
        </div>
      </div>

      {/* ADD CUSTOM TIME SLOT INPUT POPUP */}
      {isAddingSlot && (
        <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 flex items-center space-x-3 text-xs font-semibold animate-fadeIn">
          <span>Nhập khung giờ mới (VD: 11:30-13:00):</span>
          <input
            type="text"
            placeholder="HH:MM-HH:MM"
            value={newSlotInput}
            onChange={(e) => setNewSlotInput(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-pink-200 bg-white focus:outline-none text-slate-900"
          />
          <button
            onClick={handleAddSlot}
            className="px-3.5 py-1.5 rounded-xl bg-pink-400 text-white font-bold hover:bg-pink-500"
          >
            Thêm
          </button>
          <button
            onClick={() => setIsAddingSlot(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TEACHER TABS NAVIGATION BAR (SUPER ADMIN & ADMIN CAN TOGGLE) */}
      {!isTeacher && (
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-pink-100 dark:border-slate-800 shadow-xs overflow-x-auto">
          {teacherTabs.map((t) => {
            const isMsVy = t.id === 'u_super_admin' || t.name.toLowerCase().includes('vy');
            const isActive = effectiveTeacherTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTeacherId(t.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-800'
                }`}
              >
                {isMsVy ? <Crown className="w-4 h-4 text-amber-200 shrink-0" /> : <UserIcon className="w-3.5 h-3.5 shrink-0" />}
                <span>{isMsVy ? '👑 Lịch Ms. Vy (Super Admin)' : `👩‍🏫 ${t.name}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TEACHER ROLE NOTICE */}
      {isTeacher && (
        <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-950 flex items-center justify-between">
          <span className="flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-pink-500" />
            Đang hiển thị lịch giảng dạy cá nhân của <strong>{currentUser?.displayName || 'Giáo Viên'}</strong>
          </span>
        </div>
      )}

      {/* CONFLICT WARNING BANNER IF ANY OVERLAPS EXIST */}
      {DAYS_OF_WEEK.map((day) => {
        const conflicts = getConflictsForDay(day.key);
        if (conflicts.length === 0) return null;
        return (
          <div key={`conflict_${day.key}`} className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center space-x-2 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p>⚠️ Cảnh báo xung đột lịch vào {day.full}:</p>
              {conflicts.map((c, i) => (
                <p key={i} className="font-semibold text-amber-800">
                  • Lớp "{c.classA.className}" ({c.classA.schedule}) đang bị trùng thời gian thực tế với Lớp "{c.classB.className}" ({c.classB.schedule})
                </p>
              ))}
            </div>
          </div>
        );
      })}

      {/* MAIN NOTION / APPLE STYLE GRID TIMETABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-[900px]">
          
          <table className="w-full border-collapse">
            
            {/* GRID COLUMNS HEADER: DAYS OF WEEK */}
            <thead>
              <tr className="border-b border-pink-100 dark:border-slate-800 bg-pink-50/50 dark:bg-slate-800/50">
                <th className="p-4 text-left font-black text-xs text-slate-500 uppercase tracking-wider w-36 border-r border-pink-100 dark:border-slate-800 sticky left-0 bg-pink-50/90 dark:bg-slate-800 z-10">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-pink-500" />
                    <span>Khung Giờ</span>
                  </div>
                </th>

                {DAYS_OF_WEEK.map((day) => (
                  <th key={day.key} className="p-4 text-center font-black text-xs text-slate-800 dark:text-slate-200 border-r border-pink-100 dark:border-slate-800 min-w-[120px]">
                    <div className="space-y-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${day.badge} inline-block`}>
                        {day.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* GRID ROWS: TIME SLOTS */}
            <tbody className="divide-y divide-pink-100 dark:divide-slate-800 text-xs">
              {timeSlots.map((slot, slotIdx) => (
                <tr key={slotIdx} className="hover:bg-pink-50/20 dark:hover:bg-slate-800/30 transition">
                  
                  {/* TIME SLOT LABEL COLUMN (STICKY LEFT ON MOBILE SCROLL) */}
                  <td className="p-3.5 font-extrabold text-slate-700 dark:text-slate-300 border-r border-pink-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-xs whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 text-pink-600 font-mono">
                      <span className="w-2 h-2 rounded-full bg-pink-400 inline-block shrink-0"></span>
                      <span>{slot}</span>
                    </div>
                  </td>

                  {/* 7 DAYS COLUMNS */}
                  {DAYS_OF_WEEK.map((day) => {
                    const slotClasses = getClassesForSlotAndDay(day.key, slot);

                    return (
                      <td key={day.key} className="p-2 border-r border-pink-100 dark:border-slate-800 vertical-top h-24 align-top">
                        {slotClasses.length > 0 ? (
                          <div className="space-y-2">
                            {slotClasses.map((cls) => {
                              const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(cls.id));
                              const statusBadges = getClassStatusBadges(cls);
                              const parsedTime = parseScheduleTimeRange(cls.schedule)?.label || slot;

                              return (
                                <div
                                  key={cls.id}
                                  onClick={() => onSelectClass && onSelectClass(cls)}
                                  className="p-3 rounded-2xl bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 border border-pink-200/80 dark:border-slate-700 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer space-y-2 relative group"
                                >
                                  {/* Top Header: Class Name & Micro Status Badges */}
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-pink-600 transition line-clamp-1 underline decoration-pink-300">
                                      {cls.className}
                                    </h4>

                                    {/* Status Badges with Tooltips */}
                                    <div className="flex items-center space-x-1 shrink-0">
                                      {statusBadges.map((badge, bIdx) => (
                                        <span
                                          key={bIdx}
                                          title={badge.tooltip}
                                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border shadow-2xs ${badge.color}`}
                                        >
                                          {badge.icon}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Time & Teacher Badge */}
                                  <div className="text-[11px] font-extrabold text-pink-700 dark:text-pink-300 flex items-center space-x-1 bg-white/70 dark:bg-slate-800/70 p-1.5 rounded-xl border border-pink-100">
                                    <Clock className="w-3 h-3 text-pink-500 shrink-0" />
                                    <span>{parsedTime}</span>
                                  </div>

                                  {/* Student Avatars Preview Strip */}
                                  <div className="flex items-center justify-between pt-1 border-t border-pink-100/60 dark:border-slate-800">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      {classStudents.slice(0, 4).map((std) => (
                                        <img
                                          key={std.id}
                                          src={resolveAvatarUrl(std.avatar)}
                                          alt={std.name}
                                          title={`Học viên: ${std.name}`}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectStudent) onSelectStudent(std);
                                          }}
                                          className="inline-block h-5 w-5 rounded-full border-2 border-white hover:scale-110 transition cursor-pointer object-cover shadow-2xs"
                                        />
                                      ))}
                                      {classStudents.length > 4 && (
                                        <span className="w-5 h-5 rounded-full bg-pink-200 text-pink-900 font-bold text-[9px] flex items-center justify-center border border-white">
                                          +{classStudents.length - 4}
                                        </span>
                                      )}
                                    </div>

                                    {(isSuperAdmin || isAdmin) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingClassForSchedule(cls);
                                          setCustomScheduleInput(cls.schedule);
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-100 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title="Sửa nhanh lịch học lớp này"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[48px] rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-700 italic">
                            Trống ca
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>

      {/* QUICK SCHEDULE EDIT MODAL FOR SUPER ADMIN & ADMIN */}
      {editingClassForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800 dark:text-white relative">
            <button
              onClick={() => setEditingClassForSchedule(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-pink-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">Chỉnh Sửa Lịch Học Thủ Công</h4>
                <p className="text-xs text-slate-500 font-medium">Lớp: {editingClassForSchedule.className}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <label className="text-slate-700 dark:text-slate-300 block">Lịch học hàng tuần:</label>
              <input
                type="text"
                value={customScheduleInput}
                onChange={(e) => setCustomScheduleInput(e.target.value)}
                placeholder="Ví dụ: T2 - T4 - T6 (18:00 - 19:30)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 text-slate-900 dark:text-white font-extrabold"
              />
              <p className="text-[11px] text-slate-500 italic">
                Hệ thống tự động đọc thứ (T2, T3, T4, T5, T6, T7, CN) và khung giờ thực tế (HH:MM - HH:MM).
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingClassForSchedule(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => {
                  if (onUpdateClassSchedule && editingClassForSchedule) {
                    onUpdateClassSchedule(editingClassForSchedule.id, customScheduleInput);
                    alert(`Đã cập nhật lịch học cho lớp "${editingClassForSchedule.className}"!`);
                    setEditingClassForSchedule(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-pink-400 hover:bg-pink-500 text-white font-black shadow-md"
              >
                💾 Lưu Lịch Học
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

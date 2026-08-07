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
  Moon,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react';

import { TimetableImageExportModal } from './TimetableImageExportModal';

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

// DETERMINISTIC PASTEL PALETTES FOR CLASSES IN TIMETABLE
const PASTEL_CLASS_PALETTES = [
  {
    bg: 'bg-pink-50/90 dark:bg-pink-950/40',
    border: 'border-pink-200 dark:border-pink-800',
    hoverBorder: 'hover:border-pink-400',
    badgeBg: 'bg-pink-100 dark:bg-pink-900/60 text-pink-900 dark:text-pink-200 border-pink-200',
    headerText: 'text-pink-950 dark:text-pink-100 group-hover:text-pink-600',
    timeBg: 'bg-pink-100/80 dark:bg-pink-900/50 text-pink-950 dark:text-pink-200 border-pink-200/80',
  },
  {
    bg: 'bg-sky-50/90 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    hoverBorder: 'hover:border-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 border-sky-200',
    headerText: 'text-sky-950 dark:text-sky-100 group-hover:text-sky-600',
    timeBg: 'bg-sky-100/80 dark:bg-sky-900/50 text-sky-950 dark:text-sky-200 border-sky-200/80',
  },
  {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    hoverBorder: 'hover:border-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-200',
    headerText: 'text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-600',
    timeBg: 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-200 border-emerald-200/80',
  },
  {
    bg: 'bg-amber-50/90 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    hoverBorder: 'hover:border-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-200',
    headerText: 'text-amber-950 dark:text-amber-100 group-hover:text-amber-600',
    timeBg: 'bg-amber-100/80 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border-amber-200/80',
  },
  {
    bg: 'bg-purple-50/90 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    hoverBorder: 'hover:border-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-purple-200',
    headerText: 'text-purple-950 dark:text-purple-100 group-hover:text-purple-600',
    timeBg: 'bg-purple-100/80 dark:bg-purple-900/50 text-purple-950 dark:text-purple-200 border-purple-200/80',
  },
  {
    bg: 'bg-rose-50/90 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    hoverBorder: 'hover:border-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border-rose-200',
    headerText: 'text-rose-950 dark:text-rose-100 group-hover:text-rose-600',
    timeBg: 'bg-rose-100/80 dark:bg-rose-900/50 text-rose-950 dark:text-rose-200 border-rose-200/80',
  },
  {
    bg: 'bg-teal-50/90 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    hoverBorder: 'hover:border-teal-400',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200 border-teal-200',
    headerText: 'text-teal-950 dark:text-teal-100 group-hover:text-teal-600',
    timeBg: 'bg-teal-100/80 dark:bg-teal-900/50 text-teal-950 dark:text-teal-200 border-teal-200/80',
  },
  {
    bg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    hoverBorder: 'hover:border-indigo-400',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border-indigo-200',
    headerText: 'text-indigo-950 dark:text-indigo-100 group-hover:text-indigo-600',
    timeBg: 'bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 border-indigo-200/80',
  },
];

function getClassPastelPalette(cls: Class) {
  const str = cls.id || cls.className || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_CLASS_PALETTES.length;
  return PASTEL_CLASS_PALETTES[index];
}

// 4 MAJOR SHIFTS (CA DẠY) IN THE WEEKLY TIMETABLE
const SHIFTS = [
  {
    key: 'morning',
    title: 'CA SÁNG',
    timeLabel: '05:00 - 12:00',
    range: { startMin: 5 * 60, endMin: 12 * 60 },
    icon: '🌅',
    badge: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200',
  },
  {
    key: 'afternoon',
    title: 'CA CHIỀU',
    timeLabel: '12:00 - 18:00',
    range: { startMin: 12 * 60, endMin: 18 * 60 },
    icon: '☀️',
    badge: 'bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950 dark:text-sky-200',
  },
  {
    key: 'evening',
    title: 'CA TỐI',
    timeLabel: '18:00 - 24:00',
    range: { startMin: 18 * 60, endMin: 24 * 60 },
    icon: '🌙',
    badge: 'bg-pink-100 text-pink-950 border-pink-300 dark:bg-pink-950 dark:text-pink-200',
  },
  {
    key: 'night',
    title: 'CA ĐÊM',
    timeLabel: '00:00 - 02:00',
    range: { startMin: 0, endMin: 2 * 60 },
    icon: '🌌',
    badge: 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200',
  },
];

const DAYS_OF_WEEK = [
  {
    key: 'T2',
    name: 'Thứ 2',
    full: 'Thứ Hai',
    badge: 'bg-pink-200 text-pink-950 border-pink-300 font-black',
    colHeaderBg: 'bg-pink-100/90 dark:bg-pink-950/40 text-pink-950 dark:text-pink-200 border-pink-200 dark:border-pink-900',
    colCellBg: 'bg-pink-50/50 dark:bg-pink-950/15 hover:bg-pink-100/60',
  },
  {
    key: 'T3',
    name: 'Thứ 3',
    full: 'Thứ Ba',
    badge: 'bg-amber-200 text-amber-950 border-amber-300 font-black',
    colHeaderBg: 'bg-amber-100/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-900',
    colCellBg: 'bg-amber-50/50 dark:bg-amber-950/15 hover:bg-amber-100/60',
  },
  {
    key: 'T4',
    name: 'Thứ 4',
    full: 'Thứ Tư',
    badge: 'bg-emerald-200 text-emerald-950 border-emerald-300 font-black',
    colHeaderBg: 'bg-emerald-100/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900',
    colCellBg: 'bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-100/60',
  },
  {
    key: 'T5',
    name: 'Thứ 5',
    full: 'Thứ Năm',
    badge: 'bg-sky-200 text-sky-950 border-sky-300 font-black',
    colHeaderBg: 'bg-sky-100/90 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-900',
    colCellBg: 'bg-sky-50/50 dark:bg-sky-950/15 hover:bg-sky-100/60',
  },
  {
    key: 'T6',
    name: 'Thứ 6',
    full: 'Thứ Sáu',
    badge: 'bg-purple-200 text-purple-950 border-purple-300 font-black',
    colHeaderBg: 'bg-purple-100/90 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-900',
    colCellBg: 'bg-purple-50/50 dark:bg-purple-950/15 hover:bg-purple-100/60',
  },
  {
    key: 'T7',
    name: 'Thứ 7',
    full: 'Thứ Bảy',
    badge: 'bg-indigo-200 text-indigo-950 border-indigo-300 font-black',
    colHeaderBg: 'bg-indigo-100/90 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900',
    colCellBg: 'bg-indigo-50/50 dark:bg-indigo-950/15 hover:bg-indigo-100/60',
  },
  {
    key: 'CN',
    name: 'Chủ Nhật',
    full: 'Chủ Nhật',
    badge: 'bg-rose-200 text-rose-950 border-rose-300 font-black',
    colHeaderBg: 'bg-rose-100/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-rose-200 dark:border-rose-900',
    colCellBg: 'bg-rose-50/50 dark:bg-rose-950/15 hover:bg-rose-100/60',
  },
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

function parseScheduleTimeRange(scheduleStr: string, dayKey?: string): { startMin: number; endMin: number; label: string } | null {
  if (!scheduleStr) return null;

  if (dayKey) {
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
          if (endMin === 0 && endStr === '00:00') {
            endMin = 24 * 60;
          }
          return {
            startMin,
            endMin,
            label: `${startStr} - ${endStr}`,
          };
        }
      }
    }
  }

  // Fallback: parse global first time range
  const globalMatch = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (!globalMatch) return null;

  const startStr = globalMatch[1];
  const endStr = globalMatch[2];
  const startMin = parseTimeToMinutes(startStr);
  let endMin = parseTimeToMinutes(endStr);
  if (endMin === 0 && endStr === '00:00') {
    endMin = 24 * 60;
  }

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

  const [editingClassForSchedule, setEditingClassForSchedule] = useState<Class | null>(null);
  const [customScheduleInput, setCustomScheduleInput] = useState<string>('');
  const [isExportImageModalOpen, setIsExportImageModalOpen] = useState(false);

  // EXTRACT TEACHERS FOR TABS
  const activeClasses = (classes || []).filter((c) => c && c.status !== 'archived');

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
  const [activeTeacherId, setActiveTeacherId] = useState<string>('u_super_admin');

  const effectiveTeacherTab = isTeacher
    ? (teacherTabs.find((t) => (currentUser?.displayName && t.name.toLowerCase() === currentUser.displayName.toLowerCase()) || t.id === currentUser?.uid)?.id || currentUser?.uid || 'u_teacher')
    : activeTeacherId;

  const currentTeacherObj = teacherTabs.find((t) => t.id === effectiveTeacherTab) || teacherTabs[0];

  // STRICT TEACHER PRIVACY FILTERING:
  // If user is a Teacher, ONLY show classes assigned to this teacher! (NEVER show Ms. Vy's classes for other teachers)
  const teacherClasses = activeClasses.filter((c) => {
    if (!c) return false;

    if (isTeacher) {
      const matchId = c.teacherId === currentUser?.uid;
      const matchName = c.teacherName && currentUser?.displayName && c.teacherName.toLowerCase() === currentUser.displayName.toLowerCase();
      const isUserMsVy = currentUser?.displayName?.toLowerCase().includes('vy') || currentUser?.uid === 'u_super_admin';

      if (isUserMsVy) {
        return matchId || matchName || !c.teacherName || c.teacherName.toLowerCase().includes('vy') || c.teacherId === 'u_super_admin';
      }

      // For other teachers (e.g. Ms. Ngọc): MUST match their teacherId or teacherName ONLY!
      return matchId || matchName;
    }

    if (currentTeacherObj && (currentTeacherObj.id === 'u_super_admin' || currentTeacherObj.name.toLowerCase().includes('vy'))) {
      return !c.teacherName || c.teacherName.toLowerCase().includes('vy') || c.teacherId === 'u_super_admin';
    }
    return currentTeacherObj && (c.teacherId === currentTeacherObj.id || (c.teacherName && c.teacherName.toLowerCase() === currentTeacherObj.name.toLowerCase()));
  });

  // HELPER: Map classes to specific Day & Shift Range (CHRONOLOGICALLY SORTED BY START TIME -> END TIME -> CLASS NAME)
  const getClassesForShiftAndDay = (dayKey: string, shiftRange: { startMin: number; endMin: number }) => {
    const list = teacherClasses.filter((cls) => {
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

      const clsRange = parseScheduleTimeRange(cls.schedule, dayKey);
      if (!clsRange) return true;

      return checkTimeConflict(shiftRange, clsRange);
    });

    // CHRONOLOGICAL TIME SORTING (06:00 -> 07:00 -> 08:30 -> 18:00...)
    return list.sort((a, b) => {
      const rangeA = parseScheduleTimeRange(a.schedule, dayKey);
      const rangeB = parseScheduleTimeRange(b.schedule, dayKey);

      const startA = rangeA ? rangeA.startMin : 0;
      const startB = rangeB ? rangeB.startMin : 0;
      if (startA !== startB) return startA - startB;

      const endA = rangeA ? rangeA.endMin : 0;
      const endB = rangeB ? rangeB.endMin : 0;
      if (endA !== endB) return endA - endB;

      const orderA = (a as any).displayOrder ?? 0;
      const orderB = (b as any).displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;

      return (a.className || '').localeCompare(b.className || '', 'vi');
    });
  };

  // CONFLICT DETECTOR FOR ACTIVE TEACHER ON A SPECIFIC DAY
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
        const rangeA = parseScheduleTimeRange(dayClasses[i].schedule, dayKey);
        const rangeB = parseScheduleTimeRange(dayClasses[j].schedule, dayKey);
        if (rangeA && rangeB && checkTimeConflict(rangeA, rangeB)) {
          conflicts.push({ classA: dayClasses[i], classB: dayClasses[j] });
        }
      }
    }
    return conflicts;
  };

  // CALCULATE STATUS BADGES FOR CLASS CARD
  const getClassStatusBadges = (cls: Class) => {
    const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(cls.id));
    const classSubs = (homeworkSubmissions || []).filter((s) => s && s.classId === cls.id);
    const pendingSubs = classSubs.filter((s) => !s.isTeacherFeedbackChecked && s.feedbackStatus !== 'COMPLETED');

    const badges = [];

    if (pendingSubs.length > 0) {
      badges.push({
        icon: '📚',
        tooltip: `Có ${pendingSubs.length} bài tập về nhà chưa chấm`,
        color: 'bg-rose-100 text-rose-800 border-rose-200',
      });
    }

    const unpaidStudents = classStudents.filter((s) => (s.remainingSessions || 0) <= 0);
    if (unpaidStudents.length > 0) {
      badges.push({
        icon: '💰',
        tooltip: `${unpaidStudents.length} học viên hết/chưa đóng học phí`,
        color: 'bg-amber-100 text-amber-800 border-amber-200',
      });
    }

    const lowSessionStudents = classStudents.filter((s) => (s.remainingSessions || 0) > 0 && (s.remainingSessions || 0) <= 2);
    if (lowSessionStudents.length > 0) {
      badges.push({
        icon: '⚠️',
        tooltip: `${lowSessionStudents.length} học viên sắp hết số buổi học (<= 2 buổi)`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      });
    }

    if (cls.status === 'archived' || cls.status === 'paused') {
      badges.push({
        icon: '⏸️',
        tooltip: 'Lớp học đang bảo lưu / lưu trữ',
        color: 'bg-slate-100 text-slate-800 border-slate-200',
      });
    }

    if (classStudents.length === 0) {
      badges.push({
        icon: '❌',
        tooltip: 'Lớp học chưa có học viên đăng ký',
        color: 'bg-red-100 text-red-800 border-red-200',
      });
    }

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

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* HEADER BAR */}
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
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExportImageModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-950 dark:text-amber-200 font-extrabold text-xs border border-amber-300 shadow-xs transition flex items-center shrink-0 cursor-pointer"
            title="Xuất thời khóa biểu thành ảnh poster chất lượng cao PNG/JPG"
          >
            📸 Xuất Ảnh TKB (PNG/JPG)
          </button>

          {(isSuperAdmin || isAdmin) && (
            <button
              onClick={() => onOpenAddSession()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-md transition flex items-center shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> + Thêm Buổi Học
            </button>
          )}
        </div>
      </div>

      {/* TEACHER TABS NAVIGATION BAR (SUPER ADMIN & ADMIN CAN TOGGLE BETWEEN TEACHERS) */}
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
                <span>{isMsVy ? '👑 Lịch Ms. Vy (Super Admin)' : `👩‍🏫 Lịch ${t.name}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TEACHER ROLE NOTICE (STRICTLY ISOLATED TO THIS TEACHER) */}
      {isTeacher && (
        <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-950 flex items-center justify-between">
          <span className="flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-pink-500" />
            Đang hiển thị lịch giảng dạy cá nhân của Giáo Viên <strong>{currentUser?.displayName || ''}</strong>
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

      {/* MAIN 4-SHIFT TIMETABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-[900px]">
          <table className="w-full border-collapse">
            
            {/* GRID COLUMNS HEADER: DAYS OF WEEK WITH DISTINCT BACKGROUND COLORS */}
            <thead>
              <tr className="border-b border-pink-100 dark:border-slate-800">
                <th className="p-4 text-left font-black text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider w-44 border-r border-pink-100 dark:border-slate-800 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-pink-500" />
                    <span>Ca Dạy / Giờ</span>
                  </div>
                </th>

                {DAYS_OF_WEEK.map((day) => (
                  <th key={day.key} className={`p-4 text-center font-black text-xs border-r border-pink-100 dark:border-slate-800 min-w-[130px] ${day.colHeaderBg}`}>
                    <div className="space-y-1">
                      <span className={`px-3.5 py-1 rounded-full text-xs font-black border shadow-2xs ${day.badge} inline-block`}>
                        {day.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* GRID ROWS: ONE ROW PER SHIFT (SÁNG, CHIỀU, TỐI, ĐÊM) */}
            <tbody className="divide-y divide-pink-100 dark:divide-slate-800 text-xs">
              {SHIFTS.map((shift) => (
                <tr key={shift.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  
                  {/* LEFT COLUMN: SHIFT LABEL & TIME RANGE (e.g. 05:00 - 12:00) */}
                  <td className="p-4 font-black text-slate-800 dark:text-slate-200 border-r border-pink-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-xs whitespace-nowrap align-top">
                    <div className="space-y-1.5">
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                        <span className="mr-1.5 text-base">{shift.icon}</span>
                        <span>{shift.title}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${shift.badge} inline-block font-mono shadow-2xs`}>
                        {shift.timeLabel}
                      </span>
                    </div>
                  </td>

                  {/* 7 DAYS COLUMNS FOR THIS SHIFT */}
                  {DAYS_OF_WEEK.map((day) => {
                    const shiftClasses = getClassesForShiftAndDay(day.key, shift.range);

                    return (
                      <td key={day.key} className={`p-2.5 border-r border-pink-100 dark:border-slate-800 align-top min-h-[140px] transition ${day.colCellBg}`}>
                        {shiftClasses.length > 0 ? (
                          <div className="space-y-2">
                            {shiftClasses.map((cls) => {
                              const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(cls.id));
                              const statusBadges = getClassStatusBadges(cls);
                              const parsedTime = parseScheduleTimeRange(cls.schedule, day.key)?.label || shift.timeLabel;
                              const palette = getClassPastelPalette(cls);

                              return (
                                <div
                                  key={cls.id}
                                  onClick={() => onSelectClass && onSelectClass(cls)}
                                  className={`p-3.5 rounded-2xl ${palette.bg} ${palette.border} ${palette.hoverBorder} shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer space-y-2 relative group`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className={`font-black text-xs ${palette.headerText} transition line-clamp-1 underline decoration-pink-300/60`}>
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

                                  <div className={`text-[11px] font-extrabold flex items-center space-x-1 ${palette.timeBg} p-1.5 rounded-xl`}>
                                    <Clock className="w-3 h-3 text-pink-500 shrink-0" />
                                    <span>{parsedTime}</span>
                                  </div>

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
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[100px] flex items-center justify-center text-[11px] font-semibold text-slate-400 dark:text-slate-600 italic">
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

      {/* QUICK SCHEDULE EDIT MODAL */}
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
                Hệ thống tự động phân loại vào đúng 4 Ca Dạy (Sáng, Chiều, Tối, Đêm) và các thứ tương ứng.
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

      {/* TIMETABLE IMAGE EXPORT MODAL */}
      <TimetableImageExportModal
        isOpen={isExportImageModalOpen}
        onClose={() => setIsExportImageModalOpen(false)}
        classes={classes}
        currentUser={currentUser}
        teacherTabs={teacherTabs}
        activeTeacherId={activeTeacherId}
      />

    </div>
  );
};

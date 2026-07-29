import React, { useState } from 'react';
import { Class, Student, Session } from '../../types';
import { Calendar, Clock, Video, User, PlusCircle, BookOpen, ExternalLink, X, GraduationCap, CheckCircle2 } from 'lucide-react';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface WeeklyTimetableProps {
  classes: Class[];
  students: Student[];
  sessions: Session[];
  onOpenAddSession: (classId?: string) => void;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  classes,
  students,
  sessions,
  onOpenAddSession,
}) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 7 DISTINCT SOFT PASTEL THEMES FOR EACH DAY OF THE WEEK
  const daysOfWeek = [
    {
      key: 'T2',
      name: 'Thứ 2',
      dayBg: 'bg-pink-50/80 dark:bg-slate-900/90 border-pink-200 dark:border-pink-900/50',
      headerBg: 'bg-pink-100 text-pink-950 border border-pink-200',
      badgeColor: 'text-pink-700 bg-pink-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-pink-200 hover:border-pink-400 shadow-2xs',
      cardTitleColor: 'text-pink-950 dark:text-pink-300 group-hover:text-pink-600 underline decoration-pink-300',
    },
    {
      key: 'T3',
      name: 'Thứ 3',
      dayBg: 'bg-amber-50/80 dark:bg-slate-900/90 border-amber-200 dark:border-amber-900/50',
      headerBg: 'bg-amber-100 text-amber-950 border border-amber-200',
      badgeColor: 'text-amber-800 bg-amber-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-amber-200 hover:border-amber-400 shadow-2xs',
      cardTitleColor: 'text-amber-950 dark:text-amber-300 group-hover:text-amber-600 underline decoration-amber-300',
    },
    {
      key: 'T4',
      name: 'Thứ 4',
      dayBg: 'bg-emerald-50/80 dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-900/50',
      headerBg: 'bg-emerald-100 text-emerald-950 border border-emerald-200',
      badgeColor: 'text-emerald-800 bg-emerald-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-emerald-200 hover:border-emerald-400 shadow-2xs',
      cardTitleColor: 'text-emerald-950 dark:text-emerald-300 group-hover:text-emerald-600 underline decoration-emerald-300',
    },
    {
      key: 'T5',
      name: 'Thứ 5',
      dayBg: 'bg-sky-50/80 dark:bg-slate-900/90 border-sky-200 dark:border-sky-900/50',
      headerBg: 'bg-sky-100 text-sky-950 border border-sky-200',
      badgeColor: 'text-sky-800 bg-sky-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-sky-200 hover:border-sky-400 shadow-2xs',
      cardTitleColor: 'text-sky-950 dark:text-sky-300 group-hover:text-sky-600 underline decoration-sky-300',
    },
    {
      key: 'T6',
      name: 'Thứ 6',
      dayBg: 'bg-purple-50/80 dark:bg-slate-900/90 border-purple-200 dark:border-purple-900/50',
      headerBg: 'bg-purple-100 text-purple-950 border border-purple-200',
      badgeColor: 'text-purple-800 bg-purple-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-purple-200 hover:border-purple-400 shadow-2xs',
      cardTitleColor: 'text-purple-950 dark:text-purple-300 group-hover:text-purple-600 underline decoration-purple-300',
    },
    {
      key: 'T7',
      name: 'Thứ 7',
      dayBg: 'bg-indigo-50/80 dark:bg-slate-900/90 border-indigo-200 dark:border-indigo-900/50',
      headerBg: 'bg-indigo-100 text-indigo-950 border border-indigo-200',
      badgeColor: 'text-indigo-800 bg-indigo-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-indigo-200 hover:border-indigo-400 shadow-2xs',
      cardTitleColor: 'text-indigo-950 dark:text-indigo-300 group-hover:text-indigo-600 underline decoration-indigo-300',
    },
    {
      key: 'CN',
      name: 'Chủ Nhật',
      dayBg: 'bg-rose-50/80 dark:bg-slate-900/90 border-rose-200 dark:border-rose-900/50',
      headerBg: 'bg-rose-100 text-rose-950 border border-rose-200',
      badgeColor: 'text-rose-800 bg-rose-100/80',
      cardBg: 'bg-white/95 dark:bg-slate-800/90 border-rose-200 hover:border-rose-400 shadow-2xs',
      cardTitleColor: 'text-rose-950 dark:text-rose-300 group-hover:text-rose-600 underline decoration-rose-300',
    },
  ];

  // Helper to map schedule text to days
  const getClassesForDay = (dayKey: string) => {
    return (classes || []).filter((cls) => {
      if (!cls || !cls.schedule) return false;
      const sched = (cls.schedule || '').toUpperCase();
      if (dayKey === 'T2') return sched.includes('T2') || sched.includes('THỨ 2');
      if (dayKey === 'T3') return sched.includes('T3') || sched.includes('THỨ 3');
      if (dayKey === 'T4') return sched.includes('T4') || sched.includes('THỨ 4');
      if (dayKey === 'T5') return sched.includes('T5') || sched.includes('THỨ 5');
      if (dayKey === 'T6') return sched.includes('T6') || sched.includes('THỨ 6');
      if (dayKey === 'T7') return sched.includes('T7') || sched.includes('THỨ 7');
      if (dayKey === 'CN') return sched.includes('CN') || sched.includes('CHỦ NHẬT');
      return false;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Timetable Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-pink-500 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bảng Thời Khóa Biểu Lịch Dạy Học Trong Tuần
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ấn vào tên Lớp để xem thông tin chi tiết • Ấn vào tên Học viên để xem quá trình học
          </p>
        </div>

        <button
          onClick={() => onOpenAddSession()}
          className="px-5 py-2.5 rounded-2xl bg-pink-400 text-white font-extrabold text-xs hover:bg-pink-500 transition shadow-xs flex items-center justify-center shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> + Thêm buổi học
        </button>
      </div>

      {/* Timetable Grid with 7 Distinct Soft Pastel Backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((day) => {
          const dayClasses = getClassesForDay(day.key);

          return (
            <div
              key={day.key}
              className={`rounded-3xl border p-3.5 space-y-3 flex flex-col justify-between shadow-xs hover:shadow-md transition ${day.dayBg}`}
            >
              {/* Day Header Pill */}
              <div className="pb-2 text-center border-b border-pink-100/60 dark:border-slate-800">
                <span className={`px-3 py-1 rounded-2xl font-black text-xs uppercase tracking-wider inline-block ${day.headerBg}`}>
                  {day.name}
                </span>
                <span className={`text-[10px] font-extrabold block mt-1 ${day.badgeColor}`}>
                  {dayClasses.length} Ca Dạy
                </span>
              </div>

              {/* Class Cards List */}
              <div className="space-y-2.5 flex-1">
                {dayClasses.length > 0 ? (
                  dayClasses.map((cls) => {
                    const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(cls.id));
                    const timePart = cls.schedule ? (cls.schedule.split('(')[1]?.replace(')', '') || cls.schedule) : 'Chưa xếp giờ';

                    return (
                      <div
                        key={cls.id}
                        className={`p-3 rounded-2xl transition space-y-2 text-left group cursor-pointer ${day.cardBg}`}
                        onClick={() => setSelectedClass(cls)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-black text-xs ${day.cardTitleColor}`}>
                            {cls.className || 'Lớp Học'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium space-y-0.5">
                          <p className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-pink-500 shrink-0" />
                            {timePart}
                          </p>
                          <p className="flex items-center text-slate-500">
                            <User className="w-3 h-3 mr-1 text-sky-500 shrink-0" />
                            {cls.teacherName || 'Giáo viên'}
                          </p>
                        </div>

                        {/* Quick Students Avatars */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {classStudents.map((std) => (
                              <img
                                key={std.id}
                                src={resolveAvatarUrl(std.avatar)}
                                alt={std.name || 'Học viên'}
                                title={`Học viên: ${std.name || ''}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(std);
                                }}
                                className="inline-block h-6 w-6 rounded-full border-2 border-white hover:scale-110 transition cursor-pointer object-cover shadow-2xs"
                              />
                            ))}
                          </div>

                          {cls.zoomLink && (
                            <a
                              href={cls.zoomLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-xl bg-sky-100 text-sky-950 hover:bg-sky-200 text-[10px] font-bold flex items-center shadow-2xs border border-sky-200"
                              title="Vào lớp Zoom"
                            >
                              <Video className="w-3 h-3 text-sky-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs font-extrabold italic">
                    Không có ca dạy
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL: Class Inspection */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 p-6 space-y-5 relative">
            <button
              onClick={() => setSelectedClass(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-slate-800 text-pink-700 flex items-center justify-center font-black">
                <BookOpen className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedClass.className}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pink-200 text-pink-950 uppercase">
                  Mã Lớp: {selectedClass.code}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pink-50/60 dark:bg-slate-800/60 border border-pink-100 text-xs space-y-2">
              <p><strong>Giáo viên phụ trách:</strong> {selectedClass.teacherName}</p>
              <p><strong>Lịch học:</strong> {selectedClass.schedule}</p>
              <p><strong>Giáo trình:</strong> {selectedClass.courseName}</p>
              <p><strong>Phòng học:</strong> {selectedClass.room || 'Online Zoom'}</p>
              {selectedClass.zoomLink && (
                <p className="flex items-center text-sky-700 font-bold">
                  <Video className="w-4 h-4 mr-1 text-sky-600" />
                  Link Zoom: <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer" className="underline ml-1 truncate">{selectedClass.zoomLink}</a>
                </p>
              )}
            </div>

            {/* Students List in Class */}
            <div>
              <h4 className="font-extrabold text-xs text-pink-950 dark:text-pink-300 uppercase mb-2">
                Danh Sách Học Viên Trực Thuộc
              </h4>
              <div className="space-y-2">
                {(students || [])
                  .filter((s) => s && s.classIds && s.classIds.includes(selectedClass.id))
                  .map((std) => (
                    <div
                      key={std.id}
                      onClick={() => {
                        setSelectedClass(null);
                        setSelectedStudent(std);
                      }}
                      className="p-3 rounded-2xl border border-pink-100 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between hover:border-pink-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={resolveAvatarUrl(std.avatar)}
                          alt={std.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                          }}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {std.name}
                          </p>
                          <span className="text-[10px] text-pink-600 font-bold">
                            {std.honorNickname || 'Học viên active'}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-xl">
                        Xem Học Tập →
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => {
                  const targetId = selectedClass.id;
                  setSelectedClass(null);
                  onOpenAddSession(targetId);
                }}
                className="px-4 py-2.5 rounded-2xl bg-pink-400 text-white font-extrabold text-xs hover:bg-pink-500 transition flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" /> + Thêm buổi học cho lớp này
              </button>

              <button
                onClick={() => setSelectedClass(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs"
              >
                Đóng Lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

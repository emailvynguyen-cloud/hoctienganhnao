import React, { useState } from 'react';
import { Class, Student, Session } from '../../types';
import { Calendar, Clock, Video, User, PlusCircle, BookOpen, ExternalLink, X, GraduationCap, CheckCircle2 } from 'lucide-react';

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

  const daysOfWeek = [
    { key: 'T2', name: 'Thứ 2' },
    { key: 'T3', name: 'Thứ 3' },
    { key: 'T4', name: 'Thứ 4' },
    { key: 'T5', name: 'Thứ 5' },
    { key: 'T6', name: 'Thứ 6' },
    { key: 'T7', name: 'Thứ 7' },
    { key: 'CN', name: 'Chủ Nhật' },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-purple-600 animate-pulse" />
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
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs hover:from-purple-700 hover:to-pink-700 transition shadow-md flex items-center justify-center shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Thêm Buổi Học Đã Dạy
        </button>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((day) => {
          const dayClasses = getClassesForDay(day.key);

          return (
            <div
              key={day.key}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800/80 p-3.5 space-y-3 flex flex-col justify-between shadow-sm hover:shadow-md transition"
            >
              {/* Day Header */}
              <div className="border-b border-purple-100 dark:border-purple-800 pb-2 text-center">
                <span className="font-black text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                  {day.name}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
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
                        className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 hover:border-purple-400 transition space-y-2 text-left group cursor-pointer"
                        onClick={() => setSelectedClass(cls)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-purple-900 dark:text-purple-200 group-hover:text-purple-600 transition underline decoration-purple-300">
                            {cls.className || 'Lớp Học'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-purple-300 font-medium space-y-0.5">
                          <p className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-purple-500 shrink-0" />
                            {timePart}
                          </p>
                          <p className="flex items-center text-slate-500">
                            <User className="w-3 h-3 mr-1 text-pink-500 shrink-0" />
                            {cls.teacherName || 'Giáo viên'}
                          </p>
                        </div>

                        {/* Quick Students Avatars */}
                        <div className="pt-1.5 border-t border-purple-100 dark:border-purple-800/60 flex items-center justify-between">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {classStudents.map((std) => (
                              <img
                                key={std.id}
                                src={std.avatar || '/logo.jpg'}
                                alt={std.name || 'Học viên'}
                                title={`Học viên: ${std.name || ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(std);
                                }}
                                className="inline-block h-6 w-6 rounded-full border border-white hover:scale-110 transition cursor-pointer object-cover"
                              />
                            ))}
                          </div>

                          {cls.zoomLink && (
                            <a
                              href={cls.zoomLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-[10px] font-bold flex items-center"
                              title="Vào lớp Zoom"
                            >
                              <Video className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-300 text-xs font-bold italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 space-y-5 relative">
            <button
              onClick={() => setSelectedClass(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 flex items-center justify-center font-black">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedClass.className}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                  Mã Lớp: {selectedClass.code}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 text-xs space-y-2">
              <p><strong>Giáo viên phụ trách:</strong> {selectedClass.teacherName}</p>
              <p><strong>Lịch học:</strong> {selectedClass.schedule}</p>
              <p><strong>Giáo trình:</strong> {selectedClass.courseName}</p>
              <p><strong>Phòng học:</strong> {selectedClass.room}</p>
              {selectedClass.zoomLink && (
                <p className="flex items-center text-indigo-600 font-bold">
                  <Video className="w-4 h-4 mr-1" />
                  Link Zoom: <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer" className="underline ml-1 truncate">{selectedClass.zoomLink}</a>
                </p>
              )}
            </div>

            {/* Students List in Class */}
            <div>
              <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 uppercase mb-2">
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
                      className="p-3 rounded-2xl border border-purple-100 dark:border-purple-800 bg-white dark:bg-slate-800 flex items-center justify-between hover:border-purple-400 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <img src={std.avatar || '/logo.jpg'} alt={std.name} className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {std.name}
                          </p>
                          <span className="text-[10px] text-purple-600 font-bold">
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
                className="px-4 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" /> Thêm Buổi Học Cho Lớp Này
              </button>

              <button
                onClick={() => setSelectedClass(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs"
              >
                Đóng Lại
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Student Inspection */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <img src={selectedStudent.avatar || '/logo.jpg'} alt={selectedStudent.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-300 shadow-md" />
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedStudent.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-800 uppercase">
                  {selectedStudent.honorNickname || 'Học viên Ms. Vy English'}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  SĐT: {selectedStudent.phone || ''} • Email: {selectedStudent.email || ''}
                </p>
              </div>
            </div>

            {/* Quick Session Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100">
                <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  {selectedStudent.remainingSessions || 0} / {selectedStudent.totalPaidSessions || 8}
                </span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  Số buổi học phí còn lại
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-100">
                <span className="text-2xl font-black text-pink-700 dark:text-pink-300">
                  {selectedStudent.completedHomeworkTaskIds ? selectedStudent.completedHomeworkTaskIds.length : 0} Bài
                </span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  Bài tập đã hoàn thành
                </span>
              </div>
            </div>

            {/* Notes */}
            {selectedStudent.notes && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
                <strong>Nhận xét học viên:</strong> {selectedStudent.notes}
              </div>
            )}

            {/* Private Student Link Access */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
              <span className="font-bold flex items-center">
                🔗 Link xem học tập cá nhân (Dành riêng cho học viên):
              </span>
              <code className="block p-2 rounded-xl bg-white dark:bg-slate-800 font-mono text-[11px] break-all border border-indigo-100">
                {window.location.origin}/?hash={selectedStudent.publicHash}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?hash=${selectedStudent.publicHash}`);
                  alert('Đã sao chép đường link cá nhân của học viên!');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition"
              >
                Sao Chép Link Gửi Học Viên
              </button>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs"
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

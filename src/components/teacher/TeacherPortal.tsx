import React, { useState } from 'react';
import { Class, Student, Session } from '../../types';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import {
  Calendar,
  Clock,
  Video,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  Users,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Flame,
  X,
  User,
} from 'lucide-react';

interface TeacherPortalProps {
  classes: Class[];
  students: Student[];
  sessions: Session[];
  onRefreshData: () => void;
  onOpenAddSession: (classId?: string) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  classes,
  students,
  sessions,
  onRefreshData,
  onOpenAddSession,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'all_classes'>('today');
  const [scheduleView, setScheduleView] = useState<'week' | 'month'>('week');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const todayClasses = classes;
  const currentOngoingClass = todayClasses[0];

  return (
    <div className="space-y-6">
      
      {/* Teacher Portal Navigation Tabs (Clean Headers without "Mục 1, 2, 3") */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 min-w-[130px] ${
            activeTab === 'today'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>HÔM NAY</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 min-w-[130px] ${
            activeTab === 'schedule'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>LỊCH DẠY</span>
        </button>

        <button
          onClick={() => setActiveTab('all_classes')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 min-w-[130px] ${
            activeTab === 'all_classes'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>TẤT CẢ LỚP HỌC ({classes.length})</span>
        </button>
      </div>

      {/* TAB 1: HÔM NAY */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {currentOngoingClass && (
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0">
                    <Video className="w-7 h-7 text-pink-200 animate-pulse" />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase tracking-wider shadow-sm">
                      🔴 LỚP HỌC HIỆN TẠI ĐANG BẮT ĐẦU
                    </span>
                    <h3
                      onClick={() => setSelectedClass(currentOngoingClass)}
                      className="text-xl font-black mt-1 hover:underline cursor-pointer"
                    >
                      {currentOngoingClass.className}
                    </h3>
                    <p className="text-xs text-purple-100 mt-0.5 font-medium">
                      Lịch học: {currentOngoingClass.schedule} • Giáo trình: {currentOngoingClass.courseName}
                    </p>
                  </div>
                </div>

                {currentOngoingClass.zoomLink ? (
                  <a
                    href={currentOngoingClass.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-900 font-extrabold text-xs hover:bg-amber-300 transition shadow-lg flex items-center justify-center shrink-0"
                  >
                    <Video className="w-4 h-4 mr-2" /> VÀO BUỔI HỌC (ZOOM)
                  </a>
                ) : (
                  <button
                    onClick={() => onOpenAddSession(currentOngoingClass.id)}
                    className="px-6 py-3 rounded-2xl bg-white text-purple-900 font-extrabold text-xs hover:bg-purple-50 transition shadow-lg shrink-0"
                  >
                    + Ghi Nhận Buổi Học
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Today's Schedule List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" /> Danh Sách Lớp Dạy Hôm Nay
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Bấm vào từng lớp để xem thông tin lớp và danh sách học viên
                </p>
              </div>

              <button
                onClick={() => onOpenAddSession()}
                className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" /> Thêm Buổi Học
              </button>
            </div>

            <div className="space-y-3">
              {todayClasses.map((cls) => {
                const classStudents = students.filter((s) => s.classIds.includes(cls.id));

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="p-5 rounded-3xl border border-purple-100 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-300 transition cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition underline decoration-purple-300">
                          {cls.className}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                          {cls.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Lịch: {cls.schedule} • Sĩ số: {classStudents.length} học viên
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {cls.zoomLink && (
                        <a
                          href={cls.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 transition flex items-center"
                        >
                          <Video className="w-3.5 h-3.5 mr-1.5" /> Vào Buổi Học
                        </a>
                      )}

                      <button
                        onClick={() => onOpenAddSession(cls.id)}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold hover:bg-purple-700 transition flex items-center"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Thêm Buổi Học
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LỊCH DẠY (Grid Table Format) */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-purple-100 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" /> Bảng Lịch Dạy Theo Kẻ Bảng Trực Quan
            </h3>

            <div className="bg-purple-50 p-1 rounded-2xl flex items-center space-x-1 border border-purple-200">
              <button
                onClick={() => setScheduleView('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  scheduleView === 'week' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Lịch Tuần
              </button>
              <button
                onClick={() => setScheduleView('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  scheduleView === 'month' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Lịch Tháng
              </button>
            </div>
          </div>

          <WeeklyTimetable
            classes={classes}
            students={students}
            sessions={sessions}
            onOpenAddSession={onOpenAddSession}
          />
        </div>
      )}

      {/* TAB 3: TẤT CẢ LỚP HỌC (Clickable to inspect Class & Students) */}
      {activeTab === 'all_classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" /> Thống Kê Tất Cả Các Lớp Học Đang Phụ Trách
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Nhấn vào từng lớp để xem danh sách học viên trực thuộc và tạo buổi học
              </p>
            </div>

            <button
              onClick={() => onOpenAddSession()}
              className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm"
            >
              + Thêm Buổi Học
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => {
              const classStudents = students.filter((s) => s.classIds.includes(cls.id));

              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="p-6 rounded-3xl border border-purple-100 bg-purple-50/40 space-y-4 hover:border-purple-400 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-purple-600 transition underline decoration-purple-300">
                        {cls.className}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase mt-1 inline-block">
                        {cls.code}
                      </span>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-100 text-pink-800">
                      {classStudents.length} Học Viên
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-medium">
                    <p><strong>Lịch học:</strong> {cls.schedule}</p>
                    <p><strong>Phòng học:</strong> {cls.room}</p>
                    <p><strong>Giáo trình:</strong> {cls.courseName}</p>
                  </div>

                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex -space-x-2">
                      {classStudents.map((std) => (
                        <img key={std.id} src={std.avatar} alt={std.name} title={std.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                      ))}
                    </div>

                    <button
                      onClick={() => onOpenAddSession(cls.id)}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm"
                    >
                      + Thêm Buổi Học
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLASS INSPECTION MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-purple-100 p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedClass(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedClass.className}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                  {selectedClass.code}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 text-xs space-y-1.5 font-medium">
              <p><strong>Giáo viên:</strong> {selectedClass.teacherName}</p>
              <p><strong>Lịch học:</strong> {selectedClass.schedule}</p>
              <p><strong>Giáo trình:</strong> {selectedClass.courseName}</p>
              <p><strong>Phòng học:</strong> {selectedClass.room}</p>
              {selectedClass.zoomLink && (
                <p className="flex items-center text-indigo-600 font-bold">
                  <Video className="w-4 h-4 mr-1" />
                  Zoom: <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer" className="underline ml-1 truncate">{selectedClass.zoomLink}</a>
                </p>
              )}
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-purple-900 uppercase mb-2">
                Danh Sách Học Viên Trực Thuộc ({students.filter((s) => s.classIds.includes(selectedClass.id)).length} em):
              </h4>
              <div className="space-y-2">
                {students
                  .filter((s) => s.classIds.includes(selectedClass.id))
                  .map((std) => (
                    <div key={std.id} className="p-3 rounded-2xl border border-purple-100 bg-white flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={std.avatar} alt={std.name} className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <p className="font-extrabold text-xs text-slate-900">{std.name}</p>
                          <span className="text-[10px] text-purple-600 font-bold">{std.honorNickname || 'Học viên active'}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-xl">
                        SĐT: {std.phone}
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
                className="px-4 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition"
              >
                + Thêm Buổi Học Cho Lớp Này
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

    </div>
  );
};

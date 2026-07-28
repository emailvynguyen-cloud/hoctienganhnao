import React, { useState } from 'react';
import { Class, Student, Session, User as UserType } from '../../types';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from '../admin/ClassDetailsView';
import { StorageEngine } from '../../lib/storage';
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
  currentUser?: UserType | null;
  classes: Class[];
  students: Student[];
  sessions: Session[];
  onRefreshData: () => void;
  onOpenAddSession: (classId?: string) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  classes,
  students,
  sessions,
  onRefreshData,
  onOpenAddSession,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'all_classes'>('today');
  const [inspectedClass, setInspectedClass] = useState<Class | null>(null);

  // Restrict classes so teacher only sees their assigned classes
  const assignedClasses = (classes || []).filter((c) => {
    if (!currentUser || currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;
    return c.teacherId === currentUser.uid || c.teacherName === currentUser.displayName;
  });

  const todayClasses = assignedClasses;
  const currentOngoingClass = todayClasses[0];

  // IF INSPECTING A SPECIFIC CLASS DEDICATED PAGE VIEW
  if (inspectedClass) {
    return (
      <ClassDetailsView
        selectedClass={inspectedClass}
        students={students}
        sessions={sessions}
        homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
        onBack={() => setInspectedClass(null)}
        onOpenAddSession={onOpenAddSession}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Teacher Portal Navigation Tabs */}
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
          <span>LỊCH DẠY BẢNG TUẦN</span>
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
          <span>LỚP PHỤ TRÁCH ({assignedClasses.length})</span>
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
                      onClick={() => setInspectedClass(currentOngoingClass)}
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
                  Bấm vào từng lớp để xem trang chi tiết thông tin lớp & danh sách buổi học
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
                    onClick={() => setInspectedClass(cls)}
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

      {/* TAB 2: LỊCH DẠY BẢNG TUẦN */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-purple-100 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" /> Bảng Lịch Dạy Phân Bổ Theo Tuần
            </h3>
          </div>

          <WeeklyTimetable
            classes={assignedClasses}
            students={students}
            sessions={sessions}
            onOpenAddSession={onOpenAddSession}
          />
        </div>
      )}

      {/* TAB 3: LỚP PHỤ TRÁCH (CLICKING ANY CLASS OPENS DEDICATED CLASS PAGE) */}
      {activeTab === 'all_classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" /> Thống Kê Các Lớp Học Đang Phụ Trách ({assignedClasses.length} lớp)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Nhấn vào từng lớp để xem trang thông tin chi tiết lớp & danh sách buổi học
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
            {assignedClasses.map((cls) => {
              const classStudents = students.filter((s) => s.classIds.includes(cls.id));

              return (
                <div
                  key={cls.id}
                  onClick={() => setInspectedClass(cls)}
                  className="p-6 rounded-3xl border border-purple-100 bg-purple-50/40 space-y-4 hover:border-purple-400 transition cursor-pointer group shadow-xs"
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

                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition flex items-center">
                      Mở Trang Thông Tin Lớp Học →
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddSession(cls.id);
                      }}
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

    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
  Coffee,
  Heart,
  ShieldAlert,
  Home,
  ArrowLeft,
} from 'lucide-react';

interface TeacherPortalProps {
  currentUser?: UserType | null;
  classes: Class[];
  students: Student[];
  sessions: Session[];
  onRefreshData: () => void;
  onOpenAddSession: (classId?: string) => void;
  onOpenPublicStudentLink?: (hash: string) => void;
  onSetSubViewNavigation?: (canBack: boolean, onBack?: () => void, onHome?: () => void) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  classes,
  students,
  sessions,
  onRefreshData,
  onOpenAddSession,
  onOpenPublicStudentLink,
  onSetSubViewNavigation,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'all_classes'>('today');
  const [inspectedClass, setInspectedClass] = useState<Class | null>(null);

  // STRICT TEACHER SCOPING: Filter classes strictly assigned to this teacher
  const isSuperOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const assignedClasses = (classes || []).filter((c) => {
    if (!currentUser || isSuperOrAdmin) return true;
    return c.teacherId === currentUser.uid || (c.teacherName && c.teacherName === currentUser.displayName);
  });

  // Notify parent component about Sub-View Navigation state (Header Home & Back Buttons)
  useEffect(() => {
    if (onSetSubViewNavigation) {
      if (inspectedClass) {
        onSetSubViewNavigation(
          true,
          () => setInspectedClass(null),
          () => {
            setInspectedClass(null);
            setActiveTab('today');
          }
        );
      } else {
        onSetSubViewNavigation(
          false,
          undefined,
          () => setActiveTab('today')
        );
      }
    }
  }, [inspectedClass, onSetSubViewNavigation]);

  // HELPER: Check if a class is ongoing right now based on local time & schedule
  const getOngoingClassRightNow = (classesList: Class[]) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeVal = currentHours * 60 + currentMinutes;

    const dayTokens: Record<number, string[]> = {
      1: ['t2', 'thứ 2', 'thứ hai', '2'],
      2: ['t3', 'thứ 3', 'thứ ba', '3'],
      3: ['t4', 'thứ 4', 'thứ tư', '4'],
      4: ['t5', 'thứ 5', 'thứ năm', '5'],
      5: ['t6', 'thứ 6', 'thứ sáu', '6'],
      6: ['t7', 'thứ 7', 'thứ bảy', '7'],
      0: ['cn', 'chủ nhật'],
    };

    const todayKeys = dayTokens[currentDay] || [];

    for (const cls of classesList) {
      if (!cls || !cls.schedule) continue;
      const schLower = cls.schedule.toLowerCase();

      const matchesDay = todayKeys.some((token) => schLower.includes(token));
      if (!matchesDay) continue;

      const timeMatch = schLower.match(/(\d{1,2})[:h](\d{2})\s*[-–\to]+\s*(\d{1,2})[:h](\d{2})/);
      if (timeMatch) {
        const startH = parseInt(timeMatch[1], 10);
        const startM = parseInt(timeMatch[2], 10);
        const endH = parseInt(timeMatch[3], 10);
        const endM = parseInt(timeMatch[4], 10);

        const startTimeVal = startH * 60 + startM;
        const endTimeVal = endH * 60 + endM;

        if (currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal) {
          return cls;
        }
      }
    }

    return null;
  };

  const currentOngoingClass = getOngoingClassRightNow(assignedClasses);

  // IF INSPECTING A SPECIFIC CLASS DEDICATED PAGE VIEW
  if (inspectedClass) {
    // ROUTE GUARD CHECK: Ensure Teacher cannot inspect unassigned classes
    const isAssigned = isSuperOrAdmin || assignedClasses.some((c) => c.id === inspectedClass.id);

    if (!isAssigned) {
      return (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto space-y-4 shadow-md my-12">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-rose-950">Quyền Truy Cập Bị Giới Hạn</h3>
          <p className="text-xs text-rose-800 font-medium">
            Bạn không có quyền quản lý hoặc xem dữ liệu của lớp học này. Vui lòng quay về trang chủ Giáo Viên của bạn.
          </p>
          <button
            onClick={() => setInspectedClass(null)}
            className="px-6 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 shadow-md"
          >
            ← Quay Về Trang Chủ Giáo Viên
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK BUTTON FOR TEACHER */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-2xs">
          <button
            onClick={() => setInspectedClass(null)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition flex items-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Giáo Viên
          </button>
          <span className="text-xs font-black text-slate-700 dark:text-purple-200 truncate">
            Đang Xem Chi Tiết Lớp: {inspectedClass.className}
          </span>
          <button
            onClick={() => {
              setInspectedClass(null);
              setActiveTab('today');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center shrink-0"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home
          </button>
        </div>

        <ClassDetailsView
          selectedClass={inspectedClass}
          students={students}
          sessions={sessions}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          onBack={() => setInspectedClass(null)}
          onOpenAddSession={onOpenAddSession}
          onOpenPublicStudentLink={onOpenPublicStudentLink}
        />
      </div>
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
          
          {/* ONGOING CLASS BANNER OR RELAXING PRINCESS BANNER */}
          {currentOngoingClass ? (
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
          ) : (
            /* NO ONGOING CLASS RIGHT NOW BANNER */
            <div className="p-8 rounded-3xl border-2 border-purple-200/80 bg-gradient-to-r from-pink-100/90 via-purple-100/90 to-indigo-100/90 dark:from-purple-950/80 dark:to-slate-900 text-center space-y-2 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-purple-900 text-pink-500 flex items-center justify-center mx-auto shadow-sm text-2xl animate-bounce">
                ☕
              </div>
              <h3 className="text-lg font-black text-purple-950 dark:text-purple-100 flex items-center justify-center">
                Hiện không có lớp, nghỉ ngơi đi nhé công chúa <Heart className="w-5 h-5 ml-1.5 text-pink-500 fill-pink-500 animate-pulse" />
              </h3>
              <p className="text-xs text-purple-800 dark:text-purple-300 font-medium max-w-md mx-auto">
                Hệ thống sẽ tự động kích hoạt khung lớp học trên đầu khi tới đúng ca dạy của bạn!
              </p>
            </div>
          )}

          {/* Today's Schedule List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" /> Danh Sách Tất Cả Lớp Phụ Trách
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
              {assignedClasses.map((cls) => {
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

      {/* TAB 3: LỚP PHỤ TRÁCH */}
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

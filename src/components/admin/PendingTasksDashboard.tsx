import React, { useState, useEffect } from 'react';
import { Class, Student, Session, User, getStudentQuizletUrl } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { calculateGlobalPendingTasks, PendingTaskItem, isTaskForTeacher } from '../../lib/pendingTasksEngine';
import { PendingTaskService, DbPendingTask } from '../../lib/pendingTaskService';
import {
  Bell,
  Clock,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Trash2,
  Filter,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface PendingTasksDashboardProps {
  classes: Class[];
  students: Student[];
  sessions: Session[];
  allUsers?: User[];
  currentUser?: User | null;
  onOpenAddSession?: (classId?: string, editingSession?: Session) => void;
  onInspectClass?: (classId: string) => void;
}



// Helper interface for Teacher Pending Groups
export interface TeacherPendingGroup {
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  tasks: PendingTaskItem[];
}



export const PendingTasksDashboard: React.FC<PendingTasksDashboardProps> = React.memo(({
  classes = [],
  students = [],
  sessions = [],
  allUsers = [],
  currentUser,
  onOpenAddSession,
  onInspectClass,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [dbTasks, setDbTasks] = useState<DbPendingTask[]>([]);
  const dismissedTaskIds = StorageEngine.getDismissedPendingTaskIds() || [];
  const [filterType, setFilterType] = useState<'all' | 'unrecorded' | 'missing_quizlet' | 'missing_record_link' | 'overdue' | 'today'>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');

  useEffect(() => {
    console.log('[PENDING][UI MOUNT] PendingTasksDashboard mounted');

    // Initial fetch from Supabase pending_tasks table
    PendingTaskService.fetchPendingTasks().then((tasks) => {
      console.log('[PENDING][INITIAL FETCH] Dashboard fetched tasks:', tasks.length);
      console.log('[PENDING][STATE UPDATE] Dashboard updating dbTasks state:', tasks.length);
      setDbTasks(tasks);
    });

    // Direct Supabase Realtime subscription on pending_tasks table
    const unsubscribe = PendingTaskService.subscribePendingTasks((updatedTasks) => {
      console.log('[PENDING][REALTIME SUBSCRIBED] Dashboard subscription ready');
      console.log('[PENDING][REALTIME EVENT] Dashboard received tasks via Realtime event:', updatedTasks.length);
      console.log('[PENDING][STATE UPDATE] Dashboard updating dbTasks state from Realtime:', updatedTasks.length);
      setDbTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, []);

  const handleDismissTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn bỏ qua vĩnh viễn công việc này khỏi danh sách cần xử lý?')) {
      return;
    }

    // 1. OPTIMISTIC UI UPDATE: Instantly remove item from local React state (0ms latency!)
    const previousDbTasks = [...dbTasks];
    setDbTasks((prev) => prev.filter((t) => t.id !== taskId));

    // 2. Silent storage persistence (does not trigger full-app loadData re-render)
    StorageEngine.dismissPendingTaskIdSilent(taskId);

    // 3. Async backend request with failure rollback
    try {
      const ok = await PendingTaskService.dismissPendingTask(taskId);
      if (!ok) {
        setDbTasks(previousDbTasks);
        alert('Không thể bỏ qua tác vụ trên máy chủ. Đã khôi phục dữ liệu.');
      }
    } catch (e) {
      console.error('[DISMISS][ERROR]', e);
      setDbTasks(previousDbTasks);
      alert('Đã xảy ra lỗi khi bỏ qua tác vụ. Đã khôi phục dữ liệu.');
    }
  };

  const {
    allPendingTasks,
    totalTasksCount,
    unrecordedCount,
    quizletCount,
    overdueCount,
    todayCount,
    uniqueTeachers,
    filteredTasks,
    activeTeacherGroups,
    todayFormatted,
  } = React.useMemo(() => {
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayFmt = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    const derivedTasks = calculateGlobalPendingTasks(classes, sessions, students, dismissedTaskIds);

    // 1. Build a map of all tasks from dbTasks (Supabase Realtime)
    const dbTaskMap = new Map<string, DbPendingTask>();
    (dbTasks || []).forEach((t) => dbTaskMap.set(t.id, t));

    // 2. Map active tasks from dbTasks
    const activeDbTasks: PendingTaskItem[] = (dbTasks || [])
      .filter((t) => t.status === 'pending' && !dismissedTaskIds.includes(t.id))
      .map((t) => ({
        id: t.id,
        type: t.type as any,
        classId: t.class_id || '',
        className: t.class_name || 'Lớp học',
        teacherId: t.teacher_id,
        teacherName: t.teacher_name || 'Giáo viên',
        dateISO: t.date_iso || '',
        scheduleTimeStr: t.schedule_time_str || '',
        dueDeadlineStr: '',
        overdueDays: t.overdue_days || 0,
        penaltyAmount: (t.overdue_days || 0) * 10000,
        isOverdue: (t.overdue_days || 0) > 0,
        sessionId: t.session_id,
      }));

    const taskMap = new Map<string, PendingTaskItem>();

    // Add derived tasks ONLY if they are not marked completed/dismissed in dbTasks
    derivedTasks.forEach((dt) => {
      const dbRecord = dbTaskMap.get(dt.id);
      if (!dbRecord || (dbRecord.status === 'pending' && !dismissedTaskIds.includes(dt.id))) {
        taskMap.set(dt.id, dt);
      }
    });

    // Overwrite with active dbTasks
    activeDbTasks.forEach((dbt) => taskMap.set(dbt.id, dbt));

    const tasks = Array.from(taskMap.values());
    console.log('[PENDING][UI RENDER] PendingTasksDashboard re-calculating directly from dbTasks Realtime! Active items:', tasks.length);

    const totalCount = tasks.length;
    const unrecCount = tasks.filter((t) => t.type === 'unrecorded_session').length;
    const quizCount = tasks.filter((t) => t.type === 'missing_quizlet').length;
    const ovdCount = tasks.filter((t) => t.overdueDays > 0).length;
    const tdayCount = tasks.filter((t) => t.overdueDays === 0).length;

    const uTeachers = Array.from(
      new Set(tasks.map((t) => JSON.stringify({ id: t.teacherId, name: t.teacherName })))
    ).map((str) => JSON.parse(str) as { id: string; name: string });

    const isTeacherRole = currentUser?.role === 'teacher';

    const fTasks = tasks.filter((task) => {
      // Rule 1: Teachers NEVER see missing_quizlet tasks in Pending Tasks
      if (isTeacherRole && task.type === 'missing_quizlet') return false;

      // Rule 2: Teachers ONLY see tasks of their assigned classes / their teacherId / teacherName
      if (isTeacherRole) {
        if (!isTaskForTeacher(task, currentUser, classes)) return false;
      }

      if (filterType === 'unrecorded' && task.type !== 'unrecorded_session') return false;
      if (filterType === 'missing_quizlet' && task.type !== 'missing_quizlet') return false;
      if (filterType === 'missing_record_link' && task.type !== 'missing_record_link') return false;
      if (filterType === 'overdue' && task.overdueDays === 0) return false;
      if (filterType === 'today' && task.overdueDays !== 0) return false;

      if (selectedTeacherFilter !== 'all') {
        const targetTeacherUser = (allUsers || []).find((u) => u.uid === selectedTeacherFilter || u.displayName === selectedTeacherFilter) || {
          uid: selectedTeacherFilter,
          displayName: selectedTeacherFilter,
          role: 'teacher' as const,
        };
        if (!isTaskForTeacher(task, targetTeacherUser, classes)) {
          return false;
        }
      }
      return true;
    });

    const teacherGroupsMap: Record<string, TeacherPendingGroup> = {};
    fTasks.forEach((task) => {
      const teacherKey = task.teacherId || task.teacherName;
      if (!teacherGroupsMap[teacherKey]) {
        const userObj = allUsers.find((u) => u.displayName === task.teacherName || u.uid === task.teacherId);
        teacherGroupsMap[teacherKey] = {
          teacherId: teacherKey,
          teacherName: task.teacherName,
          teacherAvatar: userObj?.avatarUrl,
          tasks: [],
        };
      }
      teacherGroupsMap[teacherKey].tasks.push(task);
    });

    const groups = Object.values(teacherGroupsMap).filter((g) => g.tasks.length > 0);

    return {
      allPendingTasks: tasks,
      totalTasksCount: totalCount,
      unrecordedCount: unrecCount,
      quizletCount: quizCount,
      overdueCount: ovdCount,
      todayCount: tdayCount,
      uniqueTeachers: uTeachers,
      filteredTasks: fTasks,
      activeTeacherGroups: groups,
      todayFormatted: todayFmt,
    };
  }, [classes, sessions, students, allUsers, dismissedTaskIds, filterType, selectedTeacherFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-2xl shadow-2xs">
              📋
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                CÔNG VIỆC CẦN XỬ LÝ
              </h2>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 shrink-0 self-start sm:self-center">
            📅 Hôm nay: {todayFormatted}
          </div>
        </div>

        {/* SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Tổng Việc Tồn</span>
            <span className="text-2xl font-black text-white block">{totalTasksCount} việc</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-0.5">
            <span className="text-[10px] font-bold text-rose-300 block uppercase tracking-wider">🔴 Chưa Nhập Buổi</span>
            <span className="text-2xl font-black text-rose-200 block">{unrecordedCount} buổi</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-0.5">
            <span className="text-[10px] font-bold text-amber-300 block uppercase tracking-wider">🟠 Chưa Thêm Quizlet</span>
            <span className="text-2xl font-black text-amber-200 block">{quizletCount} ca</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-0.5">
            <span className="text-[10px] font-bold text-rose-300 block uppercase tracking-wider">⏰ Vi Phạm Quá Hạn</span>
            <span className="text-2xl font-black text-rose-200 block">{overdueCount} việc</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-300 block uppercase tracking-wider">📅 Phát Sinh Hôm Nay</span>
            <span className="text-2xl font-black text-emerald-200 block">{todayCount} việc</span>
          </div>
        </div>
      </div>

      {/* QUICK FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Lọc Nhanh:
          </span>

          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({totalTasksCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('unrecorded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterType === 'unrecorded'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            🔴 Chưa Nhập Buổi ({unrecordedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('missing_quizlet')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterType === 'missing_quizlet'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            🟠 Chưa Thêm Quizlet ({quizletCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('overdue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterType === 'overdue'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            ⏰ Quá Hạn ({overdueCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterType === 'today'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            📅 Hôm Nay ({todayCount})
          </button>
        </div>

        {/* TEACHER FILTER DROPDOWN */}
        {uniqueTeachers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">👩‍🏫 Theo Giáo Viên:</span>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-300 cursor-pointer"
            >
              <option value="all">Tất Cả Giáo Viên ({uniqueTeachers.length})</option>
              {uniqueTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MAIN TEACHER GROUPS GRID */}
      {activeTeacherGroups.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-emerald-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <span className="text-4xl">🎉</span>
          <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-300">
            Tuyệt Vời! Không Có Công Việc Nào Tồn Đọng
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            Toàn bộ công việc theo bộ lọc đã hoàn thành hoặc chưa có công việc nào bị quá hạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTeacherGroups.map((group) => (
            <div
              key={group.teacherId}
              className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200/90 dark:border-slate-800 p-6 space-y-4 shadow-sm hover:shadow-md transition duration-200"
            >
              {/* TEACHER CARD HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="flex items-center space-x-3">
                  <img
                    src={resolveAvatarUrl(group.teacherAvatar || '')}
                    alt={group.teacherName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className="w-11 h-11 rounded-2xl object-cover border border-rose-200 dark:border-slate-700 shadow-2xs"
                  />
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center">
                      👩‍🏫 {group.teacherName}
                    </h3>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-extrabold block mt-0.5">
                      Còn {group.tasks.length} công việc cần xử lý
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-black border border-rose-200">
                  {group.tasks.length} Việc
                </span>
              </div>

              {/* PENDING TASKS LIST */}
              <div className="space-y-3.5">
                {group.tasks.map((task) => {
                  const priorityBg =
                    task.priorityColor === 'red'
                      ? 'bg-[#D9AEB0]/40 text-[#5A2C2F] dark:text-rose-200 border-[#D9AEB0]'
                      : task.priorityColor === 'orange'
                      ? 'bg-[#E4C3A8]/40 text-[#5C3F29] dark:text-amber-200 border-[#E4C3A8]'
                      : 'bg-[#E6D5A8]/40 text-[#4D3F1D] dark:text-yellow-200 border-[#E6D5A8]';

                  const cardBorderBg =
                    task.type === 'unrecorded_session'
                      ? 'bg-[#FAF9F6] dark:bg-slate-800/60 border-[#E3E0DA] dark:border-slate-700 text-[#3F4146] dark:text-slate-200'
                      : 'bg-[#FAF9F6] dark:bg-slate-800/60 border-[#E3E0DA] dark:border-slate-700 text-[#3F4146] dark:text-slate-200';

                  return (
                    <div key={task.id} className={`p-4.5 rounded-2xl border space-y-3 text-xs transition duration-150 ${cardBorderBg}`}>
                      {/* TASK HEADER & OVERDUE BADGE */}
                      <div className="flex flex-wrap items-center justify-between gap-2 font-black">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {task.type === 'unrecorded_session'
                              ? '🔴'
                              : task.type === 'missing_record_link'
                              ? '🎥'
                              : '🟠'}
                          </span>
                          <span className="uppercase tracking-wider font-extrabold text-[#3F4146] dark:text-white">
                            {task.type === 'unrecorded_session'
                              ? 'Chưa Nhập Buổi Học'
                              : task.type === 'missing_record_link'
                              ? 'Chưa Có Link Record'
                              : 'Chưa Thêm Quizlet'}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border uppercase shadow-2xs ${priorityBg}`}>
                            ⏰ {task.overdueBadgeText}
                          </span>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex items-center space-x-2">
                          {task.type === 'unrecorded_session' && onOpenAddSession && (
                            <button
                              type="button"
                              onClick={() => onOpenAddSession(task.classId)}
                              className="px-3 py-1.5 rounded-xl bg-[#B8CEE0] hover:bg-[#A3BFD5] text-[#2C3B49] font-extrabold text-[11px] shadow-2xs transition cursor-pointer flex items-center shrink-0 border border-[#A5C3DA]"
                            >
                              + Nhập Buổi Ngay ↗
                            </button>
                          )}

                          {task.type === 'missing_record_link' && onOpenAddSession && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetSession = sessions.find((s) => String(s.id) === String(task.sessionId));
                                onOpenAddSession(task.classId, targetSession);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-[11px] shadow-2xs transition cursor-pointer flex items-center shrink-0 border border-purple-300"
                            >
                              + Thêm Link Record ↗
                            </button>
                          )}

                          {task.type === 'missing_quizlet' && onInspectClass && (
                            <button
                              type="button"
                              onClick={() => onInspectClass(task.classId)}
                              className="px-3 py-1.5 rounded-xl bg-[#E4C3A8] hover:bg-[#D8B497] text-[#4F3622] font-extrabold text-[11px] shadow-2xs transition cursor-pointer flex items-center shrink-0 border border-[#D8B497]"
                            >
                              Chỉnh Sửa Lớp ↗
                            </button>
                          )}

                          {/* ONLY SUPER ADMIN HAS PERMISSION TO DISMISS TASK PERMANENTLY */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismissTask(task.id);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-700 font-extrabold text-[11px] transition shrink-0 cursor-pointer shadow-2xs border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                              title="Chỉ Super Admin: Bỏ qua vĩnh viễn công việc này khỏi danh sách"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-500 hover:text-white" /> 🗑 Bỏ qua
                            </button>
                          )}
                        </div>
                      </div>

                      {/* TASK BODY & QUIZLET MISSING STUDENTS HIERARCHY */}
                      <div className="space-y-1.5 font-medium">
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                          • Lớp: <span className="underline text-pink-700 dark:text-pink-300">{task.className}</span> ({task.scheduleTimeStr})
                        </p>

                        {task.type === 'missing_quizlet' && task.missingStudents && task.missingStudents.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-amber-200/80 dark:border-amber-900/60 space-y-1.5 bg-amber-100/50 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-200 dark:border-slate-700">
                            <span className="font-extrabold text-amber-950 dark:text-amber-300 block">
                              Chưa thêm Quizlet cho các học viên ({task.missingStudents.length} em):
                            </span>
                            <div className="pl-3 space-y-1 text-slate-800 dark:text-slate-200 font-bold">
                              {task.missingStudents.map((stdName, sIdx) => (
                                <div key={sIdx} className="flex items-center space-x-2 text-xs">
                                  <span className="text-amber-600 font-black">└── 👤</span>
                                  <span>{stdName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

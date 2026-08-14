import React, { useState } from 'react';
import { StorageEngine } from '../../lib/storage';
import { isBillableStudentSession } from '../../types';
import { DollarSign, Calendar, TrendingUp, Clock, CheckCircle2, Flame, Sparkles, UserCheck, Award } from 'lucide-react';
import { formatVND } from '../../lib/vietqr';

export const MonthlyRevenueWidget: React.FC = () => {
  // Get current date string in Vietnam time (YYYY-MM-DD)
  const getTodayDateStr = () => {
    const now = new Date();
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      const formatted = new Intl.DateTimeFormat('en-CA', options).format(now);
      return formatted; // "YYYY-MM-DD"
    } catch (e) {
      return now.toISOString().split('T')[0];
    }
  };

  const todayDateStr = getTodayDateStr();
  const currentMonthStr = todayDateStr.substring(0, 7); // "YYYY-MM"

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const sessions = StorageEngine.getSessions() || [];
  const students = StorageEngine.getStudents() || [];
  const classes = StorageEngine.getClasses() || [];

  // HELPER: Check if a class strictly belongs to Ms. Vy
  const isMsVyClass = (classId: string) => {
    const cls = classes.find((c) => c && c.id === classId);
    if (!cls) return true; // Default to true if unassigned
    const nameLower = (cls.teacherName || '').toLowerCase();
    return (
      nameLower.includes('vy') ||
      cls.teacherId === 'u_super_admin' ||
      cls.teacherId === 'u_admin' ||
      nameLower.includes('điều hành')
    );
  };

  // -------------------------------------------------------------
  // 1. MS. VY'S REVENUE (STRICTLY EXCLUDES OTHER TEACHERS)
  // -------------------------------------------------------------
  
  // Today's revenue for Ms. Vy
  const msVyTodaySessions = sessions.filter((s) => s && s.date === todayDateStr && isMsVyClass(s.classId));
  let todayRevenue = 0;
  let todayStudentCount = 0;

  msVyTodaySessions.forEach((sess) => {
    const classStudents = students.filter(
      (s) => s && s.status !== 'soft_deleted' && s.classIds?.includes(sess.classId)
    );

    classStudents.forEach((std) => {
      if (isBillableStudentSession(sess, std.id)) {
        const pkgPrice = std.tuitionPackagePrice || 2000000;
        const pkgSessions = std.packageSessionCount || 8;
        const perSession = pkgPrice / pkgSessions;
        todayRevenue += perSession;
        todayStudentCount += 1;
      }
    });
  });

  // Monthly revenue for Ms. Vy
  const msVyMonthSessions = sessions.filter((s) => s && s.date && s.date.startsWith(selectedMonth) && isMsVyClass(s.classId));

  const dailyMap: Record<string, { date: string; sessionCount: number; revenue: number; details: string[] }> = {};
  let msVyMonthlyRevenue = 0;

  const studentBreakdown: {
    studentId: string;
    studentName: string;
    className: string;
    sessionsTaughtInMonth: number;
    perSessionPrice: number;
    monthlyRevenue: number;
  }[] = [];

  students.forEach((std) => {
    if (!std || std.status === 'soft_deleted') return;

    const stdMsVyClasses = (std.classIds || []).filter((cid) => isMsVyClass(cid));
    if (stdMsVyClasses.length === 0) return;

    const pkgPrice = std.tuitionPackagePrice || 2000000;
    const pkgCount = std.packageSessionCount || 8;
    const perSessionPrice = Math.round(pkgPrice / pkgCount);

    let countInMonth = 0;
    msVyMonthSessions.forEach((ses) => {
      if (ses && stdMsVyClasses.includes(ses.classId)) {
        if (isBillableStudentSession(ses, std.id)) {
          countInMonth += 1;
        }
      }
    });

    const monthlyRev = countInMonth * perSessionPrice;
    msVyMonthlyRevenue += monthlyRev;

    if (countInMonth > 0) {
      const primaryCls = classes.find((c) => c.id === stdMsVyClasses[0]);
      studentBreakdown.push({
        studentId: std.id,
        studentName: std.name || 'Học viên',
        className: primaryCls?.className || 'Lớp Ms. Vy',
        sessionsTaughtInMonth: countInMonth,
        perSessionPrice,
        monthlyRevenue: monthlyRev,
      });
    }
  });

  msVyMonthSessions.forEach((sess) => {
    const dateStr = sess.date;
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { date: dateStr, sessionCount: 0, revenue: 0, details: [] };
    }

    dailyMap[dateStr].sessionCount += 1;

    const classStudents = students.filter((s) => s && s.status !== 'soft_deleted' && s.classIds?.includes(sess.classId));

    let sessionRev = 0;
    let billableCount = 0;
    classStudents.forEach((std) => {
      if (isBillableStudentSession(sess, std.id)) {
        const pkgPrice = std.tuitionPackagePrice || 2000000;
        const pkgSessions = std.packageSessionCount || 8;
        const perSession = pkgPrice / pkgSessions;
        sessionRev += perSession;
        billableCount += 1;
      }
    });

    dailyMap[dateStr].revenue += sessionRev;
    dailyMap[dateStr].details.push(`Buổi #${sess.sessionNumber} (${billableCount} học viên tính phí)`);
  });

  const dailyList = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
  const formattedToday = todayDateStr.split('-').reverse().join('/');

  // -------------------------------------------------------------
  // 2. REVENUE FROM OTHER TEACHERS (50.000 VNĐ / COMPLETED SESSION)
  // -------------------------------------------------------------
  const FEE_PER_OTHER_TEACHER_SESSION = 50000; // 50.000 VNĐ / buổi

  const otherTeacherTodaySessions = sessions.filter((s) => s && s.date === todayDateStr && !isMsVyClass(s.classId));
  const todayTeacherFeeRevenue = otherTeacherTodaySessions.length * FEE_PER_OTHER_TEACHER_SESSION;

  const otherTeacherMonthSessions = sessions.filter((s) => s && s.date && s.date.startsWith(selectedMonth) && !isMsVyClass(s.classId));
  const monthlyTeacherFeeRevenue = otherTeacherMonthSessions.length * FEE_PER_OTHER_TEACHER_SESSION;

  // Breakdown by Teacher
  const teacherFeeBreakdownMap: Record<string, { teacherName: string; sessionCount: number; feeRevenue: number }> = {};

  otherTeacherMonthSessions.forEach((s) => {
    const cls = classes.find((c) => c && c.id === s.classId);
    const teacherName = s.teacherName || cls?.teacherName || 'Giáo viên';
    if (!teacherFeeBreakdownMap[teacherName]) {
      teacherFeeBreakdownMap[teacherName] = { teacherName, sessionCount: 0, feeRevenue: 0 };
    }
    teacherFeeBreakdownMap[teacherName].sessionCount += 1;
    teacherFeeBreakdownMap[teacherName].feeRevenue += FEE_PER_OTHER_TEACHER_SESSION;
  });

  const teacherFeeList = Object.values(teacherFeeBreakdownMap);

  // COMBINED TOTAL REVENUE
  const totalCombinedRevenue = msVyMonthlyRevenue + monthlyTeacherFeeRevenue;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
      
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-emerald-600 animate-pulse shrink-0" />
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Báo Cáo Doanh Thu Học Phí Trung Tâm (Ms. Vy & Phí Giáo Viên)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-relaxed">
            Doanh thu trực tiếp từ lớp Ms. Vy + Phí trích lập từ các buổi dạy của Giáo Viên khác (50.000đ/buổi)
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tháng:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="2026-07">Tháng 07 / 2026</option>
            <option value="2026-06">Tháng 06 / 2026</option>
            <option value="2026-05">Tháng 05 / 2026</option>
            <option value="2026-08">Tháng 08 / 2026</option>
            <option value="2025-07">Tháng 07 / 2025</option>
          </select>
        </div>
      </div>

      {/* 4-COLUMN KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: MS. VY TODAY'S REVENUE */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-100 text-amber-950 shadow-2xs border border-amber-300 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center">
              <Flame className="w-4 h-4 mr-1 text-amber-600 shrink-0" /> Doanh Thu Hôm Nay
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
              {formattedToday}
            </span>
          </div>
          <h4 className="text-2xl sm:text-3xl font-bold text-amber-950 font-mono tracking-tight">
            +{formatVND(todayRevenue)}
          </h4>
          <p className="text-xs text-amber-900 font-medium">
            {msVyTodaySessions.length > 0
              ? `${msVyTodaySessions.length} ca dạy hôm nay • ${todayStudentCount} học viên`
              : 'Hôm nay Ms. Vy chưa có ca dạy'}
          </p>
        </div>

        {/* CARD 2: MS. VY MONTHLY REVENUE */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-200 via-rose-100 to-pink-100 text-pink-950 shadow-2xs border border-pink-300 space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-900">
            Doanh Thu Lớp Ms. Vy (Tháng {selectedMonth.split('-')[1]})
          </span>
          <h4 className="text-2xl sm:text-3xl font-bold text-pink-950 font-mono tracking-tight">
            {formatVND(msVyMonthlyRevenue)}
          </h4>
          <p className="text-xs text-pink-800 font-medium">
            Chỉ tính các ca dạy thực tế của Ms. Vy
          </p>
        </div>

        {/* CARD 3: REVENUE FROM OTHER TEACHERS (50.000đ / SESSION) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-200 via-blue-100 to-indigo-100 text-sky-950 shadow-2xs border border-sky-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center">
              <UserCheck className="w-4 h-4 mr-1 text-sky-700 shrink-0" /> Doanh Thu Từ Giáo Viên
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-600 text-white">
              50k/buổi
            </span>
          </div>
          <h4 className="text-2xl sm:text-3xl font-bold text-sky-950 font-mono tracking-tight">
            +{formatVND(monthlyTeacherFeeRevenue)}
          </h4>
          <p className="text-xs text-sky-800 font-medium">
            {otherTeacherMonthSessions.length} buổi hoàn thành từ các GV khác
          </p>
        </div>

        {/* CARD 4: TOTAL COMBINED REVENUE */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-100 text-emerald-950 shadow-2xs border border-emerald-300 space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center">
            <Award className="w-4 h-4 mr-1 text-emerald-600 shrink-0" /> Tổng Doanh Thu Hợp Nhất
          </span>
          <h4 className="text-2xl sm:text-3xl font-bold text-emerald-950 font-mono tracking-tight">
            {formatVND(totalCombinedRevenue)}
          </h4>
          <p className="text-xs text-emerald-800 font-medium">
            Bao gồm Doanh thu Ms. Vy + Phí GV
          </p>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MỤC MỚI: DOANH THU TRÍCH PHÍ TỪ CÁC GIÁO VIÊN KHÁC (50k/buổi) */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              👩‍🏫 Chi Tiết Doanh Thu Trích Phí Từ Giáo Viên Khác (50.000đ / 1 Buổi Học Hoàn Thành)
            </h4>
          </div>
          <span className="text-xs font-bold text-sky-900 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-3.5 py-1 rounded-xl border border-sky-200 shrink-0">
            Tổng phí thu: +{formatVND(monthlyTeacherFeeRevenue)}
          </span>
        </div>

        {teacherFeeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teacherFeeList.map((item) => (
              <div
                key={item.teacherName}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                    👩‍🏫 {item.teacherName}
                  </span>
                  <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg">
                    {item.sessionCount} buổi dạy
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-slate-500 font-medium">Đơn giá trích phí:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">50.000đ / buổi</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Phí thu về trung tâm:</span>
                  <span className="font-bold text-sky-700 dark:text-sky-300 font-mono text-sm">
                    +{formatVND(item.feeRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-center bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-500 italic">
            Chưa có buổi dạy nào của các giáo viên khác trong tháng này.
          </div>
        )}
      </div>

      {/* MỤC CHI TIẾT: DOANH THU MỖI NGÀY TRONG THÁNG CỦA MS. VY */}
      <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-pink-600 shrink-0" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              📆 Bảng Doanh Thu Chi Tiết Mỗi Ngày Của Ms. Vy (Tháng {selectedMonth.split('-')[1]})
            </h4>
          </div>
          <span className="text-xs font-bold text-pink-900 dark:text-pink-300 bg-pink-100 dark:bg-pink-950/60 px-3.5 py-1 rounded-xl border border-pink-200 shrink-0">
            {dailyList.length} Ngày Có Ca Dạy
          </span>
        </div>

        {dailyList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dailyList.map((dayItem) => {
              const isTodayItem = dayItem.date === todayDateStr;

              return (
                <div
                  key={dayItem.date}
                  className={`p-4 rounded-xl border shadow-2xs space-y-1.5 transition ${
                    isTodayItem
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 ring-2 ring-amber-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      🗓️ Ngày {dayItem.date.split('-').reverse().join('/')}
                      {isTodayItem && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-xs font-bold bg-amber-400 text-amber-950">
                          Hôm Nay
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      {dayItem.sessionCount} Ca Dạy
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-medium">Doanh thu ngày:</span>
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400 font-mono">
                      +{formatVND(dayItem.revenue)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-normal truncate">
                    {dayItem.details.join(' • ')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-500 italic">
            Chưa có thông tin ca dạy nào của Ms. Vy được ghi nhận trong tháng này.
          </div>
        )}
      </div>

      {/* Breakdown Table For Ms. Vy's Students */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Chi Tiết Doanh Thu Từng Học Viên Lớp Ms. Vy Trong Tháng {selectedMonth.split('-')[1]}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 rounded-l-xl">Học Viên</th>
                <th className="p-3">Lớp Học</th>
                <th className="p-3">Đơn Giá 1 Buổi</th>
                <th className="p-3">Số Buổi Học Trong Tháng</th>
                <th className="p-3 rounded-r-xl text-right">Doanh Thu Phân Bổ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {studentBreakdown.map((row) => (
                <tr key={row.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {row.studentName}
                  </td>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                    {row.className}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    {formatVND(row.perSessionPrice)} / buổi
                  </td>
                  <td className="p-3 font-semibold text-pink-600 dark:text-pink-400">
                    {row.sessionsTaughtInMonth} buổi
                  </td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 text-right font-mono">
                    {formatVND(row.monthlyRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

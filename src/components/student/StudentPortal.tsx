import React, { useState } from 'react';
import { Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND, getVietQRUrl, copyToClipboard } from '../../lib/vietqr';
import { MascotWidget } from '../common/MascotWidget';
import {
  Calendar,
  CheckCircle2,
  BookOpen,
  FileText,
  Video,
  Award,
  Star,
  Download,
  Copy,
  Check,
  Flame,
  User,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentPortalProps {
  currentStudent?: Student;
  classes: Class[];
  sessions: Session[];
  homeworkTasks: HomeworkTask[];
  homeworkSubmissions: HomeworkSubmission[];
  invoices: Invoice[];
  bankConfig: BankConfig;
  onRefreshData: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  classes,
  sessions,
  homeworkTasks,
  homeworkSubmissions,
  invoices,
  bankConfig,
  onRefreshData,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!currentStudent) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-xs text-slate-500 font-bold max-w-md mx-auto my-12 shadow-sm space-y-4">
        <p>Hệ thống đang sẵn sàng. Vui lòng đăng nhập tài khoản hoặc dùng đường link cá nhân.</p>
      </div>
    );
  }

  // Student's classes
  const studentClasses = classes.filter((c) => currentStudent.classIds.includes(c.id));
  const primaryClass = studentClasses[0] || classes[0];

  // Student's sessions
  const studentSessions = sessions.filter((s) => s.classId === primaryClass?.id);

  // Progress Bar Calculation
  const totalCount = Math.max(1, studentSessions.length);
  const completedCount = currentStudent.completedHomeworkTaskIds ? currentStudent.completedHomeworkTaskIds.length : 0;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  // Toggle Homework Item Checkbox
  const handleToggleHomeworkItem = (sessionId: string, homeworkItemId: string, homeworkTitle: string) => {
    const isNowChecked = StorageEngine.toggleHomeworkTaskItemCheck(
      currentStudent.id,
      sessionId,
      homeworkItemId,
      homeworkTitle
    );

    if (isNowChecked) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    onRefreshData();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. GENERAL INFO CARD (Logo, Teacher, Course, Schedule, Remaining Sessions) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          <img
            src={currentStudent.avatar || '/logo.jpg'}
            alt={currentStudent.name}
            className="w-20 h-20 rounded-3xl object-cover border-4 border-purple-100 shadow-md shrink-0"
          />

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {currentStudent.name}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-100 text-pink-800 border border-pink-200 inline-block">
                {currentStudent.honorNickname || '⭐ Chiến Thần Chăm Học'}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium space-y-0.5">
              <p><strong>Lớp học:</strong> {primaryClass?.className || 'Lớp Ms. Vy English'}</p>
              <p><strong>Giáo viên phụ trách:</strong> {primaryClass?.teacherName || 'Ms. Vy'}</p>
              <p><strong>Giáo trình:</strong> {primaryClass?.courseName || 'Tiếng Anh Giao Tiếp'}</p>
              <p><strong>Lịch học:</strong> {primaryClass?.schedule || 'Thứ 2 - Thứ 4 - Thứ 6'}</p>
            </div>
          </div>

          {/* Remaining Sessions Highlight Pill */}
          <div className="bg-gradient-to-tr from-purple-600 to-pink-500 text-white p-4 rounded-3xl shadow-lg text-center min-w-[150px] shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-90">
              Số Buổi Học Phí Còn Lại
            </span>
            <div className="text-3xl font-black mt-0.5">
              {currentStudent.remainingSessions} <span className="text-sm font-bold">Buổi</span>
            </div>
            <span className="text-[10px] font-medium block mt-1 opacity-80">
              Gói đã đóng: {currentStudent.totalPaidSessions || 8} buổi
            </span>
          </div>
        </div>
      </div>

      {/* Mascot Widget */}
      <MascotWidget studentName={currentStudent.name} starsCount={currentStudent.stars} />

      {/* 2. OVERALL PROGRESS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-pink-500 animate-bounce" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Thanh Tổng Tiến Độ Hoàn Thành Bài Tập Về Nhà
            </h3>
          </div>
          <span className="text-sm font-black text-purple-700">{progressPercent}% Hoàn Thành</span>
        </div>

        <div className="w-full bg-purple-100 h-4 rounded-full overflow-hidden p-0.5 border border-purple-200">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Đã tích chọn {completedCount} bài tập về nhà. Tích cực làm bài để vinh danh trên Bảng Thành Tích Thi Đua!
        </p>
      </div>

      {/* 3. SESSION LIST (PER-SESSION INFORMATION) */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-600" /> Bảng Theo Dõi Học Tập Theo Buổi
        </h3>

        {studentSessions.length > 0 ? (
          studentSessions.map((session) => {
            const myFeedback = session.studentFeedbacks ? session.studentFeedbacks[currentStudent.id] : null;
            const itemsList = session.homeworkItems || [];

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800/60 p-6 shadow-sm space-y-4 hover:border-purple-300 transition"
              >
                {/* Session Header: Number & Date */}
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      #{session.sessionNumber}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        Buổi Học Số {session.sessionNumber}
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        Ngày học: {session.date} • GV: {session.teacherName || 'Ms. Vy'}
                      </span>
                    </div>
                  </div>

                  {session.recordLink && (
                    <a
                      href={session.recordLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-100 text-indigo-800 text-xs font-bold hover:bg-indigo-200 transition flex items-center"
                    >
                      <Video className="w-3.5 h-3.5 mr-1" /> Xem Record Video
                    </a>
                  )}
                </div>

                {/* Lesson Content */}
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                    📘 Nội Dung Học Trong Buổi:
                  </span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                    {session.lessonContent}
                  </p>
                </div>

                {/* INDIVIDUAL TEACHER COMMENT FOR THIS STUDENT */}
                {myFeedback && (myFeedback.strengths || myFeedback.improvements) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 space-y-2 text-xs">
                    <span className="font-black text-pink-900 uppercase block">
                      💬 Nhận Xét Của Giáo Viên Dành Cho {currentStudent.name}:
                    </span>

                    {myFeedback.strengths && (
                      <p className="text-emerald-800 font-medium">
                        💪 <strong>Điểm mạnh:</strong> {myFeedback.strengths}
                      </p>
                    )}

                    {myFeedback.improvements && (
                      <p className="text-amber-800 font-medium">
                        🎯 <strong>Điểm cần cải thiện:</strong> {myFeedback.improvements}
                      </p>
                    )}
                  </div>
                )}

                {/* PER-ITEM HOMEWORK TASKS & CHECKBOX */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                    📝 Bài Tập Về Nhà Cần Làm ({itemsList.length} bài):
                  </span>

                  {itemsList.length > 0 ? (
                    itemsList.map((hwItem) => {
                      const isItemChecked = currentStudent.completedHomeworkTaskIds?.includes(hwItem.id) || false;
                      const subRecord = homeworkSubmissions.find((s) => s.studentId === currentStudent.id && s.homeworkTaskId === hwItem.id);

                      return (
                        <div
                          key={hwItem.id}
                          className={`p-4 rounded-2xl border transition space-y-2 ${
                            isItemChecked
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-slate-50 border-purple-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                {hwItem.title}
                              </h5>
                              {hwItem.content && (
                                <p className="text-xs text-slate-600 font-medium">{hwItem.content}</p>
                              )}
                              {hwItem.attachmentUrl && (
                                <a
                                  href={hwItem.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-purple-700 font-bold underline inline-block"
                                >
                                  🔗 Xem File / Ảnh bài tập đính kèm
                                </a>
                              )}
                            </div>

                            {/* PER-ITEM CHECKBOX */}
                            <button
                              onClick={() => handleToggleHomeworkItem(session.id, hwItem.id, hwItem.title)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center shrink-0 ${
                                isItemChecked
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              {isItemChecked ? '✓ Đã Làm Bài' : 'Check Đã Làm'}
                            </button>
                          </div>

                          {/* TEACHER FEEDBACK STATUS */}
                          {subRecord && (
                            <div className="pt-2 border-t border-purple-100/60 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Trạng thái chấm bài của GV:</span>
                              {subRecord.isTeacherFeedbackChecked ? (
                                <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                  ✓ Đã Feedback ({subRecord.ratingStars || 3} ⭐): {subRecord.feedbackText}
                                </span>
                              ) : (
                                <span className="font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                  ⏳ Đã nộp bài - Đang chờ Giáo viên / Admin feedback
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">Không có bài tập về nhà cho buổi này.</p>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-xs text-slate-500 italic">
            Chưa có thông tin buổi học nào được cập nhật.
          </div>
        )}
      </div>

      {/* 4. ALL SESSION MATERIALS HUB */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
          <FolderOpen className="w-5 h-5 mr-2 text-purple-600" /> Kho Tài Liệu & Giáo Trình Buổi Học
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {primaryClass?.resourceLinks && primaryClass.resourceLinks.length > 0 ? (
            primaryClass.resourceLinks.map((res) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:border-purple-300 transition flex items-center space-x-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black group-hover:scale-110 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                    {res.title}
                  </h4>
                  <span className="text-[10px] text-purple-600 font-bold underline">
                    Bấm để tải về / xem tài liệu →
                  </span>
                </div>
              </a>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic col-span-2">Chưa có tài liệu đính kèm.</p>
          )}
        </div>
      </div>

    </div>
  );
};

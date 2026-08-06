import React, { useState } from 'react';
import { Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND, getVietQRUrl, copyToClipboard } from '../../lib/vietqr';
import { MascotWidget } from '../common/MascotWidget';
import { StudentAiChatbotModal } from './StudentAiChatbotModal';
import { ClassRulesModal } from '../common/ClassRulesModal';
import { KAKAOTALK_AVATARS_LIST, KAKAOTALK_SVG_AVATARS, resolveAvatarUrl } from '../../lib/kakaotalkAvatars';
import { formatSessionDate } from '../../lib/dateUtils';
import { getStudentHonorBadge } from '../../lib/rankingUtils';
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
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  X,
  Smile,
  AlertCircle,
  History,
  Search,
  BarChart2,
  Trophy,
  Zap,
  Clock,
  MessageSquare,
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
  const [isExtraMaterialsOpen, setIsExtraMaterialsOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isOlderSessionsOpen, setIsOlderSessionsOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isClassRulesOpen, setIsClassRulesOpen] = useState(false);
  const [viewingFeedbackSub, setViewingFeedbackSub] = useState<HomeworkSubmission | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [copiedResId, setCopiedResId] = useState<string | null>(null);

  const toggleExpandComment = (key: string) => {
    setExpandedComments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderExpandableText = (key: string, label: string, text: string = '', icon: string, textColor: string) => {
    const safeText = typeof text === 'string' ? text : String(text || '');
    if (!safeText.trim()) return null;

    const maxLength = 110;
    const isLong = safeText.length > maxLength || safeText.includes('\n');
    const isExpanded = !!expandedComments[key];
    const displayText = isLong && !isExpanded ? safeText.slice(0, maxLength) + '...' : safeText;

    return (
      <div className="space-y-1.5">
        <p className={`${textColor} font-semibold whitespace-pre-wrap leading-relaxed`}>
          {icon} <strong>{label}:</strong> {displayText}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => toggleExpandComment(key)}
            className="text-[11px] font-black text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center cursor-pointer pt-0.5"
          >
            {isExpanded ? '▲ Thu gọn' : '▼ Đọc thêm'}
          </button>
        )}
      </div>
    );
  };

  if (!currentStudent) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-pink-100 text-xs text-slate-500 font-bold max-w-md mx-auto my-12 shadow-sm space-y-4">
        <p>Hệ thống đang sẵn sàng. Vui lòng đăng nhập tài khoản hoặc dùng đường link cá nhân.</p>
      </div>
    );
  }

  // Student's classes
  const studentClasses = (classes || []).filter((c) => c && currentStudent.classIds && currentStudent.classIds.includes(c.id));
  const primaryClass = studentClasses[0] || (classes || [])[0];

  // Student's sessions sorted chronologically descending (newest date first, fallback to sessionNumber)
  const studentSessions = (sessions || [])
    .filter((s) => s && primaryClass?.id && s.classId === primaryClass.id)
    .sort((a, b) => {
      if (!a || !b) return 0;
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA && dateB && dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const numA = Number(a.sessionNumber) || 0;
      const numB = Number(b.sessionNumber) || 0;
      return numB - numA;
    });

  // Split sessions: 2 Most Recent Sessions vs Older Sessions
  const recent2Sessions = studentSessions.slice(0, 2);
  const olderSessions = studentSessions.slice(2);

  // MOST RECENT SESSION HOMEWORK PROGRESS SUMMARY CALCULATION
  const latestSession = studentSessions[0];
  const latestHomeworkItems = latestSession?.homeworkItems || [];
  const latestHomeworkCount = latestHomeworkItems.length;
  const latestCompletedCount = latestHomeworkItems.filter((item) =>
    currentStudent.completedHomeworkTaskIds?.includes(item.id)
  ).length;

  const latestProgressPercent = latestHomeworkCount > 0
    ? Math.min(100, Math.round((latestCompletedCount / latestHomeworkCount) * 100))
    : 100;

  // Automatically aggregate ALL materials from all sessions of this student's classes in real time
  const allSessionMaterials = studentSessions.flatMap((s) => {
    const list: { id: string; title: string; url: string; sessionNum: number; date: string }[] = [];

    // 1. General session materials
    if (s.sessionMaterials) {
      s.sessionMaterials.forEach((m) => {
        if (m && m.url) {
          list.push({
            id: m.id || `mat_${s.id}_${Math.random()}`,
            title: m.title || 'Tài liệu buổi học',
            url: m.url,
            sessionNum: s.sessionNumber,
            date: s.date,
          });
        }
      });
    }

    // 2. Per-student material link assigned specifically to this student in this session
    if (s.studentFeedbacks?.[currentStudent.id]?.materialUrl) {
      const fb = s.studentFeedbacks[currentStudent.id];
      list.push({
        id: `std_mat_${s.id}_${currentStudent.id}`,
        title: fb.materialTitle ? `Tài liệu riêng: ${fb.materialTitle}` : 'Tài liệu đính kèm riêng cho em',
        url: fb.materialUrl,
        sessionNum: s.sessionNumber,
        date: s.date,
      });
    }

    // 3. Record Video link
    if (s.recordLink) {
      list.push({
        id: `record_${s.id}`,
        title: '📹 Video Record buổi học',
        url: s.recordLink,
        sessionNum: s.sessionNumber,
        date: s.date,
      });
    }

    // 5. Homework attachments
    if (s.homeworkItems) {
      s.homeworkItems.forEach((hw) => {
        if (hw && hw.attachmentUrl) {
          list.push({
            id: `hw_att_${hw.id}`,
            title: `📝 Bài tập: ${hw.title}`,
            url: hw.attachmentUrl,
            sessionNum: s.sessionNumber,
            date: s.date,
          });
        }
      });
    }

    return list;
  });

  const filteredSessionMaterials = allSessionMaterials.filter((mat) =>
    (mat.title || '').toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `buoi ${mat.sessionNum}`.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `${mat.sessionNum}`.includes(materialSearchQuery)
  );

  const studentAvatarSrc = resolveAvatarUrl(currentStudent.avatar);

  // HANDLER: STUDENT TICKS/UNTICKS HOMEWORK COMPLETION
  const handleToggleTaskCheck = (session: Session, hwItemId: string, hwTitle: string) => {
    const isNowChecked = StorageEngine.toggleHomeworkTaskItemCheck(currentStudent.id, session.id, hwItemId, hwTitle);
    console.log("UPDATE SUCCESS", { studentId: currentStudent.id, hwItemId, isNowChecked });
    if (isNowChecked) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
    onRefreshData();
  };

  // Real-time synchronization for viewingFeedbackSub modal state
  React.useEffect(() => {
    if (viewingFeedbackSub) {
      const updatedSub = homeworkSubmissions.find((s) => s.id === viewingFeedbackSub.id);
      if (updatedSub) {
        setViewingFeedbackSub(updatedSub);
      }
    }
  }, [homeworkSubmissions]);

  const handleSelectKakaoAvatar = (avatarSvgStr: string) => {
    StorageEngine.updateStudentAvatar(currentStudent.id, avatarSvgStr);
    setIsAvatarModalOpen(false);
    onRefreshData();
  };

  const handleFileUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        if (base64Str) {
          StorageEngine.updateStudentAvatar(currentStudent.id, base64Str);
          setIsAvatarModalOpen(false);
          onRefreshData();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // HELPER: RENDER SINGLE SESSION CARD WITH MOTIVATING MINI PROGRESS BAR STRIP
  const renderSessionCard = (session: Session, isRecent: boolean = true) => {
    const itemsList = session.homeworkItems || [];
    const completedItems = itemsList.filter((item) =>
      currentStudent.completedHomeworkTaskIds?.includes(item.id)
    ).length;
    const totalItems = itemsList.length;
    const sessionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

    // PER-SESSION PASTEL COLOR PALETTE (EACH SESSION GETS A DISTINCT, RICHER PASTEL BG)
    const sessionPastelBgPalette = [
      'bg-rose-100/85 dark:bg-rose-950/40 border-rose-200/90 hover:border-rose-300 shadow-2xs',
      'bg-sky-100/85 dark:bg-sky-950/40 border-sky-200/90 hover:border-sky-300 shadow-2xs',
      'bg-amber-100/85 dark:bg-amber-950/40 border-amber-200/90 hover:border-amber-300 shadow-2xs',
      'bg-emerald-100/85 dark:bg-emerald-950/40 border-emerald-200/90 hover:border-emerald-300 shadow-2xs',
      'bg-indigo-100/85 dark:bg-indigo-950/40 border-indigo-200/90 hover:border-indigo-300 shadow-2xs',
      'bg-purple-100/85 dark:bg-purple-950/40 border-purple-200/90 hover:border-purple-300 shadow-2xs',
      'bg-teal-100/85 dark:bg-teal-950/40 border-teal-200/90 hover:border-teal-300 shadow-2xs',
    ];
    const cardBgStyle = sessionPastelBgPalette[(session.sessionNumber - 1) % sessionPastelBgPalette.length];

    if (session.isChargedAbsenceSession) {
      return (
        <div
          key={session.id}
          className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium text-amber-950 dark:text-amber-300"
        >
          <div className="flex items-center space-x-3">
            <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200/60">
              #{session.sessionNumber}
            </span>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Buổi Học #{session.sessionNumber} • Ngày {formatSessionDate(session.date)}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 uppercase">
                  Nghỉ tính phí
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-normal mt-0.5">
                Ghi chú: Buổi nghỉ tính phí (nghỉ quá số lần quy định hoặc không tham gia ca học).
              </p>
            </div>
          </div>

          <span className="text-[11px] font-medium bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-1 rounded-lg border border-amber-200/60 shrink-0 text-center">
            -1 Buổi trong gói học
          </span>
        </div>
      );
    }

    const currentTeacherName = session.teacherName || primaryClass?.teacherName || 'Giáo viên';

    return (
      <div
        key={session.id}
        className={`rounded-2xl border p-5 shadow-2xs space-y-4 hover:shadow-xs transition duration-150 ${cardBgStyle}`}
      >
        {/* Session Header: Number, Date, Record Video */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-200/60 dark:border-slate-700">
              #{session.sessionNumber}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  Buổi Học Số {session.sessionNumber}
                </h4>
                {isRecent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase animate-pulse">
                    Mới Nhất
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-black text-pink-700 dark:text-pink-300">
                🗓️ Ngày học: {formatSessionDate(session.date)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {session.quizletUrl && (
              <a
                href={session.quizletUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs hover:from-blue-600 hover:to-indigo-700 transition flex items-center shadow-md border border-indigo-200"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1" /> 🎴 Học Từ Vựng Quizlet ↗
              </a>
            )}

            {session.recordLink && (
              <a
                href={session.recordLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-sky-100 text-sky-950 border border-sky-300 text-xs font-bold hover:bg-sky-200 transition flex items-center shadow-xs"
              >
                <Video className="w-3.5 h-3.5 mr-1 text-sky-600" /> Xem Record Video
              </a>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Nội Dung Bài Học:
          </span>
          <p className="text-sm font-normal text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-xl border border-transparent whitespace-pre-wrap leading-relaxed">
            {session.lessonContent}
          </p>
        </div>

        {/* Teacher Comment for THIS specific student in THIS session */}
        {session.studentFeedbacks?.[currentStudent.id] && (
          <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-transparent text-sm space-y-4 shadow-2xs">
            {/* Standard Card Header inside the card with bottom border separator */}
            <div className="flex items-center space-x-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
              <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-medium text-sm shrink-0">
                💬
              </span>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Nhận Xét Của Giáo Viên
              </h4>
            </div>

            {/* 2-Column Parallel Grid Layout for Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.studentFeedbacks[currentStudent.id]?.strengths ? (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-transparent shadow-2xs">
                  {renderExpandableText(
                    `fb_str_${session.id}_${currentStudent.id}`,
                    'Điểm mạnh',
                    session.studentFeedbacks[currentStudent.id]?.strengths || '',
                    '💪',
                    'text-emerald-800 dark:text-emerald-300'
                  )}
                </div>
              ) : <div className="hidden md:block"></div>}

              {session.studentFeedbacks[currentStudent.id]?.improvements ? (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-transparent shadow-2xs">
                  {renderExpandableText(
                    `fb_imp_${session.id}_${currentStudent.id}`,
                    'Cần cải thiện',
                    session.studentFeedbacks[currentStudent.id]?.improvements || '',
                    '🎯',
                    'text-amber-800 dark:text-amber-300'
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* REDESIGNED HOMEWORK ITEMS LIST */}
        {session.hasNoHomework ? (
          <div className="p-4 rounded-2xl bg-pink-50/80 dark:bg-slate-800/80 border border-pink-200 text-xs font-black text-pink-950 dark:text-pink-200 text-center flex items-center justify-center space-x-2 shadow-2xs">
            <span>✨ Buổi học này không có bài tập về nhà</span>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-pink-900 dark:text-pink-300 uppercase tracking-wider block">
                📝 Bài tập về nhà cần làm ({itemsList.length} bài):
              </span>

              {itemsList.length > 0 ? (
                itemsList.map((hwItem, hwIdx) => {
                  const isChecked = currentStudent.completedHomeworkTaskIds?.includes(hwItem.id);
                  const subObj = homeworkSubmissions.find(
                    (sub) => sub.studentId === currentStudent.id && sub.homeworkTaskId === hwItem.id
                  );
                  const isFeedbackDone = subObj?.feedbackStatus === 'COMPLETED' || subObj?.isTeacherFeedbackChecked;

                  // SOFT PASTEL ZEBRA STRIPING STYLING FOR EASY READING
                  const zebraBgClass = isChecked
                    ? 'pastel-emerald-card text-emerald-950 dark:text-emerald-200'
                    : hwIdx % 2 === 0
                    ? 'pastel-pink-card text-rose-950 dark:text-rose-200'
                    : 'pastel-blue-card text-sky-950 dark:text-sky-200';

                  return (
                    <div
                      key={hwItem.id}
                      className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${zebraBgClass}`}
                    >
                      {/* Left: Homework details */}
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-white/80 dark:bg-slate-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-semibold shrink-0 mt-0.5 shadow-2xs">
                          📚
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                            {hwItem.title}
                          </h5>
                          {hwItem.content && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal">{hwItem.content}</p>
                          )}
                          {hwItem.deadline && (
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">
                              ⏰ Hạn nộp: {hwItem.deadline}
                            </span>
                          )}
                          {hwItem.attachmentUrl && (
                            <div className="pt-1">
                              <a
                                href={hwItem.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-xs font-medium hover:underline transition inline-flex items-center shadow-2xs"
                              >
                                🔗 Xem Link Bài Tập Đính Kèm
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: 2 Independent States (Completion & Feedback) */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-pink-100">
                        
                        {/* STATE 1: COMPLETION STATUS BUTTON */}
                        <button
                          onClick={() => handleToggleTaskCheck(session, hwItem.id, hwItem.title)}
                          className={`h-9 px-3.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 flex items-center space-x-1 cursor-pointer border border-transparent ${
                            isChecked
                              ? 'bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200'
                              : 'bg-rose-100/90 text-rose-900 hover:bg-rose-200'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <span>🟢 ĐÃ HOÀN THÀNH</span>
                              <CheckCircle2 className="w-4 h-4 ml-1 text-emerald-700" />
                            </>
                          ) : (
                            <>
                              <span>🔴 CHƯA HOÀN THÀNH</span>
                            </>
                          )}
                        </button>

                        {/* STATE 2: FEEDBACK STATUS BADGE */}
                        {isChecked && (
                          isFeedbackDone ? (
                            <span className="h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium bg-sky-100/90 text-sky-900 flex items-center border border-transparent">
                              🔵 ĐÃ FEEDBACK ✓
                            </span>
                          ) : (
                            <span className="h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium bg-amber-100/90 text-amber-900 flex items-center border border-transparent">
                              🟡 CHỜ FEEDBACK
                            </span>
                          )
                        )}

                        {/* VIEW FEEDBACK BUTTON */}
                        {isFeedbackDone && subObj && (
                          <button
                            onClick={() => setViewingFeedbackSub(subObj)}
                            className="h-9 px-3.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-medium text-xs sm:text-sm transition-all duration-150 border border-transparent shadow-2xs flex items-center cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 mr-1.5 text-sky-700" />
                            XEM FEEDBACK →
                          </button>
                        )}

                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">Không có bài tập đính kèm cho buổi này.</p>
              )}
            </div>

            {/* MOTIVATING MINI PROGRESS BAR STRIP FOR THIS SESSION */}
            <div className="pt-3 border-t border-pink-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <span className="text-pink-950 dark:text-pink-200 font-black flex items-center shrink-0">
                  <BarChart2 className="w-4 h-4 mr-1 text-pink-500 animate-pulse" /> Tiến độ bài tập buổi #{session.sessionNumber}:
                </span>

                <div className="flex-1 bg-pink-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-pink-200 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                      sessionPercent === 100
                        ? 'bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400'
                        : sessionPercent > 0
                        ? 'bg-gradient-to-r from-amber-300 via-pink-300 to-rose-300'
                        : 'bg-rose-300'
                    }`}
                    style={{ width: `${sessionPercent}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0">
                <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-xs flex items-center space-x-1.5 ${
                  sessionPercent === 100
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                    : sessionPercent > 0
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : 'bg-rose-100 text-rose-950 border border-rose-300'
                }`}>
                  <span>Đã làm <strong>{completedItems} / {totalItems}</strong> bài ({sessionPercent}%)</span>
                  {sessionPercent === 100 ? (
                    <span className="text-emerald-700 font-black">🎉 Hoàn Thành 100%!</span>
                  ) : sessionPercent > 0 ? (
                    <span className="text-amber-700 font-black">💪 Cố Lên Em Nhé!</span>
                  ) : (
                    <span className="text-rose-700 font-black">⚡ Tick Bài Ngay!</span>
                  )}
                </span>
              </div>
            </div>
          </>
        )}

      </div>
    );
  };

  // Dynamic Single Source of Truth Honor Badge Computation from Leaderboard Rankings
  const freshStudents = StorageEngine.getStudents() || [];
  const currentHonorBadge = currentStudent ? getStudentHonorBadge(currentStudent.id, freshStudents, sessions, homeworkSubmissions) : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. STUDENT PROFILE HEADER CARD WITH RICH PASTEL HIGHLIGHT CONTAINER */}
      <div className="bg-gradient-to-r from-pink-100/95 via-rose-100/90 to-amber-100/95 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-2 border-rose-200/90 dark:border-slate-700 p-6 sm:p-8 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        
        {/* Left: Avatar + Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 w-full lg:w-auto">
          
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <img
              src={studentAvatarSrc}
              alt={currentStudent.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xs transition group-hover:scale-102"
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md hover:bg-rose-500 dark:hover:bg-rose-500 dark:hover:text-white transition flex items-center justify-center cursor-pointer border border-transparent"
              title="Đổi ảnh đại diện / Chọn avatar KakaoTalk Friends"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Student Details */}
          <div className="space-y-3 flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="app-page-title text-2xl sm:text-3xl">
                {currentStudent.name}
              </h2>
              {currentHonorBadge ? (
                <span className={`px-3 py-1 rounded-lg text-xs font-medium inline-block ${currentHonorBadge.badgeColor}`}>
                  {currentHonorBadge.title}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-500 inline-block">
                  Chưa có danh hiệu Top
                </span>
              )}
              <button
                onClick={() => setIsClassRulesOpen(true)}
                className="px-3.5 py-1 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 transition flex items-center cursor-pointer border border-transparent"
                title="Bấm để xem Nội quy lớp học đầy đủ"
              >
                📋 Nội quy lớp học
              </button>
            </div>

            {/* 2x2 Grid Info Box with Rich Soft Pastel Highlight Background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm text-slate-900 dark:text-slate-100 font-normal bg-gradient-to-r from-sky-100/90 via-blue-50/80 to-indigo-100/90 dark:from-slate-800 dark:to-slate-800 p-5 sm:p-6 rounded-2xl border border-sky-200/80 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center space-x-2">
                <span className="text-sky-800 dark:text-sky-300 font-semibold shrink-0">🎓 Lớp học:</span>
                <span className="font-bold text-slate-900 dark:text-white break-words">
                  {primaryClass?.className || 'Lớp Ms. Vy English'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sky-800 dark:text-sky-300 font-semibold shrink-0">👩‍🏫 Giáo viên:</span>
                <span className="font-bold text-slate-900 dark:text-white break-words">
                  {primaryClass?.teacherName || 'Ms. Vy'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sky-800 dark:text-sky-300 font-semibold shrink-0">📚 Giáo trình:</span>
                <span className="font-bold text-slate-900 dark:text-white break-words">
                  {primaryClass?.courseName || 'Tiếng Anh Giao Tiếp'}
                </span>
              </div>

              <div className="flex items-start space-x-2 col-span-1 sm:col-span-2">
                <span className="text-sky-800 dark:text-sky-300 font-semibold shrink-0">⏰ Lịch học:</span>
                <span className="font-bold text-slate-900 dark:text-white break-words leading-relaxed">
                  {primaryClass?.schedule || 'Thứ 2 - Thứ 4 - Thứ 6'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT: BALANCED MINI STATISTIC CARD (SỐ BUỔI CÒN LẠI - CLICKABLE MODAL TRIGGER) */}
        <div
          onClick={() => setIsPaymentHistoryOpen(true)}
          className="bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-white px-7 py-6 rounded-2xl border border-rose-200/80 dark:border-slate-700 shrink-0 flex flex-col items-center justify-center text-center gap-2 w-full lg:w-auto cursor-pointer hover:shadow-md transition-all duration-180 group relative shadow-2xs"
          title="Bấm vào để xem lịch sử đóng học phí chi tiết"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            SỐ BUỔI CÒN LẠI <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition" />
          </span>

          <div className="flex items-baseline justify-center gap-1.5 py-1">
            <span className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white font-mono leading-none tracking-tight">
              {currentStudent.remainingSessions}
            </span>
            <span className="text-base sm:text-lg font-medium text-slate-500 dark:text-slate-400 leading-none">
              Buổi
            </span>
          </div>

          <span className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline transition">
            🔍 Bấm xem chi tiết đóng học phí →
          </span>
        </div>
      </div>

      {/* 2. MOTIVATIONAL MASCOT QUOTE WIDGET */}
      <MascotWidget
        studentName={currentStudent.name}
        starsCount={currentStudent.stars}
      />

      {/* 2.5. EXCUSED ABSENCE STATISTICS WIDGET SECTION */}
      {(() => {
        const now = new Date();
        const currYear = now.getFullYear();
        const currMonthNum = now.getMonth() + 1;
        const currentMonthStr = `${currYear}-${currMonthNum < 10 ? '0' : ''}${currMonthNum}`;
        const currentMonthLabel = `${currMonthNum < 10 ? '0' : ''}${currMonthNum}/${currYear}`;

        // Per Requirements: ONLY Excused, non-chargeable absences belong to Absence Statistics
        const excusedAbsences = (currentStudent.absences || []).map((abs) => ({
          id: abs.id,
          date: abs.date,
          reason: abs.reason || 'Nghỉ có phép / Bảo lưu',
          isMakeupCompleted: abs.isMakeupCompleted,
          badgeColor: abs.isMakeupCompleted
            ? 'bg-emerald-50 text-emerald-700 border-transparent'
            : 'bg-sky-50 text-sky-700 border-transparent',
          type: abs.isMakeupCompleted ? 'Đã học bù' : 'Nghỉ có phép',
        }));

        const monthExcusedAbsences = excusedAbsences.filter((a) => a.date && a.date.startsWith(currentMonthStr));

        return (
          <div className="app-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-lg border border-transparent shrink-0">
                  📊
                </div>
                <div>
                  <h3 className="app-card-title text-base sm:text-lg uppercase tracking-wider">
                    Thống Kê Buổi Nghỉ Học Có Phép Tháng {currentMonthLabel}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    Chỉ thống kê các buổi nghỉ có phép (bảo lưu/học bù). Các buổi nghỉ tính phí không nằm trong thống kê này.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold text-xs border border-transparent">
                  Số buổi nghỉ tháng {currentMonthLabel}: <strong>{monthExcusedAbsences.length} buổi</strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-transparent">
                  Tổng số buổi nghỉ có phép: {excusedAbsences.length} buổi
                </span>
              </div>
            </div>

            {/* Absence Details List */}
            {excusedAbsences.length > 0 ? (
              <div className="space-y-2.5">
                <span className="text-xs font-black text-amber-950 dark:text-amber-300 uppercase tracking-wider block">
                  🗓️ Danh Sách Các Buổi Nghỉ Có Phép Chi Tiết:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {excusedAbsences.map((abs) => (
                    <div
                      key={abs.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-0.5 truncate">
                        <span className="font-black text-slate-900 dark:text-white block">
                          🗓️ Ngày nghỉ: {formatSessionDate(abs.date)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium truncate block">
                          Lý do: {abs.reason}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-black shrink-0 border ${abs.badgeColor}`}>
                        {abs.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 text-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                <span>🎉 Học viên đi học rất chuyên cần! Chưa có buổi nghỉ có phép nào.</span>
                <span className="px-3 py-1 rounded-xl bg-emerald-200 text-emerald-950 font-black text-[11px]">Chuyên Cần 100% ⭐</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. MOST RECENT SESSION HOMEWORK PROGRESS SUMMARY BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-pink-500 animate-bounce" />
            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
              📚 TIẾN ĐỘ BÀI TẬP BUỔI MỚI NHẤT {latestSession ? `(BUỔI #${latestSession.sessionNumber})` : ''}
            </h3>
          </div>

          <span className="text-xs font-extrabold text-pink-900 bg-pink-100 px-3.5 py-1 rounded-full border border-pink-200 shadow-2xs">
            <strong>{latestCompletedCount} / {latestHomeworkCount}</strong> bài đã hoàn thành ({latestProgressPercent}%)
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-pink-100 dark:bg-slate-800 h-5 rounded-2xl overflow-hidden p-1 border border-pink-200 shadow-inner">
          <div
            className="h-full rounded-xl bg-gradient-to-r from-pink-400 via-rose-400 to-emerald-400 transition-all duration-1000 shadow-xs flex items-center justify-end pr-2"
            style={{ width: `${Math.max(5, latestProgressPercent)}%` }}
          >
            <span className="text-[10px] font-black text-white drop-shadow-xs font-mono">
              {latestProgressPercent}%
            </span>
          </div>
        </div>

        {latestProgressPercent === 100 && latestHomeworkCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-950 text-xs font-black text-center border border-emerald-300 animate-pulse">
            🎉 Tuyệt vời! Bạn đã hoàn thành tất cả bài tập của buổi mới nhất!
          </div>
        )}
      </div>

      {/* 4. DESIGNED 2-BOX MATERIALS SECTION: TÀI LIỆU TỔNG & TÀI LIỆU HỌC TẬP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Ô 1: TÀI LIỆU TỔNG (DẪN TỚI GOOGLE DRIVE) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-100 text-sky-950 shadow-sm border-2 border-sky-200 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/90 text-sky-600 flex items-center justify-center text-xl shadow-xs border border-sky-200">
                📁
              </div>
              <div>
                <h3 className="font-black text-base text-sky-950 dark:text-white uppercase tracking-wider">
                  Tài liệu tổng
                </h3>
                <span className="text-[11px] font-bold text-sky-800">
                  Google Drive Thư Mục Chính
                </span>
              </div>
            </div>
            <p className="text-xs text-sky-900 font-medium leading-relaxed">
              Tổng hợp toàn bộ giáo trình gốc, file âm thanh MP3, slide giảng dạy & kho tài liệu tham khảo chính thức của khóa học.
            </p>
          </div>

          {/* Direct Action Link Buttons */}
          <div className="pt-2 flex flex-col space-y-2">
            {primaryClass?.resourceLinks && primaryClass.resourceLinks.filter((res) => !res.isHidden).length > 0 ? (
              primaryClass.resourceLinks
                .filter((res) => !res.isHidden)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((res) => {
                  const isCopied = copiedResId === res.id;

                  return (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-950 font-extrabold text-xs transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-sky-300 group"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <span className="text-xl shrink-0">{res.icon || '📁'}</span>
                        <div className="truncate">
                          <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-800 truncate">
                            {res.title}
                          </h5>
                          {res.description && (
                            <p className="text-[11px] text-slate-500 font-medium truncate">{res.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 justify-end pt-1 sm:pt-0">
                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => {
                            copyToClipboard(res.url);
                            setCopiedResId(res.id);
                            setTimeout(() => setCopiedResId(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center cursor-pointer"
                          title="Sao chép đường dẫn link này"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                          {isCopied ? 'Đã Copy' : 'Copy'}
                        </button>

                        {/* Open Link Button */}
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px] transition shadow-xs flex items-center"
                        >
                          Mở ↗
                        </a>
                      </div>
                    </div>
                  );
                })
            ) : (
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-white hover:bg-sky-50 text-sky-950 font-extrabold text-xs transition shadow-xs flex items-center justify-between border border-sky-300 group"
              >
                <span className="flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2 text-sky-600 shrink-0" />
                  Mở Thư Mục Google Drive Tài Liệu Tổng
                </span>
                <span className="text-[10px] font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full shrink-0 group-hover:bg-sky-200 transition">
                  Mở GG Drive ↗
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Ô 2: TÀI LIỆU HỌC TẬP (CÓ THỂ MỞ RA ĐÓNG VÀO ĐƯỢC) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm border-2 border-pink-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center text-xl shadow-xs border border-pink-200">
                  📚
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
                    Tài liệu học tập
                  </h3>
                  <span className="text-[11px] font-bold text-pink-600">
                    {allSessionMaterials.length} File bài học theo từng buổi
                  </span>
                </div>
              </div>

              {/* TOGGLE OPEN / CLOSE BUTTON */}
              <button
                onClick={() => setIsExtraMaterialsOpen(!isExtraMaterialsOpen)}
                className="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition border border-pink-300 flex items-center shrink-0 shadow-2xs"
              >
                {isExtraMaterialsOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1 text-pink-600" /> Đóng Lại
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1 text-pink-600" /> Mở Xem
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Các file bài học đính kèm, slide thuyết trình & đề luyện tập được giáo viên cập nhật chi tiết theo từng ca học.
            </p>

            {/* EXPANDABLE LIST WITH SEARCH */}
            {isExtraMaterialsOpen && (
              <div className="space-y-3 pt-2 animate-fadeIn border-t border-pink-100">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên file hoặc số buổi..."
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-pink-200 text-xs bg-pink-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                {/* Materials List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredSessionMaterials.length > 0 ? (
                    filteredSessionMaterials.map((mat) => (
                      <a
                        key={mat.id}
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-2xl border border-pink-100 bg-pink-50/40 hover:border-pink-300 transition flex items-center justify-between space-x-2 group text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-4 h-4 text-pink-500 shrink-0" />
                          <span className="font-extrabold text-slate-900 dark:text-white truncate group-hover:text-pink-600 transition">
                            Buổi {mat.sessionNum}: {mat.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-pink-600 underline shrink-0">
                          Tải về →
                        </span>
                      </a>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Chưa tìm thấy tài liệu phù hợp.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. RECENT 2 SESSIONS (MOST IMPORTANT) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
            <Flame className="w-5 h-5 mr-2 text-pink-500 animate-pulse" /> 2 Buổi Học Mới Nhất (Cập Nhật Liên Tục)
          </h3>
          <span className="text-xs text-pink-900 font-black bg-pink-100 px-3 py-1 rounded-full border border-pink-200">
            Tất cả bài tập đều có tích chọn tự động
          </span>
        </div>

        {recent2Sessions.length > 0 ? (
          recent2Sessions.map((s) => renderSessionCard(s, true))
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-pink-100 text-xs text-slate-500 italic">
            Chưa có thông tin buổi học nào được ghi nhận.
          </div>
        )}
      </div>

      {/* 6. OLDER SESSIONS COLLAPSIBLE SECTION */}
      {olderSessions.length > 0 && (
        <div className="space-y-4 pt-2">
          <button
            onClick={() => setIsOlderSessionsOpen(!isOlderSessionsOpen)}
            className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-slate-800 hover:border-pink-300 transition flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 shadow-xs"
          >
            <span className="flex items-center">
              <History className="w-4 h-4 mr-2 text-pink-500" />
              Xem Lại Các Buổi Học Cũ Hơn ({olderSessions.length} buổi)
            </span>
            {isOlderSessionsOpen ? (
              <span className="text-pink-600 flex items-center">
                Thu gọn danh sách <ChevronUp className="w-4 h-4 ml-1" />
              </span>
            ) : (
              <span className="text-pink-600 flex items-center">
                Mở rộng tất cả {olderSessions.length} buổi <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            )}
          </button>

          {isOlderSessionsOpen && (
            <div className="space-y-4 animate-fadeIn">
              {olderSessions.map((s) => renderSessionCard(s, false))}
            </div>
          )}
        </div>
      )}

      {/* VIEW FEEDBACK MODAL FOR STUDENT */}
      {viewingFeedbackSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-sky-200 p-6 space-y-5 relative text-slate-800 dark:text-white">
            <button
              onClick={() => setViewingFeedbackSub(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xl shadow-xs">
                💬
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Phản Hồi Từ {viewingFeedbackSub.feedbackByUserName || viewingFeedbackSub.teacherName || 'Giáo Viên'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Bài tập: <strong>{viewingFeedbackSub.homeworkTitle}</strong> • {viewingFeedbackSub.feedbackDate} {viewingFeedbackSub.feedbackTime || ''}
                </p>
              </div>
            </div>

            {/* Stars rating display */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-sky-950 dark:text-sky-300">
                <span>Đánh Giá Chất Lượng Bài Làm:</span>
                <div className="flex items-center space-x-1 text-amber-400">
                  {Array.from({ length: viewingFeedbackSub.ratingStars || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-sky-200/60">
                <span className="text-xs font-bold text-slate-500 block mb-1">Lời nhận xét động viên:</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-sky-100">
                  "{viewingFeedbackSub.feedbackText || 'Em làm bài tập rất đầy đủ và chăm chỉ! Tiếp tục phát huy nhé em!'}"
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setViewingFeedbackSub(null)}
                className="px-6 py-2.5 rounded-2xl bg-sky-200 text-sky-950 font-extrabold text-xs hover:bg-sky-300 transition border border-sky-300 shadow-xs"
              >
                Đóng Cửa Sổ Phản Hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVATAR KAKAOTALK SELECTOR / UPLOAD MODAL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border-2 border-pink-100 p-6 space-y-6 relative text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Chọn Ảnh Đại Diện Hoặc Avatar KakaoTalk
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Chọn 1 trong các linh vật KakaoTalk siêu dễ thương hoặc tải ảnh tùy chọn của em lên nhé!
              </p>
            </div>

            {/* KAKAOTALK FRIENDS AVATAR GRID WITH SAFE FALLBACK */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-pink-900 dark:text-pink-300 uppercase tracking-wider block">
                ✨ Bộ Cặp Đôi KakaoTalk Friends Nổi Tiếng:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {KAKAOTALK_AVATARS_LIST.map((kt) => (
                  <button
                    key={kt.id}
                    onClick={() => handleSelectKakaoAvatar(kt.url || kt.svgDataUrl)}
                    className="p-2 rounded-2xl border-2 border-pink-100 hover:border-pink-400 hover:bg-pink-50 transition flex flex-col items-center space-y-1 group"
                  >
                    <img
                      src={kt.url || kt.svgDataUrl}
                      alt={kt.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                      }}
                      className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition"
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{kt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM UPLOAD IMAGE SECTION */}
            <div className="pt-3 border-t border-pink-100 space-y-2">
              <span className="text-xs font-extrabold text-pink-900 dark:text-pink-300 uppercase tracking-wider block">
                📤 Hoặc Tải Ảnh Tự Chọn Từ Máy Tính / Điện Thoại:
              </span>
              <label className="p-4 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-400 bg-pink-50/50 hover:bg-pink-100/50 transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 text-xs text-pink-950 font-bold">
                <Upload className="w-6 h-6 text-pink-500" />
                <span>Bấm vào đây để chọn file ảnh từ máy (Max 2MB)</span>
                <input type="file" accept="image/*" onChange={handleFileUploadAvatar} className="hidden" />
              </label>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-xs hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. DETAILED TUITION PAYMENT HISTORY MODAL */}
      {isPaymentHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-pink-300 p-6 sm:p-7 space-y-5 relative text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsPaymentHistoryOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3.5 border-b border-pink-100 dark:border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                💳
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Lịch Sử Đóng Học Phí Chi Tiết
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Học viên: <strong className="text-pink-600 dark:text-pink-400">{currentStudent.name}</strong> • Chi tiết các đợt hoàn tất học phí
                </p>
              </div>
            </div>

            {/* Top 3 KPI Summary Cards inside Payment History Modal */}
            {(() => {
              const paidInvoices = (invoices || [])
                .filter((inv) => inv && inv.studentId === currentStudent.id && (inv.status === 'paid' || inv.status === 'completed'))
                .sort((a, b) => (a.paidDate || a.createdDate || '').localeCompare(b.paidDate || b.createdDate || ''));

              const historyList = [];
              let cumulativeSessions = 0;

              if (paidInvoices.length > 0) {
                paidInvoices.forEach((inv, idx) => {
                  const count = Number(inv.sessionsPurchased) || 8;
                  const startSession = cumulativeSessions + 1;
                  const endSession = cumulativeSessions + count;
                  cumulativeSessions = endSession;

                  historyList.push({
                    index: idx + 1,
                    code: inv.code,
                    paidDate: inv.paidDate || inv.createdDate || 'Đã thanh toán',
                    sessionsCount: count,
                    amount: inv.amount,
                    startSession,
                    endSession,
                  });
                });
              } else {
                const totalPaid = Math.max(
                  Number(currentStudent.totalPaidSessions) || 0,
                  Number(currentStudent.remainingSessions) || 0,
                  Number(currentStudent.packageSessionCount) || 8
                );
                const pkgPrice = Number(currentStudent.tuitionPackagePrice) || 2000000;
                const sessionStep = Number(currentStudent.packageSessionCount) || 8;

                let currentStart = 1;
                let countRemaining = totalPaid;
                let cycleIdx = 1;

                while (countRemaining > 0) {
                  const thisCycleCount = Math.min(countRemaining, sessionStep);
                  const endSession = currentStart + thisCycleCount - 1;

                  historyList.push({
                    index: cycleIdx,
                    code: `PACK-0${cycleIdx}`,
                    paidDate: currentStudent.createdAt || 'Thời điểm nhập học',
                    sessionsCount: thisCycleCount,
                    amount: pkgPrice,
                    startSession: currentStart,
                    endSession: endSession,
                  });

                  currentStart = endSession + 1;
                  countRemaining -= thisCycleCount;
                  cycleIdx++;
                }
                cumulativeSessions = totalPaid;
              }

              const totalPaidDisplay = Math.max(cumulativeSessions, currentStudent.totalPaidSessions || 0, currentStudent.remainingSessions || 0);
              const remainingDisplay = currentStudent.remainingSessions || 0;
              const usedDisplay = Math.max(0, totalPaidDisplay - remainingDisplay);

              return (
                <div className="space-y-4">
                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-pink-50/80 dark:bg-slate-800/80 border border-pink-200/80 text-center">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Tổng Buổi Đã Đóng</span>
                      <span className="text-base sm:text-lg font-black text-pink-700 dark:text-pink-300 font-mono">
                        {totalPaidDisplay} Buổi
                      </span>
                    </div>

                    <div className="space-y-1 border-x border-pink-200 dark:border-slate-700">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Đã Sử Dụng</span>
                      <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 font-mono">
                        {usedDisplay} Buổi
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Buổi Còn Lại</span>
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {remainingDisplay} Buổi
                      </span>
                    </div>
                  </div>

                  {/* Detailed Payment Cycles Table / List */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      📋 Danh Sách Chi Tiết Các Lần Đóng Học Phí:
                    </span>

                    {historyList.reverse().map((item) => (
                      <div
                        key={item.index}
                        className="p-4 rounded-2xl bg-gradient-to-r from-white via-pink-50/50 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 border border-pink-200/80 dark:border-slate-700 shadow-2xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 dark:border-slate-700/60 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-pink-400 text-white shadow-2xs">
                              Lần #{item.index}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              🗓️ Ngày đóng: <strong className="text-pink-600 dark:text-pink-300 font-extrabold">{item.paidDate}</strong>
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-pink-100">
                            {item.code}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-500 font-bold">📦 Số buổi đóng:</span>
                            <span className="font-black text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-200">
                              +{item.sessionsCount} buổi học
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-500 font-bold">🎓 Hạn buổi học:</span>
                            <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200">
                              Buổi #{item.startSession} → Buổi #{item.endSession}
                            </span>
                          </div>

                          {item.amount && (
                            <div className="flex items-center space-x-1.5 sm:col-span-2 pt-1 border-t border-dashed border-pink-100 dark:border-slate-700/50">
                              <span className="text-slate-500 font-bold">💰 Số tiền đóng học phí:</span>
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                {formatVND(item.amount)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Modal Close Footer */}
            <div className="text-center pt-3 border-t border-pink-100 dark:border-slate-800">
              <button
                onClick={() => setIsPaymentHistoryOpen(false)}
                className="px-6 py-2.5 rounded-2xl bg-pink-400 hover:bg-pink-500 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
              >
                Đóng Cửa Sổ Lịch Sử
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 24/7 AI STUDENT ASSISTANT CHATBOT WIDGET */}
      <StudentAiChatbotModal />

      {/* CLASS RULES POPUP MODAL */}
      <ClassRulesModal
        isOpen={isClassRulesOpen}
        onClose={() => setIsClassRulesOpen(false)}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};

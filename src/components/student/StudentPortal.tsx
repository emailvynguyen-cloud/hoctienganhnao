import React, { useState } from 'react';
import { Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND, getVietQRUrl, copyToClipboard } from '../../lib/vietqr';
import { MascotWidget } from '../common/MascotWidget';
import { KAKAOTALK_AVATARS_LIST, KAKAOTALK_SVG_AVATARS, resolveAvatarUrl } from '../../lib/kakaotalkAvatars';
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

  if (!currentStudent) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-xs text-slate-500 font-bold max-w-md mx-auto my-12 shadow-sm space-y-4">
        <p>Hệ thống đang sẵn sàng. Vui lòng đăng nhập tài khoản hoặc dùng đường link cá nhân.</p>
      </div>
    );
  }

  // Student's classes
  const studentClasses = (classes || []).filter((c) => c && currentStudent.classIds && currentStudent.classIds.includes(c.id));
  const primaryClass = studentClasses[0] || (classes || [])[0];

  // Student's sessions sorted chronologically descending (newest first)
  const studentSessions = (sessions || [])
    .filter((s) => s && s.classId === primaryClass?.id)
    .sort((a, b) => b.sessionNumber - a.sessionNumber);

  // Split sessions: 2 Most Recent Sessions vs Older Sessions
  const recent2Sessions = studentSessions.slice(0, 2);
  const olderSessions = studentSessions.slice(2);

  // LATEST SESSION FOR PROGRESS CALCULATION
  const latestSession = studentSessions[0];
  const latestSessionItems = latestSession?.homeworkItems || [];
  const completedLatestItemsCount = latestSessionItems.filter((item) =>
    currentStudent.completedHomeworkTaskIds?.includes(item.id)
  ).length;

  const progressPercent = latestSessionItems.length > 0
    ? Math.min(100, Math.round((completedLatestItemsCount / latestSessionItems.length) * 100))
    : 100;

  // Extract all session materials
  const allSessionMaterials = studentSessions.flatMap((s) => (s.sessionMaterials || []).map((m) => ({
    ...m,
    sessionNum: s.sessionNumber,
    date: s.date,
  })));

  const filteredSessionMaterials = allSessionMaterials.filter((mat) =>
    (mat.title || '').toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `buoi ${mat.sessionNum}`.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `${mat.sessionNum}`.includes(materialSearchQuery)
  );

  const studentAvatarSrc = resolveAvatarUrl(currentStudent.avatar);

  const handleToggleTaskCheck = (taskId: string) => {
    StorageEngine.toggleStudentHomeworkTaskCheck(currentStudent.id, taskId);
    onRefreshData();
  };

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

    // ALTERNATING PASTEL STYLES
    const mod = Math.abs(session.sessionNumber) % 4;
    let cardBgStyle = 'bg-gradient-to-r from-pink-50/90 via-purple-50/70 to-pink-50/90 border-pink-200';
    if (mod === 2) cardBgStyle = 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-emerald-200';
    if (mod === 3) cardBgStyle = 'bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-amber-50/90 border-amber-200';
    if (mod === 0) cardBgStyle = 'bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 border-indigo-200';

    return (
      <div
        key={session.id}
        className={`rounded-3xl border p-6 shadow-sm space-y-4 hover:shadow-md transition duration-200 dark:bg-slate-900 ${cardBgStyle}`}
      >
        {/* Session Header: Number, Date, Record Video */}
        <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              #{session.sessionNumber}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  Buổi Học Số {session.sessionNumber}
                </h4>
                {isRecent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white uppercase animate-pulse">
                    Mới Nhất
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Ngày học: {session.date} • GV: {session.teacherName || primaryClass?.teacherName}
              </span>
            </div>
          </div>

          {session.recordLink && (
            <a
              href={session.recordLink}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center shadow-xs"
            >
              <Video className="w-3.5 h-3.5 mr-1" /> Xem Record Video
            </a>
          )}
        </div>

        {/* Lesson Content */}
        <div className="space-y-1">
          <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
            📘 Nội Dung Bài Học:
          </span>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-purple-100/80 backdrop-blur-xs">
            {session.lessonContent}
          </p>
        </div>

        {/* Teacher Comment for THIS specific student in THIS session */}
        {session.studentFeedbacks?.[currentStudent.id] && (
          <div className="p-4 rounded-2xl bg-pink-50/90 dark:bg-slate-800/90 border border-pink-200 text-xs space-y-1.5 backdrop-blur-xs">
            <span className="font-black text-pink-900 dark:text-pink-300 flex items-center">
              💬 Nhận Xét Riêng Từ Cô Vy Cho Em:
            </span>
            {session.studentFeedbacks[currentStudent.id].strengths && (
              <p className="text-emerald-800 dark:text-emerald-300 font-semibold">
                💪 <strong>Điểm mạnh:</strong> {session.studentFeedbacks[currentStudent.id].strengths}
              </p>
            )}
            {session.studentFeedbacks[currentStudent.id].improvements && (
              <p className="text-amber-800 dark:text-amber-300 font-semibold">
                🎯 <strong>Cần phát huy:</strong> {session.studentFeedbacks[currentStudent.id].improvements}
              </p>
            )}
          </div>
        )}

        {/* Homework Items Checklist */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
            📝 Bài Tập Về Nhà Nền Nổi ({itemsList.length} bài):
          </span>

          {itemsList.length > 0 ? (
            itemsList.map((hwItem) => {
              const isChecked = currentStudent.completedHomeworkTaskIds?.includes(hwItem.id);

              return (
                <div
                  key={hwItem.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between text-xs ${
                    isChecked
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : 'bg-white/90 dark:bg-slate-800/90 border-purple-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleTaskCheck(hwItem.id)}
                      className={`w-6 h-6 rounded-xl flex items-center justify-center transition border-2 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'border-purple-300 hover:border-purple-500 bg-white'
                      }`}
                      title={isChecked ? 'Bấm để hủy tích' : 'Bấm để tích đã làm bài này'}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <h5 className={`font-extrabold ${isChecked ? 'line-through opacity-70' : ''}`}>
                        {hwItem.title}
                      </h5>
                      {hwItem.content && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{hwItem.content}</p>
                      )}
                    </div>
                  </div>

                  {hwItem.attachmentUrl && (
                    <a
                      href={hwItem.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-[11px] font-bold hover:bg-purple-200 transition shrink-0"
                    >
                      🔗 Xem Link Đính Kèm
                    </a>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">Không có bài tập đính kèm cho buổi này.</p>
          )}
        </div>

        {/* MOTIVATING MINI PROGRESS BAR STRIP FOR THIS SESSION */}
        <div className="pt-3 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <span className="text-purple-950 dark:text-purple-200 font-black flex items-center shrink-0">
              <BarChart2 className="w-4 h-4 mr-1 text-pink-500 animate-pulse" /> Tiến độ bài tập buổi #{session.sessionNumber}:
            </span>

            {/* CUTE MOTIVATING MINI PROGRESS BAR CONTAINER */}
            <div className="flex-1 bg-purple-200/60 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-purple-300/80 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                  sessionPercent === 100
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600'
                    : sessionPercent > 0
                    ? 'bg-gradient-to-r from-amber-400 via-pink-400 to-purple-500'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${sessionPercent}%` }}
              />
            </div>
          </div>

          {/* MOTIVATIONAL BADGE PILL */}
          <div className="shrink-0">
            <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-xs flex items-center space-x-1.5 ${
              sessionPercent === 100
                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-950 border border-emerald-300'
                : sessionPercent > 0
                ? 'bg-gradient-to-r from-amber-100 to-pink-100 text-amber-950 border border-amber-300'
                : 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-950 border border-rose-300'
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

      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. GENERAL INFO CARD WITH VIBRANT CUTE PASTEL BACKGROUND */}
      <div className="bg-gradient-to-r from-pink-100/90 via-purple-100/90 to-indigo-100/90 dark:from-purple-950 dark:to-slate-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <img
              src={studentAvatarSrc}
              alt={currentStudent.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
              }}
              className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-md transition group-hover:scale-105"
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-purple-600 text-white shadow-md hover:bg-purple-700 transition flex items-center justify-center border-2 border-white cursor-pointer"
              title="Đổi ảnh đại diện / Chọn avatar KakaoTalk Friends"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {currentStudent.name}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs inline-block">
                {currentStudent.honorNickname || '🥇 Vua/ Nữ Hoàng Chăm Chỉ 👑'}
              </span>
            </div>

            <div className="text-xs text-slate-800 dark:text-slate-200 font-bold space-y-0.5">
              <p><strong>Lớp học:</strong> {primaryClass?.className || 'Lớp Ms. Vy English'}</p>
              <p><strong>Giáo viên phụ trách:</strong> {primaryClass?.teacherName || 'Ms. Vy'}</p>
              <p><strong>Giáo trình:</strong> {primaryClass?.courseName || 'Tiếng Anh Giao Tiếp'}</p>
              <p><strong>Lịch học:</strong> {primaryClass?.schedule || 'Thứ 2 - Thứ 4 - Thứ 6'}</p>
            </div>
          </div>

          {/* Remaining Sessions Highlight Pill */}
          <div className="bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white p-4 rounded-3xl shadow-xl text-center min-w-[150px] shrink-0 border-2 border-white/40">
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

      {/* 2. MOTIVATIONAL MASCOT QUOTE WIDGET */}
      <MascotWidget
        studentName={currentStudent.name}
        starsCount={currentStudent.stars}
      />

      {/* 3. KHO TÀI LIỆU & GIÁO TRÌNH XUYÊN SUỐT KHÓA HỌC */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 p-6 shadow-sm space-y-5">
        
        {/* PHẦN 1: LINK TÀI LIỆU CHÍNH */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-purple-600 animate-pulse" />
            <h3 className="font-black text-base text-purple-950 dark:text-white uppercase tracking-wider">
              Kho Tài Liệu & Giáo Trình Chính
            </h3>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-lg">
            <div className="flex flex-wrap gap-2.5">
              {primaryClass?.resourceLinks && primaryClass.resourceLinks.length > 0 ? (
                primaryClass.resourceLinks.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-white text-purple-950 font-extrabold text-xs hover:bg-purple-50 transition shadow-md flex items-center shrink-0 border border-white/60"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 text-purple-600" />
                    {res.title}
                  </a>
                ))
              ) : (
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-white text-purple-950 font-extrabold text-xs hover:bg-purple-50 transition shadow-md flex items-center border border-white/60"
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-purple-600" />
                  Mở Thư Mục Giáo Trình Chính
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PHẦN 2: SEARCHABLE / COLLAPSIBLE SESSION MATERIALS */}
        <div className="pt-2 border-t border-purple-100 dark:border-purple-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-slate-700 dark:text-purple-300 uppercase tracking-wider">
              📎 Tài Liệu Theo Từng Buổi Học ({allSessionMaterials.length} File)
            </span>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm tài liệu buổi học..."
                  value={materialSearchQuery}
                  onChange={(e) => {
                    setMaterialSearchQuery(e.target.value);
                    if (!isExtraMaterialsOpen) setIsExtraMaterialsOpen(true);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-purple-200 text-xs bg-purple-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                onClick={() => setIsExtraMaterialsOpen(!isExtraMaterialsOpen)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-extrabold transition flex items-center shrink-0"
              >
                {isExtraMaterialsOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1 text-purple-600" /> Thu Gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1 text-purple-600" /> Mở Xem
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search-Filtered Materials List */}
          {isExtraMaterialsOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
              {filteredSessionMaterials.length > 0 ? (
                filteredSessionMaterials.map((mat) => (
                  <a
                    key={mat.id}
                    href={mat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/50 hover:border-purple-300 transition flex items-center space-x-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                        Buổi {mat.sessionNum}: {mat.title}
                      </h5>
                      <span className="text-[10px] text-purple-600 font-bold underline">
                        Bấm để xem / tải về →
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic col-span-2">Không tìm thấy tài liệu phù hợp từ khóa.</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 4. RECENT 2 SESSIONS (MOST IMPORTANT) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
            <Flame className="w-5 h-5 mr-2 text-pink-500 animate-pulse" /> 2 Buổi Học Mới Nhất (Cập Nhật Liên Tục)
          </h3>
          <span className="text-xs text-purple-700 font-black bg-purple-100 px-3 py-1 rounded-full">
            Tất cả bài tập đều có tích chọn tự động
          </span>
        </div>

        {recent2Sessions.length > 0 ? (
          recent2Sessions.map((s) => renderSessionCard(s, true))
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-xs text-slate-500 italic">
            Chưa có thông tin buổi học nào được ghi nhận.
          </div>
        )}
      </div>

      {/* 5. OLDER SESSIONS COLLAPSIBLE SECTION */}
      {olderSessions.length > 0 && (
        <div className="space-y-4 pt-2">
          <button
            onClick={() => setIsOlderSessionsOpen(!isOlderSessionsOpen)}
            className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition flex items-center justify-between text-xs font-black text-purple-950 dark:text-purple-200 shadow-sm"
          >
            <span className="flex items-center">
              <History className="w-4 h-4 mr-2 text-purple-600" />
              Xem Lại Các Buổi Học Cũ Hơn ({olderSessions.length} buổi)
            </span>
            {isOlderSessionsOpen ? (
              <span className="text-purple-600 flex items-center">
                Thu gọn danh sách <ChevronUp className="w-4 h-4 ml-1" />
              </span>
            ) : (
              <span className="text-purple-600 flex items-center">
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

      {/* AVATAR KAKAOTALK SELECTOR / UPLOAD MODAL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border-2 border-purple-100 p-6 space-y-6 relative text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto">
            
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
              <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                ✨ Bộ Cặp Đôi KakaoTalk Friends Nổi Tiếng:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {KAKAOTALK_AVATARS_LIST.map((kt) => (
                  <button
                    key={kt.id}
                    onClick={() => handleSelectKakaoAvatar(kt.url || kt.svgDataUrl)}
                    className="p-2 rounded-2xl border-2 border-purple-100 hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center space-y-1 group"
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
            <div className="pt-3 border-t border-purple-100 space-y-2">
              <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                📤 Hoặc Tải Ảnh Tự Chọn Từ Máy Tính / Điện Thoại:
              </span>
              <label className="p-4 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-100/50 transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 text-xs text-purple-900 font-bold">
                <Upload className="w-6 h-6 text-purple-600" />
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

    </div>
  );
};

import React, { useState } from 'react';
import { Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND, getVietQRUrl, copyToClipboard } from '../../lib/vietqr';
import { MascotWidget } from '../common/MascotWidget';
import { KAKAOTALK_AVATARS_LIST, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
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
  const [isExtraMaterialsOpen, setIsExtraMaterialsOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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

  // Student's sessions
  const studentSessions = (sessions || []).filter((s) => s && s.classId === primaryClass?.id);

  // LATEST SESSION FOR PROGRESS CALCULATION (Buổi học gần nhất)
  const latestSession = studentSessions[studentSessions.length - 1] || studentSessions[0];
  const latestSessionItems = latestSession?.homeworkItems || [];
  const completedLatestItemsCount = latestSessionItems.filter((item) =>
    currentStudent.completedHomeworkTaskIds?.includes(item.id)
  ).length;

  const progressPercent = latestSessionItems.length > 0
    ? Math.min(100, Math.round((completedLatestItemsCount / latestSessionItems.length) * 100))
    : 100;

  // Extract all session-attached materials
  const allSessionMaterials = studentSessions.flatMap((s) => (s.sessionMaterials || []).map((m) => ({
    ...m,
    sessionNum: s.sessionNumber,
    date: s.date,
  })));

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

  // Change Student Avatar
  const handleSelectKakaoAvatar = (avatarUrl: string) => {
    const updatedStudent = { ...currentStudent, avatar: avatarUrl };
    StorageEngine.updateStudent(updatedStudent);
    setIsAvatarModalOpen(false);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    onRefreshData();
  };

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        const updatedStudent = { ...currentStudent, avatar: base64Url };
        StorageEngine.updateStudent(updatedStudent);
        setIsAvatarModalOpen(false);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        onRefreshData();
      }
    };
    reader.readAsDataURL(file);
  };

  const studentAvatarSrc = currentStudent.avatar && currentStudent.avatar.length > 20
    ? currentStudent.avatar
    : KAKAOTALK_SVG_AVATARS.ryan;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. GENERAL INFO CARD WITH AVATAR PICKER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <img
              src={studentAvatarSrc}
              alt={currentStudent.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
              }}
              className="w-20 h-20 rounded-3xl object-cover border-4 border-purple-100 shadow-md transition group-hover:scale-105"
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-purple-600 text-white shadow-md hover:bg-purple-700 transition flex items-center justify-center border-2 border-white"
              title="Đổi ảnh đại diện / Chọn avatar KakaoTalk Friends"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {currentStudent.name}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-100 text-pink-800 border border-pink-200 inline-block">
                {currentStudent.honorNickname || '🥇 Vua/ Nữ Hoàng Chăm Chỉ 👑'}
              </span>

              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="text-xs text-purple-700 font-bold underline hover:text-purple-900 transition ml-2"
              >
                [ 📷 Đổi Avatar KakaoTalk ]
              </button>
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

      {/* Mascot Widget with 6 Custom Quotes */}
      <MascotWidget studentName={currentStudent.name} starsCount={currentStudent.stars} />

      {/* 2. KHO TÀI LIỆU & GIÁO TRÌNH */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
        
        {/* PHẦN 1: LINK GOOGLE DRIVE TÀI LIỆU CHÍNH */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-purple-600 animate-pulse" />
            <h3 className="font-black text-base text-purple-950 dark:text-white uppercase tracking-wider">
              Kho Tài Liệu & Giáo Trình Chính (Google Drive Khóa Học)
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-500 text-white shadow-md space-y-2">
            <h4 className="font-black text-sm">
              📁 Thư Mục Google Drive Giáo Trình Xuyên Suốt Khóa: {primaryClass?.courseName || 'Tiếng Anh Ms. Vy'}
            </h4>
            <p className="text-xs text-purple-100 font-medium">
              Chứa đầy đủ Sách Ebook, File Audio Nghe, Từ vựng Academic & Đề thi luyện tập toàn khóa.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {primaryClass?.resourceLinks && primaryClass.resourceLinks.length > 0 ? (
                primaryClass.resourceLinks.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-white text-purple-900 font-extrabold text-xs hover:bg-purple-50 transition shadow-sm flex items-center shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                    {res.title}
                  </a>
                ))
              ) : (
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white text-purple-900 font-extrabold text-xs hover:bg-purple-50 transition shadow-sm flex items-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                  Mở Thư Mục Google Drive Giáo Trình Chính
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PHẦN 2: TÀI LIỆU & BÀI TẬP ĐÍNH KÈM THEO BUỔI HỌC (ĐÓNG / MỞ NÓI CHUNG) */}
        <div className="pt-2 border-t border-purple-100 dark:border-purple-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-purple-300 uppercase tracking-wider">
              📎 Tài Liệu & Bài Tập Kèm Theo Ở Các Buổi Học ({allSessionMaterials.length} file)
            </span>

            <button
              onClick={() => setIsExtraMaterialsOpen(!isExtraMaterialsOpen)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-extrabold transition flex items-center"
            >
              {isExtraMaterialsOpen ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1 text-purple-600" /> Thu Gọn Kho Tài Liệu Buổi
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1 text-purple-600" /> Mở Rộng Xem Tất Cả ({allSessionMaterials.length} file)
                </>
              )}
            </button>
          </div>

          {/* Collapsible Materials Container */}
          {isExtraMaterialsOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
              {allSessionMaterials.length > 0 ? (
                allSessionMaterials.map((mat) => (
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
                <p className="text-xs text-slate-400 italic col-span-2">Chưa có bài tập hay tài liệu bổ sung theo từng buổi.</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 3. OVERALL PROGRESS BAR (DỰA VÀO BUỔI HỌC GẦN NHẤT) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-pink-500 animate-bounce" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Thanh Tiến Độ Bài Tập Buổi Gần Nhất (Buổi #{latestSession?.sessionNumber || 1})
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
          Đã tick hoàn thành <strong>{completedLatestItemsCount} / {latestSessionItems.length}</strong> bài tập về nhà của buổi gần nhất. Tích cực làm bài để vinh danh trên Bảng Thành Tích!
        </p>
      </div>

      {/* 4. SESSION LIST */}
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

                {/* PER-ITEM HOMEWORK TASKS & CHECKBOX (RED IF UNCHECKED FOR HIGH VISIBILITY) */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                    📝 Bài Tập Về Nhà Cần Làm ({itemsList.length} bài):
                  </span>

                  {itemsList.length > 0 ? (
                    itemsList.map((hwItem) => {
                      const isItemChecked = currentStudent.completedHomeworkTaskIds?.includes(hwItem.id) || false;
                      const subRecord = (homeworkSubmissions || []).find((s) => s && s.studentId === currentStudent.id && s.homeworkTaskId === hwItem.id);

                      return (
                        <div
                          key={hwItem.id}
                          className={`p-4 rounded-2xl border transition space-y-2 ${
                            isItemChecked
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-rose-50/70 border-rose-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {hwItem.title}
                                </h5>
                                {!isItemChecked && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                    ⚠️ CHƯA NỘP BÀI
                                  </span>
                                )}
                              </div>
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

                            {/* PER-ITEM CHECKBOX (MÀU ĐỎ NỔI BẬT LÚC CHƯA TICK) */}
                            <button
                              onClick={() => handleToggleHomeworkItem(session.id, hwItem.id, hwItem.title)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center shrink-0 shadow-md ${
                                isItemChecked
                                  ? 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-sm'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-700 animate-pulse ring-2 ring-rose-300'
                              }`}
                            >
                              {isItemChecked ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                  ✓ Đã Làm Bài
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 mr-1.5 animate-bounce" />
                                  ⚡ CHƯA LÀM BÀI (TICK NGAY)
                                </>
                              )}
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

      {/* AVATAR PICKER MODAL (KAKAOTALK FRIENDS & UPLOAD PHOTO) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border-2 border-purple-100 p-6 space-y-5 relative">
            <button
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto font-black text-xl">
                🎀
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Đổi Ảnh Đại Diện Học Viên
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tải ảnh riêng từ thiết bị hoặc chọn 1 nhân vật KakaoTalk Friends siêu cute!
              </p>
            </div>

            {/* OPTION 1: CUSTOM FILE UPLOAD */}
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-2">
              <span className="font-extrabold text-xs text-purple-900 uppercase block">
                Cách 1: Tải Ảnh Đại Diện Từ Máy Tính / Điện Thoại
              </span>
              <label className="cursor-pointer inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm">
                <Upload className="w-4 h-4 mr-2" /> Chọn File Ảnh Từ Máy
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* OPTION 2: KAKAOTALK FRIENDS AVATARS GRID */}
            <div className="space-y-2">
              <span className="font-extrabold text-xs text-slate-700 dark:text-purple-300 uppercase block">
                Cách 2: Chọn Linh Vật KakaoTalk Friends Cute:
              </span>

              <div className="grid grid-cols-3 gap-3">
                {KAKAOTALK_AVATARS_LIST.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => handleSelectKakaoAvatar(k.url)}
                    className="p-2 rounded-2xl border border-purple-100 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-100/50 transition flex flex-col items-center space-y-1.5 group cursor-pointer"
                  >
                    <img
                      src={k.url}
                      alt={k.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                      }}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white group-hover:scale-110 transition shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-purple-900 text-center leading-tight">
                      {k.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

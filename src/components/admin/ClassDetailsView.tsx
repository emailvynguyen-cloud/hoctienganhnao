import React, { useState } from 'react';
import { Class, Student, Session, HomeworkSubmission, BankConfig } from '../../types';
import {
  ArrowLeft,
  BookOpen,
  Video,
  User,
  Clock,
  PlusCircle,
  Calendar,
  FileText,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Users,
  MessageSquare,
  Search,
} from 'lucide-react';

interface ClassDetailsViewProps {
  selectedClass: Class;
  students: Student[];
  sessions: Session[];
  homeworkSubmissions: HomeworkSubmission[];
  bankConfig?: BankConfig;
  onBack: () => void;
  onOpenAddSession: (classId: string) => void;
  onOpenPublicStudentLink?: (hash: string) => void;
}

export const ClassDetailsView: React.FC<ClassDetailsViewProps> = ({
  selectedClass,
  students,
  sessions,
  homeworkSubmissions,
  onBack,
  onOpenAddSession,
  onOpenPublicStudentLink,
}) => {
  const [isExtraMaterialsOpen, setIsExtraMaterialsOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  // Filter students in this class
  const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(selectedClass.id));

  // Filter sessions in this class
  const classSessions = (sessions || []).filter((s) => s && s.classId === selectedClass.id);

  // Extract all session materials
  const allSessionMaterials = classSessions.flatMap((s) => (s.sessionMaterials || []).map((m) => ({
    ...m,
    sessionNum: s.sessionNumber,
    date: s.date,
  })));

  // Filter materials search query
  const filteredSessionMaterials = allSessionMaterials.filter((mat) =>
    (mat.title || '').toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `buoi ${mat.sessionNum}`.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `${mat.sessionNum}`.includes(materialSearchQuery)
  );

  // ALTERNATING PASTEL BACKGROUND COLOR STYLES PER SESSION
  const getSessionBgStyle = (sessionNumber: number) => {
    const mod = Math.abs(sessionNumber) % 4;
    if (mod === 1) return 'bg-gradient-to-r from-pink-50/90 via-purple-50/70 to-pink-50/90 border-pink-200 dark:bg-slate-900';
    if (mod === 2) return 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-emerald-200 dark:bg-slate-900';
    if (mod === 3) return 'bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-amber-50/90 border-amber-200 dark:bg-slate-900';
    return 'bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 border-indigo-200 dark:bg-slate-900';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-purple-100 shadow-sm">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Về Danh Sách Lớp Học
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenAddSession(selectedClass.id)}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs hover:from-purple-700 hover:to-pink-700 transition shadow-md flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" /> + Thêm Buổi Học Mới Cho Lớp Này
          </button>
        </div>
      </div>

      {/* 1. CLASS HEADER BANNER */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase tracking-wider shadow-sm inline-block">
              MÃ LỚP: {selectedClass.code}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              {selectedClass.className}
            </h2>
            <div className="text-xs text-purple-100 font-medium space-y-0.5 pt-1">
              <p><strong>Giáo viên phụ trách:</strong> {selectedClass.teacherName}</p>
              <p><strong>Lịch học:</strong> {selectedClass.schedule}</p>
              <p><strong>Giáo trình:</strong> {selectedClass.courseName}</p>
              <p><strong>Phòng học:</strong> {selectedClass.room}</p>
            </div>
          </div>

          {selectedClass.zoomLink && (
            <a
              href={selectedClass.zoomLink}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-amber-400 text-slate-900 font-black text-xs hover:bg-amber-300 transition shadow-lg flex items-center justify-center shrink-0"
            >
              <Video className="w-4 h-4 mr-2" /> VÀO PHÒNG HỌC (ZOOM)
            </a>
          )}
        </div>
      </div>

      {/* 2. ENROLLED STUDENTS SUMMARY GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center uppercase tracking-wider">
            <Users className="w-5 h-5 mr-2 text-purple-600" /> Danh Sách Học Viên Trực Thuộc Lớp ({classStudents.length} Học Viên)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {classStudents.map((std) => (
            <div
              key={std.id}
              className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between hover:border-purple-300 transition"
            >
              <div className="flex items-center space-x-3">
                <img src={std.avatar || '/logo.jpg'} alt={std.name} className="w-10 h-10 rounded-2xl object-cover border border-purple-200" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{std.name}</h4>
                  <p className="text-[10px] text-purple-600 font-bold">{std.honorNickname || 'Học viên active'}</p>
                  <p className="text-[10px] text-slate-500">SĐT: {std.phone}</p>
                </div>
              </div>

              {onOpenPublicStudentLink && (
                <button
                  onClick={() => onOpenPublicStudentLink(std.publicHash)}
                  className="p-2 rounded-xl bg-pink-100 text-pink-800 hover:bg-pink-200 transition text-[11px] font-bold"
                  title="Xem trang học tập cá nhân của học viên"
                >
                  Xem Link →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. KHO TÀI LIỆU & GIÁO TRÌNH LỚP HỌC (2 PHẦN + Ô TÌM KIẾM TÀI LIỆU) */}
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
              📁 Thư Mục Google Drive Giáo Trình Xuyên Suốt Khóa: {selectedClass.courseName}
            </h4>
            <p className="text-xs text-purple-100 font-medium">
              Chứa đầy đủ Sách Ebook, File Audio Nghe, Từ vựng Academic & Đề thi luyện tập toàn khóa.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {selectedClass.resourceLinks && selectedClass.resourceLinks.length > 0 ? (
                selectedClass.resourceLinks.map((res) => (
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

        {/* PHẦN 2: TÀI LIỆU CÁC BUỔI (THU GỌN / MỞ RỘNG + Ô TÌM KIẾM TÀI LIỆU) */}
        <div className="pt-2 border-t border-purple-100 dark:border-purple-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-slate-700 dark:text-purple-300 uppercase tracking-wider">
              📎 Tài Liệu & Bài Tập Kèm Theo Ở Các Buổi Học ({allSessionMaterials.length} file)
            </span>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* LIVE SEARCH BAR FOR SESSION MATERIALS */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tra cứu tên bài tập, số buổi..."
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
                    <ChevronUp className="w-4 h-4 mr-1 text-purple-600" /> Thu Gọn Kho
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1 text-purple-600" /> Mở Rộng Tất Cả
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible & Search-Filtered Materials Container */}
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
                <p className="text-xs text-slate-400 italic col-span-2">Không tìm thấy tài liệu phù hợp từ khóa "{materialSearchQuery}".</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 4. SESSIONS LIST (FORMATTED EXACTLY LIKE STUDENT VIEW WITH ALTERNATING PASTEL BACKGROUNDS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-600" /> Bảng Nhật Ký Buổi Học Của Lớp ({classSessions.length} Buổi Dạy)
          </h3>

          <button
            onClick={() => onOpenAddSession(selectedClass.id)}
            className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition flex items-center"
          >
            + Thêm Buổi Học Mới
          </button>
        </div>

        {classSessions.length > 0 ? (
          classSessions.map((session) => {
            const itemsList = session.homeworkItems || [];
            const bgStyle = getSessionBgStyle(session.sessionNumber);

            return (
              <div
                key={session.id}
                className={`rounded-3xl border p-6 shadow-sm space-y-4 hover:shadow-md transition duration-200 ${bgStyle}`}
              >
                {/* Session Header: Number & Date */}
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      #{session.sessionNumber}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        Buổi Học Số {session.sessionNumber}
                      </h4>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Ngày học: {session.date} • GV: {session.teacherName || selectedClass.teacherName}
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

                {/* PER-STUDENT COMMENTS LIST IN THIS SESSION */}
                {session.studentFeedbacks && Object.keys(session.studentFeedbacks).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                      💬 Nhận Xét Chi Tiết Cho Từng Học Viên Trong Buổi:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(session.studentFeedbacks).map(([stdId, fb]) => {
                        const stdObj = classStudents.find((s) => s.id === stdId);
                        if (!fb.strengths && !fb.improvements) return null;

                        return (
                          <div key={stdId} className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-pink-200 text-xs space-y-1 backdrop-blur-xs">
                            <span className="font-black text-pink-900 block">
                              👤 {stdObj?.name || 'Học viên'}:
                            </span>
                            {fb.strengths && (
                              <p className="text-emerald-800 font-medium">💪 <strong>Mạnh:</strong> {fb.strengths}</p>
                            )}
                            {fb.improvements && (
                              <p className="text-amber-800 font-medium">🎯 <strong>Cải thiện:</strong> {fb.improvements}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* HOMEWORK ITEMS LIST */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                    📝 Bài Tập Về Nhà Của Buổi Học ({itemsList.length} bài):
                  </span>

                  {itemsList.length > 0 ? (
                    itemsList.map((hwItem) => (
                      <div
                        key={hwItem.id}
                        className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-purple-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <h5 className="font-extrabold text-slate-900 dark:text-white">
                            {hwItem.title}
                          </h5>
                          {hwItem.content && <p className="text-slate-600 mt-0.5">{hwItem.content}</p>}
                        </div>

                        {hwItem.attachmentUrl && (
                          <a
                            href={hwItem.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-[11px] font-bold hover:bg-purple-200 transition"
                          >
                            🔗 Xem Link Đính Kèm
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Không có bài tập về nhà đính kèm.</p>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-xs text-slate-500 italic">
            Chưa có thông tin buổi học nào được ghi nhận cho lớp này.
          </div>
        )}
      </div>

    </div>
  );
};

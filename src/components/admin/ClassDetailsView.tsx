import React, { useState } from 'react';
import { Class, Student, Session, HomeworkSubmission, BankConfig, User } from '../../types';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { StorageEngine } from '../../lib/storage';
import { ManageResourceLinksModal } from './ManageResourceLinksModal';
import {
  ArrowLeft,
  BookOpen,
  Video,
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
  Share2,
  Check,
  AlertCircle,
  BarChart2,
  Trash2,
  UserX,
  Archive,
  RotateCcw,
  Box,
} from 'lucide-react';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { StudentAbsenceManagerModal } from '../common/StudentAbsenceManagerModal';
import { formatSessionDate } from '../../lib/dateUtils';
import { getStudentHonorBadge } from '../../lib/rankingUtils';

interface ClassDetailsViewProps {
  selectedClass: Class;
  students: Student[];
  sessions: Session[];
  homeworkSubmissions: HomeworkSubmission[];
  bankConfig?: BankConfig;
  currentUser?: User | null;
  onBack: () => void;
  onOpenAddSession: (classId: string) => void;
  onOpenEditSession?: (session: Session) => void;
  onOpenPublicStudentLink?: (hash: string) => void;
  onDeleteClass?: (classId: string) => void;
  onRemoveStudentFromClass?: (studentId: string, classId: string) => void;
  onArchiveClass?: (classId: string) => void;
  onRestoreClass?: (classId: string) => void;
  onRefreshData?: () => void;
}

export const ClassDetailsView: React.FC<ClassDetailsViewProps> = ({
  selectedClass,
  students,
  sessions,
  homeworkSubmissions,
  currentUser,
  onBack,
  onOpenAddSession,
  onOpenEditSession,
  onOpenPublicStudentLink,
  onDeleteClass,
  onRemoveStudentFromClass,
  onArchiveClass,
  onRestoreClass,
  onRefreshData = () => {},
}) => {
  const [isExtraMaterialsOpen, setIsExtraMaterialsOpen] = useState(false);
  const [isManageResourcesOpen, setIsManageResourcesOpen] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedAbsenceStudent, setSelectedAbsenceStudent] = useState<Student | null>(null);
  const [deleteTargetModal, setDeleteTargetModal] = useState<{
    isOpen: boolean;
    type: 'class' | 'student_from_class';
    name: string;
    detail?: string;
    studentId?: string;
  }>({ isOpen: false, type: 'class', name: '' });

  // Filter students in this class
  const classStudents = (students || []).filter((s) => s && s.classIds && s.classIds.includes(selectedClass.id));

  // Filter & Sort sessions in this class chronologically descending (newest date first)
  const classSessions = (sessions || [])
    .filter((s) => s && s.classId === selectedClass.id)
    .sort((a, b) => {
      if (b.date && a.date && b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return b.sessionNumber - a.sessionNumber;
    });

  // Extract all session materials (general session materials + student-specific materials + Quizlet + Record + Homework attachments)
  const allSessionMaterials = classSessions.flatMap((s) => {
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

    // 2. Student-specific material links
    if (s.studentFeedbacks) {
      Object.entries(s.studentFeedbacks).forEach(([studentId, fb]) => {
        if (fb && fb.materialUrl) {
          const std = classStudents.find((st) => st.id === studentId);
          const stdName = std ? ` - Học viên: ${std.name}` : '';
          const matTitle = fb.materialTitle ? fb.materialTitle : 'Tài liệu riêng học viên';
          list.push({
            id: `std_mat_${s.id}_${studentId}`,
            title: `${matTitle}${stdName}`,
            url: fb.materialUrl,
            sessionNum: s.sessionNumber,
            date: s.date,
          });
        }
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
            title: `📝 Link bài tập: ${hw.title}`,
            url: hw.attachmentUrl,
            sessionNum: s.sessionNumber,
            date: s.date,
          });
        }
      });
    }

    return list;
  });

  // Filter materials search query
  const filteredSessionMaterials = allSessionMaterials.filter((mat) =>
    (mat.title || '').toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `buoi ${mat.sessionNum}`.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
    `${mat.sessionNum}`.includes(materialSearchQuery)
  );

  // ALTERNATING PASTEL BACKGROUND COLOR STYLES PER SESSION
  const getSessionBgStyle = (sessionNumber: number) => {
    const mod = Math.abs(sessionNumber) % 4;
    if (mod === 1) return 'bg-gradient-to-r from-pink-50/90 via-rose-50/70 to-pink-50/90 border-pink-200 dark:bg-slate-900';
    if (mod === 2) return 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-emerald-200 dark:bg-slate-900';
    if (mod === 3) return 'bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-amber-50/90 border-amber-200 dark:bg-slate-900';
    return 'bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-sky-50/90 border-sky-200 dark:bg-slate-900';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center border border-pink-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Về Danh Sách Lớp Học
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenAddSession(selectedClass.id)}
            className="px-5 py-2 rounded-2xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-pink-700" /> + Thêm Buổi Học Mới Cho Lớp Này
          </button>
        </div>
      </div>

      {/* 1. CLASS HEADER BANNER (REDESIGNED SOFT PASTEL CARD) */}
      <div className="bg-gradient-to-r from-pink-200 via-rose-100 to-sky-100 text-pink-950 p-6 sm:p-8 rounded-3xl border-2 border-pink-300 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase tracking-wider shadow-xs inline-block">
              MÃ LỚP: {selectedClass.code}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-pink-950">
              {selectedClass.className}
            </h2>
            <div className="text-xs text-pink-900 font-medium space-y-0.5 pt-1">
              <p className="flex items-center space-x-1 flex-wrap">
                <strong>👑 Admin phụ trách:</strong>
                {currentUser?.role === 'super_admin' ? (
                  <select
                    value={selectedClass.adminId || ''}
                    onChange={(e) => {
                      const allUsers = StorageEngine.getUsers() || [];
                      const adminUsers = allUsers.filter((u) => u && (u.role === 'admin' || u.role === 'super_admin'));
                      const selectedUser = adminUsers.find((u) => u.uid === e.target.value);
                      if (selectedUser) {
                        StorageEngine.assignClassManagers(selectedClass.id, selectedUser.uid, selectedUser.displayName, undefined, undefined, undefined, currentUser);
                        onRefreshData();
                        alert(`Đã đổi Admin phụ trách lớp ${selectedClass.className} sang: ${selectedUser.displayName}`);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg border border-pink-300 bg-white/90 text-xs font-black text-pink-950 cursor-pointer shadow-2xs"
                  >
                    {(StorageEngine.getUsers() || [])
                      .filter((u) => u && (u.role === 'admin' || u.role === 'super_admin'))
                      .map((a) => (
                        <option key={a.uid} value={a.uid}>
                          👑 {a.displayName} ({a.email})
                        </option>
                      ))}
                  </select>
                ) : (
                  <span className="font-extrabold text-pink-950 underline decoration-pink-400 ms-1">
                    {selectedClass.adminName || 'Admin Trực Thuộc'}
                  </span>
                )}
              </p>
              <p><strong>Giáo viên phụ trách:</strong> {selectedClass.teacherName}</p>
              <p><strong>Lịch học:</strong> {selectedClass.schedule}</p>
              <p><strong>Giáo trình:</strong> {selectedClass.courseName}</p>
              <p><strong>Phòng học:</strong> {selectedClass.room}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedClass.zoomLink && (
              <a
                href={selectedClass.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-amber-300 text-slate-900 font-black text-xs hover:bg-amber-200 transition shadow-xs flex items-center justify-center shrink-0 border border-amber-400"
              >
                <Video className="w-4 h-4 mr-2 text-slate-800" /> VÀO PHÒNG HỌC (ZOOM)
              </a>
            )}

            {currentUser?.role === 'super_admin' && (
              <div className="flex items-center space-x-2">
                {selectedClass.status === 'archived' ? (
                  <button
                    onClick={() => {
                      if (onRestoreClass) {
                        onRestoreClass(selectedClass.id);
                        alert(`Đã khôi phục lớp học "${selectedClass.className}" về trạng thái hoạt động!`);
                      }
                    }}
                    className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md flex items-center shrink-0 cursor-pointer"
                    title="Quyền Super Admin: Khôi phục lớp học về trạng thái active"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> 🔄 Khôi Phục Lớp Học
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn có muốn LƯU TRỮ LỚP HỌC "${selectedClass.className}"? Lớp học sẽ được chuyển sang mục Lớp Học Đã Lưu Trữ (Bảo lưu/Tạm ngưng).`)) {
                        if (onArchiveClass) {
                          onArchiveClass(selectedClass.id);
                          alert(`Đã chuyển lớp học "${selectedClass.className}" vào mục lưu trữ an toàn!`);
                        }
                      }
                    }}
                    className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md flex items-center shrink-0 cursor-pointer"
                    title="Quyền Super Admin: Chuyển lớp học vào mục lưu trữ / bảo lưu / tạm ngưng"
                  >
                    <Archive className="w-4 h-4 mr-1.5" /> 📦 Lưu Trữ Lớp (Bảo Lưu)
                  </button>
                )}

                <button
                  onClick={() => {
                    setDeleteTargetModal({
                      isOpen: true,
                      type: 'class',
                      name: selectedClass.className,
                      detail: `Mã lớp: ${selectedClass.code} • Giáo viên: ${selectedClass.teacherName}`,
                    });
                  }}
                  className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-md flex items-center shrink-0 cursor-pointer"
                  title="Quyền Super Admin: Xóa lớp học này"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> 🗑️ Xóa Lớp Học Này
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ENROLLED STUDENTS SUMMARY GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center uppercase tracking-wider">
            <Users className="w-5 h-5 mr-2 text-pink-500" /> Danh Sách Học Viên Trực Thuộc Lớp ({classStudents.length} Học Viên)
          </h3>
          <span className="text-xs text-pink-900 font-bold bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
            Bấm vào học viên để mở trang học tập cá nhân
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {classStudents.map((std) => {
            const stdBadge = getStudentHonorBadge(std.id, students, sessions, homeworkSubmissions);

            return (
              <div
                key={std.id}
                onClick={() => onOpenPublicStudentLink && onOpenPublicStudentLink(std.publicHash)}
                className="p-4 rounded-3xl border border-pink-100 bg-pink-50/30 hover:bg-pink-100/50 hover:border-pink-300 transition cursor-pointer flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={resolveAvatarUrl(std.avatar)}
                    alt={std.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-pink-200 shrink-0 group-hover:scale-105 transition"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-pink-600 transition underline decoration-pink-300">
                      {std.name}
                    </h4>
                    {stdBadge && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-300 font-black">{stdBadge.title}</p>
                    )}
                    <p className="text-[10px] text-slate-500">SĐT: {std.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAbsenceStudent(std);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-950 hover:bg-amber-500 hover:text-white transition text-xs font-extrabold flex items-center shrink-0 cursor-pointer shadow-2xs border border-amber-300"
                      title="Quản Lý & Thêm Buổi Nghỉ Học Viên"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      <span className="hidden sm:inline">Quản Lý</span> Buổi Nghỉ
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const shareUrl = `${window.location.origin}/?student=${std.publicHash}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert(`Đã sao chép link trang học tập công khai của em ${std.name} vào bộ nhớ tạm!\n\nLink: ${shareUrl}`);
                    }}
                    className="p-2 rounded-xl bg-emerald-100 text-emerald-950 hover:bg-emerald-500 hover:text-white transition text-xs font-bold cursor-pointer"
                    title="Sao chép đường link xem trang học tập cho Phụ huynh / Học viên"
                  >
                    <Share2 className="w-4 h-4 text-emerald-700" />
                  </button>

                  {currentUser?.role === 'super_admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetModal({
                          isOpen: true,
                          type: 'student_from_class',
                          name: std.name,
                          detail: `Gỡ khỏi lớp: ${selectedClass.className} (${selectedClass.code})`,
                          studentId: std.id,
                        });
                      }}
                      className="p-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white transition text-xs font-bold cursor-pointer"
                      title="Quyền Super Admin: Xóa học viên này ra khỏi lớp"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. KHO TÀI LIỆU & GIÁO TRÌNH LỚP HỌC (REDESIGNED SOFT PASTEL CARD) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 p-6 shadow-xs space-y-5">
        
        {/* PHẦN 1: LINK TÀI LIỆU CHÍNH */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-sky-500 animate-pulse" />
              <h3 className="font-black text-base text-sky-950 dark:text-white uppercase tracking-wider">
                Kho Tài Liệu & Giáo Trình Tổng
              </h3>
            </div>

            {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
              <button
                onClick={() => setIsManageResourcesOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 text-xs font-black transition border border-pink-300 shadow-2xs flex items-center shrink-0 cursor-pointer"
              >
                ⚙️ Quản Lý Kho Tài Liệu Tổng
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-100 via-blue-50 to-emerald-100 dark:from-slate-800 dark:to-slate-800 text-sky-950 shadow-xs border border-sky-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedClass.resourceLinks && selectedClass.resourceLinks.length > 0 ? (
                selectedClass.resourceLinks.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-3 rounded-2xl bg-white dark:bg-slate-900 text-sky-950 dark:text-white hover:bg-sky-50 transition shadow-2xs flex items-center justify-between space-x-3 border ${
                      res.isHidden ? 'opacity-50 border-slate-300' : 'border-sky-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-lg shrink-0">{res.icon || '📁'}</span>
                      <div className="truncate">
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {res.title}
                        </h5>
                        {res.description && (
                          <p className="text-[10px] text-slate-500 font-medium truncate">{res.description}</p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-black text-sky-700 bg-sky-100 px-2 py-1 rounded-lg shrink-0">
                      Mở ↗
                    </span>
                  </a>
                ))
              ) : (
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-white text-sky-950 font-extrabold text-xs hover:bg-sky-50 transition shadow-2xs flex items-center border border-sky-200 col-span-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-sky-600 shrink-0" />
                  <span>Mở Thư Mục Google Drive Giáo Trình Chính</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PHẦN 2: TÀI LIỆU CÁC BUỔI */}
        <div className="pt-2 border-t border-pink-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              📎 Tài Liệu & Bài Tập Kèm Theo Ở Các Buổi Học ({allSessionMaterials.length} file)
            </span>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tra cứu tên bài tập, số buổi..."
                  value={materialSearchQuery}
                  onChange={(e) => {
                    setMaterialSearchQuery(e.target.value);
                    if (!isExtraMaterialsOpen) setIsExtraMaterialsOpen(true);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-pink-200 text-xs bg-pink-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <button
                onClick={() => setIsExtraMaterialsOpen(!isExtraMaterialsOpen)}
                className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 text-xs font-extrabold transition flex items-center shrink-0 border border-pink-200"
              >
                {isExtraMaterialsOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1 text-pink-600" /> Thu Gọn Kho
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1 text-pink-600" /> Mở Rộng Tất Cả
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
                    className="p-3.5 rounded-2xl border border-pink-100 bg-pink-50/40 hover:border-pink-300 transition flex items-center space-x-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-black shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-pink-600 transition">
                        Buổi {mat.sessionNum}: {mat.title}
                      </h5>
                      <span className="text-[10px] text-pink-600 font-bold underline">
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

      {/* 4. SESSIONS LIST (INCLUDES CONCISE STUDENT HOMEWORK PROGRESS STRIP) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-pink-500" /> Bảng Nhật Ký Buổi Học Của Lớp ({classSessions.length} Buổi Dạy)
          </h3>

          <button
            onClick={() => onOpenAddSession(selectedClass.id)}
            className="px-4 py-2 rounded-2xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition flex items-center shadow-xs"
          >
            + Thêm Buổi Học Mới
          </button>
        </div>

        {classSessions.length > 0 ? (
          classSessions.map((session) => {
            if (session.isChargedAbsenceSession) {
              return (
                <div
                  key={session.id}
                  className="p-5 rounded-3xl border-2 border-amber-300 bg-amber-50 dark:bg-slate-800 flex items-center justify-between text-xs font-black text-amber-950 dark:text-amber-300 shadow-2xs"
                >
                  <span className="truncate mr-2">
                    ⚠️ Buổi {session.sessionNumber} - Ngày {formatSessionDate(session.date)} - Nghỉ tính phí do vi phạm quy định
                  </span>

                  {onOpenEditSession && (
                    <button
                      onClick={() => onOpenEditSession(session)}
                      className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 font-extrabold text-[11px] transition shrink-0"
                    >
                      ✏️ Chỉnh Sửa
                    </button>
                  )}
                </div>
              );
            }

            const itemsList = session.homeworkItems || [];
            const bgStyle = getSessionBgStyle(session.sessionNumber);

            return (
              <div
                key={session.id}
                className={`rounded-3xl border p-6 shadow-xs space-y-4 hover:shadow-md transition duration-200 ${bgStyle}`}
              >
                {/* Session Header: Number, Date, Edit Button & Action Links */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-pink-200/60 pb-3 gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-2xl bg-pink-400 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      #{session.sessionNumber}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        Buổi Học Số {session.sessionNumber}
                      </h4>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Ngày học: {formatSessionDate(session.date)} • GV: {session.teacherName || selectedClass.teacherName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* EDIT SESSION BUTTON FOR ADMIN / SUPER ADMIN */}
                    {onOpenEditSession && (
                      <button
                        onClick={() => onOpenEditSession(session)}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-200 hover:bg-pink-300 text-pink-950 border border-pink-300 text-xs font-extrabold transition flex items-center shadow-2xs"
                        title="Chỉnh sửa chi tiết buổi học này"
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1 text-pink-700" /> ✏️ Chỉnh Sửa Buổi Học
                      </button>
                    )}

                    {/* QUIZLET LINK BUTTON */}
                    {session.quizletUrl && (
                      <a
                        href={session.quizletUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-indigo-200 text-xs font-black hover:from-blue-600 hover:to-indigo-700 transition flex items-center shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1" /> 🎴 Link Quizlet ↗
                      </a>
                    )}

                    {/* RECORD LINK BUTTON */}
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
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-pink-900 dark:text-pink-300 uppercase tracking-wider block">
                    📘 Nội Dung Bài Học:
                  </span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-pink-100/80 backdrop-blur-xs whitespace-pre-wrap leading-relaxed">
                    {session.lessonContent}
                  </p>
                </div>

                {/* HOMEWORK ITEMS LIST */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-pink-900 dark:text-pink-300 uppercase tracking-wider block">
                    📝 Bài Tập Về Nhà Của Buổi Học ({itemsList.length} bài):
                  </span>

                  {itemsList.length > 0 ? (
                    itemsList.map((hwItem) => (
                      <div
                        key={hwItem.id}
                        className="p-3.5 rounded-2xl border border-pink-100 bg-white/90 dark:bg-slate-800/90 flex items-center justify-between text-xs"
                      >
                        <div>
                          <h5 className="font-extrabold text-slate-900 dark:text-white">
                            {hwItem.title}
                          </h5>
                          {hwItem.content && <p className="text-slate-600 mt-0.5 whitespace-pre-wrap leading-relaxed">{hwItem.content}</p>}
                        </div>

                        {hwItem.attachmentUrl && (
                          <a
                            href={hwItem.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-xl bg-pink-100 text-pink-900 text-[11px] font-bold hover:bg-pink-200 transition"
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

                {/* CONCISE STUDENT HOMEWORK PROGRESS STRIP IN THIS SESSION */}
                <div className="pt-3 border-t border-pink-200/60 space-y-2">
                  <span className="text-xs font-extrabold text-pink-900 dark:text-pink-300 uppercase tracking-wider flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1.5 text-pink-500" /> Tóm Tắt Tiến Độ Làm Bài Tập Buổi Này Của Các Học Viên:
                  </span>

                  <div className="flex flex-wrap gap-2.5">
                    {classStudents.map((std) => {
                      const completedCount = itemsList.filter((item) =>
                        std.completedHomeworkTaskIds?.includes(item.id)
                      ).length;
                      const totalItems = itemsList.length;
                      const percent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 100;

                      const isDone = totalItems > 0 && completedCount === totalItems;
                      const isPartial = completedCount > 0 && completedCount < totalItems;

                      return (
                        <div
                          key={std.id}
                          onClick={() => onOpenPublicStudentLink && onOpenPublicStudentLink(std.publicHash)}
                          className={`px-3 py-1.5 rounded-2xl border text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer shadow-2xs hover:scale-102 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : isPartial
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-rose-100 text-rose-950 border-rose-300'
                          }`}
                          title={`Bấm để xem trang học tập cá nhân của em ${std.name}`}
                        >
                          <img
                            src={resolveAvatarUrl(std.avatar)}
                            alt={std.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                            }}
                            className="w-5 h-5 rounded-full object-cover shrink-0 border border-white"
                          />
                          <span>{std.name}:</span>
                          <span className="font-black">
                            {completedCount}/{totalItems} Bài ({percent}%)
                          </span>
                          {isDone ? (
                            <span className="text-emerald-700 font-black">✓</span>
                          ) : isPartial ? (
                            <span className="text-amber-700 font-black">⏳</span>
                          ) : (
                            <span className="text-rose-700 font-black">⚠️</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-pink-100 text-xs text-slate-500 italic">
            Chưa có thông tin buổi học nào được ghi nhận cho lớp này.
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteTargetModal.isOpen}
        itemType={deleteTargetModal.type}
        itemName={deleteTargetModal.name}
        itemDetail={deleteTargetModal.detail}
        onClose={() => setDeleteTargetModal({ ...deleteTargetModal, isOpen: false })}
        onConfirm={() => {
          if (deleteTargetModal.type === 'class' && onDeleteClass) {
            onDeleteClass(selectedClass.id);
          } else if (deleteTargetModal.type === 'student_from_class' && onRemoveStudentFromClass && deleteTargetModal.studentId) {
            onRemoveStudentFromClass(deleteTargetModal.studentId, selectedClass.id);
          }
        }}
      />

      <ManageResourceLinksModal
        isOpen={isManageResourcesOpen}
        onClose={() => setIsManageResourcesOpen(false)}
        targetClass={selectedClass}
        currentUser={currentUser}
        onRefreshData={() => {
          // Trigger re-render if needed
        }}
      />

      {selectedAbsenceStudent && (
        <StudentAbsenceManagerModal
          isOpen={!!selectedAbsenceStudent}
          onClose={() => setSelectedAbsenceStudent(null)}
          student={selectedAbsenceStudent}
          currentUser={currentUser}
          onRefreshData={onRefreshData}
        />
      )}

    </div>
  );
};

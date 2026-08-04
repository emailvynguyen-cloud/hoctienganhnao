import React, { useState, useEffect } from 'react';
import { Class, Student, Session, AttendanceRecord, ResourceLink, HomeworkTaskItem, StudentFeedback } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { PlusCircle, Calendar, BookOpen, Video, Link2, CheckCircle2, UserCheck, X, FileText, Image, Sparkles, Plus, Trash2, Edit3 } from 'lucide-react';

interface AddSessionModalProps {
  isOpen?: boolean;
  onClose: () => void;
  classes: Class[];
  students: Student[];
  initialClassId?: string;
  defaultClassId?: string;
  editingSession?: Session | null;
  onSessionAdded: () => void;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({
  isOpen = true,
  onClose,
  classes,
  students,
  initialClassId,
  defaultClassId,
  editingSession,
  onSessionAdded,
}) => {
  const targetClassId = editingSession?.classId || initialClassId || defaultClassId || (classes[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(targetClassId);
  const [date, setDate] = useState<string>(editingSession?.date || new Date().toISOString().split('T')[0]);
  const [lessonContent, setLessonContent] = useState<string>(editingSession?.lessonContent || '');
  const [recordLink, setRecordLink] = useState<string>(editingSession?.recordLink || '');
  const [quizletUrl, setQuizletUrl] = useState<string>(editingSession?.quizletUrl || '');
  const [isChargedAbsenceSession, setIsChargedAbsenceSession] = useState<boolean>(editingSession?.isChargedAbsenceSession || false);
  const [hasNoHomework, setHasNoHomework] = useState<boolean>(editingSession?.hasNoHomework || false);

  useEffect(() => {
    if (editingSession) {
      setSelectedClassId(editingSession.classId);
      setDate(editingSession.date);
      setLessonContent(editingSession.lessonContent);
      setRecordLink(editingSession.recordLink || '');
      setQuizletUrl(editingSession.quizletUrl || '');
      setIsChargedAbsenceSession(editingSession.isChargedAbsenceSession || false);
      setHasNoHomework(editingSession.hasNoHomework || false);
      setHomeworkItems(editingSession.homeworkItems || [
        { id: `hw_${Date.now()}_1`, title: 'Bài 1: Làm bài tập nói/viết', content: '', attachmentUrl: '' }
      ]);
      setStudentFeedbacks(editingSession.studentFeedbacks || {});
      setMaterials(editingSession.sessionMaterials || []);

      const attMap: Record<string, 'present' | 'excused' | 'unexcused' | 'late'> = {};
      (editingSession.attendance || []).forEach((att) => {
        attMap[att.studentId] = att.status;
      });
      setAttendanceMap(attMap);
    } else {
      const cid = initialClassId || defaultClassId;
      if (cid) {
        setSelectedClassId(cid);
      } else if (classes.length > 0) {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [editingSession, initialClassId, defaultClassId, classes]);

  // Multiple Homework Items List
  const [homeworkItems, setHomeworkItems] = useState<HomeworkTaskItem[]>(
    editingSession?.homeworkItems || [
      { id: `hw_${Date.now()}_1`, title: 'Bài 1: Làm bài tập nói/viết', content: '', attachmentUrl: '' }
    ]
  );

  // Per-Student Individual Feedbacks (studentId -> { strengths, improvements })
  const classStudents = students.filter((s) => s.classIds && s.classIds.includes(selectedClassId));
  const [studentFeedbacks, setStudentFeedbacks] = useState<Record<string, StudentFeedback>>(
    editingSession?.studentFeedbacks || {}
  );

  // Attendance Map
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'excused' | 'unexcused' | 'late'>>({});

  // Materials List
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [materialUrl, setMaterialUrl] = useState<string>('');
  const [materials, setMaterials] = useState<ResourceLink[]>(editingSession?.sessionMaterials || []);

  if (!isOpen) return null;

  // Homework Item Handlers
  const handleAddHomeworkItem = () => {
    setHomeworkItems([
      ...homeworkItems,
      {
        id: `hw_${Date.now()}_${homeworkItems.length + 1}`,
        title: `Bài ${homeworkItems.length + 1}: `,
        content: '',
        attachmentUrl: '',
      },
    ]);
  };

  const handleUpdateHomeworkItem = (index: number, field: keyof HomeworkTaskItem, value: string) => {
    const updated = [...homeworkItems];
    updated[index] = { ...updated[index], [field]: value };
    setHomeworkItems(updated);
  };

  const handleRemoveHomeworkItem = (index: number) => {
    if (homeworkItems.length <= 1) return;
    setHomeworkItems(homeworkItems.filter((_, i) => i !== index));
  };

  // Student Feedback Handlers
  const handleUpdateStudentFeedback = (studentId: string, field: keyof StudentFeedback, value: string) => {
    setStudentFeedbacks({
      ...studentFeedbacks,
      [studentId]: {
        ...studentFeedbacks[studentId],
        [field]: value,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId || !lessonContent) {
      alert('Vui lòng chọn Lớp học và nhập Nội dung bài học!');
      return;
    }

    const currentClass = classes.find((c) => c.id === selectedClassId);

    const attendanceList: AttendanceRecord[] = classStudents.map((std) => ({
      studentId: std.id,
      studentName: std.name,
      status: attendanceMap[std.id] || 'present',
    }));

    if (editingSession) {
      // EDIT EXISTING SESSION
      StorageEngine.updateSession(editingSession.id, {
        classId: selectedClassId,
        date,
        lessonContent,
        homeworkItems: hasNoHomework ? [] : homeworkItems,
        studentFeedbacks,
        recordLink,
        quizletUrl,
        sessionMaterials: materials,
        attendance: attendanceList,
        isChargedAbsenceSession,
        hasNoHomework,
      });
      alert(`Đã cập nhật chỉnh sửa Buổi học #${editingSession.sessionNumber} thành công!`);
    } else {
      // RECORD NEW SESSION
      StorageEngine.recordBulkSession({
        classId: selectedClassId,
        teacherId: currentClass?.teacherId || 'u_teacher_01',
        teacherName: currentClass?.teacherName || 'Giáo viên',
        date,
        lessonContent,
        homeworkItems: hasNoHomework ? [] : homeworkItems,
        studentFeedbacks,
        recordLink,
        quizletUrl,
        sessionMaterials: materials,
        attendanceList,
        isChargedAbsenceSession,
        hasNoHomework,
      });
      alert('Đã tạo buổi học mới thành công!');
    }

    onSessionAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative text-slate-800 dark:text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-pink-100 dark:border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-slate-800 text-pink-700 flex items-center justify-center font-black">
            {editingSession ? <Edit3 className="w-6 h-6 text-pink-600" /> : <PlusCircle className="w-6 h-6 text-pink-600" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingSession ? `✏️ Chỉnh Sửa Buổi Học #${editingSession.sessionNumber}` : 'Cập Nhật Buổi Học Mới'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Chỉnh sửa link Quizlet từ vựng, bài tập về nhà, video record & nhận xét học viên
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-medium">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Chọn Lớp Học *
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!!editingSession}
                className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/50 font-extrabold text-xs"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} ({cls.schedule})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Ngày Học *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/50 font-extrabold text-xs"
                required
              />
            </div>
          </div>

          {/* CHARGED ABSENCE SESSION CHECKBOX */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700/60 shadow-2xs">
            <label className="flex items-center space-x-3 cursor-pointer text-xs font-black text-amber-950 dark:text-amber-300">
              <input
                type="checkbox"
                checked={isChargedAbsenceSession}
                onChange={(e) => setIsChargedAbsenceSession(e.target.checked)}
                className="w-4 h-4 text-pink-500 rounded focus:ring-pink-400 cursor-pointer"
              />
              <span>⚠️ Lớp nghỉ tính phí vì nghỉ quá số lần quy định hoặc học viên không vào lớp</span>
            </label>
            {isChargedAbsenceSession && (
              <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold mt-1.5 pl-7 leading-relaxed">
                Lưu ý: Ca học này vẫn được tính vào buổi dạy hoàn thành và trừ số buổi theo quy định do vắng/hủy quá quy định.
              </p>
            )}
          </div>

          {/* Lesson Content */}
          <div>
            <label className="block font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
              Nội Dung Học Trong Buổi *
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Unit 2 Speaking Part 2 - Từ vựng chủ đề Travel..."
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-pink-200 bg-white dark:bg-slate-800 text-xs font-medium"
              required
            />
          </div>

          {/* LINKS SECTION: RECORD LINK & QUIZLET LINK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-200">
            <div>
              <label className="block font-black text-sky-900 dark:text-sky-300 uppercase mb-1 flex items-center">
                📹 Link Video Record Buổi Học
              </label>
              <input
                type="url"
                placeholder="https://zoom.us/... hoặc Drive"
                value={recordLink}
                onChange={(e) => setRecordLink(e.target.value)}
                className="w-full p-3 rounded-xl border border-sky-200 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-black text-purple-900 dark:text-purple-300 uppercase mb-1 flex items-center">
                🎴 Link Quizlet Từ Vựng Buổi Học
              </label>
              <input
                type="url"
                placeholder="https://quizlet.com/vn/..."
                value={quizletUrl}
                onChange={(e) => setQuizletUrl(e.target.value)}
                className="w-full p-3 rounded-xl border border-purple-200 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>
          </div>

          {/* NO HOMEWORK CHECKBOX */}
          <div className="p-3.5 rounded-2xl bg-pink-50/80 dark:bg-slate-800 border border-pink-200 flex items-center justify-between">
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-black text-pink-950 dark:text-pink-200">
              <input
                type="checkbox"
                checked={hasNoHomework}
                onChange={(e) => setHasNoHomework(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 cursor-pointer"
              />
              <span>🚫 Buổi học này KHÔNG CÓ BÀI TẬP VỀ NHÀ</span>
            </label>
            <span className="text-[10px] text-pink-700 font-medium">
              (Tích chọn nếu buổi học này không giao bài tập)
            </span>
          </div>

          {/* MULTIPLE HOMEWORK TASKS LIST */}
          {!hasNoHomework && (
            <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center">
                <BookOpen className="w-4 h-4 mr-1 text-amber-600" /> Danh Sách Bài Tập Về Nhà ({homeworkItems.length} bài)
              </h4>
              <button
                type="button"
                onClick={handleAddHomeworkItem}
                className="px-3 py-1.5 rounded-xl bg-amber-400 text-white font-extrabold text-xs hover:bg-amber-500 transition flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> + Thêm Bài Tập
              </button>
            </div>

            {homeworkItems.map((item, idx) => (
              <div key={item.id || idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-amber-900 dark:text-amber-300">
                    Bài tập #{idx + 1}
                  </span>
                  {homeworkItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHomeworkItem(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa bài tập này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Tiêu đề bài tập (Ví dụ: Bài 1: Thu âm Speaking Part 2)"
                  value={item.title}
                  onChange={(e) => handleUpdateHomeworkItem(idx, 'title', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-200 text-xs font-bold"
                  required
                />

                <textarea
                  rows={2}
                  placeholder="Nội dung/hướng dẫn chi tiết cho bài tập này..."
                  value={item.content || ''}
                  onChange={(e) => handleUpdateHomeworkItem(idx, 'content', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-200 text-xs font-medium"
                />

                <input
                  type="url"
                  placeholder="Link file đính kèm/đề bài (nếu có: https://...)"
                  value={item.attachmentUrl || ''}
                  onChange={(e) => handleUpdateHomeworkItem(idx, 'attachmentUrl', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-200 text-xs font-medium"
                />
              </div>
            ))}
          </div>

          {/* INDIVIDUAL PER-STUDENT FEEDBACKS */}
          <div className="p-4 rounded-3xl bg-pink-50/60 dark:bg-slate-800/60 border border-pink-200 space-y-4">
            <h4 className="font-black text-xs text-pink-900 dark:text-pink-300 uppercase tracking-wider">
              💬 Nhận Xét Riêng Cho Từng Học Viên Trong Lớp ({classStudents.length} em)
            </h4>

            {classStudents.map((std) => {
              const fb = studentFeedbacks[std.id] || {};

              return (
                <div key={std.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-pink-100 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-pink-100 pb-2">
                    <img src={std.avatar} alt={std.name} className="w-8 h-8 rounded-xl object-cover" />
                    <span className="font-black text-xs text-slate-900 dark:text-white">
                      Học viên: {std.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                        🌟 Điểm mạnh riêng hôm nay:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ví dụ: Phát âm ending sound rất tốt, tự tin trả lời..."
                        value={fb.strengths || ''}
                        onChange={(e) => handleUpdateStudentFeedback(std.id, 'strengths', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-emerald-200 text-xs bg-emerald-50/30"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300 mb-1">
                        🎯 Điểm cần cải thiện:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ví dụ: Chú ý thì quá khứ đơn khi viết essay..."
                        value={fb.improvements || ''}
                        onChange={(e) => handleUpdateStudentFeedback(std.id, 'improvements', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-rose-200 text-xs bg-rose-50/30"
                      />
                    </div>

                    {/* Link tài liệu riêng trong buổi học cho học viên này */}
                    <div className="sm:col-span-2 pt-2 border-t border-dashed border-pink-100 dark:border-slate-700/60 space-y-1">
                      <label className="block text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center">
                        <Link2 className="w-3.5 h-3.5 mr-1 text-sky-600 shrink-0" /> 📎 Tài liệu / Phiếu bài tập riêng cho em {std.name}:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Tên tài liệu (Ví dụ: Phiếu bài tập Reading nâng cao)"
                          value={fb.materialTitle || ''}
                          onChange={(e) => handleUpdateStudentFeedback(std.id, 'materialTitle', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs bg-sky-50/20 font-bold text-slate-800 dark:text-white"
                        />
                        <input
                          type="url"
                          placeholder="Link dẫn đến (https://drive.google.com/...)"
                          value={fb.materialUrl || ''}
                          onChange={(e) => handleUpdateStudentFeedback(std.id, 'materialUrl', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-mono text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center"
            >
              {editingSession ? <Edit3 className="w-4 h-4 mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
              {editingSession ? `Lưu Thay Đổi Buổi Học #${editingSession.sessionNumber}` : 'Lưu Buổi Học Mới'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

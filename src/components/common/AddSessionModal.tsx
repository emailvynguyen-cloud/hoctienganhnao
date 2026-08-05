import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Class, Student, Session, AttendanceRecord, ResourceLink, HomeworkTaskItem, StudentFeedback } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
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

// ----------------------------------------------------------------------
// MEMOIZED DEBOUNCED INPUT COMPONENTS FOR 60FPS TYPING PERFORMANCE
// ----------------------------------------------------------------------
interface DebouncedTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onDebouncedChange: (val: string) => void;
  delay?: number;
}

const DebouncedTextArea = memo<DebouncedTextAreaProps>(({ value, onDebouncedChange, delay = 300, ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDebouncedChange(val);
    }, delay);
  };

  return <textarea {...props} value={localValue} onChange={handleChange} />;
});
DebouncedTextArea.displayName = 'DebouncedTextArea';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onDebouncedChange: (val: string) => void;
  delay?: number;
}

const DebouncedInput = memo<DebouncedInputProps>(({ value, onDebouncedChange, delay = 300, ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDebouncedChange(val);
    }, delay);
  };

  return <input {...props} value={localValue} onChange={handleChange} />;
});
DebouncedInput.displayName = 'DebouncedInput';

// ----------------------------------------------------------------------
// MEMOIZED SUBCOMPONENT: ISOLATED STUDENT FEEDBACK CARD
// ----------------------------------------------------------------------
interface StudentFeedbackCardProps {
  student: Student;
  initialFeedback?: StudentFeedback;
  onChange: (studentId: string, updatedFb: StudentFeedback) => void;
}

const StudentFeedbackCard = memo<StudentFeedbackCardProps>(({ student, initialFeedback, onChange }) => {
  const [strengths, setStrengths] = useState(initialFeedback?.strengths || '');
  const [improvements, setImprovements] = useState(initialFeedback?.improvements || '');
  const [materialTitle, setMaterialTitle] = useState(initialFeedback?.materialTitle || '');
  const [materialUrl, setMaterialUrl] = useState(initialFeedback?.materialUrl || '');

  useEffect(() => {
    setStrengths(initialFeedback?.strengths || '');
    setImprovements(initialFeedback?.improvements || '');
    setMaterialTitle(initialFeedback?.materialTitle || '');
    setMaterialUrl(initialFeedback?.materialUrl || '');
  }, [initialFeedback]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackRef = useRef({ strengths, improvements, materialTitle, materialUrl });
  feedbackRef.current = { strengths, improvements, materialTitle, materialUrl };

  const triggerDebouncedSync = useCallback((updated: StudentFeedback) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(student.id, updated);
    }, 300);
  }, [student.id, onChange]);

  const handleStrengthsChange = (val: string) => {
    setStrengths(val);
    triggerDebouncedSync({ ...feedbackRef.current, strengths: val });
  };

  const handleImprovementsChange = (val: string) => {
    setImprovements(val);
    triggerDebouncedSync({ ...feedbackRef.current, improvements: val });
  };

  const handleMaterialTitleChange = (val: string) => {
    setMaterialTitle(val);
    triggerDebouncedSync({ ...feedbackRef.current, materialTitle: val });
  };

  const handleMaterialUrlChange = (val: string) => {
    setMaterialUrl(val);
    triggerDebouncedSync({ ...feedbackRef.current, materialUrl: val });
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 space-y-3 shadow-2xs">
      <div className="flex items-center space-x-2 border-b border-pink-100 dark:border-slate-700 pb-2">
        <img
          src={resolveAvatarUrl(student.avatar)}
          alt={student.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
          }}
          className="w-8 h-8 rounded-xl object-cover border border-pink-200"
        />
        <span className="font-black text-xs text-slate-900 dark:text-white">
          Học viên: {student.name}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            🌟 Điểm mạnh riêng hôm nay:
          </label>
          <textarea
            rows={3}
            placeholder="Ví dụ: Phát âm ending sound rất tốt, tự tin trả lời..."
            value={strengths}
            onChange={(e) => handleStrengthsChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs bg-emerald-50/30 dark:bg-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300 mb-1">
            🎯 Điểm cần cải thiện:
          </label>
          <textarea
            rows={3}
            placeholder="Ví dụ: Chú ý thì quá khứ đơn khi viết essay..."
            value={improvements}
            onChange={(e) => handleImprovementsChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-xs bg-rose-50/30 dark:bg-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        <div className="sm:col-span-2 pt-2 border-t border-dashed border-pink-100 dark:border-slate-700/60 space-y-1">
          <label className="block text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center">
            <Link2 className="w-3.5 h-3.5 mr-1 text-sky-600 shrink-0" /> 📎 Tài liệu / Phiếu bài tập riêng cho em {student.name}:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Tên tài liệu (Ví dụ: Phiếu bài tập Reading nâng cao)"
              value={materialTitle}
              onChange={(e) => handleMaterialTitleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs bg-sky-50/20 dark:bg-slate-900 font-bold text-slate-800 dark:text-white"
            />
            <input
              type="url"
              placeholder="Link dẫn đến (https://drive.google.com/...)"
              value={materialUrl}
              onChange={(e) => handleMaterialUrlChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.student.id === nextProps.student.id;
});

StudentFeedbackCard.displayName = 'StudentFeedbackCard';

// ----------------------------------------------------------------------
// MEMOIZED SUBCOMPONENT: ISOLATED HOMEWORK ITEM CARD
// ----------------------------------------------------------------------
interface HomeworkItemCardProps {
  item: HomeworkTaskItem;
  index: number;
  canRemove: boolean;
  onUpdate: (index: number, field: keyof HomeworkTaskItem, value: string) => void;
  onRemove: (index: number) => void;
}

const HomeworkItemCard = memo<HomeworkItemCardProps>(({ item, index, canRemove, onUpdate, onRemove }) => {
  const [title, setTitle] = useState(item.title || '');
  const [content, setContent] = useState(item.content || '');
  const [attachmentUrl, setAttachmentUrl] = useState(item.attachmentUrl || '');

  useEffect(() => {
    setTitle(item.title || '');
    setContent(item.content || '');
    setAttachmentUrl(item.attachmentUrl || '');
  }, [item.id]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDebouncedSync = useCallback((field: keyof HomeworkTaskItem, val: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdate(index, field, val);
    }, 300);
  }, [index, onUpdate]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerDebouncedSync('title', val);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerDebouncedSync('content', val);
  };

  const handleUrlChange = (val: string) => {
    setAttachmentUrl(val);
    triggerDebouncedSync('attachmentUrl', val);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-2 relative shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="font-black text-xs text-amber-900 dark:text-amber-300">
          Bài tập #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
            title="Xóa bài tập này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Tiêu đề bài tập (Ví dụ: Bài 1: Thu âm Speaking Part 2)"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        required
      />

      <textarea
        rows={3}
        placeholder="Nội dung/hướng dẫn chi tiết cho bài tập này..."
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed resize-y"
      />

      <input
        type="url"
        placeholder="Link file đính kèm/đề bài (nếu có: https://...)"
        value={attachmentUrl}
        onChange={(e) => handleUrlChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id && prevProps.index === nextProps.index && prevProps.canRemove === nextProps.canRemove;
});

HomeworkItemCard.displayName = 'HomeworkItemCard';

// ----------------------------------------------------------------------
// MAIN ADD SESSION MODAL COMPONENT
// ----------------------------------------------------------------------
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
    if (!isOpen) return;

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
  }, [isOpen, editingSession?.id]);

  // Multiple Homework Items List
  const [homeworkItems, setHomeworkItems] = useState<HomeworkTaskItem[]>(
    editingSession?.homeworkItems || [
      { id: `hw_${Date.now()}_1`, title: 'Bài 1: Làm bài tập nói/viết', content: '', attachmentUrl: '' }
    ]
  );

  // Memoize classStudents to prevent re-filtering on every keystroke
  const classStudents = React.useMemo(
    () => students.filter((s) => s && s.classIds && s.classIds.includes(selectedClassId)),
    [students, selectedClassId]
  );

  // Per-Student Individual Feedbacks (studentId -> { strengths, improvements })
  const [studentFeedbacks, setStudentFeedbacks] = useState<Record<string, StudentFeedback>>(
    editingSession?.studentFeedbacks || {}
  );

  // Attendance Map
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'excused' | 'unexcused' | 'late'>>({});

  // Materials List
  const [materials, setMaterials] = useState<ResourceLink[]>(editingSession?.sessionMaterials || []);

  if (!isOpen) return null;

  // Homework Item Handlers
  const handleAddHomeworkItem = () => {
    setHomeworkItems((prev) => [
      ...prev,
      {
        id: `hw_${Date.now()}_${prev.length + 1}`,
        title: `Bài ${prev.length + 1}: `,
        content: '',
        attachmentUrl: '',
      },
    ]);
  };

  const handleUpdateHomeworkItem = useCallback((index: number, field: keyof HomeworkTaskItem, value: string) => {
    setHomeworkItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }, []);

  const handleRemoveHomeworkItem = useCallback((index: number) => {
    setHomeworkItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Student Feedback Handlers
  const handleSingleStudentFeedbackChange = useCallback((studentId: string, updatedFb: StudentFeedback) => {
    setStudentFeedbacks((prev) => ({
      ...prev,
      [studentId]: updatedFb,
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId) {
      alert('Vui lòng chọn Lớp học!');
      return;
    }

    let finalLessonContent = lessonContent;
    if (isChargedAbsenceSession) {
      if (!finalLessonContent || !finalLessonContent.trim()) {
        finalLessonContent = 'Nghỉ tính phí do vi phạm quy định / học viên không vào lớp';
      }
    } else if (!finalLessonContent || !finalLessonContent.trim()) {
      alert('Vui lòng nhập Nội dung bài học!');
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
        lessonContent: finalLessonContent,
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
        lessonContent: finalLessonContent,
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

  const isLockedToSingleClass = !!(initialClassId || defaultClassId || editingSession);

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
                Lớp Học
              </label>
              {isLockedToSingleClass ? (
                <div className="w-full p-3 rounded-xl border border-pink-300 bg-pink-100/80 font-black text-xs text-pink-950 flex items-center shadow-2xs">
                  <span>🎓 {classes.find((c) => c.id === selectedClassId)?.className || 'Lớp Hiện Tại'}</span>
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/50 font-extrabold text-xs"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.schedule})
                    </option>
                  ))}
                </select>
              )}
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

          {/* OPTIONAL CONTENT SECTIONS */}
          {isChargedAbsenceSession ? (
            <div className="p-4 rounded-2xl bg-amber-100/90 dark:bg-slate-800 border border-amber-300 text-amber-950 dark:text-amber-200 text-xs font-bold space-y-1">
              <span>📌 Ca học này đã được đánh dấu là Nghỉ tính phí.</span>
              <p className="font-normal opacity-90">Nội dung bài học, bài tập về nhà và nhận xét đã được tự động tạm ẩn để giáo viên không cần phải nhập. Khi bỏ tích, dữ liệu đã nhập (nếu có) sẽ hiển thị lại bình thường.</p>
            </div>
          ) : (
            <>
              {/* Lesson Content */}
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                  Nội Dung Học Trong Buổi *
                </label>
                <DebouncedTextArea
                  rows={4}
                  placeholder="Ví dụ: Unit 2 Speaking Part 2 - Từ vựng chủ đề Travel..."
                  value={lessonContent}
                  onDebouncedChange={setLessonContent}
                  className="w-full p-3 rounded-xl border border-pink-200 bg-white dark:bg-slate-800 text-xs font-medium whitespace-pre-wrap leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-pink-300"
                  required={!isChargedAbsenceSession}
                />
              </div>

              {/* LINKS SECTION: RECORD LINK & QUIZLET LINK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-200">
                <div>
                  <label className="block font-black text-sky-900 dark:text-sky-300 uppercase mb-1 flex items-center">
                    📹 Link Video Record Buổi Học
                  </label>
                  <DebouncedInput
                    type="url"
                    placeholder="https://zoom.us/... hoặc Drive"
                    value={recordLink}
                    onDebouncedChange={setRecordLink}
                    className="w-full p-3 rounded-xl border border-sky-200 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-purple-900 dark:text-purple-300 uppercase mb-1 flex items-center">
                    🎴 Link Quizlet Từ Vựng Buổi Học
                  </label>
                  <DebouncedInput
                    type="url"
                    placeholder="https://quizlet.com/vn/..."
                    value={quizletUrl}
                    onDebouncedChange={setQuizletUrl}
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
                      className="px-3 py-1.5 rounded-xl bg-amber-400 text-white font-extrabold text-xs hover:bg-amber-500 transition flex items-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> + Thêm Bài Tập
                    </button>
                  </div>

                  {homeworkItems.map((item, idx) => (
                    <HomeworkItemCard
                      key={item.id || idx}
                      item={item}
                      index={idx}
                      canRemove={homeworkItems.length > 1}
                      onUpdate={handleUpdateHomeworkItem}
                      onRemove={handleRemoveHomeworkItem}
                    />
                  ))}
                </div>
              )}

              {/* INDIVIDUAL PER-STUDENT FEEDBACKS */}
              <div className="p-4 rounded-3xl bg-pink-50/60 dark:bg-slate-800/60 border border-pink-200 space-y-4">
                <h4 className="font-black text-xs text-pink-900 dark:text-pink-300 uppercase tracking-wider">
                  💬 Nhận Xét Riêng Cho Từng Học Viên Trong Lớp ({classStudents.length} em)
                </h4>

                {classStudents.map((std) => (
                  <StudentFeedbackCard
                    key={std.id}
                    student={std}
                    initialFeedback={studentFeedbacks[std.id]}
                    onChange={handleSingleStudentFeedbackChange}
                  />
                ))}
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center cursor-pointer"
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

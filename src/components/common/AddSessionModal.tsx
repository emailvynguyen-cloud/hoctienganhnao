import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Class, Student, Session, AttendanceRecord, ResourceLink, HomeworkTaskItem, StudentFeedback } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { DraftStorage, FormDraft } from '../../lib/draftStorage';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { PlusCircle, Calendar, BookOpen, Video, Link2, CheckCircle2, UserCheck, X, FileText, Image, Sparkles, Plus, Trash2, Edit3, FolderOpen } from 'lucide-react';
import { notifySessionUpdated, notifyQuizletAdded } from '../../lib/webPush';

interface DraftPromptBannerProps {
  draftKey: string;
  onRestore: (draftData: any) => void;
  onDiscard?: () => void;
}

export const DraftPromptBanner: React.FC<DraftPromptBannerProps> = ({ draftKey, onRestore, onDiscard }) => {
  const [draft, setDraft] = React.useState<FormDraft | null>(() => DraftStorage.getDraft(draftKey));

  if (!draft || !draft.data) return null;

  const savedTimeLabel = draft.savedAt
    ? new Date(draft.savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : 'gần đây';

  const handleRestore = () => {
    onRestore(draft.data);
    setDraft(null);
  };

  const handleDiscard = () => {
    DraftStorage.clearDraft(draftKey);
    setDraft(null);
    if (onDiscard) onDiscard();
  };

  return (
    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
      <div className="flex items-center space-x-2.5">
        <span className="text-lg shrink-0">📝</span>
        <div>
          <span className="font-extrabold block sm:inline">Phát hiện bản nháp chưa lưu (lúc {savedTimeLabel}).</span>
          <span className="text-amber-800 dark:text-amber-300 font-medium ml-1 block sm:inline">Bạn có muốn khôi phục không?</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={handleRestore}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-2xs transition duration-150 cursor-pointer"
        >
          Khôi phục
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition duration-150 cursor-pointer"
        >
          Bỏ
        </button>
      </div>
    </div>
  );
};

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

  const getInitialMaterials = (fb?: StudentFeedback): ResourceLink[] => {
    if (fb?.materials && fb.materials.length > 0) return fb.materials;
    if (fb?.materialTitle || fb?.materialUrl) {
      return [{ id: `mat_${Date.now()}_legacy`, title: fb.materialTitle || '', url: fb.materialUrl || '' }];
    }
    return [];
  };

  const [studentMaterials, setStudentMaterials] = useState<ResourceLink[]>(() => getInitialMaterials(initialFeedback));

  useEffect(() => {
    setStrengths(initialFeedback?.strengths || '');
    setImprovements(initialFeedback?.improvements || '');
    setStudentMaterials(getInitialMaterials(initialFeedback));
  }, [initialFeedback]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackRef = useRef({ strengths, improvements, studentMaterials });
  feedbackRef.current = { strengths, improvements, studentMaterials };

  const triggerDebouncedSync = useCallback((updated: StudentFeedback) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(student.id, updated);
    }, 300);
  }, [student.id, onChange]);

  const handleStrengthsChange = (val: string) => {
    setStrengths(val);
    triggerDebouncedSync({ ...feedbackRef.current, strengths: val, materials: studentMaterials });
  };

  const handleImprovementsChange = (val: string) => {
    setImprovements(val);
    triggerDebouncedSync({ ...feedbackRef.current, improvements: val, materials: studentMaterials });
  };

  const handleAddStudentMaterial = () => {
    const updated = [
      ...studentMaterials,
      { id: `mat_${Date.now()}_${studentMaterials.length + 1}`, title: '', url: '' },
    ];
    setStudentMaterials(updated);
    triggerDebouncedSync({ ...feedbackRef.current, materials: updated });
  };

  const handleUpdateStudentMaterial = (index: number, field: keyof ResourceLink, val: string) => {
    const updated = [...studentMaterials];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setStudentMaterials(updated);
      triggerDebouncedSync({ ...feedbackRef.current, materials: updated });
    }
  };

  const handleRemoveStudentMaterial = (index: number) => {
    const updated = studentMaterials.filter((_, i) => i !== index);
    setStudentMaterials(updated);
    triggerDebouncedSync({ ...feedbackRef.current, materials: updated });
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

        {/* PER-STUDENT EXTRA MATERIALS SECTION WITH + THÊM TÀI LIỆU BUTTON */}
        <div className="sm:col-span-2 pt-3 border-t border-dashed border-sky-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-black text-sky-900 dark:text-sky-300 flex items-center">
              <Link2 className="w-3.5 h-3.5 mr-1 text-sky-600 shrink-0" /> 📎 Tài liệu / Phiếu bài tập riêng cho em {student.name} ({studentMaterials.length})
            </label>
            <button
              type="button"
              onClick={handleAddStudentMaterial}
              className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition flex items-center cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 mr-1" /> + Thêm Tài Liệu
            </button>
          </div>

          {studentMaterials.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-sky-50/40 dark:bg-slate-900 border border-dashed border-sky-200 dark:border-slate-700 text-center">
              <button
                type="button"
                onClick={handleAddStudentMaterial}
                className="text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center cursor-pointer"
              >
                <Plus className="w-3 h-3 mr-1" /> + Bấm để thêm tài liệu riêng (file bài tập, slide, link Drive...) cho em {student.name}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {studentMaterials.map((mat, idx) => (
                <div
                  key={mat.id || idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-sky-50/30 dark:bg-slate-900 border border-sky-100 dark:border-slate-700"
                >
                  <input
                    type="text"
                    placeholder={`Tên tài liệu #${idx + 1} (VD: Phiếu Reading nâng cao)`}
                    value={mat.title || ''}
                    onChange={(e) => handleUpdateStudentMaterial(idx, 'title', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 text-xs bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="Link URL (https://drive.google.com/...)"
                    value={mat.url || ''}
                    onChange={(e) => handleUpdateStudentMaterial(idx, 'url', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStudentMaterial(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer self-end sm:self-center"
                    title="Xóa tài liệu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
  const [studentQuizlets, setStudentQuizlets] = useState<Record<string, string>>(editingSession?.studentQuizlets || {});
  const [isChargedAbsenceSession, setIsChargedAbsenceSession] = useState<boolean>(editingSession?.isChargedAbsenceSession || false);
  const [isExcusedAbsenceSession, setIsExcusedAbsenceSession] = useState<boolean>(editingSession?.isExcusedAbsenceSession || false);
  const [hasNoHomework, setHasNoHomework] = useState<boolean>(editingSession?.hasNoHomework || false);
  const [hasNoQuizlet, setHasNoQuizlet] = useState<boolean>(editingSession?.hasNoQuizlet || false);

  const draftKey = editingSession ? `session_edit_${editingSession.id}` : `session_add_${selectedClassId || 'new'}`;

  useEffect(() => {
    if (!isOpen) return;

    if (editingSession) {
      setSelectedClassId(editingSession.classId);
      setDate(editingSession.date);
      setLessonContent(editingSession.lessonContent);
      setRecordLink(editingSession.recordLink || '');
      setQuizletUrl(editingSession.quizletUrl || '');
      setStudentQuizlets(editingSession.studentQuizlets || {});
      setIsChargedAbsenceSession(editingSession.isChargedAbsenceSession || false);
      setIsExcusedAbsenceSession(editingSession.isExcusedAbsenceSession || false);
      setHasNoHomework(editingSession.hasNoHomework || false);
      setHasNoQuizlet(editingSession.hasNoQuizlet || false);
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

  // AUTO-SAVE DRAFT TO LOCALSTORAGE
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (
        lessonContent ||
        recordLink ||
        quizletUrl ||
        Object.keys(studentQuizlets).length > 0 ||
        homeworkItems.some((h) => h.title || h.content) ||
        Object.keys(studentFeedbacks).length > 0
      ) {
        DraftStorage.saveDraft(draftKey, {
          selectedClassId,
          date,
          lessonContent,
          recordLink,
          quizletUrl,
          studentQuizlets,
          isChargedAbsenceSession,
          hasNoHomework,
          homeworkItems,
          studentFeedbacks,
          materials,
          attendanceMap,
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    draftKey,
    selectedClassId,
    date,
    lessonContent,
    recordLink,
    quizletUrl,
    studentQuizlets,
    isChargedAbsenceSession,
    hasNoHomework,
    homeworkItems,
    studentFeedbacks,
    materials,
    attendanceMap,
  ]);

  const handleRestoreDraft = (data: any) => {
    if (!data) return;
    if (data.selectedClassId) setSelectedClassId(data.selectedClassId);
    if (data.date) setDate(data.date);
    if (data.lessonContent) setLessonContent(data.lessonContent);
    if (data.recordLink !== undefined) setRecordLink(data.recordLink);
    if (data.quizletUrl !== undefined) setQuizletUrl(data.quizletUrl);
    if (data.studentQuizlets) setStudentQuizlets(data.studentQuizlets);
    if (data.isChargedAbsenceSession !== undefined) setIsChargedAbsenceSession(data.isChargedAbsenceSession);
    if (data.hasNoHomework !== undefined) setHasNoHomework(data.hasNoHomework);
    if (data.homeworkItems) setHomeworkItems(data.homeworkItems);
    if (data.studentFeedbacks) setStudentFeedbacks(data.studentFeedbacks);
    if (data.materials) setMaterials(data.materials);
    if (data.attendanceMap) setAttendanceMap(data.attendanceMap);
  };

  if (!isOpen) return null;

  // Material Handlers
  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: `mat_${Date.now()}_${prev.length + 1}`,
        title: '',
        url: '',
      },
    ]);
  };

  const handleUpdateMaterial = (index: number, field: keyof ResourceLink, value: string) => {
    setMaterials((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const lastHomeworkRef = useRef<HTMLDivElement | null>(null);

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
    setTimeout(() => {
      lastHomeworkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
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
    if (isExcusedAbsenceSession) {
      if (!finalLessonContent || !finalLessonContent.trim()) {
        finalLessonContent = 'Nghỉ có phép (không tính phí)';
      }
    } else if (isChargedAbsenceSession) {
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
      status: isExcusedAbsenceSession ? 'excused' : (attendanceMap[std.id] || 'present'),
    }));

    const finalStudentQuizlets: Record<string, string> = { ...studentQuizlets };
    let finalQuizletUrl = '';

    if (classStudents.length === 1) {
      const singleStdId = classStudents[0]?.id;
      if (singleStdId) {
        finalQuizletUrl = studentQuizlets[singleStdId] !== undefined ? studentQuizlets[singleStdId] : quizletUrl;
        finalStudentQuizlets[singleStdId] = finalQuizletUrl;
      } else {
        finalQuizletUrl = quizletUrl;
      }
    } else {
      // For 2 or more students: quizletUrl is set to '' so no student accidentally inherits it
      finalQuizletUrl = '';
    }

    if (editingSession) {
      // EDIT EXISTING SESSION
      StorageEngine.updateSession(editingSession.id, {
        classId: selectedClassId,
        date,
        lessonContent: finalLessonContent,
        homeworkItems: (hasNoHomework || isExcusedAbsenceSession) ? [] : homeworkItems,
        studentFeedbacks: isExcusedAbsenceSession ? {} : studentFeedbacks,
        recordLink: isExcusedAbsenceSession ? '' : recordLink,
        quizletUrl: (hasNoQuizlet || isExcusedAbsenceSession) ? '' : finalQuizletUrl,
        studentQuizlets: (hasNoQuizlet || isExcusedAbsenceSession) ? {} : finalStudentQuizlets,
        sessionMaterials: isExcusedAbsenceSession ? [] : materials,
        attendance: attendanceList,
        isChargedAbsenceSession,
        isExcusedAbsenceSession,
        hasNoHomework,
        hasNoQuizlet,
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
        homeworkItems: (hasNoHomework || isExcusedAbsenceSession) ? [] : homeworkItems,
        studentFeedbacks: isExcusedAbsenceSession ? {} : studentFeedbacks,
        recordLink: isExcusedAbsenceSession ? '' : recordLink,
        quizletUrl: (hasNoQuizlet || isExcusedAbsenceSession) ? '' : finalQuizletUrl,
        studentQuizlets: (hasNoQuizlet || isExcusedAbsenceSession) ? {} : finalStudentQuizlets,
        sessionMaterials: isExcusedAbsenceSession ? [] : materials,
        attendanceList,
        isChargedAbsenceSession,
        isExcusedAbsenceSession,
        hasNoHomework,
        hasNoQuizlet,
      });
      alert(isExcusedAbsenceSession ? 'Đã lưu ghi nhận buổi Nghỉ có phép thành công!' : 'Đã tạo buổi học mới thành công!');
    }

    // Trigger Web Push Notifications for Students
    if (!isExcusedAbsenceSession) {
      const firstQuizlet = finalQuizletUrl || Object.values(finalStudentQuizlets).find((u) => u && u.trim());
      if (firstQuizlet) {
        notifyQuizletAdded(date, firstQuizlet);
      } else {
        notifySessionUpdated(date);
      }
    }

      onSessionAdded();
      DraftStorage.clearDraft(draftKey);
      onClose();
    };

    const isLockedToSingleClass = !!(initialClassId || defaultClassId || editingSession);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative text-slate-800 dark:text-white">
          
          <button
            onClick={() => {
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
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

          <DraftPromptBanner draftKey={draftKey} onRestore={handleRestoreDraft} />

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

          {/* SPECIAL SESSION STATUS CHECKBOXES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* EXCUSED ABSENCE (FREE / NON-CHARGED) CHECKBOX */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
              <label className="flex items-center space-x-3 cursor-pointer text-xs font-black text-emerald-950 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={isExcusedAbsenceSession}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsExcusedAbsenceSession(checked);
                    if (checked) {
                      setIsChargedAbsenceSession(false);
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-400 cursor-pointer"
                />
                <span>🟢 Nghỉ có phép (không tính phí)</span>
              </label>
              {isExcusedAbsenceSession && (
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold mt-1.5 pl-7 leading-relaxed">
                  Lưu ý: Không tính học phí, không trừ số buổi học còn lại của gói, không ghi nhận vắng sai quy định, tự động cộng vào tổng buổi nghỉ trong tháng.
                </p>
              )}
            </div>

            {/* CHARGED ABSENCE CHECKBOX */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <label className="flex items-center space-x-3 cursor-pointer text-xs font-black text-amber-950 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={isChargedAbsenceSession}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsChargedAbsenceSession(checked);
                    if (checked) {
                      setIsExcusedAbsenceSession(false);
                    }
                  }}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-400 cursor-pointer"
                />
                <span>⚠️ Lớp nghỉ tính phí (nghỉ sai quy định)</span>
              </label>
              {isChargedAbsenceSession && (
                <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold mt-1.5 pl-7 leading-relaxed">
                  Lưu ý: Ca học này vẫn được tính vào buổi dạy hoàn thành và trừ số buổi theo quy định do vắng/hủy quá quy định.
                </p>
              )}
            </div>
          </div>

          {/* OPTIONAL CONTENT SECTIONS */}
          {isExcusedAbsenceSession ? (
            <div className="p-4 rounded-2xl bg-emerald-100/90 dark:bg-slate-800 border border-emerald-300 text-emerald-950 dark:text-emerald-200 text-xs font-bold space-y-1">
              <span>🟢 Ca học này đã được đánh dấu là Nghỉ có phép (không tính phí).</span>
              <p className="font-normal opacity-90">Nội dung bài học, bài tập về nhà, Quizlet và nhận xét đã được tự động tạm ẩn. Không bắt buộc nhập bất kỳ thông tin nào khác.</p>
            </div>
          ) : isChargedAbsenceSession ? (
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
              <div className="space-y-4 p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-200">
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

                {/* NO QUIZLET TOGGLE CHECKBOX */}
                <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-slate-800 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between col-span-1 sm:col-span-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-black text-purple-950 dark:text-purple-200">
                    <input
                      type="checkbox"
                      checked={hasNoQuizlet}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasNoQuizlet(checked);
                        if (checked) {
                          setQuizletUrl('');
                          setStudentQuizlets({});
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                    />
                    <span>🚫 Buổi học này KHÔNG CÓ BÀI TẬP QUIZLET</span>
                  </label>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                    (Tích chọn nếu không dùng Quizlet — Tự động hủy/xóa task nhắc nhở)
                  </span>
                </div>

                {hasNoQuizlet ? (
                  <div className="p-3.5 rounded-2xl bg-purple-100/70 dark:bg-slate-800 border border-purple-200 text-purple-900 dark:text-purple-300 text-xs font-bold col-span-1 sm:col-span-2">
                    <span>🚫 Đã đánh dấu buổi học không sử dụng Quizlet. Hệ thống sẽ KHÔNG tạo cảnh báo "Chưa thêm Quizlet" cho buổi này trong Công việc cần xử lý.</span>
                  </div>
                ) : classStudents.length <= 1 ? (
                  <div>
                    <label className="block font-black text-purple-900 dark:text-purple-300 uppercase mb-1 flex items-center">
                      🎴 Link Quizlet Từ Vựng Buổi Học {classStudents[0]?.name ? `(${classStudents[0].name})` : ''}
                    </label>
                    <DebouncedInput
                      type="url"
                      placeholder="https://quizlet.com/vn/..."
                      value={classStudents[0]?.id ? (studentQuizlets[classStudents[0].id] ?? quizletUrl) : quizletUrl}
                      onDebouncedChange={(val) => {
                        setQuizletUrl(val);
                        if (classStudents[0]?.id) {
                          setStudentQuizlets((prev) => ({
                            ...prev,
                            [classStudents[0].id]: val,
                          }));
                        }
                      }}
                      className="w-full p-3 rounded-xl border border-purple-200 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 pt-3 border-t border-sky-200/80 dark:border-slate-700/80">
                    <div>
                      <label className="block font-black text-purple-900 dark:text-purple-300 uppercase flex items-center text-xs">
                        🎴 Link Quizlet Từ Vựng Riêng Cho Từng Học Viên ({classStudents.length} em)
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Mỗi học viên có thể có link Quizlet riêng hoặc để trống nếu không có.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {classStudents.map((std) => (
                        <div key={std.id} className="p-3 rounded-xl bg-purple-50/80 dark:bg-slate-800/90 border border-purple-200 dark:border-purple-900/60 space-y-1">
                          <label className="block font-black text-xs text-purple-950 dark:text-purple-200 flex items-center">
                            👤 {std.name}
                          </label>
                          <DebouncedInput
                            type="url"
                            placeholder={`Link Quizlet cho ${std.name} (để trống nếu không có)...`}
                            value={studentQuizlets[std.id] || ''}
                            onDebouncedChange={(val) => {
                              setStudentQuizlets((prev) => ({
                                ...prev,
                                [std.id]: val,
                              }));
                            }}
                            className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-slate-700/80 pb-2">
                    <h4 className="font-black text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center">
                      <BookOpen className="w-4 h-4 mr-1.5 text-amber-600" /> Danh Sách Bài Tập Về Nhà ({homeworkItems.length} bài)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {homeworkItems.map((item, idx) => (
                      <div key={item.id || idx} ref={idx === homeworkItems.length - 1 ? lastHomeworkRef : null}>
                        <HomeworkItemCard
                          item={item}
                          index={idx}
                          canRemove={homeworkItems.length > 1}
                          onUpdate={handleUpdateHomeworkItem}
                          onRemove={handleRemoveHomeworkItem}
                        />
                      </div>
                    ))}
                  </div>

                  {/* MOVED TO BOTTOM: + THÊM BÀI TẬP BUTTON */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddHomeworkItem}
                      className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-2xs transition duration-150 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> + Thêm Bài Tập Về Nhà Mới
                    </button>
                  </div>
                </div>
              )}

              {/* INDIVIDUAL PER-STUDENT FEEDBACKS */}
              <div className="p-5 sm:p-6 rounded-3xl bg-pink-50/60 dark:bg-slate-800/60 border border-pink-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center space-x-2 border-b border-pink-200/80 dark:border-slate-700/80 pb-2.5">
                  <span className="w-7 h-7 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center font-black text-sm shrink-0 border border-pink-200/60">
                    💬
                  </span>
                  <h4 className="font-black text-xs text-pink-950 dark:text-pink-200 uppercase tracking-wider">
                    NHẬN XÉT RIÊNG CHO TỪNG HỌC VIÊN TRONG LỚP ({classStudents.length} em)
                  </h4>
                </div>

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

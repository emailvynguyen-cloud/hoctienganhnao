import React, { useState, useEffect } from 'react';
import { Book, Chapter, Lesson, Exercise } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  FileText,
  HelpCircle,
  Eye,
  Sparkles,
  Layers,
  CheckCircle2,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface LessonWorkspaceProps {
  book: Book;
  chapter: Chapter;
  lesson: Lesson;
  isSuperAdmin: boolean;
  onBackToChapter: () => void;
  onOpenExerciseEditor: (exercise?: Exercise) => void;
  onOpenExerciseViewer: (exercise: Exercise) => void;
}

export const LessonWorkspace: React.FC<LessonWorkspaceProps> = ({
  book,
  chapter,
  lesson,
  isSuperAdmin,
  onBackToChapter,
  onOpenExerciseEditor,
  onOpenExerciseViewer,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteTargetExercise, setDeleteTargetExercise] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadLessonExercises();
  }, [lesson.id]);

  const loadLessonExercises = async () => {
    setIsLoading(true);
    const exList = await LearningHubService.getExercises(lesson.id);
    setExercises(exList);
    setIsLoading(false);
  };

  const handleDuplicateExercise = async (ex: Exercise) => {
    if (!isSuperAdmin) return;
    const duplicated = await LearningHubService.duplicateExercise(ex, 'super_admin');
    if (duplicated) {
      alert(`Đã nhân bản bài tập "${ex.title}" thành "${duplicated.title}" với ID độc lập!`);
      await loadLessonExercises();
    } else {
      alert('Không thể nhân bản bài tập. Vui lòng kiểm tra quyền Super Admin.');
    }
  };

  const handleDeleteExerciseConfirmed = async () => {
    if (!deleteTargetExercise || !isSuperAdmin) return;
    setIsDeleting(true);
    const success = await LearningHubService.deleteExercise(deleteTargetExercise.id, 'super_admin');
    if (success) {
      setDeleteTargetExercise(null);
      await loadLessonExercises();
    } else {
      alert('Không thể xóa bài tập. Vui lòng kiểm tra quyền Super Admin.');
    }
    setIsDeleting(false);
  };

  const getExerciseTypeBadge = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return { label: '📚 Vocabulary (Từ vựng)', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' };
      case 'grammar':
        return { label: '📐 Grammar (Ngữ pháp)', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'multiple-choice':
        return { label: '📝 Trắc Nghiệm Multiple Choice', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' };
      case 'fill-blank':
        return { label: '✏️ Điền Ô Trống (Fill in Blank)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' };
      case 'matching':
        return { label: '🔗 Nối Cặp (Matching)', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' };
      case 'translation':
        return { label: '🔄 Dịch Câu (Translation)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'sentence-building':
        return { label: '🔤 Sắp Xếp Câu (Sentence Building)', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' };
      case 'true-false':
        return { label: '☑️ Đúng / Sai (True False)', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' };
      default:
        return { label: `📝 ${type}`, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* BREADCRUMB & BACK BUTTON */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBackToChapter}
          className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Quay lại {chapter.title}</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
          <span>📚 {book.title}</span>
          <span>/</span>
          <span>📖 {chapter.title}</span>
          <span>/</span>
          <span className="text-pink-600 dark:text-pink-400 font-black">{lesson.title}</span>
        </div>
      </div>

      {/* LESSON HEADER CARD */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 p-6 rounded-3xl text-white shadow-md space-y-3 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
              🟢 LESSON WORKSPACE
            </span>

            {!isSuperAdmin && (
              <span className="px-3 py-1 rounded-xl bg-slate-950/40 text-amber-300 text-[11px] font-extrabold flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Chế độ Xem (Read-only Thư Viện)
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{lesson.title}</h1>
          <p className="text-xs md:text-sm text-pink-100 font-medium">
            {lesson.description || 'Chưa có mô tả cho bài học này.'}
          </p>

          {lesson.teacherNotes && (
            <div className="pt-2">
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs text-white/95 space-y-1">
                <p className="font-extrabold text-amber-200 flex items-center">
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Teacher Notes (Ghi chú giảng dạy):
                </p>
                <p className="italic">{lesson.teacherNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXERCISES WORKSPACE BAR */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>📝 BÀI TẬP CỦA LESSON</span>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 text-xs font-extrabold">
              {exercises.length} Bài Tập
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý các dạng bài tập ôn luyện dành riêng cho bài học này
          </p>
        </div>

        {/* CTA BUTTON: + THÊM BÀI TẬP (SUPER ADMIN ONLY) */}
        {isSuperAdmin && (
          <button
            onClick={() => onOpenExerciseEditor()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ THÊM BÀI TẬP</span>
          </button>
        )}
      </div>

      {/* EXERCISES LIST GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          Đang tải danh sách bài tập...
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
            Bài học này chưa có bài tập nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isSuperAdmin
              ? 'Bấm nút "+ THÊM BÀI TẬP" ở trên để tạo bài tập trắc nghiệm, điền từ, dịch câu hoặc từ vựng cho bài học này.'
              : 'Nội dung bài tập đang được Super Admin cập nhật.'}
          </p>
          {isSuperAdmin && (
            <button
              onClick={() => onOpenExerciseEditor()}
              className="mt-2 px-5 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bài Tập Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map((ex) => {
            const badge = getExerciseTypeBadge(ex.type);
            const questionCount = ex.questions?.length || ex.questionIds?.length || (ex.richVocabulary ? ex.richVocabulary.length : 0);

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-900 transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl shrink-0">
                      {questionCount} câu
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-pink-600 transition">
                    {ex.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {ex.description || 'Bài tập ôn luyện đa kỹ năng dành cho bài học.'}
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    ID: {ex.id.substring(0, 12)}...
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* READ ONLY VIEW FOR ADMIN/TEACHER OR PREVIEW FOR SUPER ADMIN */}
                    <button
                      onClick={() => onOpenExerciseViewer(ex)}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold transition flex items-center cursor-pointer"
                      title="Xem nội dung chi tiết bài tập"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Xem</span>
                    </button>

                    {/* SUPER ADMIN MUTATION CONTROLS */}
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => onOpenExerciseEditor(ex)}
                          className="px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 hover:bg-pink-100 text-xs font-bold transition flex items-center cursor-pointer"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => handleDuplicateExercise(ex)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Nhân bản bài tập này (Copy)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTargetExercise(ex)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Xóa bài tập này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetExercise && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-rose-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-fadeIn text-slate-900 dark:text-white">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base">Xóa Bài Tập Này?</h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Hành động này sẽ xóa toàn bộ câu hỏi trong bài tập.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 space-y-1.5 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                📝 Bài tập: <strong className="text-rose-600 dark:text-rose-400 font-black">{deleteTargetExercise.title}</strong>
              </p>
              <p className="text-slate-500">
                Số câu hỏi: {deleteTargetExercise.questions?.length || deleteTargetExercise.questionIds?.length || 0} câu
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetExercise(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteExerciseConfirmed}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>{isDeleting ? 'Đang Xóa...' : 'Xóa Bài Tập'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

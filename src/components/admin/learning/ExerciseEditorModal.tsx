import React, { useState } from 'react';
import { Book, Chapter, Lesson, Exercise, ExerciseType, LearningQuestion, LearningQuestionType } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import { BulkImportModal } from './BulkImportModal';
import { X, Plus, Trash2, Save, FileText, CheckCircle2, AlertCircle, Copy, HelpCircle } from 'lucide-react';

interface ExerciseEditorModalProps {
  book: Book;
  chapter: Chapter;
  lesson: Lesson;
  exercise?: Exercise | null;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const ExerciseEditorModal: React.FC<ExerciseEditorModalProps> = ({
  book,
  chapter,
  lesson,
  exercise,
  isSuperAdmin,
  onClose,
  onSaveSuccess,
}) => {
  const [title, setTitle] = useState<string>(exercise?.title || '');
  const [exerciseType, setExerciseType] = useState<ExerciseType>(exercise?.type || 'multiple-choice');
  const [description, setDescription] = useState<string>(exercise?.description || '');

  const [questions, setQuestions] = useState<LearningQuestion[]>(
    exercise?.questions && exercise.questions.length > 0
      ? exercise.questions
      : [
          {
            id: `q_${Date.now()}_0`,
            questionType: 'grammar_choice' as LearningQuestionType,
            prompt: 'Choose the correct answer:',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: '',
            difficulty: 'easy',
            category: 'grammar',
            status: 'published',
            createdAt: new Date().toISOString(),
          },
        ]
  );

  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleAddQuestion = () => {
    const newQ: LearningQuestion = {
      id: `q_${Date.now()}_${questions.length}`,
      questionType: 'grammar_choice' as LearningQuestionType,
      prompt: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'medium',
      category: 'grammar',
      status: 'published',
      createdAt: new Date().toISOString(),
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      alert('Một bài tập phải có ít nhất 1 câu hỏi!');
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleUpdateQuestion = (index: number, updatedFields: Partial<LearningQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updatedFields };
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const opts = [...updated[qIndex].options];
    opts[optIndex] = value;
    updated[qIndex].options = opts;
    setQuestions(updated);
  };

  const handleBulkImportedQuestions = (newQuestions: LearningQuestion[]) => {
    // Append newly parsed questions
    setQuestions([...questions.filter((q) => q.prompt.trim()), ...newQuestions]);
  };

  const handleSaveExercise = async () => {
    if (!isSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền lưu hoặc chỉnh sửa bài tập!');
      return;
    }
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài tập!');
      return;
    }

    setIsSaving(true);

    const exercisePayload: Partial<Exercise> = {
      id: exercise?.id || `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookId: book.id,
      chapterId: chapter.id,
      lessonId: lesson.id,
      title: title.trim(),
      type: exerciseType,
      description: description.trim(),
      order: exercise?.order || 1,
    };

    const success = await LearningHubService.saveExerciseWithQuestions(
      exercisePayload,
      questions,
      'super_admin'
    );

    if (success) {
      alert('Đã lưu bài tập thành công!');
      onSaveSuccess();
      onClose();
    } else {
      alert('Không thể lưu bài tập. Vui lòng kiểm tra lại quyền Super Admin.');
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-pink-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 max-h-[92vh] overflow-y-auto animate-fadeIn text-slate-900 dark:text-white relative">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 font-extrabold text-xs uppercase">
                🟢 {lesson.title}
              </span>
              <span className="text-xs font-bold text-slate-400">ZERO RE-SELECTION BOUND</span>
            </div>

            <h2 className="font-black text-xl text-slate-900 dark:text-white mt-1">
              {exercise ? '✏️ CHỈNH SỬA BÀI TẬP' : '➕ SOẠN BÀI TẬP MỚI'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EXERCISE GENERAL INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">Tên bài tập (*):</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Exercise 1 – Present Simple Practice"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">Dạng bài tập (*):</label>
            <select
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none cursor-pointer"
            >
              <option value="multiple-choice">📝 Multiple Choice (Trắc nghiệm A/B/C/D)</option>
              <option value="fill-blank">✏️ Fill in the Blank (Điền ô trống)</option>
              <option value="vocabulary">📚 Vocabulary (Từ vựng có IPA)</option>
              <option value="grammar">📐 Grammar (Ngữ pháp & Công thức)</option>
              <option value="translation">🔄 Translation (Dịch câu Việt-Anh)</option>
              <option value="matching">🔗 Matching (Nối cặp từ - nghĩa)</option>
              <option value="sentence-building">🔤 Sentence Building (Sắp xếp câu)</option>
              <option value="true-false">☑️ True / False (Đúng hay Sai)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">Mô tả / Hướng dẫn bài tập:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Choose the best answer to complete each sentence below."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>
        </div>

        {/* MULTI-QUESTION EDITOR WORKSPACE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <span>DANH SÁCH CÂU HỎI TRONG EXERCISE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-slate-800 dark:text-pink-300 text-xs font-black">
                  {questions.length} câu
                </span>
              </h3>
              <p className="text-xs text-slate-500">Soạn thảo nhiều câu hỏi trực tiếp và lưu 1 lần duy nhất</p>
            </div>

            {/* BULK IMPORT & ADD QUESTION CONTROLS */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 hover:bg-purple-100 font-extrabold text-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📋 Nhập nhiều câu (Paste)</span>
              </button>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm câu hỏi</span>
              </button>
            </div>
          </div>

          {/* QUESTIONS LIST FORM */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {questions.map((q, qIndex) => (
              <div
                key={q.id || qIndex}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="font-extrabold text-xs text-pink-600 dark:text-pink-400">
                    CÂU HỎI {qIndex + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* QUESTION PROMPT */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Đề bài câu hỏi:</label>
                  <input
                    type="text"
                    value={q.prompt}
                    onChange={(e) => handleUpdateQuestion(qIndex, { prompt: e.target.value })}
                    placeholder="VD: What is your name?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* OPTIONS A, B, C, D */}
                {['multiple-choice', 'grammar_choice', 'vocab_vi_en'].includes(exerciseType) || q.options?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + optIndex)}`}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* CORRECT ANSWER & EXPLANATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Đáp án đúng (*):</label>
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) => handleUpdateQuestion(qIndex, { correctAnswer: e.target.value })}
                      placeholder="VD: I'm Vy hoặc nhập lựa chọn A"
                      className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Giải thích đáp án:</label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIndex, { explanation: e.target.value })}
                      placeholder="VD: Đây là cấu trúc trả lời tên chuẩn."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm 1 câu hỏi</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveExercise}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang Lưu...' : '💾 LƯU BÀI TẬP & CÂU HỎI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* BULK IMPORT MODAL */}
      {isBulkImportOpen && (
        <BulkImportModal
          onClose={() => setIsBulkImportOpen(false)}
          onImportQuestions={handleBulkImportedQuestions}
        />
      )}
    </div>
  );
};

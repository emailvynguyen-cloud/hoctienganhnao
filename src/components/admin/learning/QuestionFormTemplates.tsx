import React from 'react';
import { ExerciseType, LearningQuestion } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionFormTemplatesProps {
  exerciseType: ExerciseType;
  question: LearningQuestion;
  index: number;
  onUpdate: (updatedFields: Partial<LearningQuestion>) => void;
  onRemove: () => void;
}

export const QuestionFormTemplates: React.FC<QuestionFormTemplatesProps> = ({
  exerciseType,
  question,
  index,
  onUpdate,
  onRemove,
}) => {
  switch (exerciseType) {
    // 1. MULTIPLE CHOICE
    case 'multiple-choice':
    case 'true-false':
      return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <span className="font-extrabold text-xs text-pink-600 dark:text-pink-400">
              CÂU HỎI {index + 1}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nội dung câu hỏi (Question):</label>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="VD: What do you say when you meet someone?"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(question.options || ['', '', '', '']).map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...(question.options || ['', '', '', ''])];
                    newOpts[oIdx] = e.target.value;
                    onUpdate({ options: newOpts });
                  }}
                  placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}`}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Đáp án đúng (*):</label>
              <select
                value={question.correctAnswer || (question.options?.[0] || 'A')}
                onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {(question.options || ['', '', '', '']).map((opt, oIdx) => (
                  <option key={oIdx} value={opt || String.fromCharCode(65 + oIdx)}>
                    {String.fromCharCode(65 + oIdx)}: {opt || `Lựa chọn ${String.fromCharCode(65 + oIdx)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Giải thích đáp án (tùy chọn):</label>
              <input
                type="text"
                value={question.explanation || ''}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                placeholder="VD: 'Hello' là câu chào hỏi chuẩn."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      );

    // 2. FILL IN THE BLANK
    case 'fill-blank':
    case 'short-answer':
      return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
              CÂU HỎI Điền Từ {index + 1}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Câu chứa chỗ trống (dùng `___`):</label>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="VD: I ___ from Vietnam."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đáp án chính xác (Accepted Answers):</label>
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
              placeholder="VD: am"
              className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      );

    // 3. VOCABULARY
    case 'vocabulary':
      return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <span className="font-extrabold text-xs text-pink-600 dark:text-pink-400">
              TỪ VỰNG {index + 1}
            </span>
            <button type="button" onClick={onRemove} className="p-1 text-slate-400 hover:text-rose-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold">Từ tiếng Anh (Word):</label>
              <input
                type="text"
                value={question.prompt}
                onChange={(e) => onUpdate({ prompt: e.target.value })}
                placeholder="VD: introduce"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Nghĩa tiếng Việt (Meaning):</label>
              <input
                type="text"
                value={question.correctAnswer}
                onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                placeholder="VD: giới thiệu"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-pink-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold">Ví dụ mẫu (Example):</label>
            <input
              type="text"
              value={question.explanation || ''}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="VD: Let me introduce myself."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs italic"
            />
          </div>
        </div>
      );

    // 4. TRANSLATION
    case 'translation':
      return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <span className="font-extrabold text-xs text-purple-600 dark:text-purple-400">
              CÂU DỊCH {index + 1}
            </span>
            <button type="button" onClick={onRemove} className="p-1 text-slate-400 hover:text-rose-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-purple-700 dark:text-purple-300">Câu tiếng Việt:</label>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="VD: Tôi sống ở Việt Nam."
              className="w-full px-3.5 py-2 rounded-xl border border-purple-200 dark:border-slate-600 bg-purple-50/40 dark:bg-slate-900 text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đáp án tiếng Anh chuẩn:</label>
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
              placeholder="VD: I live in Vietnam."
              className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-slate-900 text-xs font-bold"
            />
          </div>
        </div>
      );

    // DEFAULT FALLBACK
    default:
      return (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <span className="font-extrabold text-xs text-slate-600">CÂU HỎI {index + 1}</span>
            <button type="button" onClick={onRemove} className="p-1 text-slate-400 hover:text-rose-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold">Nội dung câu hỏi / Prompt:</label>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-emerald-600">Đáp án đúng:</label>
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
              placeholder="Nhập đáp án đúng..."
              className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-bold"
            />
          </div>
        </div>
      );
  }
};

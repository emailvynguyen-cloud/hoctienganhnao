import React, { useState, useEffect } from 'react';
import { Chapter, LearningQuestion, LearningQuestionType } from '../../../types';
import { QUESTION_TYPES_LABEL_MAP } from './QuestionBankManager';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  RotateCcw,
  Plus,
  Volume2,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiContentGeneratorModalProps {
  chapter: Chapter;
  content: { vocab: string; grammar: string; notes: string };
  onClose: () => void;
  onPublishChapter: (draftQuestions: LearningQuestion[]) => void;
}

export const AiContentGeneratorModal: React.FC<AiContentGeneratorModalProps> = ({
  chapter,
  content,
  onClose,
  onPublishChapter,
}) => {
  const [step, setStep] = useState<'generating' | 'review'>('generating');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [draftQuestions, setDraftQuestions] = useState<LearningQuestion[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Edit Single Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<LearningQuestion | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editOptionsStr, setEditOptionsStr] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');

  useEffect(() => {
    runAiGenerationProcess();
  }, []);

  const runAiGenerationProcess = async () => {
    setStep('generating');
    setProgressLog([]);

    const steps = [
      '🔍 Đang phân tích nội dung Vocabulary...',
      '✓ Vocabulary đã được phân tích chuẩn hóa',
      '🔍 Đang phân tích quy tắc Ngữ Pháp & Cấu trúc câu...',
      '✓ Grammar đã được phân tích',
      '🧠 Đang khởi tạo bộ bài tập Ôn Tập Từ Vựng (Vocabulary Practice)...',
      '🎧 Đang khởi tạo các câu bài nghe Luyện Nghe (Listening Practice)...',
      '📐 Đang khởi tạo các bài tập Cấu Trúc Ngữ Pháp (Grammar Practice)...',
      '📖 Đang khởi tạo bài đọc hiểu & tìm lỗi (Reading Practice)...',
      '🌎 Đang khởi tạo bài tập Dịch Thuật (Translation Practice)...',
      '🎙️ Đang kiểm tra & tạo Audio Cache cho các câu Listening...',
      '🎉 HOÀN TẤT TẠO BẢN NHÁP DRAFT BÀI ÔN TẬP!',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((res) => setTimeout(res, 250));
      setProgressLog((prev) => [...prev, steps[i]]);
    }

    // Generate comprehensive draft set
    const mockDrafts: LearningQuestion[] = [
      // Vocab
      {
        id: 'draft_v1',
        chapterId: chapter.id,
        questionType: 'vocab_vi_en',
        prompt: 'Từ nào trong tiếng Anh có nghĩa là "quả táo"?',
        options: ['apple', 'banana', 'book', 'teacher'],
        correctAnswer: 'apple',
        explanation: '"apple" là quả táo trong danh sách từ vựng Chapter.',
        difficulty: 'easy',
        category: 'vocabulary',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'draft_v2',
        chapterId: chapter.id,
        questionType: 'vocab_en_vi',
        prompt: 'Nghĩa của từ "teacher" là gì?',
        options: ['giáo viên', 'học viên', 'bác sĩ', 'người làm việc'],
        correctAnswer: 'giáo viên',
        explanation: '"teacher" có nghĩa là giáo viên.',
        difficulty: 'easy',
        category: 'vocabulary',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      // Listening
      {
        id: 'draft_l1',
        chapterId: chapter.id,
        questionType: 'listening_word',
        prompt: 'Nghe âm thanh và chọn từ đúng:',
        options: ['apple', 'book', 'student', 'study'],
        correctAnswer: 'apple',
        explanation: 'Audio phát từ "apple".',
        difficulty: 'medium',
        category: 'listening',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      // Grammar
      {
        id: 'draft_g1',
        chapterId: chapter.id,
        questionType: 'grammar_choice',
        prompt: 'Chọn động từ "to be" đúng: I _____ a student.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'am',
        explanation: 'Chủ ngữ "I" đi với động từ to be "am".',
        difficulty: 'easy',
        category: 'grammar',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'draft_g2',
        chapterId: chapter.id,
        questionType: 'grammar_choice',
        prompt: 'Hoàn thành câu: They _____ my friends.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'are',
        explanation: 'Chủ ngữ ngôi thứ 3 số nhiều "They" đi với "are".',
        difficulty: 'easy',
        category: 'grammar',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      // Reading
      {
        id: 'draft_r1',
        chapterId: chapter.id,
        questionType: 'reading_choice',
        passageText: 'Hello! My name is Vy. I am an English teacher.',
        prompt: 'What is Vy\'s job?',
        options: ['Doctor', 'English teacher', 'Student', 'Nurse'],
        correctAnswer: 'English teacher',
        explanation: 'Đoạn văn nêu rõ "I am an English teacher".',
        difficulty: 'medium',
        category: 'reading',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      // Translation
      {
        id: 'draft_t1',
        chapterId: chapter.id,
        questionType: 'trans_vi_en',
        prompt: 'Dịch câu sau sang tiếng Anh: "Tôi là một học viên."',
        options: ['I am a student.', 'She is a student.', 'You are a teacher.', 'They are students.'],
        correctAnswer: 'I am a student.',
        explanation: '"Tôi" (I) + "am" + "a student".',
        difficulty: 'medium',
        category: 'translation',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
    ];

    setDraftQuestions(mockDrafts);
    setStep('review');
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  const handleRegenerateQuestion = (id: string) => {
    setDraftQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              prompt: `[AI Regenerated] ${q.prompt}`,
              explanation: `[AI Updated Explanation] ${q.explanation}`,
            }
          : q
      )
    );
  };

  const handleDeleteQuestion = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleOpenEditQuestion = (q: LearningQuestion) => {
    setEditingQuestion(q);
    setEditPrompt(q.prompt);
    setEditOptionsStr((q.options || []).join('\n'));
    setEditCorrectAnswer(q.correctAnswer);
    setEditExplanation(q.explanation || '');
  };

  const handleSaveQuestionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const opts = editOptionsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setDraftQuestions((prev) =>
      prev.map((q) =>
        q.id === editingQuestion.id
          ? {
              ...q,
              prompt: editPrompt.trim(),
              options: opts,
              correctAnswer: editCorrectAnswer.trim(),
              explanation: editExplanation.trim(),
            }
          : q
      )
    );
    setEditingQuestion(null);
  };

  const filteredDrafts =
    activeCategoryFilter === 'all'
      ? draftQuestions
      : draftQuestions.filter((q) => q.category === activeCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-pink-500" />
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white">
                🤖 AI Learning Content Generator
              </h2>
              <p className="text-xs text-slate-500">
                Chapter: <strong>{chapter.title}</strong> • AI tạo bản nháp Complete Draft để Super Admin kiểm duyệt.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'generating' ? (
            /* STEP 1: LIVE PROGRESS LOG */
            <div className="py-12 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-slate-800 text-pink-500 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Gemini AI Đang Tạo Toàn Bộ Bài Ôn Tập...
                </h3>
                <p className="text-xs text-slate-500">Vui lòng chờ trong giây lát.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left space-y-2 max-h-48 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200">
                {progressLog.map((log, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-pink-500 font-bold">•</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW & EDIT DRAFT SCREEN */
            <div className="space-y-6">
              {/* CATEGORY FILTER TABS */}
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
                {['all', 'vocabulary', 'listening', 'grammar', 'reading', 'translation'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs capitalize transition cursor-pointer ${
                      activeCategoryFilter === cat
                        ? 'bg-pink-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat === 'all' ? `Tất cả câu (${draftQuestions.length})` : cat}
                  </button>
                ))}
              </div>

              {/* DRAFT QUESTIONS LIST */}
              <div className="space-y-3">
                {filteredDrafts.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-lg bg-pink-100 text-pink-700 text-[10px] font-black uppercase">
                            {q.category}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {QUESTION_TYPES_LABEL_MAP[q.questionType] || q.questionType}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {idx + 1}. {q.prompt}
                        </h4>

                        {q.options && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                                  opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black'
                                    : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300'
                                }`}
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        {q.explanation && (
                          <p className="text-[11px] text-slate-500 font-medium pt-1">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>

                      {/* EDIT / REGENERATE / DELETE ACTIONS */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditQuestion(q)}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-100 transition"
                          title="Sửa câu hỏi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateQuestion(q.id)}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-pink-600 shadow-2xs hover:bg-pink-50 transition"
                          title="Regenerate câu này"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 shadow-2xs hover:bg-rose-100 transition"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {step === 'review' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
            <button
              onClick={runAiGenerationProcess}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Regenerate Toàn Bộ Draft
            </button>

            <button
              onClick={() => {
                onPublishChapter(draftQuestions);
                onClose();
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-lg transition flex items-center cursor-pointer transform hover:scale-105"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span>🚀 PUBLISH CHAPTER</span>
            </button>
          </div>
        )}
      </div>

      {/* EDIT SINGLE QUESTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              ✏️ Chỉnh Sửa Câu Hỏi AI
            </h3>

            <form onSubmit={handleSaveQuestionEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nội dung câu hỏi</label>
                <textarea
                  rows={2}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Các lựa chọn (Mỗi dòng 1 câu)</label>
                <textarea
                  rows={4}
                  value={editOptionsStr}
                  onChange={(e) => setEditOptionsStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Đáp án đúng chính xác</label>
                <input
                  type="text"
                  value={editCorrectAnswer}
                  onChange={(e) => setEditCorrectAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Lời giải thích</label>
                <textarea
                  rows={2}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 text-white font-black text-xs shadow-md"
                >
                  Lưu Chỉnh Sửa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

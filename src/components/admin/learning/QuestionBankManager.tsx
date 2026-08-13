import React, { useState, useEffect } from 'react';
import { LearningQuestion, LearningQuestionType, Chapter, Book } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Mic,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  X,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react';

interface QuestionBankManagerProps {
  books: Book[];
  chapters: Chapter[];
}

export const QUESTION_TYPES_LABEL_MAP: Record<LearningQuestionType, string> = {
  // Listening
  listening_word: '🎧 Listening – Từ vựng nghe được',
  listening_sentence: '🎧 Listening – Nhập cả câu nghe được',
  listening_dictation: '🎧 Listening – Nghe & viết chính tả',
  listening_choice: '🎧 Listening – Nghe & chọn đáp án',
  listening_true_false: '🎧 Listening – Nghe & True / False',
  // Vocabulary
  vocab_vi_en: '🔤 Vocab – Việt → Anh',
  vocab_en_vi: '🔤 Vocab – Anh → Việt',
  vocab_audio_type: '🔤 Vocab – Nghe → viết từ',
  vocab_image_type: '🔤 Vocab – Nhìn hình → viết từ',
  vocab_match_meaning: '🔤 Vocab – Nối từ với nghĩa',
  vocab_match_image: '🔤 Vocab – Nối từ với hình ảnh',
  vocab_choice: '🔤 Vocab – Chọn từ đúng',
  vocab_gap_fill: '🔤 Vocab – Điền từ vào chỗ trống',
  // Reading
  reading_true_false: '📖 Reading – Đọc → True / False',
  reading_choice: '📖 Reading – Đọc → chọn đáp án đúng',
  reading_find_error: '📖 Reading – Đọc → tìm câu sai',
  reading_qa: '📖 Reading – Trả lời câu hỏi',
  reading_gap_fill: '📖 Reading – Đọc → điền từ',
  // Grammar
  grammar_choice: '📐 Grammar – Chọn đáp án đúng',
  grammar_gap_fill: '📐 Grammar – Điền từ vào chỗ trống',
  grammar_reorder: '📐 Grammar – Sắp xếp lại câu',
  grammar_find_error: '📐 Grammar – Tìm lỗi sai',
  grammar_fix_error: '📐 Grammar – Sửa lỗi sai',
  grammar_correct_sentence: '📐 Grammar – Chọn câu đúng',
  grammar_complete: '📐 Grammar – Hoàn thành câu',
  // Translation
  trans_vi_en: '🌎 Dịch – Việt → Anh',
  trans_en_vi: '🌎 Dịch – Anh → Việt',
  trans_hint_sentence: '🌎 Dịch – Câu có gợi ý',
  trans_free: '🌎 Dịch – Tự do',
  // Matching
  match_word_meaning: '🔗 Matching – Từ ↔ nghĩa',
  match_word_image: '🔗 Matching – Từ ↔ hình',
  match_sentence_meaning: '🔗 Matching – Câu ↔ nghĩa',
};

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({ books, chapters }) => {
  const [questions, setQuestions] = useState<LearningQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('all');
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  // Form State
  const [editingQuestion, setEditingQuestion] = useState<LearningQuestion | null>(null);
  const [formChapterId, setFormChapterId] = useState('');
  const [formQuestionType, setFormQuestionType] = useState<LearningQuestionType>('vocab_vi_en');
  const [formPrompt, setFormPrompt] = useState('');
  const [formPassage, setFormPassage] = useState('');
  const [formOptionsStr, setFormOptionsStr] = useState('');
  const [formCorrectAnswer, setFormCorrectAnswer] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    // Initial questions from mock data or local state
    const sampleQuestions: LearningQuestion[] = [
      {
        id: 'q_01',
        chapterId: chapters[0]?.id || 'ch_ef_b_01',
        questionType: 'vocab_vi_en',
        prompt: 'Từ nào có nghĩa là "Xin chào"?',
        options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
        correctAnswer: 'Hello',
        explanation: '"Hello" là từ chào hỏi thân mật tiếng Anh.',
        difficulty: 'easy',
        category: 'vocabulary',
        status: 'published',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'q_02',
        chapterId: chapters[0]?.id || 'ch_ef_b_01',
        questionType: 'grammar_choice',
        prompt: 'Chọn từ phù hợp: She _____ a student.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'is',
        explanation: 'Ngôi thứ 3 số ít "She" đi với động từ to be "is".',
        difficulty: 'easy',
        category: 'grammar',
        status: 'published',
        createdAt: new Date().toISOString(),
      },
    ];
    setQuestions(sampleQuestions);
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormChapterId(chapters[0]?.id || '');
    setFormQuestionType('vocab_vi_en');
    setFormPrompt('');
    setFormPassage('');
    setFormOptionsStr('Option A\nOption B\nOption C\nOption D');
    setFormCorrectAnswer('');
    setFormExplanation('');
    setFormDifficulty('medium');
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditModal = (q: LearningQuestion) => {
    setEditingQuestion(q);
    setFormChapterId(q.chapterId || '');
    setFormQuestionType(q.questionType);
    setFormPrompt(q.prompt);
    setFormPassage(q.passageText || '');
    setFormOptionsStr((q.options || []).join('\n'));
    setFormCorrectAnswer(q.correctAnswer);
    setFormExplanation(q.explanation || '');
    setFormDifficulty(q.difficulty);
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrompt.trim() || !formCorrectAnswer.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi và đáp án đúng.');
      return;
    }

    const optionsArray = formOptionsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    let category: LearningQuestion['category'] = 'vocabulary';
    if (formQuestionType.startsWith('listening_')) category = 'listening';
    else if (formQuestionType.startsWith('reading_')) category = 'reading';
    else if (formQuestionType.startsWith('grammar_')) category = 'grammar';
    else if (formQuestionType.startsWith('trans_')) category = 'translation';
    else if (formQuestionType.startsWith('match_')) category = 'matching';

    const questionToSave: LearningQuestion = {
      id: editingQuestion ? editingQuestion.id : 'q_' + Date.now(),
      chapterId: formChapterId,
      questionType: formQuestionType,
      prompt: formPrompt.trim(),
      passageText: formPassage.trim() || undefined,
      options: optionsArray,
      correctAnswer: formCorrectAnswer.trim(),
      explanation: formExplanation.trim() || undefined,
      difficulty: formDifficulty,
      category,
      status: 'published',
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
    };

    if (editingQuestion) {
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? questionToSave : q)));
    } else {
      setQuestions((prev) => [questionToSave, ...prev]);
    }

    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng câu hỏi?')) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !searchQuery ||
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.correctAnswer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChapter = selectedChapterFilter === 'all' || q.chapterId === selectedChapterFilter;
    const matchesType = selectedTypeFilter === 'all' || q.questionType === selectedTypeFilter;
    const matchesDifficulty = selectedDifficultyFilter === 'all' || q.difficulty === selectedDifficultyFilter;

    return matchesSearch && matchesChapter && matchesType && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* FILTER & CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi hoặc đáp án..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs transition shadow-md flex items-center shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tạo Câu Hỏi Mới
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Lọc Theo Chapter:</label>
            <select
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Tất cả các Chapter</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Dạng Câu Hỏi:</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Tất cả dạng câu hỏi (32+ Types)</option>
              {Object.entries(QUESTION_TYPES_LABEL_MAP).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Độ Khó:</label>
            <select
              value={selectedDifficultyFilter}
              onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Dễ (Easy)</option>
              <option value="medium">Trung bình (Medium)</option>
              <option value="hard">Khó (Hard)</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUESTION LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            📚 Danh Sách Câu Hỏi ({filteredQuestions.length})
          </h3>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">
            Chưa có câu hỏi nào khớp với bộ lọc. Bấm "Tạo Câu Hỏi Mới" để bắt đầu!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 text-[10px] font-black">
                        {QUESTION_TYPES_LABEL_MAP[q.questionType] || q.questionType}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold capitalize">
                        {q.difficulty}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {q.prompt}
                    </h4>

                    {q.options && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {q.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                              opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt} {opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() && '✓'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                      title="Sửa câu hỏi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT / CREATE QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-200 dark:border-slate-800 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingQuestion ? '✏️ Chỉnh Sửa Câu Hỏi' : '➕ Tạo Câu Hỏi Mới'}
              </h3>
              <button onClick={() => setIsQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Chọn Chapter *
                </label>
                <select
                  value={formChapterId}
                  onChange={(e) => setFormChapterId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Dạng Câu Hỏi (Question Type) *
                </label>
                <select
                  value={formQuestionType}
                  onChange={(e) => setFormQuestionType(e.target.value as LearningQuestionType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  {Object.entries(QUESTION_TYPES_LABEL_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nội Dung Câu Hỏi (Prompt / Question) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="Nhập câu hỏi tiếng Anh hoặc yêu cầu bài tập..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Các Lựa Chọn (Mỗi lựa chọn 1 dòng)
                </label>
                <textarea
                  rows={4}
                  value={formOptionsStr}
                  onChange={(e) => setFormOptionsStr(e.target.value)}
                  placeholder="Mỗi lựa chọn một dòng&#10;Lựa chọn A&#10;Lựa chọn B&#10;Lựa chọn C"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Đáp Án Đúng (Exact Correct Answer) *
                </label>
                <input
                  type="text"
                  required
                  value={formCorrectAnswer}
                  onChange={(e) => setFormCorrectAnswer(e.target.value)}
                  placeholder="Nhập chính xác đáp án đúng..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Giải Thích Đáp Án (Explanation)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Nhập lời giải thích ngắn gọn để giúp học viên hiểu bài..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

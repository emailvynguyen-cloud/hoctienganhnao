import React, { useState, useEffect } from 'react';
import { Book, Chapter, User, LearningQuestion, ChapterTest, ChapterTestQuestionSnapshot } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import { QuestionBankManager } from './QuestionBankManager';
import { AiLearningStudio } from './AiLearningStudio';
import { ChapterContentEditor } from './ChapterContentEditor';
import { AiContentGeneratorModal } from './AiContentGeneratorModal';
import { AiChapterTestGeneratorModal } from './AiChapterTestGeneratorModal';
import { LearningResultsView } from './LearningResultsView';
import { BookOpen, Plus, Sparkles, Layers, FileText, CheckCircle2, Mic, RefreshCw, BarChart2, ShieldAlert, Edit2, PlayCircle, Eye, Lock } from 'lucide-react';

interface AdminLearningHubProps {
  currentUser?: User | null;
}

export const AdminLearningHub: React.FC<AdminLearningHubProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isTeacher = currentUser?.role === 'teacher';

  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<'books' | 'bank' | 'practice' | 'tests' | 'audio' | 'results'>('books');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Chapter for Editor
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // AI Generator Modals State
  const [aiPracticeModalChapter, setAiPracticeModalChapter] = useState<Chapter | null>(null);
  const [aiPracticeModalContent, setAiPracticeModalContent] = useState<{ vocab: string; grammar: string; notes: string }>({ vocab: '', grammar: '', notes: '' });

  const [aiTestModalChapter, setAiTestModalChapter] = useState<Chapter | null>(null);
  const [aiTestModalContent, setAiTestModalContent] = useState<{ vocab: string; grammar: string; notes: string }>({ vocab: '', grammar: '', notes: '' });

  // New Book Form Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookLevel, setNewBookLevel] = useState('A1');
  const [newBookDesc, setNewBookDesc] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    const bList = await LearningHubService.getBooks();
    const cList = await LearningHubService.getChapters();
    setBooks(bList);
    setChapters(cList);
    setIsLoading(false);
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    if (!newBookTitle.trim()) return;

    const newBook: Partial<Book> = {
      id: 'book_' + Date.now(),
      title: newBookTitle.trim(),
      level: newBookLevel,
      description: newBookDesc.trim(),
      displayOrder: books.length + 1,
    };

    await LearningHubService.saveBook(newBook);
    setIsAddBookModalOpen(false);
    setNewBookTitle('');
    setNewBookDesc('');
    loadAdminData();
  };

  const handleTriggerAiGenerate = (ch: Chapter, content: { vocab: string; grammar: string; notes: string }) => {
    if (!isSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền chạy AI Generator!');
      return;
    }
    setAiPracticeModalChapter(ch);
    setAiPracticeModalContent(content);
  };

  const handleTriggerAiTestGenerate = (ch: Chapter, content: { vocab: string; grammar: string; notes: string }) => {
    if (!isSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền tạo Chapter Test!');
      return;
    }
    setAiTestModalChapter(ch);
    setAiTestModalContent(content);
  };

  if (editingChapter) {
    const parentBook = books.find((b) => b.id === editingChapter.bookId);
    return (
      <ChapterContentEditor
        chapter={editingChapter}
        book={parentBook}
        currentUser={currentUser}
        onBack={() => setEditingChapter(null)}
        onTriggerAiGenerate={handleTriggerAiGenerate}
        onTriggerAiTestGenerate={handleTriggerAiTestGenerate}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* MANAGEMENT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LEARNING HUB – {isTeacher ? 'CHẾ ĐỘ XEM GIÁO VIÊN (READ-ONLY)' : 'QUẢN TRỊ NỘI DUNG HỌC TẬP'}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            📚 Thư Viện Học Tập & Bài Tập AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? 'Xem nội dung giáo trình, bài tập đã Publish và điểm số kết quả của học viên.'
              : 'Nhập Vocabulary + Grammar + Notes ➔ AI tự động biến đổi thành hệ thống bài tập hoàn chỉnh.'}
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={() => setIsAddBookModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs transition shadow-md flex items-center shrink-0 cursor-pointer self-start md:self-center"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Thêm Giáo Trình Mới
          </button>
        ) : isTeacher ? (
          <div className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center shrink-0">
            <Lock className="w-4 h-4 mr-1.5" /> Chế độ Read-Only
          </div>
        ) : null}
      </div>

      {/* ADMIN TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'books'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-1" />
          <span>📘 Giáo Trình & Chapter ({books.length})</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 mr-1" />
            <span>📚 Question Bank</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Mic className="w-4 h-4 mr-1" />
            <span>🎙️ AI Studio & Audio</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'results'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 mr-1" />
          <span>📊 Kết Quả Học Viên</span>
        </button>
      </div>

      {/* TAB CONTENT: BOOKS & CHAPTERS */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {books.map((book) => {
              const bookChapters = chapters.filter((c) => c.bookId === book.id);
              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 text-[10px] font-black uppercase">
                        Trình độ: {book.level}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {bookChapters.length} Chapter
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {book.description || 'Chưa có mô tả cho giáo trình này.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Danh Sách Chapter:
                    </div>
                    {bookChapters.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">Chưa có Chapter nào.</div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {bookChapters.map((ch) => (
                          <div
                            key={ch.id}
                            onClick={() => setEditingChapter(ch)}
                            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-pink-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer border border-transparent hover:border-pink-200"
                          >
                            <span className="truncate">{ch.title}</span>
                            <span className="text-pink-600 text-[11px] font-black flex items-center shrink-0">
                              {isTeacher ? <Eye className="w-3.5 h-3.5 mr-1" /> : <Edit2 className="w-3.5 h-3.5 mr-1" />}
                              {isTeacher ? 'Xem Nội Dung' : 'Soạn AI'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUESTION BANK TAB */}
      {activeTab === 'bank' && isSuperAdmin && (
        <QuestionBankManager books={books} chapters={chapters} />
      )}

      {/* AI STUDIO & TTS AUDIO TAB */}
      {activeTab === 'audio' && isSuperAdmin && (
        <AiLearningStudio
          books={books}
          chapters={chapters}
          onAddGeneratedQuestions={(newQs) => {
            alert(`Đã lưu ${newQs.length} câu hỏi AI vào Ngân hàng câu hỏi!`);
          }}
        />
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <LearningResultsView currentUser={currentUser} />
      )}

      {/* AI PRACTICE GENERATOR MODAL */}
      {aiPracticeModalChapter && (
        <AiContentGeneratorModal
          chapter={aiPracticeModalChapter}
          content={aiPracticeModalContent}
          onClose={() => setAiPracticeModalChapter(null)}
          onPublishChapter={(draftQs) => {
            alert(`Đã Publish thành công Chapter "${aiPracticeModalChapter.title}" với ${draftQs.length} câu hỏi! Học viên có thể ôn luyện ngay.`);
          }}
        />
      )}

      {/* AI CHAPTER TEST GENERATOR MODAL */}
      {aiTestModalChapter && (
        <AiChapterTestGeneratorModal
          chapter={aiTestModalChapter}
          content={aiTestModalContent}
          onClose={() => setAiTestModalChapter(null)}
          onPublishTest={(test, snapshots) => {
            alert(`Đã Publish bài Chapter Test v${test.version} cho "${aiTestModalChapter.title}" với ${snapshots.length} frozen câu hỏi!`);
          }}
        />
      )}

      {/* ADD BOOK MODAL */}
      {isAddBookModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              📘 Thêm Giáo Trình Mới
            </h3>

            <form onSubmit={handleCreateBook} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Tên Giáo Trình *
                </label>
                <input
                  type="text"
                  required
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Ví dụ: English File Intermediate"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Trình Độ (Level)
                </label>
                <select
                  value={newBookLevel}
                  onChange={(e) => setNewBookLevel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary / Pre-Intermediate</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper-Intermediate</option>
                  <option value="Starters">Starters (Kids)</option>
                  <option value="Movers">Movers (Kids)</option>
                  <option value="Flyers">Flyers (Kids)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Mô Tả Ngắn
                </label>
                <textarea
                  rows={3}
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  placeholder="Mô tả nội dung chính của giáo trình..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md"
                >
                  Lưu Giáo Trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

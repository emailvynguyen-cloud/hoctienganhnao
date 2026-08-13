import React, { useState, useEffect } from 'react';
import { Book, Chapter, User } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import { QuestionBankManager } from './QuestionBankManager';
import { BookOpen, Plus, Sparkles, Layers, FileText, CheckCircle2, Mic, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

interface AdminLearningHubProps {
  currentUser?: User | null;
}

export const AdminLearningHub: React.FC<AdminLearningHubProps> = ({ currentUser }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<'books' | 'bank' | 'practice' | 'tests' | 'audio' | 'results'>('books');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  return (
    <div className="space-y-6">
      {/* MANAGEMENT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LEARNING HUB – QUẢN TRỊ NỘI DUNG HỌC TẬP</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            📚 Quản Lý Thư Viện Học Tập & Bài Tập
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý giáo trình, chapter, ngân hàng câu hỏi, bài tập Daily Practice & bài kiểm tra Chapter Test.
          </p>
        </div>

        <button
          onClick={() => setIsAddBookModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs transition shadow-md flex items-center shrink-0 cursor-pointer self-start md:self-center"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Thêm Giáo Trình Mới
        </button>
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

        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 mr-1" />
          <span>📚 Ngân Hàng Câu Hỏi</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'practice'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 mr-1" />
          <span>🧠 Bài Tập Daily Practice</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'tests'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          <span>📝 Bài Kiểm Tra Chapter</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 mr-1" />
          <span>🎙️ AI Audio Library</span>
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
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {bookChapters.map((ch) => (
                          <div
                            key={ch.id}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
                          >
                            <span className="truncate">{ch.title}</span>
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
      {activeTab === 'bank' && (
        <QuestionBankManager books={books} chapters={chapters} />
      )}

      {/* OTHER TABS PLACEHOLDERS */}
      {activeTab !== 'books' && activeTab !== 'bank' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-pink-500 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Giao Diện Quản Lý {activeTab.toUpperCase()}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Module đang được khởi tạo và sẵn sàng nhận dữ liệu trực tiếp từ Supabase.
          </p>
        </div>
      )}

      {/* ADD BOOK MODAL */}
      {isAddBookModalOpen && (
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

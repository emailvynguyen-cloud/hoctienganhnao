import React, { useState } from 'react';
import { Chapter, Book, User } from '../../../types';
import { Sparkles, Save, BookOpen, Layers, FileText, ArrowLeft, Bot, Wand2, PlayCircle, CheckCircle2 } from 'lucide-react';

interface ChapterContentEditorProps {
  chapter: Chapter;
  book?: Book | null;
  currentUser?: User | null;
  onBack: () => void;
  onTriggerAiGenerate: (chapter: Chapter, content: { vocab: string; grammar: string; notes: string }) => void;
  onTriggerAiTestGenerate: (chapter: Chapter, content: { vocab: string; grammar: string; notes: string }) => void;
}

export const ChapterContentEditor: React.FC<ChapterContentEditorProps> = ({
  chapter,
  book,
  currentUser,
  onBack,
  onTriggerAiGenerate,
  onTriggerAiTestGenerate,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isTeacher = currentUser?.role === 'teacher';

  const [vocabInput, setVocabInput] = useState<string>(
    chapter.vocabularyInput ||
      'apple – quả táo\nbanana – quả chuối\nbook – quyển sách\nteacher – giáo viên\nstudent – học viên\nstudy – học tập\nwork – làm việc'
  );
  const [grammarInput, setGrammarInput] = useState<string>(
    chapter.grammarInput ||
      'Verb to be:\nI am a student.\nYou are a teacher.\nHe is a doctor.\nShe is a nurse.\nThey are friends.\n\nRules:\nI -> am\nYou/We/They -> are\nHe/She/It -> is'
  );
  const [notesInput, setNotesInput] = useState<string>(
    chapter.notesInput ||
      'Mô tả bài học:\nChủ đề giới thiệu bản thân và nghề nghiệp hàng ngày.\nLuyện tập lắng nghe phát âm chuẩn các danh từ và cấu trúc câu mô tả.'
  );

  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSaveContent = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[10px] font-black uppercase">
              <span>Giáo trình: {book?.title || 'English File'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              📖 Soạn Nội Dung Kiến Thức: {chapter.title}
            </h1>
          </div>
        </div>

        {/* TEACHER READ-ONLY BADGE VS SUPER ADMIN ACTIONS */}
        {isTeacher ? (
          <div className="px-4 py-2 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300 flex items-center shrink-0">
            🔒 Chế độ Read-Only (Giáo Viên chỉ được xem)
          </div>
        ) : isSuperAdmin ? (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleSaveContent}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-extrabold text-xs transition flex items-center cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaved ? 'Đã Lưu Nội Dung!' : 'Lưu Bản Nháp'}</span>
            </button>

            <button
              onClick={() => onTriggerAiGenerate(chapter, { vocab: vocabInput, grammar: grammarInput, notes: notesInput })}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs transition shadow-lg flex items-center cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              <span>✨ AI TẠO TOÀN BỘ BÀI ÔN TẬP</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* INPUT SECTIONS GRID */}
      <div className="grid grid-cols-1 gap-6">
        {/* 1. VOCABULARY INPUT */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <span>📚 1. NỘI DUNG TỪ VỰNG (VOCABULARY)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Hỗ trợ nhập: English – Vietnamese hoặc paste bảng
            </span>
          </div>

          <textarea
            rows={6}
            readOnly={isTeacher}
            value={vocabInput}
            onChange={(e) => setVocabInput(e.target.value)}
            placeholder="Mỗi từ vựng 1 dòng dạng:&#10;apple – quả táo&#10;banana = quả chuối&#10;book, quyển sách"
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 leading-relaxed"
          />
        </div>

        {/* 2. GRAMMAR INPUT */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <span>📐 2. CẤU TRÚC NGỮ PHÁP (GRAMMAR POINTS)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Cấu trúc câu, ví dụ mẫu & quy tắc ngữ pháp
            </span>
          </div>

          <textarea
            rows={6}
            readOnly={isTeacher}
            value={grammarInput}
            onChange={(e) => setGrammarInput(e.target.value)}
            placeholder="Nhập quy tắc ngữ pháp & câu ví dụ:&#10;Verb to be: I am / You are / He is...&#10;Present Simple: I work / She works..."
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 leading-relaxed"
          />
        </div>

        {/* 3. NOTES & SOURCE MATERIAL */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <span>📖 3. BÀI ĐỌC / NỐT THAM KHẢO (SOURCE MATERIAL & TRANSCRIPT)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              Đoạn văn đọc hiểu, transcript phát âm hoặc ghi chú bài học
            </span>
          </div>

          <textarea
            rows={5}
            readOnly={isTeacher}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Nhập hoặc dán bài đọc Reading, Transcript bài nghe hoặc tài liệu tham khảo..."
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 leading-relaxed"
          />
        </div>
      </div>

      {/* SUPER ADMIN ACTION BAR AT BOTTOM */}
      {isSuperAdmin && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-base flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>Sẵn Sàng Cho Gemini AI Tự Động Biến Đổi Kiến Thức!</span>
            </h3>
            <p className="text-xs text-pink-100 mt-1">
              AI sẽ tự động đọc Vocabulary, Grammar & Notes để tạo trọn bộ Daily Practice & Chapter Test Draft.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onTriggerAiTestGenerate(chapter, { vocab: vocabInput, grammar: grammarInput, notes: notesInput })}
              className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs backdrop-blur-xs transition flex items-center cursor-pointer border border-white/30"
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              <span>🤖 AI Tạo Chapter Test</span>
            </button>

            <button
              onClick={() => onTriggerAiGenerate(chapter, { vocab: vocabInput, grammar: grammarInput, notes: notesInput })}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-pink-50 text-pink-600 font-black text-xs transition shadow-md flex items-center cursor-pointer transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2 text-pink-500" />
              <span>✨ TẠO TOÀN BỘ BÀI ÔN TẬP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Chapter, Book, User, RichVocabItem, RichGrammarItem, RichReadingItem, RichListeningItem, RichSpeakingItem, RichWritingItem } from '../../../types';
import { Sparkles, Save, BookOpen, Layers, FileText, ArrowLeft, Bot, Wand2, PlayCircle, CheckCircle2, Plus, Trash2, Mic, Volume2, Edit3, HelpCircle } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'classic' | 'vocab' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing'>('classic');

  // Classic Inputs
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

  // Rich Skill States
  const [richVocabList, setRichVocabList] = useState<RichVocabItem[]>(chapter.richVocabulary || []);
  const [richGrammarList, setRichGrammarList] = useState<RichGrammarItem[]>(chapter.richGrammar || []);
  const [richReadingList, setRichReadingList] = useState<RichReadingItem[]>(chapter.richReading || []);
  const [richListeningList, setRichListeningList] = useState<RichListeningItem[]>(chapter.richListening || []);
  const [richSpeakingList, setRichSpeakingList] = useState<RichSpeakingItem[]>(chapter.richSpeaking || []);
  const [richWritingList, setRichWritingList] = useState<RichWritingItem[]>(chapter.richWriting || []);

  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSaveContent = () => {
    chapter.vocabularyInput = vocabInput;
    chapter.grammarInput = grammarInput;
    chapter.notesInput = notesInput;
    chapter.richVocabulary = richVocabList;
    chapter.richGrammar = richGrammarList;
    chapter.richReading = richReadingList;
    chapter.richListening = richListeningList;
    chapter.richSpeaking = richSpeakingList;
    chapter.richWriting = richWritingList;

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Helper Adders for Rich Items
  const handleAddRichVocab = () => {
    const newItem: RichVocabItem = {
      id: 'vocab_' + Date.now(),
      word: '',
      meaning: '',
      ipa: '',
      partOfSpeech: 'noun',
      example: '',
    };
    setRichVocabList([...richVocabList, newItem]);
  };

  const handleAddRichGrammar = () => {
    const newItem: RichGrammarItem = {
      id: 'gram_' + Date.now(),
      topic: '',
      formula: '',
      usage: '',
    };
    setRichGrammarList([...richGrammarList, newItem]);
  };

  const handleAddRichReading = () => {
    const newItem: RichReadingItem = {
      id: 'read_' + Date.now(),
      title: '',
      passageText: '',
    };
    setRichReadingList([...richReadingList, newItem]);
  };

  const handleAddRichListening = () => {
    const newItem: RichListeningItem = {
      id: 'listen_' + Date.now(),
      title: '',
      transcript: '',
    };
    setRichListeningList([...richListeningList, newItem]);
  };

  const handleAddRichSpeaking = () => {
    const newItem: RichSpeakingItem = {
      id: 'speak_' + Date.now(),
      topic: '',
      promptText: '',
    };
    setRichSpeakingList([...richSpeakingList, newItem]);
  };

  const handleAddRichWriting = () => {
    const newItem: RichWritingItem = {
      id: 'write_' + Date.now(),
      promptTitle: '',
      instructions: '',
    };
    setRichWritingList([...richWritingList, newItem]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
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
              <Sparkles className="w-4 h-4 mr-2" />
              <span>✨ AI TẠO BÀI ÔN TẬP</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* EDITOR NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('classic')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'classic'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>📝 Nhập Liệu Nhanh (Classic)</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'vocab'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>📚 Từ Vựng Chi Tiết ({richVocabList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grammar')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'grammar'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>📐 Ngữ Pháp ({richGrammarList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'reading'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>📖 Reading ({richReadingList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('listening')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'listening'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>🎧 Listening ({richListeningList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('speaking')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'speaking'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>🗣️ Speaking ({richSpeakingList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('writing')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'writing'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>✍️ Writing ({richWritingList.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: CLASSIC TEXT INPUTS (100% PRESERVED) */}
      {activeTab === 'classic' && (
        <div className="grid grid-cols-1 gap-6">
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
      )}

      {/* TAB CONTENT 2: RICH VOCABULARY */}
      {activeTab === 'vocab' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              📚 Danh Sách Từ Vựng Chi Tiết ({richVocabList.length} Từ)
            </h3>
            {!isTeacher && (
              <button
                onClick={handleAddRichVocab}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Từ Vựng
              </button>
            )}
          </div>

          {richVocabList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400 space-y-2">
              <p>Chưa có từ vựng chi tiết nào cho bài học này.</p>
              {!isTeacher && (
                <p className="text-[11px] text-pink-600 font-bold">
                  Bấm "+ Thêm Từ Vựng" để thêm từ vựng với IPA, Từ loại & Ví dụ mẫu.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {richVocabList.map((v, idx) => (
                <div key={v.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-600 text-xs">#{idx + 1}</span>
                    {!isTeacher && (
                      <button
                        onClick={() => setRichVocabList(richVocabList.filter((item) => item.id !== v.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      readOnly={isTeacher}
                      value={v.word}
                      onChange={(e) => {
                        const updated = [...richVocabList];
                        updated[idx].word = e.target.value;
                        setRichVocabList(updated);
                      }}
                      placeholder="Từ vựng (Ví dụ: Beautiful)"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                    <input
                      type="text"
                      readOnly={isTeacher}
                      value={v.ipa || ''}
                      onChange={(e) => {
                        const updated = [...richVocabList];
                        updated[idx].ipa = e.target.value;
                        setRichVocabList(updated);
                      }}
                      placeholder="Phiên âm IPA (/ˈbjuː.tɪ.fəl/)"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                    <input
                      type="text"
                      readOnly={isTeacher}
                      value={v.meaning}
                      onChange={(e) => {
                        const updated = [...richVocabList];
                        updated[idx].meaning = e.target.value;
                        setRichVocabList(updated);
                      }}
                      placeholder="Nghĩa tiếng Việt (Xinh đẹp)"
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={v.example || ''}
                    onChange={(e) => {
                      const updated = [...richVocabList];
                      updated[idx].example = e.target.value;
                      setRichVocabList(updated);
                    }}
                    placeholder="Ví dụ mẫu: She is a beautiful girl."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-normal"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: RICH GRAMMAR */}
      {activeTab === 'grammar' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              📐 Chủ Điểm Ngữ Pháp Chi Tiết ({richGrammarList.length} Chủ điểm)
            </h3>
            {!isTeacher && (
              <button
                onClick={handleAddRichGrammar}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Chủ Điểm Ngữ Pháp
              </button>
            )}
          </div>

          {richGrammarList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400">
              Chưa có chủ điểm ngữ pháp cấu trúc nào.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {richGrammarList.map((g, idx) => (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-600">📐 Ngữ pháp #{idx + 1}</span>
                    {!isTeacher && (
                      <button
                        onClick={() => setRichGrammarList(richGrammarList.filter((item) => item.id !== g.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={g.topic}
                    onChange={(e) => {
                      const updated = [...richGrammarList];
                      updated[idx].topic = e.target.value;
                      setRichGrammarList(updated);
                    }}
                    placeholder="Tên chủ điểm (Ví dụ: Present Simple Tense)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={g.formula || ''}
                    onChange={(e) => {
                      const updated = [...richGrammarList];
                      updated[idx].formula = e.target.value;
                      setRichGrammarList(updated);
                    }}
                    placeholder="Công thức: S + V(s/es) + O"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                  <textarea
                    rows={2}
                    readOnly={isTeacher}
                    value={g.usage || ''}
                    onChange={(e) => {
                      const updated = [...richGrammarList];
                      updated[idx].usage = e.target.value;
                      setRichGrammarList(updated);
                    }}
                    placeholder="Cách dùng & ghi chú..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: RICH READING */}
      {activeTab === 'reading' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              📖 Bài Đọc hiểu Reading ({richReadingList.length} Bài đọc)
            </h3>
            {!isTeacher && (
              <button
                onClick={handleAddRichReading}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Bài Đọc Reading
              </button>
            )}
          </div>

          {richReadingList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400">
              Chưa có bài đọc Reading nào.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {richReadingList.map((r, idx) => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-600">📖 Reading #{idx + 1}</span>
                    {!isTeacher && (
                      <button
                        onClick={() => setRichReadingList(richReadingList.filter((item) => item.id !== r.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={r.title}
                    onChange={(e) => {
                      const updated = [...richReadingList];
                      updated[idx].title = e.target.value;
                      setRichReadingList(updated);
                    }}
                    placeholder="Tiêu đề bài đọc"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                  <textarea
                    rows={4}
                    readOnly={isTeacher}
                    value={r.passageText}
                    onChange={(e) => {
                      const updated = [...richReadingList];
                      updated[idx].passageText = e.target.value;
                      setRichReadingList(updated);
                    }}
                    placeholder="Nội dung bài đọc Reading passage..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: RICH LISTENING */}
      {activeTab === 'listening' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              🎧 Bài Luyện Nghe Listening ({richListeningList.length} Bài nghe)
            </h3>
            {!isTeacher && (
              <button
                onClick={handleAddRichListening}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Bài Nghe Listening
              </button>
            )}
          </div>

          {richListeningList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400">
              Chưa có bài nghe Listening nào.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {richListeningList.map((l, idx) => (
                <div key={l.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-600">🎧 Listening #{idx + 1}</span>
                    {!isTeacher && (
                      <button
                        onClick={() => setRichListeningList(richListeningList.filter((item) => item.id !== l.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={l.title}
                    onChange={(e) => {
                      const updated = [...richListeningList];
                      updated[idx].title = e.target.value;
                      setRichListeningList(updated);
                    }}
                    placeholder="Tiêu đề bài nghe"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={l.audioUrl || ''}
                    onChange={(e) => {
                      const updated = [...richListeningList];
                      updated[idx].audioUrl = e.target.value;
                      setRichListeningList(updated);
                    }}
                    placeholder="Link Audio MP3 (Google Drive, Cloudinary...)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                  <textarea
                    rows={3}
                    readOnly={isTeacher}
                    value={l.transcript || ''}
                    onChange={(e) => {
                      const updated = [...richListeningList];
                      updated[idx].transcript = e.target.value;
                      setRichListeningList(updated);
                    }}
                    placeholder="Transcript bài nghe..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 6: RICH SPEAKING */}
      {activeTab === 'speaking' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              🗣️ Chủ Đề Nói Speaking ({richSpeakingList.length} Chủ đề)
            </h3>
            {!isTeacher && (
              <button
                onClick={handleAddRichSpeaking}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Chủ Đề Speaking
              </button>
            )}
          </div>

          {richSpeakingList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400">
              Chưa có chủ đề Speaking nào.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {richSpeakingList.map((s, idx) => (
                <div key={s.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-600">🗣️ Speaking #{idx + 1}</span>
                    {!isTeacher && (
                      <button
                        onClick={() => setRichSpeakingList(richSpeakingList.filter((item) => item.id !== s.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={s.topic}
                    onChange={(e) => {
                      const updated = [...richSpeakingList];
                      updated[idx].topic = e.target.value;
                      setRichSpeakingList(updated);
                    }}
                    placeholder="Chủ đề Speaking (Ví dụ: Describe your daily routine)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                  <textarea
                    rows={2}
                    readOnly={isTeacher}
                    value={s.promptText}
                    onChange={(e) => {
                      const updated = [...richSpeakingList];
                      updated[idx].promptText = e.target.value;
                      setRichSpeakingList(updated);
                    }}
                    placeholder="Câu hỏi gợi ý nói (What do you usually do in the morning?)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 7: RICH WRITING */}
      {activeTab === 'writing' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              ✍️ Đề Bài Viết Writing ({richWritingList.length} Đề bài)
            </h3>
            {!isTeacher && (
              <button
                onClick={handleAddRichWriting}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-xs transition flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Đề Bài Writing
              </button>
            )}
          </div>

          {richWritingList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400">
              Chưa có đề bài Writing nào.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {richWritingList.map((w, idx) => (
                <div key={w.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-600">✍️ Writing #{idx + 1}</span>
                    {!isTeacher && (
                      <button
                        onClick={() => setRichWritingList(richWritingList.filter((item) => item.id !== w.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    readOnly={isTeacher}
                    value={w.promptTitle}
                    onChange={(e) => {
                      const updated = [...richWritingList];
                      updated[idx].promptTitle = e.target.value;
                      setRichWritingList(updated);
                    }}
                    placeholder="Tiêu đề đề bài Writing"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                  <textarea
                    rows={3}
                    readOnly={isTeacher}
                    value={w.instructions}
                    onChange={(e) => {
                      const updated = [...richWritingList];
                      updated[idx].instructions = e.target.value;
                      setRichWritingList(updated);
                    }}
                    placeholder="Yêu cầu & hướng dẫn làm bài viết..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              <span>✨ TẠO BÀI ÔN TẬP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

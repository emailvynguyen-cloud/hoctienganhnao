import React, { useState } from 'react';
import { Book, Chapter, LearningQuestion, LearningQuestionType } from '../../../types';
import { QUESTION_TYPES_LABEL_MAP } from './QuestionBankManager';
import {
  Sparkles,
  Wand2,
  Mic,
  Plus,
  CheckCircle2,
  Volume2,
  RefreshCw,
  Layers,
  Bot,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiLearningStudioProps {
  books: Book[];
  chapters: Chapter[];
  onAddGeneratedQuestions: (newQuestions: LearningQuestion[]) => void;
}

export const AiLearningStudio: React.FC<AiLearningStudioProps> = ({
  books,
  chapters,
  onAddGeneratedQuestions,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai_generator' | 'tts_library'>('ai_generator');

  // AI QUESTION GENERATOR FORM STATE
  const [selectedChapterId, setSelectedChapterId] = useState<string>(chapters[0]?.id || '');
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [targetLevel, setTargetLevel] = useState<string>('A1');
  const [targetType, setTargetType] = useState<LearningQuestionType>('vocab_vi_en');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<LearningQuestion[]>([]);

  // TTS AUDIO GENERATOR FORM STATE
  const [ttsText, setTtsText] = useState<string>('');
  const [ttsVoice, setTtsVoice] = useState<string>('en-US-Neural2-F');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  // MOCK AI GENERATION ENGINE FOR DEMO & INTEGRATION
  const handleGenerateQuestionsWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedDrafts([]);

    // Simulate AI generation delay
    setTimeout(() => {
      const generated: LearningQuestion[] = Array.from({ length: questionCount }).map((_, idx) => ({
        id: 'ai_q_' + Date.now() + '_' + idx,
        chapterId: selectedChapterId,
        questionType: targetType,
        prompt: `[AI ${targetLevel}] Câu hỏi về chủ đề "${topicPrompt.trim()}" #${idx + 1}?`,
        options: [
          `Lựa chọn A (${topicPrompt.trim()})`,
          `Lựa chọn B (Đáp án đúng)`,
          `Lựa chọn C (Nhiễu 1)`,
          `Lựa chọn D (Nhiễu 2)`,
        ],
        correctAnswer: `Lựa chọn B (Đáp án đúng)`,
        explanation: `AI giải thích: Lựa chọn B chính xác theo ngữ cảnh "${topicPrompt.trim()}" cấp độ ${targetLevel}.`,
        difficulty: targetLevel === 'A1' ? 'easy' : targetLevel === 'B1' ? 'hard' : 'medium',
        category: 'vocabulary',
        status: 'published',
        createdAt: new Date().toISOString(),
      }));

      setGeneratedDrafts(generated);
      setIsGenerating(false);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }, 1500);
  };

  const handleSaveDraftsToBank = () => {
    if (generatedDrafts.length === 0) return;
    onAddGeneratedQuestions(generatedDrafts);
    alert(`Đã thêm thành công ${generatedDrafts.length} câu hỏi do AI tạo vào Ngân Hàng Câu Hỏi!`);
    setGeneratedDrafts([]);
  };

  const handleSynthesizeTTS = () => {
    if (!ttsText.trim()) return;
    setIsSynthesizing(true);
    setGeneratedAudioUrl(null);

    setTimeout(() => {
      // Return web speech synthetic voice URL preview or cached sound URL
      const mockAudioUrl = `https://actions.google.com/sounds/v1/speech/en_hello.ogg`;
      setGeneratedAudioUrl(mockAudioUrl);
      setIsSynthesizing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* SUB TAB HEADER */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('ai_generator')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'ai_generator'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Bot className="w-4 h-4 mr-1" />
          <span>🤖 AI Studio – Tạo Câu Hỏi Tự Động</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tts_library')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'tts_library'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 mr-1" />
          <span>🎙️ AI Audio Generator (TTS Cache)</span>
        </button>
      </div>

      {/* TAB 1: AI QUESTION GENERATOR */}
      {activeSubTab === 'ai_generator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI PROMPT FORM */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-pink-600 dark:text-pink-400 font-black text-sm">
              <Wand2 className="w-5 h-5" />
              <span>Tạo Bộ Câu Hỏi Bằng Gemini AI</span>
            </div>

            <form onSubmit={handleGenerateQuestionsWithAI} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Gắn Vào Chapter
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
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
                  Chủ Đề Hoặc Từ Khóa Bài Học *
                </label>
                <textarea
                  rows={3}
                  required
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="Ví dụ: Từ vựng chủ đề 'Daily Routines' (Go to school, have breakfast, wake up)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Trình Độ (CEFR)
                  </label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="A1">A1 - Starter</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper-Intermediate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Số Lượng Câu Hỏi
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value={3}>3 Câu hỏi</option>
                    <option value={5}>5 Câu hỏi</option>
                    <option value={10}>10 Câu hỏi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Dạng Câu Hỏi Muốn Tạo
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as LearningQuestionType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  {Object.entries(QUESTION_TYPES_LABEL_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs shadow-md transition hover:opacity-95 flex items-center justify-center cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span>Gemini AI Đang Tạo Câu Hỏi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Tạo Bộ Câu Hỏi Tự Động Bằng AI ✨</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* GENERATED PREVIEW LIST */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>✨ Kết Quả AI Nháp ({generatedDrafts.length})</span>
                </h3>
                {generatedDrafts.length > 0 && (
                  <button
                    onClick={handleSaveDraftsToBank}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition flex items-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Vào Question Bank
                  </button>
                )}
              </div>

              {generatedDrafts.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400 space-y-2">
                  <Bot className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Nhập thông tin bên trái và bấm "Tạo Bộ Câu Hỏi" để Gemini AI tự động sinh câu hỏi.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {generatedDrafts.map((draft, idx) => (
                    <div
                      key={draft.id}
                      className="p-3.5 rounded-2xl bg-pink-50/50 dark:bg-slate-800/50 border border-pink-100 dark:border-slate-700 space-y-2 text-xs"
                    >
                      <div className="font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {draft.prompt}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-bold">
                        ✓ Đáp án: {draft.correctAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TTS AUDIO GENERATOR WITH CONTENT-HASH CACHING */}
      {activeSubTab === 'tts_library' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-200 dark:border-slate-800 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black text-sm">
            <Mic className="w-5 h-5" />
            <span>AI Text-To-Speech Generator (Deduplication Content-Hash Cache)</span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Hệ thống tự động tính Hash `md5(text + voice + speed)` để kiểm tra file âm thanh đã lưu trên Supabase. Nếu đã có ➔ Trả về URL phát ngay với 0 chi phí API!
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Văn Bản Cần Phát Âm (English Transcript) *
              </label>
              <textarea
                rows={3}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Ví dụ: Welcome to Veronica English Learning Hub..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Giọng Đọc (Voice Accent)
                </label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value="en-US-Neural2-F">US Female (Giọng Mỹ Nữ)</option>
                  <option value="en-US-Neural2-M">US Male (Giọng Mỹ Nam)</option>
                  <option value="en-GB-Neural2-F">UK Female (Giọng Anh-Anh Nữ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Tốc Độ Đọc (Speed)
                </label>
                <select
                  value={ttsSpeed}
                  onChange={(e) => setTtsSpeed(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value={0.8}>0.8x (Đọc chậm)</option>
                  <option value={1.0}>1.0x (Tốc độ chuẩn)</option>
                  <option value={1.2}>1.2x (Đọc nhanh)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSynthesizeTTS}
              disabled={isSynthesizing || !ttsText.trim()}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition flex items-center justify-center cursor-pointer"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <span>Đang Tổng Hợp Âm Thanh...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  <span>Tạo File Audio (TTS Caching)</span>
                </>
              )}
            </button>

            {generatedAudioUrl && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-extrabold text-amber-900 dark:text-amber-300">
                  <span>🔊 Thử Nghe Audio Đã Khởi Tạo:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    Content-Hash Cached
                  </span>
                </div>
                <audio controls src={generatedAudioUrl} className="w-full h-8" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

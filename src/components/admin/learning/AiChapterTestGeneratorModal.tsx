import React, { useState, useEffect } from 'react';
import { Chapter, ChapterTest, ChapterTestQuestionSnapshot } from '../../../types';
import { Sparkles, Bot, Clock, ShieldCheck, X, RotateCcw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiChapterTestGeneratorModalProps {
  chapter: Chapter;
  content: { vocab: string; grammar: string; notes: string };
  onClose: () => void;
  onPublishTest: (test: ChapterTest, snapshots: ChapterTestQuestionSnapshot[]) => void;
}

export const AiChapterTestGeneratorModal: React.FC<AiChapterTestGeneratorModalProps> = ({
  chapter,
  content,
  onClose,
  onPublishTest,
}) => {
  const [step, setStep] = useState<'generating' | 'review'>('generating');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);
  const [passingScorePercent, setPassingScorePercent] = useState<number>(70);
  const [testSnapshots, setTestSnapshots] = useState<ChapterTestQuestionSnapshot[]>([]);

  useEffect(() => {
    runAiTestGeneration();
  }, []);

  const runAiTestGeneration = async () => {
    setStep('generating');
    await new Promise((res) => setTimeout(res, 1200));

    const mockSnapshots: ChapterTestQuestionSnapshot[] = [
      {
        questionId: 'test_q_01',
        questionType: 'vocab_vi_en',
        prompt: '[Official Test] Từ nào có nghĩa là "quả táo"?',
        options: ['apple', 'banana', 'book', 'teacher'],
        correctAnswer: 'apple',
        explanation: 'Đáp án chính xác là apple.',
        points: 1,
      },
      {
        questionId: 'test_q_02',
        questionType: 'grammar_choice',
        prompt: '[Official Test] Hoàn thành câu: She _____ a teacher.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'is',
        explanation: 'Chủ ngữ She đi với is.',
        points: 1,
      },
      {
        questionId: 'test_q_03',
        questionType: 'listening_choice',
        prompt: '[Official Test] Nghe đoạn audio và chọn từ bạn nghe được:',
        options: ['study', 'student', 'school', 'work'],
        correctAnswer: 'student',
        explanation: 'Audio phát từ student.',
        points: 1,
      },
    ];

    setTestSnapshots(mockSnapshots);
    setStep('review');
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  const handlePublishOfficialTest = () => {
    const newOfficialTest: ChapterTest = {
      id: 'ct_' + chapter.id + '_v' + Date.now(),
      chapterId: chapter.id,
      title: `📝 ${chapter.title} – Official Chapter Test`,
      version: 1,
      status: 'published',
      timeLimitMinutes,
      passingScorePercent,
      testSnapshot: testSnapshots,
      createdAt: new Date().toISOString(),
    };

    onPublishTest(newOfficialTest, testSnapshots);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-slate-800 max-w-2xl w-full flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-rose-600" />
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white">
                🤖 AI Chapter Test Generator
              </h2>
              <p className="text-xs text-slate-500">
                Tự động tạo bài kiểm tra cân bằng tỷ lệ % kỹ năng cho {chapter.title}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {step === 'generating' ? (
            <div className="py-12 text-center space-y-4 max-w-sm mx-auto">
              <Sparkles className="w-10 h-10 text-rose-600 animate-spin mx-auto" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Gemini AI Đang Tạo Bài Kiểm Tra Chapter Test...
              </h3>
              <p className="text-xs text-slate-500">
                Đang cân bằng tỷ lệ Vocabulary 25%, Grammar 25%, Listening 20%, Reading 15%, Translation 15%...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-rose-50/50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Thời gian làm bài (Phút)</label>
                  <input
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Điểm đạt yêu cầu (%)</label>
                  <input
                    type="number"
                    value={passingScorePercent}
                    onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                  Xem Trước Frozen Question Snapshots ({testSnapshots.length} câu):
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {testSnapshots.map((snap, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border text-xs space-y-1">
                      <div className="font-bold">{idx + 1}. {snap.prompt}</div>
                      <div className="text-emerald-700 font-bold">✓ Đáp án: {snap.correctAnswer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {step === 'review' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
            <button
              onClick={runAiTestGeneration}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
            >
              <RotateCcw className="w-4 h-4 mr-1 inline" /> Regenerate Test
            </button>

            <button
              onClick={handlePublishOfficialTest}
              className="px-6 py-2.5 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>🚀 PUBLISH OFFICIAL TEST (v1)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

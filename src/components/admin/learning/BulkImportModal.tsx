import React, { useState } from 'react';
import { LearningQuestion, LearningQuestionType } from '../../../types';
import { X, CheckCircle2, AlertTriangle, FileText, ArrowRight, RefreshCw } from 'lucide-react';

interface BulkImportModalProps {
  onClose: () => void;
  onImportQuestions: (parsedQuestions: LearningQuestion[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, onImportQuestions }) => {
  const [rawText, setRawText] = useState<string>(
    `What is your name?\nA. I'm Vy\nB. I'm 25\nC. I'm from Vietnam\nD. I'm a teacher\nANSWER: A\n\nWhere do you live?\nA. I'm a teacher\nB. I live in Vietnam\nC. I'm 25\nD. Nice to meet you\nANSWER: B`
  );

  const [parsedItems, setParsedItems] = useState<{
    prompt: string;
    options: string[];
    correctAnswer: string;
    isValid: boolean;
    errorMsg?: string;
  }[]>([]);

  const [isParsed, setIsParsed] = useState<boolean>(false);

  const parseRawText = () => {
    const blocks = rawText
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    const items: {
      prompt: string;
      options: string[];
      correctAnswer: string;
      isValid: boolean;
      errorMsg?: string;
    }[] = [];

    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let prompt = '';
      const options: string[] = [];
      let correctAnswer = '';
      let answerLetter = '';

      for (const line of lines) {
        if (/^(ANSWER|ĐÁP ÁN|DAP AN|DAP_AN)\s*:\s*/i.test(line)) {
          const match = line.match(/^(ANSWER|ĐÁP ÁN|DAP AN|DAP_AN)\s*:\s*([A-D0-9]+)/i);
          if (match) {
            answerLetter = match[2].toUpperCase();
          }
        } else if (/^[A-D][.\):]/i.test(line)) {
          const cleanOpt = line.replace(/^[A-D][.\):]\s*/i, '').trim();
          options.push(cleanOpt);
        } else if (!prompt) {
          prompt = line.replace(/^(Câu\s*\d+[.:]?|Question\s*\d+[.:]?)\s*/i, '').trim();
        }
      }

      // Determine correct answer string from option letter (A -> index 0, B -> index 1...)
      if (answerLetter) {
        if (['A', 'B', 'C', 'D'].includes(answerLetter)) {
          const index = answerLetter.charCodeAt(0) - 65;
          if (options[index]) {
            correctAnswer = options[index];
          }
        } else {
          correctAnswer = answerLetter;
        }
      }

      let isValid = true;
      let errorMsg = '';

      if (!prompt) {
        isValid = false;
        errorMsg = 'Thiếu câu hỏi (Prompt)';
      } else if (options.length < 2) {
        isValid = false;
        errorMsg = 'Thiếu các lựa chọn A, B, C, D (tối thiểu 2 lựa chọn)';
      } else if (!correctAnswer) {
        isValid = false;
        errorMsg = 'Thiếu đáp án đúng (Thêm ví dụ: ANSWER: A)';
      }

      items.push({
        prompt,
        options,
        correctAnswer,
        isValid,
        errorMsg,
      });
    }

    setParsedItems(items);
    setIsParsed(true);
  };

  const handleConfirmImport = () => {
    const validItems = parsedItems.filter((item) => item.isValid);
    if (validItems.length === 0) {
      alert('Không có câu hỏi nào hợp lệ để nhập!');
      return;
    }

    const questions: LearningQuestion[] = validItems.map((item, index) => ({
      id: `q_bulk_${Date.now()}_${index}`,
      questionType: 'grammar_choice' as LearningQuestionType,
      prompt: item.prompt,
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: 'Câu hỏi được nhập tự động từ Bulk Import.',
      difficulty: 'medium',
      category: 'grammar',
      status: 'published',
      createdAt: new Date().toISOString(),
    }));

    onImportQuestions(questions);
    onClose();
  };

  const validCount = parsedItems.filter((i) => i.isValid).length;
  const invalidCount = parsedItems.filter((i) => !i.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-pink-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn text-slate-900 dark:text-white relative">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-pink-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-black text-base">📋 NHẬP NHIỀU CÂU HỎI CÙNG LÚC (BULK IMPORT)</h2>
              <p className="text-xs text-slate-500">Copy & paste đề bài từ Word/Docs để tự động tạo câu hỏi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isParsed ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-1.5 text-xs">
              <p className="font-black text-amber-900 dark:text-amber-300">💡 ĐỊNH DẠNG MẪU CHUẨN (Copy/Paste):</p>
              <pre className="font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
{`What is your name?
A. I'm Vy
B. I'm 25
C. I'm from Vietnam
D. I'm a teacher
ANSWER: A

Where do you live?
A. I'm a teacher
B. I live in Vietnam
C. I'm 25
D. Nice to meet you
ANSWER: B`}
              </pre>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                Dán văn bản đề bài của bạn vào đây:
              </label>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Dán đề bài từ file Word/Docs..."
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={parseRawText}
                className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <span>Phân Tích Đề Bài</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* PARSE SUMMARY STATS */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-4 text-xs font-bold">
                <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-black">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {validCount} câu hợp lệ
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center text-amber-600 dark:text-amber-400 font-black">
                    <AlertTriangle className="w-4 h-4 mr-1" /> {invalidCount} câu cần sửa
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsParsed(false)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition flex items-center cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sửa lại văn bản
              </button>
            </div>

            {/* PREVIEW LIST */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    item.isValid
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'bg-amber-50/70 dark:bg-slate-800/80 border-amber-200 dark:border-amber-900/50'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Câu {idx + 1}: {item.prompt || '(Chưa có tiêu đề câu)'}
                    </span>
                    {item.isValid ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                        Hợp Lệ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                        {item.errorMsg}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pl-2 text-slate-600 dark:text-slate-300">
                    {item.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-1.5 rounded-lg border text-[11px] ${
                          opt === item.correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt} {opt === item.correctAnswer && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsParsed(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Quay Lại Sửa Văn Bản
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validCount === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Nhập {validCount} Câu Hợp Lệ Vào Exercise</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

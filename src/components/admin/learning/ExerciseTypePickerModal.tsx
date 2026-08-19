import React from 'react';
import { ExerciseType } from '../../../types';
import { X, BookOpen, Layers, CheckSquare, Edit3, Repeat, Globe, Type, CheckCircle, MessageSquare, Mic, Headphones, Eye, Feather } from 'lucide-react';

interface ExerciseTypePickerModalProps {
  onClose: () => void;
  onSelectType: (type: ExerciseType) => void;
}

export const ExerciseTypePickerModal: React.FC<ExerciseTypePickerModalProps> = ({ onClose, onSelectType }) => {
  const typesList: { type: ExerciseType; title: string; desc: string; icon: any; color: string }[] = [
    { type: 'vocabulary', title: '📚 Vocabulary', desc: 'Từ vựng có IPA & câu ví dụ mẫu', icon: BookOpen, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200' },
    { type: 'grammar', title: '📐 Grammar', desc: 'Lý thuyết & công thức ngữ pháp', icon: Layers, color: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' },
    { type: 'multiple-choice', title: '📝 Multiple Choice', desc: 'Trắc nghiệm 4 lựa chọn A/B/C/D', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200' },
    { type: 'fill-blank', title: '✏️ Fill in Blank', desc: 'Điền từ thích hợp vào ô trống', icon: Edit3, color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200' },
    { type: 'matching', title: '🔗 Matching', desc: 'Nối cặp từ và nghĩa tương ứng', icon: Repeat, color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200' },
    { type: 'translation', title: '🌐 Translation', desc: 'Dịch câu tiếng Việt sang tiếng Anh', icon: Globe, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' },
    { type: 'sentence-building', title: '🔤 Sentence Building', desc: 'Sắp xếp khối từ thành câu chuẩn', icon: Type, color: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200' },
    { type: 'true-false', title: '☑️ True / False', desc: 'Xác định phát biểu Đúng hay Sai', icon: CheckCircle, color: 'bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200' },
    { type: 'short-answer', title: '💬 Short Answer', desc: 'Trả lời câu hỏi ngắn', icon: MessageSquare, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
    { type: 'speaking', title: '🎤 Speaking Practice', desc: 'Chủ đề & câu hỏi gợi ý phát âm', icon: Mic, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200' },
    { type: 'listening', title: '🎧 Listening Practice', desc: 'Bài nghe MP3 & Transcript', icon: Headphones, color: 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200' },
    { type: 'reading', title: '📖 Reading Passage', desc: 'Đoạn văn đọc hiểu & câu hỏi', icon: Eye, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200' },
    { type: 'writing', title: '✍️ Writing Essay', desc: 'Đề bài luận & bài mẫu hướng dẫn', icon: Feather, color: 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-pink-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-fadeIn text-slate-900 dark:text-white relative">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-black text-lg">📝 CHỌN DẠNG BÀI TẬP (EXERCISE TYPE)</h2>
            <p className="text-xs text-slate-500">Bấm chọn một dạng bài tập để khởi tạo và mở trực tiếp Exercise Editor</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {typesList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                onClick={() => onSelectType(item.type)}
                className={`p-4 rounded-2xl border ${item.color} shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-2 group`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 shrink-0" />
                  <h3 className="font-black text-xs group-hover:underline">{item.title}</h3>
                </div>
                <p className="text-[11px] opacity-80 line-clamp-2">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

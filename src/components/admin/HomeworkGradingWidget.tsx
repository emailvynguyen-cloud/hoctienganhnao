import React, { useState } from 'react';
import { HomeworkSubmission, Student } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { CheckCircle2, Star, Sparkles, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { GeminiEngine } from '../../lib/gemini';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface HomeworkGradingWidgetProps {
  students: Student[];
  onRefreshData: () => void;
}

export const HomeworkGradingWidget: React.FC<HomeworkGradingWidgetProps> = ({
  students,
  onRefreshData,
}) => {
  const submissions: HomeworkSubmission[] = StorageEngine.getHomeworkSubmissions() || [];
  const pendingSubmissions = submissions.filter((s) => s && !s.isTeacherFeedbackChecked);
  const reviewedSubmissions = submissions.filter((s) => s && s.isTeacherFeedbackChecked);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const handleOpenGrading = (sub: HomeworkSubmission) => {
    setSelectedSubId(sub.id);
    setFeedbackText(sub.feedbackText || 'Em làm bài tập rất xuất sắc! Giữ vững phong độ nhé. ✨');
    setStars(sub.ratingStars || 5);
  };

  const handleAutoGenerateAI = async (sub: HomeworkSubmission) => {
    setIsGeneratingAI(true);
    try {
      const studentObj = students.find((s) => s.id === sub.studentId);
      const prompt = `Bạn là giáo viên Tiếng Anh Ms. Vy cực kỳ tâm huyết và dễ thương. Hãy viết 1 câu nhận xét ngắn gọn (khoảng 2 câu) động viên em học viên "${studentObj?.name || 'em'}" đã hoàn thành bài tập về nhà "${sub.homeworkTitle}". Nhận xét mang tính khuyến khích, khen ngợi và góp ý nhẹ nhàng.`;
      
      const res = await GeminiEngine.generateText(prompt);
      setFeedbackText(res.text.trim());
    } catch (err: any) {
      setFeedbackText('Em làm bài tập rất đầy đủ và chăm chỉ! Tiếp tục phát huy nhé em! 🌟');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmitFeedback = (sub: HomeworkSubmission) => {
    StorageEngine.gradeHomeworkSubmission(sub.id, feedbackText, stars);
    setSelectedSubId(null);
    onRefreshData();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-pink-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500 animate-pulse" />
            Quản Lý Chấm Bài Tập Về Nhà & Nhận Xét
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Duyệt các bài làm của học viên và gửi phản hồi nhận xét trực tiếp
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            ⏳ {pendingSubmissions.length} Bài Chờ Chấm
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ {reviewedSubmissions.length} Đã Phản Hồi
          </span>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length > 0 ? (
          submissions.map((sub) => {
            const studentObj = students.find((s) => s && s.id === sub.studentId);
            const avatarSrc = resolveAvatarUrl(studentObj?.avatar);
            const isEditing = selectedSubId === sub.id;

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 ${
                  sub.isTeacherFeedbackChecked
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-pink-50/40 border-pink-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={avatarSrc}
                      alt={studentObj?.name || 'Học viên'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                      }}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-pink-200 shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {studentObj?.name || 'Học viên'}
                        </h4>
                        <span className="text-xs text-pink-900 font-bold bg-pink-100 px-2 py-0.5 rounded-md border border-pink-200">
                          {sub.homeworkTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Ngày nộp bài: {sub.submissionDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {sub.isTeacherFeedbackChecked ? (
                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-xs hover:bg-emerald-200 transition"
                      >
                        ✓ Đã Phản Hồi (Sửa)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="px-4 py-2 rounded-xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs"
                      >
                        ✍️ Chấm Bài & Viết Phản Hồi
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Submitted by Student */}
                {sub.content && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 text-xs space-y-1">
                    <span className="font-bold text-slate-500 block">Nội dung học viên nộp:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{sub.content}</p>
                  </div>
                )}

                {/* Submitted Audio File or Attachment */}
                {sub.fileUrl && (
                  <div className="pt-1">
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-950 font-extrabold text-xs hover:bg-sky-200 transition inline-flex items-center border border-sky-200"
                    >
                      🔗 Link File Ghi Âm / Đính Kèm Của Học Viên
                    </a>
                  </div>
                )}

                {/* Feedback Input Drawer */}
                {isEditing && (
                  <div className="pt-3 border-t border-pink-200 dark:border-slate-700 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-pink-950 dark:text-pink-300 uppercase tracking-wider">
                        📝 Viết Nhận Xét Khuyến Khích Cho Học Viên:
                      </span>
                      <button
                        onClick={() => handleAutoGenerateAI(sub)}
                        disabled={isGeneratingAI}
                        className="px-3 py-1 rounded-xl bg-sky-100 text-sky-950 font-black text-xs hover:bg-sky-200 transition flex items-center border border-sky-300"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-600 animate-spin" />
                        {isGeneratingAI ? 'AI Đang Gợi Ý...' : '✨ AI Gợi Ý Nhận Xét'}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Nhập lời khen ngợi và hướng dẫn cho em học viên..."
                      className="w-full p-3 rounded-2xl border border-pink-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white dark:bg-slate-800"
                    />

                    {/* Star rating selector */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Đánh Giá Số Sao:</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setStars(s)}
                              className={`p-1 rounded-lg transition ${
                                s <= stars ? 'text-amber-400 scale-110' : 'text-slate-300'
                              }`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedSubId(null)}
                          className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSubmitFeedback(sub)}
                          className="px-4 py-1.5 rounded-xl bg-pink-200 text-pink-950 font-extrabold text-xs hover:bg-pink-300 border border-pink-300 shadow-xs"
                        >
                          Gửi Phản Hồi Ngay
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-pink-50/30 rounded-3xl border border-pink-100 text-xs text-slate-400 italic">
            Chưa có bài tập nộp từ học viên.
          </div>
        )}
      </div>
    </div>
  );
};

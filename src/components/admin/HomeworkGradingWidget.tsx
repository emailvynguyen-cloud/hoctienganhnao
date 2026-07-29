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
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 animate-pulse" />
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
                    : 'bg-purple-50/60 border-purple-200 shadow-xs'
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
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-purple-200 shadow-sm shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {studentObj?.name || 'Học viên'}
                        </h4>
                        <span className="text-xs text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
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
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold transition flex items-center border border-emerald-300"
                      >
                        ✓ Đã Duyệt ({sub.ratingStars || 5} ⭐) - Sửa Lại
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition shadow-sm flex items-center animate-pulse"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chấm Bài & Phản Hồi
                      </button>
                    )}
                  </div>
                </div>

                {/* Grading Area Expandable */}
                {isEditing && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 space-y-3 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between">
                      <h5 className="font-black text-purple-900 dark:text-purple-200 uppercase">
                        Nhập Nhận Xét & Đánh Giá Bài Làm
                      </h5>
                      
                      <button
                        onClick={() => handleAutoGenerateAI(sub)}
                        disabled={isGeneratingAI}
                        className="px-3 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-[11px] transition flex items-center border border-purple-300"
                      >
                        <Sparkles className="w-3 h-3 mr-1 text-purple-600 animate-spin" />
                        {isGeneratingAI ? 'AI Đang Viết...' : '🪄 Gợi Ý Nhận Xét AI'}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Nhập nhận xét chi tiết bài tập cho học viên (e.g. Làm bài rất tốt, chú ý từ vựng...)"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-700">Đánh Giá Số Sao:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((starNum) => (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setStars(starNum)}
                            className={`p-1.5 rounded-xl transition ${
                              stars >= starNum ? 'text-amber-500 scale-110' : 'text-slate-300'
                            }`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                      <span className="font-black text-amber-600">({stars} ⭐)</span>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setSelectedSubId(null)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                      >
                        Hủy Bỏ
                      </button>
                      <button
                        onClick={() => handleSubmitFeedback(sub)}
                        className="px-5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition shadow-sm"
                      >
                        Lưu Phản Hồi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-purple-50/50 rounded-2xl text-xs text-slate-500 italic border border-purple-100">
            Chưa có bài nộp nào từ học viên.
          </div>
        )}
      </div>
    </div>
  );
};

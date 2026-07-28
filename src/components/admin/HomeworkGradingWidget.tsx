import React, { useState } from 'react';
import { HomeworkSubmission, Student } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { CheckCircle2, Clock, MessageSquare, Star, Send, Award, Sparkles, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface HomeworkGradingWidgetProps {
  students: Student[];
  onRefreshData: () => void;
}

export const HomeworkGradingWidget: React.FC<HomeworkGradingWidgetProps> = ({
  students,
  onRefreshData,
}) => {
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [stars, setStars] = useState(3);

  const allSubmissions = StorageEngine.getHomeworkSubmissions() || [];
  const safeStudents = students || [];
  
  const pendingSubs = allSubmissions.filter((s) => s && s.isStudentChecked && !s.isTeacherFeedbackChecked);
  const completedSubs = allSubmissions.filter((s) => s && s.isTeacherFeedbackChecked);

  const displayList = filter === 'pending' ? pendingSubs : completedSubs;

  const handleGradeSubmit = (submissionId: string) => {
    if (!feedbackText) {
      alert('Vui lòng nhập nhận xét/feedback cho bài tập!');
      return;
    }

    StorageEngine.submitHomeworkFeedback(submissionId, feedbackText, stars);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    alert('Đã chấm bài và gửi feedback thành công!');
    setSelectedSubId(null);
    setFeedbackText('');
    setStars(3);
    onRefreshData();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-6">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-purple-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-purple-600 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Chấm Bài Tập Về Nhà & Gửi Feedback (Super Admin & Admin)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Danh sách bài tập học viên đã tích chọn "Đã làm bài" cần giáo viên/admin chấm điểm & phản hồi
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/50 p-1.5 rounded-2xl border border-purple-200">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center ${
              filter === 'pending'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1 text-pink-300" />
            Chờ Chấm Bài ({pendingSubs.length})
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-purple-300 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Đã Chấm Bài ({completedSubs.length})
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {displayList.length > 0 ? (
          displayList.map((sub) => {
            const student = safeStudents.find((s) => s && s.id === sub.studentId);
            const isGradingThis = selectedSubId === sub.id;

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 ${
                  sub.isTeacherFeedbackChecked
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-purple-50/40 border-purple-100 hover:border-purple-300 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2">
                  <div className="flex items-center space-x-3">
                    <img
                      src={resolveAvatarUrl(student?.avatar)}
                      alt={sub.studentName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                      }}
                      className="w-10 h-10 rounded-2xl object-cover border border-purple-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {sub.studentName}
                      </h4>
                      <span className="text-xs font-black text-purple-700">
                        {sub.homeworkTitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Học viên đã tích ngày {sub.submissionDate}
                    </span>

                    {sub.isTeacherFeedbackChecked ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        ✓ Đã Feedback ({sub.ratingStars} ⭐)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 animate-pulse">
                        ⏳ Chờ Chấm Bài
                      </span>
                    )}
                  </div>
                </div>

                {/* Student Content if any */}
                {sub.studentContent && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100 text-xs font-medium italic text-slate-700 dark:text-slate-300">
                    "{sub.studentContent}"
                  </div>
                )}

                {/* Teacher Feedback Result or Grading Form */}
                {sub.isTeacherFeedbackChecked ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-100/60 text-xs text-emerald-900 space-y-1">
                    <span className="font-extrabold block">💬 Phản hồi của Giáo viên / Admin:</span>
                    <p className="font-medium">{sub.feedbackText}</p>
                  </div>
                ) : (
                  <div>
                    {isGradingThis ? (
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 space-y-3 animate-fadeIn text-xs">
                        <h5 className="font-black text-purple-900 dark:text-purple-200 uppercase">
                          Nhập Nhận Xét & Chấm Sao
                        </h5>

                        <textarea
                          rows={3}
                          placeholder="Nhập nhận xét chi tiết bài tập cho học viên (e.g. Làm bài rất tốt, chú ý từ vựng...)"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium"
                        />

                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-slate-700">Tặng Sao Thưởng:</span>
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

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubId(null)}
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGradeSubmit(sub.id)}
                            className="px-5 py-2 rounded-xl bg-purple-600 text-white font-extrabold shadow-md hover:bg-purple-700 flex items-center"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" /> Chấm Bài & Lưu Feedback
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setFeedbackText('');
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold hover:bg-purple-700 transition shadow-sm flex items-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chấm Bài Tập Này →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-purple-50/40 rounded-3xl text-xs font-bold text-purple-700 italic border border-purple-100">
            {filter === 'pending'
              ? 'Tuyệt vời! Không có bài tập nào đang chờ chấm.'
              : 'Chưa có bài tập nào được hoàn tất feedback.'}
          </div>
        )}
      </div>

    </div>
  );
};

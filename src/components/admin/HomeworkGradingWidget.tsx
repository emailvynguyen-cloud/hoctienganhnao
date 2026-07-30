import React, { useState } from 'react';
import { HomeworkSubmission, Student, Class, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { CheckCircle2, Star, Sparkles, MessageSquare, Clock, AlertCircle, Bell, UserCheck, Check, Send } from 'lucide-react';
import { GeminiEngine } from '../../lib/gemini';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface HomeworkGradingWidgetProps {
  currentUser?: User | null;
  students: Student[];
  classes?: Class[];
  onRefreshData: () => void;
  targetSubmissionId?: string | null;
}

export const HomeworkGradingWidget: React.FC<HomeworkGradingWidgetProps> = ({
  currentUser,
  students,
  classes = [],
  onRefreshData,
  targetSubmissionId,
}) => {
  const isSuperOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // TEACHER RBAC SCOPING: Filter classes strictly assigned to this teacher
  const assignedClasses = classes.filter((c) => {
    if (!currentUser || isSuperOrAdmin) return true;
    return c.teacherId === currentUser.uid || (c.teacherName && c.teacherName === currentUser.displayName);
  });
  const assignedClassIds = assignedClasses.map((c) => c.id);

  // Filter students enrolled in teacher's assigned classes
  const assignedStudents = students.filter((s) => {
    if (!currentUser || isSuperOrAdmin) return true;
    return s.classIds && s.classIds.some((cid) => assignedClassIds.includes(cid));
  });
  const assignedStudentIds = assignedStudents.map((s) => s.id);

  const submissions: HomeworkSubmission[] = StorageEngine.getHomeworkSubmissions() || [];

  // SCOPED SUBMISSIONS PER RBAC PERMISSIONS
  const scopedSubmissions = submissions.filter((sub) => {
    if (!currentUser || isSuperOrAdmin) return true;
    return assignedStudentIds.includes(sub.studentId);
  });

  const pendingSubmissions = scopedSubmissions.filter(
    (s) => s && (s.feedbackStatus === 'PENDING' || (!s.isTeacherFeedbackChecked && s.isStudentChecked))
  );
  const completedSubmissions = scopedSubmissions.filter(
    (s) => s && (s.feedbackStatus === 'COMPLETED' || s.isTeacherFeedbackChecked)
  );

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(targetSubmissionId || null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const handleOpenGrading = (sub: HomeworkSubmission) => {
    setSelectedSubId(sub.id);
    setFeedbackText(sub.feedbackText || 'Em làm bài tập rất xuất sắc! Giữ vững phong độ nhé. ✨');
    setStars(sub.ratingStars || 5);
  };

  React.useEffect(() => {
    if (targetSubmissionId) {
      const sub = scopedSubmissions.find((s) => s && s.id === targetSubmissionId);
      if (sub) {
        handleOpenGrading(sub);
      } else {
        setSelectedSubId(targetSubmissionId);
      }
    }
  }, [targetSubmissionId]);

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
    StorageEngine.submitHomeworkFeedback(sub.id, feedbackText, stars, currentUser);
    setSelectedSubId(null);
    onRefreshData();
  };

  const currentDisplayList = activeTab === 'pending' ? pendingSubmissions : completedSubmissions;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 p-6 space-y-6 shadow-sm">
      
      {/* Widget Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-pink-500 animate-pulse" />
            🔔 BÀI TẬP CẦN FEEDBACK
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Duyệt các bài tập học viên đã hoàn thành và gửi phản hồi nhận xét trực tiếp
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition flex items-center ${
              activeTab === 'pending'
                ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🟡 Chờ Feedback ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition flex items-center ${
              activeTab === 'completed'
                ? 'bg-sky-100 text-sky-950 border border-sky-300 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔵 Đã Feedback ✓ ({completedSubmissions.length})
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {currentDisplayList.length > 0 ? (
          currentDisplayList.map((sub) => {
            const studentObj = students.find((s) => s && s.id === sub.studentId);
            const avatarSrc = resolveAvatarUrl(studentObj?.avatar);
            const isEditing = selectedSubId === sub.id;
            const isFeedbackDone = sub.feedbackStatus === 'COMPLETED' || sub.isTeacherFeedbackChecked;

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 ${
                  isFeedbackDone
                    ? 'bg-sky-50/40 border-sky-200'
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
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-pink-200 shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {studentObj?.name || sub.studentName || 'Học viên'}
                        </h4>
                        <span className="text-xs text-pink-900 font-bold bg-pink-100 px-2.5 py-0.5 rounded-lg border border-pink-200">
                          {sub.homeworkTitle}
                        </span>

                        {isFeedbackDone ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-950 border border-sky-300">
                            🔵 ĐÃ FEEDBACK ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
                            🟡 CHỜ FEEDBACK
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium space-x-2 mt-0.5">
                        <span>Lớp: {sub.className || 'Ms. Vy English'}</span>
                        <span>•</span>
                        <span>Hoàn thành lúc: <strong>{sub.completionTime || '16:45'}</strong> ({sub.submissionDate || 'Hôm nay'})</span>
                        {sub.teacherName && (
                          <>
                            <span>•</span>
                            <span>GV phụ trách: {sub.teacherName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleOpenGrading(sub)}
                      className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition shadow-xs flex items-center ${
                        isFeedbackDone
                          ? 'bg-sky-100 text-sky-950 border border-sky-300 hover:bg-sky-200'
                          : 'bg-pink-200 text-pink-950 border border-pink-300 hover:bg-pink-300'
                      }`}
                    >
                      {isFeedbackDone ? '✓ Xem / Sửa Feedback' : 'XEM BÀI / CHẤM BÀI →'}
                    </button>
                  </div>
                </div>

                {/* Content Submitted by Student */}
                {sub.studentContent && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 text-xs space-y-1">
                    <span className="font-bold text-slate-500 block">Nội dung học viên nộp:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{sub.studentContent}</p>
                  </div>
                )}

                {/* Feedback Content if already submitted */}
                {isFeedbackDone && sub.feedbackText && !isEditing && (
                  <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 text-xs space-y-1">
                    <span className="font-bold text-sky-950 dark:text-sky-300 flex items-center">
                      💬 Nhận xét từ {sub.feedbackByUserName || 'Giáo Viên'} ({sub.feedbackDate} {sub.feedbackTime || ''}):
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{sub.feedbackText}</p>
                    {sub.ratingStars && (
                      <div className="flex items-center space-x-1 pt-1 text-amber-400">
                        {Array.from({ length: sub.ratingStars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Input Drawer */}
                {isEditing && (
                  <div className="pt-3 border-t border-pink-200 dark:border-slate-700 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-pink-950 dark:text-pink-300 uppercase tracking-wider">
                        📝 Gửi Phản Hồi / Nhận Xét Bài Tập Cho Học Viên:
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
                        <span className="font-bold text-slate-700 dark:text-slate-300">Tặng Thêm Sao Thưởng:</span>
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
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSubmitFeedback(sub)}
                          className="px-5 py-2 rounded-xl bg-pink-200 text-pink-950 font-extrabold text-xs hover:bg-pink-300 border border-pink-300 shadow-xs flex items-center"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" /> Gửi Phản Hồi Ngay
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
            {activeTab === 'pending'
              ? 'Không có bài tập nào đang chờ feedback.'
              : 'Chưa có bài tập nào đã hoàn thành feedback.'}
          </div>
        )}
      </div>
    </div>
  );
};

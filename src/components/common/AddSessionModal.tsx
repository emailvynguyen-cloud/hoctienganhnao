import React, { useState } from 'react';
import { Class, Student, AttendanceRecord, ResourceLink, HomeworkTaskItem, StudentFeedback } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { PlusCircle, Calendar, BookOpen, Video, Link2, CheckCircle2, UserCheck, X, FileText, Image, Sparkles, Plus, Trash2 } from 'lucide-react';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  students: Student[];
  initialClassId?: string;
  onSessionAdded: () => void;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  initialClassId,
  onSessionAdded,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (classes[0]?.id || '')
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [recordLink, setRecordLink] = useState<string>('');

  // Multiple Homework Items List
  const [homeworkItems, setHomeworkItems] = useState<HomeworkTaskItem[]>([
    { id: `hw_${Date.now()}_1`, title: 'Bài 1: Làm bài tập nói/viết', content: '', attachmentUrl: '' }
  ]);

  // Per-Student Individual Feedbacks (studentId -> { strengths, improvements })
  const classStudents = students.filter((s) => s.classIds.includes(selectedClassId));
  const [studentFeedbacks, setStudentFeedbacks] = useState<Record<string, StudentFeedback>>({});

  // Attendance Map
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'excused' | 'unexcused' | 'late'>>({});

  // Materials List
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [materialUrl, setMaterialUrl] = useState<string>('');
  const [materials, setMaterials] = useState<ResourceLink[]>([]);

  if (!isOpen) return null;

  // Homework Item Handlers
  const handleAddHomeworkItem = () => {
    setHomeworkItems([
      ...homeworkItems,
      {
        id: `hw_${Date.now()}_${homeworkItems.length + 1}`,
        title: `Bài ${homeworkItems.length + 1}: `,
        content: '',
        attachmentUrl: '',
      },
    ]);
  };

  const handleUpdateHomeworkItem = (index: number, field: keyof HomeworkTaskItem, value: string) => {
    const updated = [...homeworkItems];
    updated[index] = { ...updated[index], [field]: value };
    setHomeworkItems(updated);
  };

  const handleRemoveHomeworkItem = (index: number) => {
    if (homeworkItems.length <= 1) return;
    setHomeworkItems(homeworkItems.filter((_, i) => i !== index));
  };

  // Student Feedback Handlers
  const handleUpdateStudentFeedback = (studentId: string, field: 'strengths' | 'improvements', value: string) => {
    setStudentFeedbacks({
      ...studentFeedbacks,
      [studentId]: {
        ...studentFeedbacks[studentId],
        [field]: value,
      },
    });
  };

  // Material Handlers
  const handleAddMaterial = () => {
    if (!materialTitle || !materialUrl) return;
    setMaterials([
      ...materials,
      { id: `mat_${Date.now()}`, title: materialTitle, url: materialUrl, addedDate: date },
    ]);
    setMaterialTitle('');
    setMaterialUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId || !lessonContent) {
      alert('Vui lòng chọn Lớp học và nhập Nội dung bài học!');
      return;
    }

    const currentClass = classes.find((c) => c.id === selectedClassId);

    const attendanceList: AttendanceRecord[] = classStudents.map((std) => ({
      studentId: std.id,
      studentName: std.name,
      status: attendanceMap[std.id] || 'present',
    }));

    StorageEngine.recordBulkSession({
      classId: selectedClassId,
      teacherId: currentClass?.teacherId || 'u_teacher_01',
      teacherName: currentClass?.teacherName || 'Giáo viên',
      date,
      lessonContent,
      homeworkItems,
      studentFeedbacks,
      recordLink,
      sessionMaterials: materials,
      attendanceList,
    });

    alert('Đã cập nhật buổi học thành công!');
    onSessionAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-purple-100 dark:border-purple-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 flex items-center justify-center font-black">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Cập Nhật Buổi Học Mới (Admin & Giáo Viên)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Nhận xét cá nhân hóa cho từng học viên & tạo danh sách nhiều bài tập về nhà
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-medium">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-slate-700 dark:text-purple-200 uppercase mb-1">
                Chọn Lớp Học *
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-3 rounded-xl border border-purple-200 bg-purple-50/50 font-extrabold text-xs"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} ({cls.schedule})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black text-slate-700 dark:text-purple-200 uppercase mb-1">
                Ngày Học *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-purple-200 bg-purple-50/50 font-extrabold text-xs"
                required
              />
            </div>
          </div>

          {/* Lesson Content */}
          <div>
            <label className="block font-black text-slate-700 dark:text-purple-200 uppercase mb-1">
              Nội Dung Học Trong Buổi *
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Unit 2 Speaking Part 2 - Từ vựng chủ đề Travel..."
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-purple-200 bg-white text-xs font-medium"
              required
            />
          </div>

          {/* INDIVIDUAL PER-STUDENT FEEDBACKS */}
          <div className="p-4 rounded-3xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 space-y-4">
            <h4 className="font-black text-xs text-purple-900 dark:text-purple-200 uppercase tracking-wider">
              💬 Nhận Xét Riêng Cho Từng Học Viên Trong Lớp
            </h4>

            {classStudents.map((std) => {
              const fb = studentFeedbacks[std.id] || {};

              return (
                <div key={std.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-purple-100 pb-2">
                    <img src={std.avatar} alt={std.name} className="w-8 h-8 rounded-xl object-cover" />
                    <span className="font-black text-xs text-slate-900 dark:text-white">
                      Học viên: {std.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                        💪 Điểm mạnh của {std.name}:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Phát âm chuẩn, tương tác hăng hái..."
                        value={fb.strengths || ''}
                        onChange={(e) => handleUpdateStudentFeedback(std.id, 'strengths', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-700 mb-1">
                        🎯 Điểm cần cải thiện của {std.name}:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Cần chú ý trọng âm 3 âm tiết..."
                        value={fb.improvements || ''}
                        onChange={(e) => handleUpdateStudentFeedback(std.id, 'improvements', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MULTIPLE HOMEWORK ITEMS */}
          <div className="p-4 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                📝 Danh Sách Bài Tập Về Nhà ({homeworkItems.length} bài)
              </h4>

              <button
                type="button"
                onClick={handleAddHomeworkItem}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition flex items-center shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> + Thêm Bài Tập
              </button>
            </div>

            <div className="space-y-3">
              {homeworkItems.map((item, idx) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-800 text-[11px]">Bài tập #{idx + 1}</span>
                    {homeworkItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHomeworkItem(idx)}
                        className="text-rose-500 font-bold hover:underline"
                      >
                        Xóa Bài Tập Này
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Tiêu đề bài tập (e.g. Bài 1: Ghi âm 2 phút speaking...)"
                    value={item.title}
                    onChange={(e) => handleUpdateHomeworkItem(idx, 'title', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-indigo-200 text-xs font-bold"
                  />

                  <textarea
                    rows={2}
                    placeholder="Mô tả chi tiết yêu cầu làm bài tập..."
                    value={item.content || ''}
                    onChange={(e) => handleUpdateHomeworkItem(idx, 'content', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-indigo-200 text-xs font-medium"
                  />

                  <input
                    type="url"
                    placeholder="Link/Ảnh đính kèm bài tập (Drive/PDF/Image link)"
                    value={item.attachmentUrl || ''}
                    onChange={(e) => handleUpdateHomeworkItem(idx, 'attachmentUrl', e.target.value)}
                    className="w-full p-2 rounded-xl border border-indigo-200 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Record Link */}
          <div>
            <label className="block font-black text-slate-700 dark:text-purple-200 uppercase mb-1">
              🎬 Link Record Video Buổi Học (Zoom / Drive / Youtube)
            </label>
            <input
              type="url"
              placeholder="https://zoom.us/rec/play/..."
              value={recordLink}
              onChange={(e) => setRecordLink(e.target.value)}
              className="w-full p-3 rounded-xl border border-purple-200 text-xs font-mono"
            />
          </div>

          {/* Attendance Checklist */}
          <div>
            <label className="block font-black text-slate-700 dark:text-purple-200 uppercase mb-2">
              Điểm Danh Học Viên Buổi Học:
            </label>
            <div className="space-y-2">
              {classStudents.map((std) => {
                const currentAtt = attendanceMap[std.id] || 'present';

                return (
                  <div key={std.id} className="p-3 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={std.avatar} alt={std.name} className="w-8 h-8 rounded-xl object-cover" />
                      <span className="font-extrabold text-xs text-slate-800">{std.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setAttendanceMap({ ...attendanceMap, [std.id]: 'present' })}
                        className={`px-3 py-1 rounded-xl text-xs font-black ${
                          currentAtt === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        ✓ Có mặt
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceMap({ ...attendanceMap, [std.id]: 'excused' })}
                        className={`px-3 py-1 rounded-xl text-xs font-black ${
                          currentAtt === 'excused' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        Vắng có phép
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 shadow-md"
            >
              Lưu Buổi Học Này
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

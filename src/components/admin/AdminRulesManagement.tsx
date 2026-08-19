import React, { useState, useEffect } from 'react';
import { User, SystemRule } from '../../types';
import { StorageEngine } from '../../lib/storage';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';

interface AdminRulesManagementProps {
  currentUser?: User | null;
}

export const AdminRulesManagement: React.FC<AdminRulesManagementProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<'class_rule' | 'teacher_rule'>('class_rule');
  const [rules, setRules] = useState<SystemRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SystemRule | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  // Confirm Delete Modal
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  const loadRules = () => {
    const allRules = StorageEngine.getSystemRules();
    setRules(allRules);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const currentTabRules = rules
    .filter((r) => r.type === activeTab)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setTitle('');
    setContent('');
    setOrder(currentTabRules.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: SystemRule) => {
    setEditingRule(rule);
    setTitle(rule.title);
    setContent(rule.content);
    setOrder(rule.order || 1);
    setIsActive(rule.isActive);
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền quản lý nội quy!');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập đầy đủ Tiêu đề và Nội dung nội quy!');
      return;
    }

    if (editingRule) {
      StorageEngine.updateSystemRule(
        {
          ...editingRule,
          title: title.trim(),
          content: content.trim(),
          order: Number(order) || 1,
          isActive,
          type: activeTab,
        },
        currentUser
      );
    } else {
      StorageEngine.addSystemRule(
        {
          type: activeTab,
          title: title.trim(),
          content: content.trim(),
          order: Number(order) || 1,
          isActive,
        },
        currentUser
      );
    }

    setIsModalOpen(false);
    loadRules();
  };

  const handleToggleActive = (ruleId: string) => {
    if (!isSuperAdmin) return;
    StorageEngine.toggleSystemRuleActive(ruleId, currentUser);
    loadRules();
  };

  const handleConfirmDelete = () => {
    if (!deletingRuleId || !isSuperAdmin) return;
    StorageEngine.deleteSystemRule(deletingRuleId, currentUser);
    setDeletingRuleId(null);
    loadRules();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#B8CEE0]/40 via-[#D9AEB0]/20 to-[#E4C3A8]/40 border border-[#B8CEE0] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-2xl bg-[#B8CEE0] text-[#2C3B49] font-black text-xl">
              📋
            </span>
            <h2 className="text-xl font-black text-[#2C3B49] dark:text-white">
              Quản Lý Nội Quy Hệ Thống
            </h2>
          </div>
          <p className="text-xs font-semibold text-[#5A6E7F] dark:text-slate-300 mt-1">
            {isSuperAdmin
              ? 'Tùy chỉnh, tạo mới và phân loại nội quy Lớp học (dành cho Học viên) và Nội quy Giáo viên. Đồng bộ thời gian thực đến tất cả thiết bị.'
              : 'Xem danh sách nội quy chính thức của trung tâm Ms. Vy English (Chỉ đọc).'}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 rounded-2xl bg-[#B8CEE0] hover:bg-[#A3BFD5] text-[#2C3B49] font-extrabold text-xs transition shadow-2xs flex items-center justify-center cursor-pointer border border-[#A5C3DA] shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Thêm Nội Quy Mới
          </button>
        )}
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center space-x-3 border-b border-[#E3E0DA] dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('class_rule')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'class_rule'
              ? 'bg-[#B8CEE0] text-[#2C3B49] shadow-2xs'
              : 'bg-white dark:bg-slate-800 text-[#6F7278] hover:bg-slate-100'
          }`}
        >
          <span>🎒 Nội Quy Lớp Học (Dành Cho Học Viên)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/60 font-black">
            {rules.filter((r) => r.type === 'class_rule').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('teacher_rule')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'teacher_rule'
              ? 'bg-[#E4C3A8] text-[#5C3F29] shadow-2xs'
              : 'bg-white dark:bg-slate-800 text-[#6F7278] hover:bg-slate-100'
          }`}
        >
          <span>👩‍🏫 Nội Quy Giáo Viên</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/60 font-black">
            {rules.filter((r) => r.type === 'teacher_rule').length}
          </span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-slate-800 border border-amber-200/80 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {activeTab === 'class_rule'
              ? 'Dữ liệu Nội quy lớp học sẽ hiển thị trực tiếp trên trang Học Viên Portal khi đăng nhập.'
              : 'Dữ liệu Nội quy giáo viên sẽ hiển thị trực tiếp trên trang Teacher Portal khi giáo viên đăng nhập.'}
          </span>
        </div>
      </div>

      {/* Rules List */}
      {currentTabRules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {currentTabRules.map((rule, index) => (
            <div
              key={rule.id}
              className={`p-5 rounded-3xl border transition space-y-3 shadow-2xs relative ${
                !rule.isActive
                  ? 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-300 opacity-60'
                  : activeTab === 'class_rule'
                  ? 'bg-white dark:bg-slate-800 border-[#B8CEE0]'
                  : 'bg-white dark:bg-slate-800 border-[#E4C3A8]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#E3E0DA] dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-2xl bg-[#B8CEE0]/40 text-[#2C3B49] font-black text-xs flex items-center justify-center">
                    #{rule.order || index + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#3F4146] dark:text-white">
                      {rule.title}
                    </h3>
                    <span className="text-[10px] text-[#6F7278] dark:text-slate-400 font-mono">
                      Cập nhật: {rule.updatedAt || rule.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {rule.isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#B7D8C0]/40 text-[#2D4536] border border-[#B7D8C0] flex items-center">
                      <Eye className="w-3 h-3 mr-1 text-emerald-600" /> Đang hiển thị
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-600 border border-slate-300 flex items-center">
                      <EyeOff className="w-3 h-3 mr-1 text-slate-500" /> Đã ẩn
                    </span>
                  )}

                  {isSuperAdmin && (
                    <div className="flex items-center space-x-1 pl-2 border-l border-[#E3E0DA] dark:border-slate-800">
                      <button
                        onClick={() => handleToggleActive(rule.id)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-[#6F7278] transition cursor-pointer"
                        title={rule.isActive ? 'Ẩn nội quy này' : 'Bật hiển thị nội quy này'}
                      >
                        {rule.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(rule)}
                        className="p-2 rounded-xl hover:bg-blue-50 text-blue-600 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Chỉnh sửa nội quy"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingRuleId(rule.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Xóa nội quy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Rule Content */}
              <div className="p-4 rounded-2xl bg-[#F8F7F5] dark:bg-slate-900 border border-[#E3E0DA] dark:border-slate-800 text-xs font-medium text-[#3F4146] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {rule.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h4 className="font-extrabold text-sm">Chưa có nội quy nào trong mục này.</h4>
          {isSuperAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-[#B8CEE0] text-[#2C3B49] font-bold text-xs hover:bg-[#A3BFD5] transition inline-flex items-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> Tạo Nội Quy Đầu Tiên
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-[#2C3B49] dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#B8CEE0]" />
                {editingRule ? 'Chỉnh Sửa Nội Quy' : 'Thêm Nội Quy Mới'} (
                {activeTab === 'class_rule' ? 'Học Viên' : 'Giáo Viên'})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thứ Tự Hiển Thị (#):
                </label>
                <input
                  type="number"
                  min={1}
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B8CEE0] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu Đề Nội Quy:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đi học đúng giờ và nộp bài tập đúng hạn"
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B8CEE0]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nội Dung Chi Tiết (Xuống dòng tự do):
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung quy định chi tiết..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B8CEE0] leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#B8CEE0] rounded cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Bật hiển thị công khai ngay lập tức
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#B8CEE0] hover:bg-[#A3BFD5] text-[#2C3B49] font-black shadow-2xs transition cursor-pointer flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" /> Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="font-black text-base text-slate-800 dark:text-white">
                Xác Nhận Xóa Nội Quy?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hành động này không thể hoàn tác. Nội quy sẽ bị xóa hoàn toàn khỏi hệ thống.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingRuleId(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-2xs transition cursor-pointer"
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

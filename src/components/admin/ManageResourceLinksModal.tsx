import React, { useState, useEffect } from 'react';
import { ResourceLink, ResourceType, Class, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Link2,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Video,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface ManageResourceLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: Class;
  currentUser?: User | null;
  onRefreshData: () => void;
}

const RESOURCE_TYPES: { type: ResourceType; label: string; defaultIcon: string; badgeColor: string }[] = [
  { type: 'drive', label: 'Google Drive', defaultIcon: '📁', badgeColor: 'bg-sky-100 text-sky-900 border-sky-300' },
  { type: 'docs', label: 'Google Docs', defaultIcon: '📄', badgeColor: 'bg-blue-100 text-blue-900 border-blue-300' },
  { type: 'sheets', label: 'Google Sheets', defaultIcon: '📊', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { type: 'pdf', label: 'File PDF', defaultIcon: '📕', badgeColor: 'bg-rose-100 text-rose-900 border-rose-300' },
  { type: 'youtube', label: 'YouTube Video', defaultIcon: '🎥', badgeColor: 'bg-red-100 text-red-900 border-red-300' },
  { type: 'quizlet', label: 'Quizlet Từ Vựng', defaultIcon: '🎴', badgeColor: 'bg-purple-100 text-purple-900 border-purple-300' },
  { type: 'canva', label: 'Canva / Slide', defaultIcon: '🎨', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  { type: 'notion', label: 'Notion Trang Học', defaultIcon: '📝', badgeColor: 'bg-slate-200 text-slate-900 border-slate-400' },
  { type: 'other', label: 'Đường Dẫn URL Khác', defaultIcon: '🔗', badgeColor: 'bg-pink-100 text-pink-900 border-pink-300' },
];

export const ManageResourceLinksModal: React.FC<ManageResourceLinksModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  currentUser,
  onRefreshData,
}) => {
  const [links, setLinks] = useState<ResourceLink[]>(targetClass.resourceLinks || []);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>('drive');
  const [icon, setIcon] = useState('📁');
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setLinks(targetClass.resourceLinks || []);
  }, [targetClass]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingLinkId(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setType('drive');
    setIcon('📁');
    setIsHidden(false);
  };

  const handleTypeChange = (selectedType: ResourceType) => {
    setType(selectedType);
    const typeObj = RESOURCE_TYPES.find((t) => t.type === selectedType);
    if (typeObj) {
      setIcon(typeObj.defaultIcon);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      alert('Vui lòng nhập Tên tài liệu và Đường dẫn URL!');
      return;
    }

    if (editingLinkId) {
      // Edit existing
      setLinks((prev) =>
        prev.map((item) => {
          if (item.id === editingLinkId) {
            return {
              ...item,
              title: title.trim(),
              url: url.trim(),
              description: description.trim(),
              type,
              icon,
              isHidden,
            };
          }
          return item;
        })
      );
    } else {
      // Add new item
      const newItem: ResourceLink = {
        id: `res_${Date.now()}`,
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        type,
        icon,
        isHidden,
        order: links.length + 1,
        addedDate: new Date().toISOString().split('T')[0],
      };
      setLinks((prev) => [...prev, newItem]);
    }

    resetForm();
  };

  const handleEditClick = (item: ResourceLink) => {
    setEditingLinkId(item.id);
    setTitle(item.title || '');
    setUrl(item.url || '');
    setDescription(item.description || '');
    setType(item.type || 'drive');
    setIcon(item.icon || '📁');
    setIsHidden(!!item.isHidden);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa liên kết tài liệu này khỏi kho tài liệu tổng?')) {
      setLinks((prev) => prev.filter((item) => item.id !== id));
      if (editingLinkId === id) resetForm();
    }
  };

  const handleToggleHide = (id: string) => {
    setLinks((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, isHidden: !item.isHidden };
        }
        return item;
      })
    );
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setLinks((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= links.length - 1) return;
    setLinks((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const handleSaveAll = () => {
    const sortedLinks = links.map((item, idx) => ({ ...item, order: idx + 1 }));
    StorageEngine.updateClassResourceLinks(targetClass.id, sortedLinks, currentUser);
    alert(`Đã lưu cập nhật Kho Tài Liệu Tổng cho lớp "${targetClass.className}" thành công!`);
    onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 p-6 sm:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 relative text-slate-800 dark:text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 border-b border-pink-100 dark:border-slate-800 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white flex items-center justify-center font-black text-xl shadow-md">
            📁
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              Quản Lý Kho Tài Liệu Tổng — {targetClass.className}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Thêm, sửa, xóa, sắp xếp và ẩn/hiện các liên kết giáo trình (Drive, Docs, Sheets, PDF, YouTube, Quizlet...)
            </p>
          </div>
        </div>

        {/* Add / Edit Form Box */}
        <form onSubmit={handleSaveItem} className="p-5 rounded-3xl bg-pink-50/60 dark:bg-slate-800/60 border-2 border-pink-200 dark:border-slate-700 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-pink-950 dark:text-pink-200 uppercase tracking-wider flex items-center">
              {editingLinkId ? '✏️ Chỉnh Sửa Tài Liệu' : '➕ Thêm Tài Liệu Mới Vào Kho'}
            </span>
            {editingLinkId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
              >
                Hủy Chỉnh Sửa
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Tên tài liệu (*):</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Thư Mục Giáo Trình IELTS Cambridge 1-18"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Loại tài liệu (*):</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as ResourceType)}
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.defaultIcon} {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn URL (*):</label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/drive/folders/... hoặc https://docs.google.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Mô tả ngắn (tùy chọn):</label>
              <input
                type="text"
                placeholder="Mô tả về tài liệu, ghi chú cách học..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Icon đại diện:</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-16 p-2 rounded-xl border border-pink-200 bg-white text-center font-black text-base"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 pt-5">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-400"
                />
                <span>🙈 Ẩn tài liệu này khỏi Học viên</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs transition shadow-md flex items-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> {editingLinkId ? 'Cập Nhật Tài Liệu Này' : 'Thêm Vào Danh Sách'}
            </button>
          </div>
        </form>

        {/* Resource Links List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              📋 Danh Sách Tài Liệu Tổng Trong Kho ({links.length} tài liệu)
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">
              Dùng nút mũi tên ⬆️ ⬇️ để sắp xếp thứ tự hiển thị
            </span>
          </div>

          {links.length > 0 ? (
            <div className="space-y-2.5">
              {links.map((item, idx) => {
                const typeObj = RESOURCE_TYPES.find((t) => t.type === (item.type || 'drive')) || RESOURCE_TYPES[0];

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs ${
                      item.isHidden
                        ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 opacity-60'
                        : 'bg-white dark:bg-slate-800 border-pink-100 dark:border-slate-700 hover:border-pink-300'
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="flex items-start space-x-3 truncate">
                      <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-slate-700 text-pink-700 dark:text-pink-300 flex items-center justify-center font-black text-lg shrink-0">
                        {item.icon || typeObj.defaultIcon}
                      </div>

                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${typeObj.badgeColor}`}>
                            {typeObj.label}
                          </span>
                          {item.isHidden && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 text-slate-700 border border-slate-300">
                              🙈 Đã Ẩn
                            </span>
                          )}
                          <h5 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h5>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{item.description}</p>
                        )}

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-sky-600 hover:underline truncate block"
                        >
                          {item.url}
                        </a>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Move Up / Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="Di chuyển lên trên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === links.length - 1}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="Di chuyển xuống dưới"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Hide */}
                      <button
                        type="button"
                        onClick={() => handleToggleHide(item.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          item.isHidden
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={item.isHidden ? 'Hiện tài liệu này cho Học viên' : 'Ẩn tài liệu này khỏi Học viên'}
                      >
                        {item.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-lg bg-sky-100 text-sky-900 hover:bg-sky-200 transition cursor-pointer"
                        title="Chỉnh sửa tài liệu"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-pink-50/40 border border-pink-100 text-center space-y-1">
              <p className="text-xs font-bold text-slate-500">Chưa có tài liệu tổng nào trong kho của lớp này.</p>
              <p className="text-[11px] text-slate-400">Hãy dùng form trên để thêm các link Google Drive, Docs, Quizlet, PDF...</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-pink-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md cursor-pointer flex items-center"
          >
            <Save className="w-4 h-4 mr-1.5" /> 💾 Lưu Cập Nhật Kho Tài Liệu
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Crown, UserPlus, Trash2, Key, Shield, UserCheck, X, CheckCircle2 } from 'lucide-react';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshUsers: () => void;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  onRefreshUsers,
}) => {
  const [users, setUsers] = useState<User[]>(StorageEngine.getUsers());
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (!isOpen) return null;

  const reloadList = () => {
    const list = StorageEngine.getUsers();
    setUsers(list);
    onRefreshUsers();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      alert('Vui lòng điền đầy đủ Tên, Email/Tên Đăng Nhập và Mật khẩu!');
      return;
    }

    StorageEngine.addUser({
      email,
      displayName,
      role,
      password,
      phoneNumber,
      avatarUrl: role === 'admin'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    setIsAddingNew(false);
    setDisplayName('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    reloadList();
  };

  const handleUpdatePassword = (u: User) => {
    const newPass = prompt(`Nhập mật khẩu mới cho ${u.displayName}:`, u.password || 'admin123');
    if (newPass) {
      u.password = newPass;
      StorageEngine.updateUser(u);
      reloadList();
      alert(`Đã đổi mật khẩu cho ${u.displayName} thành công!`);
    }
  };

  const handleDeleteUser = (uid: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống?`)) {
      StorageEngine.deleteUser(uid);
      reloadList();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Quản Lý Tài Khoản Nhân Sự (Super Admin)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cấp tài khoản & mật khẩu cho Quản trị viên và Giáo viên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">
            Danh Sách Nhân Sự ({users.length} tài khoản)
          </span>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition flex items-center shadow-md"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            {isAddingNew ? 'Đóng Form' : 'Tạo Tài Khoản Mới'}
          </button>
        </div>

        {/* Add New User Form */}
        {isAddingNew && (
          <form onSubmit={handleCreateUser} className="p-4 rounded-3xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-4 animate-fadeIn">
            <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 uppercase">
              Tạo Tài Khoản Mới
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ & Tên Hiển Thị *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cô Nguyễn Thị Mai"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Tên Đăng Nhập *
                </label>
                <input
                  type="text"
                  placeholder="mai.nguyen@msvyenglish.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật Khẩu *
                </label>
                <input
                  type="text"
                  placeholder="Nhập mật khẩu cấp cho nhân sự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vai Trò Trong Hệ Thống *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold"
                >
                  <option value="teacher">Giáo Viên (Teacher)</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                  <option value="super_admin">Người Điều Hành (Super Admin)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số Điện Thoại
                </label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 shadow-md"
              >
                Lưu & Cấp Tài Khoản
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.uid}
              className="p-4 rounded-2xl border border-purple-100 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={u.displayName}
                  className="w-11 h-11 rounded-2xl object-cover border border-purple-200"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {u.displayName}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'super_admin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {u.role === 'super_admin'
                        ? 'Super Admin'
                        : u.role === 'admin'
                        ? 'Quản Trị'
                        : 'Giáo Viên'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {u.email} • Mật khẩu: <strong>{u.password || 'admin123'}</strong>
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleUpdatePassword(u)}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold hover:bg-purple-200 transition flex items-center"
                >
                  <Key className="w-3.5 h-3.5 mr-1 text-purple-600" /> Đổi Mật Khẩu
                </button>

                {u.role !== 'super_admin' && (
                  <button
                    onClick={() => handleDeleteUser(u.uid, u.displayName)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    title="Xóa tài khoản"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800"
          >
            Đóng Lại
          </button>
        </div>

      </div>
    </div>
  );
};

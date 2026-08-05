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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* HEADER - Fixed Top */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Quản Lý Tài Khoản Nhân Sự (Super Admin)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cấp tài khoản & mật khẩu cho Quản trị viên và Giáo viên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY - Scrollable Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 min-h-0 text-xs">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">
              Danh Sách Nhân Sự ({users.length} tài khoản)
            </span>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition flex items-center shadow-md cursor-pointer"
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
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-medium"
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
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-medium"
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
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-mono"
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
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
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
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 shadow-md cursor-pointer"
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
                    className="w-11 h-11 rounded-2xl object-cover border border-purple-200 shrink-0"
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
                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleUpdatePassword(u)}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold hover:bg-purple-200 transition flex items-center cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 mr-1 text-purple-600" /> Đổi Mật Khẩu
                  </button>

                  {u.role !== 'super_admin' && (
                    <button
                      onClick={() => handleDeleteUser(u.uid, u.displayName)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* FOOTER - Fixed Bottom */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-purple-100 dark:border-purple-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
};

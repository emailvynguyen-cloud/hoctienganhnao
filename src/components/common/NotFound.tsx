import React from 'react';
import { useNavigate } from '../../lib/router';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-fadeIn">
      <div className="w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg border border-rose-200 dark:border-rose-900 animate-bounce">
        <Compass className="w-12 h-12" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 uppercase tracking-widest">
          Lỗi 404 - Trang Không Tồn Tại
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Không Tìm Thấy Trang Yêu Cầu
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black text-xs transition flex items-center shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Trang Trước
        </button>

        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition flex items-center shadow-md cursor-pointer border border-rose-500"
        >
          <Home className="w-4 h-4 mr-1.5" /> Về Trang Chủ Hệ Thống
        </button>
      </div>
    </div>
  );
};

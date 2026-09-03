import React, { useState, useEffect } from 'react';
import { Invoice, Class } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND } from '../../lib/vietqr';
import { X, Save, Edit3, DollarSign, Calendar, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface EditReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  classes: Class[];
  onRefreshData: () => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  classes,
  onRefreshData,
}) => {
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [sessionsPurchased, setSessionsPurchased] = useState<number>(8);
  const [startFromSessionNumber, setStartFromSessionNumber] = useState<number>(1);
  const [status, setStatus] = useState<'paid' | 'pending' | 'cancelled'>('paid');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (invoice) {
      setPaymentDate(invoice.paymentDate || invoice.paidDate || invoice.createdDate || new Date().toISOString().split('T')[0]);
      setAmount(Number(invoice.amount) || 0);
      setSessionsPurchased(Number(invoice.sessionsPurchased) || 8);
      setStartFromSessionNumber(Number(invoice.startFromSessionNumber) || 1);
      setStatus(invoice.status === 'cancelled' ? 'cancelled' : invoice.status === 'pending' ? 'pending' : 'paid');
      setNotes(invoice.notes || '');
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate) {
      alert('Vui lòng chọn ngày thu tiền!');
      return;
    }
    if (sessionsPurchased <= 0) {
      alert('Số buổi nộp phải lớn hơn 0!');
      return;
    }

    StorageEngine.updateInvoice({
      id: invoice.id,
      paymentDate,
      paidDate: status === 'paid' ? paymentDate : undefined,
      amount: Number(amount) || 0,
      sessionsPurchased: Number(sessionsPurchased) || 8,
      startFromSessionNumber: Number(startFromSessionNumber) || 1,
      status,
      notes,
    });

    alert(`Đã cập nhật thành công Phiếu Thu #${invoice.code}! Số buổi còn lại của học viên đã được tự động tính toán lại chính xác.`);
    onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* HEADER */}
        <div className="p-4 sm:p-6 bg-purple-50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Chỉnh Sửa Phiếu Thu Học Phí (#{invoice.code})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Học viên: <strong>{invoice.studentName}</strong> • SĐT: {invoice.studentPhone || 'N/A'}
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

        {/* BODY FORM */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-0 text-xs font-medium">
          
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-950 font-bold flex items-center justify-between">
            <span>Mã phiếu thu: <code className="font-mono">{invoice.code}</code></span>
            <span>Mã học viên: <code className="font-mono">{invoice.studentId}</code></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Ngày Thu Tiền (*) <span className="text-[10px] text-purple-600 font-medium">(Sửa được cả phiếu cũ)</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Trạng Thái Thu (*)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="paid">✅ ĐÃ THU TIỀN (PAID)</option>
                <option value="pending">⏳ CHỜ THU TIỀN (PENDING)</option>
                <option value="cancelled">🚫 ĐÃ HỦY PHIẾU (CANCELLED)</option>
              </select>
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Số Tiền Thu (VNĐ) (*)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-extrabold text-emerald-700 text-xs"
                required
              />
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                {formatVND(amount)}
              </span>
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Số Buổi Đã Mua (*)
              </label>
              <input
                type="number"
                min={1}
                value={sessionsPurchased}
                onChange={(e) => setSessionsPurchased(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-extrabold text-purple-900 dark:text-purple-200 text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Bắt Đầu Tính Từ Buổi Số (*) <span className="text-[10px] text-pink-600 font-medium">(Các buổi trước buổi số này sẽ KHÔNG trừ vào gói)</span>
              </label>
              <input
                type="number"
                min={1}
                value={startFromSessionNumber}
                onChange={(e) => setStartFromSessionNumber(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-pink-300 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/30 font-mono font-black text-pink-700 dark:text-pink-300 text-xs"
                placeholder="Buổi #1"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Ghi Chú Phiếu Thu
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                placeholder="Ghi chú thêm thông tin nộp tiền..."
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] font-medium leading-relaxed flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Lưu ý: Sau khi bấm <strong>Lưu Thay Đổi</strong>, hệ thống sẽ tự động tính toán lại số buổi còn lại của học viên trên tất cả các giao diện thời gian thực (Super Admin, Giáo Viên và Học Viên).
            </span>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md flex items-center cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" /> Lưu Thay Đổi Phiếu Thu
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

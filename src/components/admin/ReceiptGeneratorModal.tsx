import React, { useState } from 'react';
import { Student, BankConfig, Class } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND, getVietQRUrl, copyToClipboard } from '../../lib/vietqr';
import { X, Copy, Check, QrCode, Sparkles, Send, ShieldCheck, DollarSign, Download, ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classes: Class[];
  bankConfig: BankConfig;
  onRefreshData: () => void;
}

export const ReceiptGeneratorModal: React.FC<ReceiptGeneratorModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  bankConfig,
  onRefreshData,
}) => {
  const [packagePrice, setPackagePrice] = useState(student.tuitionPackagePrice || 2000000);
  const [packageSessions, setPackageSessions] = useState(student.packageSessionCount || 8);
  const [copiedContent, setCopiedContent] = useState(false);

  if (!isOpen) return null;

  const targetClass = (classes || []).find((c) => c.id === student.classIds[0]) || classes[0];

  const receiptCode = `VY-REC-${Date.now().toString().slice(-6)}`;
  const transferInfo = `VY HOCPHI ${student.name.toUpperCase().replace(/[^A-Z0-9 ]/g, '')} ${packageSessions}BUOI`;

  const activeBankId = bankConfig.bankId || 'MB';
  const activeAccountNo = bankConfig.accountNo || '0355176317';
  const activeAccountName = bankConfig.accountName || 'MS. VY ENGLISH - MS VY';

  const qrUrl = getVietQRUrl(
    activeBankId,
    activeAccountNo,
    packagePrice,
    transferInfo,
    activeAccountName
  );

  const handleSavePendingInvoice = () => {
    StorageEngine.addInvoice({
      code: receiptCode,
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      amount: packagePrice,
      sessionsPurchased: packageSessions,
      status: 'pending',
      qrContent: qrUrl,
      bankId: activeBankId,
      accountNo: activeAccountNo,
      accountName: activeAccountName,
    });
    alert(`Đã tạo và lưu Phiếu thu #${receiptCode} ở trạng thái CHỜ THU HỌC PHÍ thành công! Khi phụ huynh chuyển khoản xong, bạn có thể tick Hoàn thành để cộng ${packageSessions} buổi cho học viên.`);
    onRefreshData();
    onClose();
  };

  const handleMarkAsPaid = () => {
    if (window.confirm(`Xác nhận đã nhận ${formatVND(packagePrice)} từ học viên ${student.name}? Hệ thống sẽ cộng thêm ${packageSessions} buổi vào tài khoản.`)) {
      StorageEngine.addInvoice({
        code: receiptCode,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        amount: packagePrice,
        sessionsPurchased: packageSessions,
        status: 'paid',
        qrContent: qrUrl,
        bankId: activeBankId,
        accountNo: activeAccountNo,
        accountName: activeAccountName,
      });

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      alert(`Thành công! Đã thu ${formatVND(packagePrice)} và cộng ${packageSessions} buổi vào tài khoản em ${student.name}.`);
      onRefreshData();
      onClose();
    }
  };

  // HANDLE DOWNLOAD / SAVE RECEIPT IMAGE (TẢI ẢNH PHIẾU THU KÈM QR)
  const handleSaveReceiptImage = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Ma_VietQR_Hoc_Phi_${student.name.replace(/\s+/g, '_')}_${packageSessions}Buoi.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      alert(`Đã lưu ảnh Mã VietQR cho học viên ${student.name}! Bạn có thể gửi ảnh này trực tiếp qua Zalo cho Phụ huynh.`);
    } catch (e) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.target = '_blank';
      link.download = `Ma_VietQR_Hoc_Phi_${student.name}.png`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 space-y-6 max-h-[92vh] overflow-y-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 border-b border-purple-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Tool Tạo Phiếu Thu Học Phí & Mã VietQR Tự Động
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Học viên: <strong>{student.name}</strong> • SĐT: {student.phone}
            </p>
          </div>
        </div>

        {/* Package Settings Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Mức học phí gói (VNĐ):</label>
            <input
              type="number"
              value={packagePrice}
              onChange={(e) => setPackagePrice(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Số buổi mua thêm:</label>
            <input
              type="number"
              value={packageSessions}
              onChange={(e) => setPackageSessions(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-mono font-bold text-xs"
            />
          </div>
        </div>

        {/* OFFICIAL RECEIPT VOUCHER */}
        <div id="printable-receipt" className="p-6 rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 space-y-4 shadow-md text-slate-800">
          
          <div className="flex items-center justify-between border-b border-purple-200 pb-3">
            <div className="flex items-center space-x-3">
              <img src="/logo.jpg" alt="Ms. Vy Logo" style={{ width: '48px', height: '48px' }} className="w-12 h-12 rounded-2xl object-cover border border-purple-200" />
              <div>
                <h4 className="font-black text-sm text-purple-900">MS. VY ENGLISH</h4>
                <p className="text-[10px] text-slate-500 font-medium">Phiếu Thu Học Phí & Mã Chuyển Khoản QR</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono font-black text-pink-600 block">{receiptCode}</span>
              <span className="text-[10px] text-slate-400 font-medium">Ngày lập: {new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>

          {/* Receipt Details Table */}
          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Họ và tên học viên:</span>
              <strong className="text-slate-900 font-black">{student.name}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Lớp học đăng ký:</span>
              <strong>{targetClass?.className || 'Lớp Ms. Vy English'}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Số buổi gia hạn:</span>
              <strong className="text-purple-700">{packageSessions} Buổi Học</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Tổng số tiền học phí:</span>
              <strong className="text-emerald-700 text-sm font-black">{formatVND(packagePrice)}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
              <strong>MBBank ({activeAccountNo}) - {activeAccountName}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Cú pháp chuyển khoản:</span>
              <strong className="font-mono text-purple-900 bg-purple-100 px-2 py-0.5 rounded">{transferInfo}</strong>
            </div>
          </div>

          {/* VietQR Display Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-200 shadow-xs">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-xs font-extrabold text-purple-900 uppercase block">
                📲 Quét Mã VietQR Chuyển Khoản Nhanh
              </span>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, Momo...) quét mã để thanh toán tự động đúng số tiền & cú pháp.
              </p>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-purple-200 shadow-sm shrink-0">
              <img src={qrUrl} alt="VietQR Payment Code" className="w-36 h-36 object-contain" />
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                copyToClipboard(transferInfo);
                setCopiedContent(true);
                setTimeout(() => setCopiedContent(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition flex items-center"
            >
              {copiedContent ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedContent ? 'Đã Copy Cú Pháp' : 'Copy Cú Pháp Nộp'}
            </button>

            <button
              onClick={handleSaveReceiptImage}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition flex items-center shadow-md"
            >
              <Download className="w-4 h-4 mr-1.5" /> 📸 Tải Ảnh QR (PNG)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSavePendingInvoice}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition shadow-xs flex items-center justify-center cursor-pointer"
              title="Lưu vào danh sách chờ nộp tiền"
            >
              ⏳ Lưu Phiếu (Chờ Thu Tiền)
            </button>

            <button
              onClick={handleMarkAsPaid}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs hover:from-emerald-700 hover:to-teal-700 transition shadow-md flex items-center justify-center cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 mr-1" /> Xác Nhận Đã Thu Ngay (+{packageSessions} Buổi)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

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
  const [tuitionPeriod, setTuitionPeriod] = useState<string>(`Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [copiedContent, setCopiedContent] = useState(false);

  if (!isOpen) return null;

  const targetClass = (classes || []).find((c) => c.id === student.classIds[0]) || classes[0];

  const receiptCode = `VY-REC-${Date.now().toString().slice(-6)}`;
  const cleanStudentName = student.name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
  const transferInfo = `VY HOCPHI ${cleanStudentName.slice(0, 15)} ${packageSessions}B`;

  const activeBankId = bankConfig.bankId || 'MB';
  const activeAccountNo = bankConfig.accountNo || '0355176317';
  const activeAccountName = bankConfig.accountName || 'MS VY ENGLISH CENTER';

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

  // PRINT RECEIPT SLIP TO PDF / PRINTER
  const handlePrintReceiptPDF = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phiếu Thu Học Phí - ${student.name}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #ec4899; padding-bottom: 20px; margin-bottom: 25px; }
            .title { font-size: 22px; font-weight: 900; color: #831843; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .badge { background: #fce7f3; color: #9d174d; font-family: monospace; font-weight: bold; padding: 6px 14px; border-radius: 8px; font-size: 14px; }
            .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .info-grid td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .info-grid td.label { font-weight: 600; color: #64748b; width: 35%; }
            .info-grid td.val { font-weight: 800; color: #0f172a; }
            .qr-container { display: flex; align-items: center; justify-content: space-between; border: 2px dashed #f472b6; padding: 20px; border-radius: 16px; background: #fff1f2; margin-bottom: 30px; }
            .qr-text { max-width: 380px; font-size: 13px; color: #831843; line-height: 1.6; }
            .qr-img { width: 180px; height: 180px; border-radius: 12px; border: 1px solid #fbcfe8; }
            .footer { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 13px; }
            .sig-title { font-weight: 800; color: #334155; margin-bottom: 60px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">🌸 MS. VY ENGLISH CENTER</h1>
              <div class="subtitle">PHIẾU THU HỌC PHÍ & MÃ XÁC NHẬN CHUYỂN KHOẢN VIETQR</div>
            </div>
            <div class="badge">MÃ PHIẾU: #${receiptCode}</div>
          </div>

          <table class="info-grid">
            <tr><td class="label">Họ và tên Học Viên:</td><td class="val" style="font-size: 16px; color: #be185d;">${student.name}</td></tr>
            <tr><td class="label">Số điện thoại liên hệ:</td><td class="val">${student.phone || 'Chưa cập nhật'}</td></tr>
            <tr><td class="label">Lớp học đăng ký:</td><td class="val">${targetClass?.className || 'Lớp Ms. Vy English'} (${targetClass?.schedule || ''})</td></tr>
            <tr><td class="label">Kỳ học / Gói học phí:</td><td class="val" style="color: #6b21a8;">${tuitionPeriod} (${packageSessions} Buổi)</td></tr>
            <tr><td class="label">Số tiền học phí:</td><td class="val" style="color: #047857; font-size: 18px;">${formatVND(packagePrice)}</td></tr>
            <tr><td class="label">Hạn thanh toán:</td><td class="val" style="color: #b45309;">${dueDate}</td></tr>
            <tr><td class="label">Ngân hàng thụ hưởng:</td><td class="val">${activeBankId} - STK: ${activeAccountNo} (${activeAccountName})</td></tr>
            <tr><td class="label">Nội dung chuyển khoản:</td><td class="val" style="font-family: monospace; background: #fef08a; padding: 4px 8px; border-radius: 4px; display: inline-block;">${transferInfo}</td></tr>
          </table>

          <div class="qr-container">
            <div class="qr-text">
              <strong>📲 MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG:</strong><br/>
              Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, Momo...) quét mã để thanh toán tự động đúng số tiền <strong>${formatVND(packagePrice)}</strong> và cú pháp <strong>${transferInfo}</strong>.
            </div>
            <img src="${qrUrl}" class="qr-img" />
          </div>

          <div class="footer">
            <div>
              <div class="sig-title">Người Lập Phiếu</div>
              <div>(Ký & ghi rõ họ tên)</div>
            </div>
            <div>
              <div class="sig-title">Đại Diện Trung Tâm Ms. Vy</div>
              <div>(Ký & ghi rõ họ tên)</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 space-y-5 max-h-[92vh] overflow-y-auto relative">
        
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
              Hệ Thống Thu Học Phí & Mã VietQR Tự Động
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Học viên: <strong>{student.name}</strong> • SĐT: {student.phone || 'N/A'} • Lớp: {targetClass?.className}
            </p>
          </div>
        </div>

        {/* Dynamic Package Settings Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Kỳ Học:</label>
            <input
              type="text"
              value={tuitionPeriod}
              onChange={(e) => setTuitionPeriod(e.target.value)}
              className="w-full p-2 rounded-xl border border-purple-200 bg-white font-bold text-xs"
              placeholder="Tháng 8/2026"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Mức học phí (VNĐ):</label>
            <input
              type="number"
              value={packagePrice}
              onChange={(e) => setPackagePrice(Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-purple-200 bg-white font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Số buổi đăng ký:</label>
            <input
              type="number"
              value={packageSessions}
              onChange={(e) => setPackageSessions(Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-purple-200 bg-white font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Hạn nộp tiền:</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-purple-200 bg-white font-bold text-xs"
            />
          </div>
        </div>

        {/* OFFICIAL RECEIPT VOUCHER */}
        <div id="printable-receipt" className="p-5 rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 space-y-3.5 shadow-md text-slate-800">
          
          <div className="flex items-center justify-between border-b border-purple-200 pb-2.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-400 text-white flex items-center justify-center font-black text-lg">
                🌸
              </div>
              <div>
                <h4 className="font-black text-sm text-purple-900">MS. VY ENGLISH CENTER</h4>
                <p className="text-[10px] text-slate-500 font-medium">Phiếu Thu Học Phí & Mã Chuyển Khoản QR Động</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono font-black text-pink-600 block">#{receiptCode}</span>
              <span className="text-[10px] text-slate-400 font-medium">Lập ngày: {new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>

          {/* Receipt Details Table */}
          <div className="space-y-1 text-xs font-medium">
            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Họ và tên học viên:</span>
              <strong className="text-slate-900 font-black text-sm">{student.name}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Lớp học:</span>
              <strong>{targetClass?.className || 'Lớp Ms. Vy English'}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Kỳ học / Gói học phí:</span>
              <strong className="text-purple-800">{tuitionPeriod} ({packageSessions} Buổi)</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Số tiền học phí:</span>
              <strong className="text-emerald-700 text-base font-black">{formatVND(packagePrice)}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Hạn thanh toán:</span>
              <strong className="text-amber-800">{dueDate}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
              <strong>{activeBankId} ({activeAccountNo}) - {activeAccountName}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-purple-100">
              <span className="text-slate-500">Cú pháp chuyển khoản:</span>
              <strong className="font-mono text-purple-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{transferInfo}</strong>
            </div>
          </div>

          {/* VietQR Display Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-200 shadow-xs">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-xs font-extrabold text-purple-900 uppercase block">
                📲 Mã VietQR Chuyển Khoản Tự Động
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
                copyToClipboard(`Nộp học phí em ${student.name} - Số tiền: ${formatVND(packagePrice)} - STK: ${activeBankId} ${activeAccountNo} (${activeAccountName}) - Nội dung: ${transferInfo}`);
                setCopiedContent(true);
                setTimeout(() => setCopiedContent(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition flex items-center cursor-pointer"
            >
              {copiedContent ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedContent ? 'Đã Copy Tin Nhắn' : '🔗 Copy Tin Nhắn / QR'}
            </button>

            <button
              onClick={handleSaveReceiptImage}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition flex items-center shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5" /> 📸 Tải Ảnh QR (PNG)
            </button>

            <button
              onClick={handlePrintReceiptPDF}
              className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition flex items-center shadow-md cursor-pointer"
            >
              🖨️ In Phiếu Thu (PDF)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSavePendingInvoice}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition shadow-xs flex items-center justify-center cursor-pointer"
              title="Lưu vào danh sách chờ nộp tiền"
            >
              ⏳ Lưu Phiếu Chờ
            </button>

            <button
              onClick={handleMarkAsPaid}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs hover:from-emerald-700 hover:to-teal-700 transition shadow-md flex items-center justify-center cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 mr-1" /> Tick Đã Thu Ngay (+{packageSessions} Buổi)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

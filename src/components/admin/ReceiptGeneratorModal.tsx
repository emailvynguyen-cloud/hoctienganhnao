import React, { useState, useEffect, useMemo } from 'react';
import { Student, BankConfig, Class, Invoice, Session } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { formatVND, getVietQRUrl, copyToClipboard } from '../../lib/vietqr';
import { X, Copy, Check, QrCode, Sparkles, Send, ShieldCheck, DollarSign, Download, ImageIcon, Search, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

interface ReceiptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  allStudents?: Student[];
  classes: Class[];
  invoices?: Invoice[];
  sessions?: Session[];
  bankConfig: BankConfig;
  onRefreshData: () => void;
}

export const ReceiptGeneratorModal: React.FC<ReceiptGeneratorModalProps> = ({
  isOpen,
  onClose,
  student,
  allStudents,
  classes,
  invoices,
  sessions,
  bankConfig,
  onRefreshData,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(student || null);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [packagePrice, setPackagePrice] = useState(2000000);
  const [packageSessions, setPackageSessions] = useState(8);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [tuitionPeriod, setTuitionPeriod] = useState<string>(`Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [copiedContent, setCopiedContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeSt = student || (allStudents && allStudents.length > 0 ? allStudents[0] : null);
      setSelectedStudent(activeSt);
      if (activeSt) {
        setPackagePrice(activeSt.tuitionPackagePrice || 2000000);
        setPackageSessions(activeSt.packageSessionCount || 8);
      }
      setStudentSearchQuery('');
    }
  }, [isOpen, student?.id]);

  const studentsList = useMemo(() => {
    if (allStudents && allStudents.length > 0) return allStudents;
    if (student) return [student];
    return StorageEngine.getStudents();
  }, [allStudents, student]);

  const matchingStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return [];
    const q = removeVietnameseTones(studentSearchQuery);
    return studentsList.filter((s) => {
      if (!s) return false;
      const nameMatch = removeVietnameseTones(s.name || '').includes(q);
      const codeMatch = removeVietnameseTones(s.code || '').includes(q);
      const phoneMatch = removeVietnameseTones(s.phone || '').includes(q);
      return nameMatch || codeMatch || phoneMatch;
    });
  }, [studentsList, studentSearchQuery]);

  if (!isOpen) return null;

  const targetClass = selectedStudent
    ? (classes || []).find((c) => selectedStudent.classIds?.includes(c.id)) || classes[0]
    : classes[0];

  const receiptCode = `VY-REC-${Date.now().toString().slice(-6)}`;
  const cleanStudentName = selectedStudent
    ? selectedStudent.name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim()
    : '';
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
    if (!selectedStudent) {
      alert('Vui lòng chọn 1 học viên hợp lệ trước khi lập phiếu thu!');
      return;
    }
    StorageEngine.addInvoice({
      code: receiptCode,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentPhone: selectedStudent.phone,
      classId: targetClass?.id || '',
      className: targetClass?.className || '',
      amount: packagePrice,
      sessionsPurchased: packageSessions,
      status: 'pending',
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      dueDate,
      notes,
      qrContent: qrUrl,
      bankId: activeBankId,
      accountNo: activeAccountNo,
      accountName: activeAccountName,
    });
    alert(`Đã tạo và lưu Phiếu thu #${receiptCode} ở trạng thái CHỜ THU HỌC PHÍ thành công!`);
    onRefreshData();
    onClose();
  };

  const handleMarkAsPaid = () => {
    if (!selectedStudent) {
      alert('Vui lòng chọn 1 học viên hợp lệ trước khi lập phiếu thu!');
      return;
    }
    if (window.confirm(`Xác nhận đã nhận ${formatVND(packagePrice)} từ học viên ${selectedStudent.name}? Phiếu thu gói ${packageSessions} buổi sẽ tự động được xếp lịch đối chiếu theo thời gian với các buổi học thực tế trong lớp.`)) {
      StorageEngine.addInvoice({
        code: receiptCode,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentPhone: selectedStudent.phone,
        classId: targetClass?.id || '',
        className: targetClass?.className || '',
        amount: packagePrice,
        sessionsPurchased: packageSessions,
        status: 'paid',
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        dueDate,
        notes,
        qrContent: qrUrl,
        bankId: activeBankId,
        accountNo: activeAccountNo,
        accountName: activeAccountName,
      });

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      alert(`Thành công! Đã lưu phiếu thu ${packageSessions} buổi cho học viên ${selectedStudent.name}.`);
      onRefreshData();
      onClose();
    }
  };

  // PRINT RECEIPT SLIP TO PDF / PRINTER
  const handlePrintReceiptPDF = () => {
    if (!selectedStudent) {
      alert('Vui lòng chọn học viên trước khi in phiếu thu!');
      return;
    }
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu Thu Học Phí #${receiptCode} - Ms. Vy English Center</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background-color: #fff; }
          .receipt-box { border: 3px solid #f472b6; border-radius: 20px; padding: 30px; background: #fff; max-w: 680px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px border #fbcfe8; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 900; color: #be185d; text-transform: uppercase; }
          .sub-title { font-size: 13px; color: #64748b; font-weight: 600; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          .table td { padding: 10px 0; border-bottom: 1px border #f1f5f9; }
          .table td.label { color: #64748b; font-weight: 600; width: 40%; }
          .table td.val { color: #0f172a; font-weight: 800; text-align: right; }
          .price { color: #047857; font-size: 18px; font-weight: 900; }
          .qr-section { display: flex; align-items: center; justify-between: space-between; background: #fdf2f8; border: 2px dashed #f472b6; border-radius: 16px; padding: 15px 20px; margin-top: 20px; }
          .qr-text { font-size: 13px; color: #831843; font-weight: 700; line-height: 1.5; }
          .qr-img { width: 130px; height: 130px; border-radius: 12px; border: 1px solid #cbd5e1; background: #fff; padding: 5px; }
          .footer { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; font-size: 13px; color: #475569; font-weight: 700; }
          @media print {
            body { padding: 0; }
            .receipt-box { border-width: 2px; shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="logo">🌸 MS. VY ENGLISH CENTER</div>
              <div class="sub-title">Phiếu Thu Học Phí & Mã Chuyển Khoản VIETQR</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 900; color: #be185d; font-family: monospace; font-size: 16px;">#${receiptCode}</div>
              <div style="font-size: 12px; color: #64748b;">Ngày lập: ${new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          <table class="table">
            <tr>
              <td class="label">Họ và tên học viên:</td>
              <td class="val" style="color: #be185d; font-size: 16px;">${selectedStudent.name}</td>
            </tr>
            <tr>
              <td class="label">Số điện thoại liên hệ:</td>
              <td class="val">${selectedStudent.phone || 'Chưa cập nhật'}</td>
            </tr>
            <tr>
              <td class="label">Lớp học đăng ký:</td>
              <td class="val">${targetClass?.className || 'Lớp Ms. Vy English'} (${targetClass?.schedule || ''})</td>
            </tr>
            <tr>
              <td class="label">Kỳ học / Gói số buổi:</td>
              <td class="val">${tuitionPeriod} (${packageSessions} Buổi)</td>
            </tr>
            <tr>
              <td class="label">Số tiền học phí:</td>
              <td class="val price">${formatVND(packagePrice)}</td>
            </tr>
            <tr>
              <td class="label">Hạn nộp học phí:</td>
              <td class="val" style="color: #b45309;">${dueDate}</td>
            </tr>
            <tr>
              <td class="label">Ngân hàng thụ hưởng:</td>
              <td class="val">${activeBankId} (${activeAccountNo}) - ${activeAccountName}</td>
            </tr>
            <tr>
              <td class="label">Nội dung chuyển khoản (Bắt buộc):</td>
              <td class="val" style="font-family: monospace; color: #be185d; font-size: 15px;">${transferInfo}</td>
            </tr>
          </table>

          <div class="qr-section">
            <div class="qr-text">
              📲 <strong>MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG</strong><br/>
              Mở app Ngân hàng quét mã để thanh toán tự động<br/>
              Số tiền: <span style="color: #047857;">${formatVND(packagePrice)}</span><br/>
              Nội dung: <span style="color: #be185d;">${transferInfo}</span>
            </div>
            <img src="${qrUrl}" class="qr-img" />
          </div>

          <div class="footer">
            <div>
              <p>Người Lập Phiếu</p>
              <br/><br/>
              <p style="font-size: 11px; color: #94a3b8; font-weight: normal;">(Ký & ghi rõ họ tên)</p>
            </div>
            <div>
              <p>Đại Diện Ms. Vy English Center</p>
              <br/><br/>
              <p style="font-size: 11px; color: #94a3b8; font-weight: normal;">(Ký & ghi rõ họ tên)</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // DOWNLOAD FULL RECEIPT AS HD PNG IMAGE (CANVAS DRAWING)
  const handleDownloadFullReceiptImage = async () => {
    if (!selectedStudent) {
      alert('Vui lòng chọn học viên trước khi tải ảnh phiếu thu!');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const width = 750;
      const height = 960;
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;
      ctx.scale(2, 2);

      // Background Card Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.5, '#fdf2f8');
      bgGrad.addColorStop(1, '#faf5ff');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Outer Border Card
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(20, 20, width - 40, height - 40, 24);
      ctx.stroke();

      // Header Banner
      ctx.fillStyle = '#9d174d';
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('🌸 MS. VY ENGLISH CENTER', 45, 65);

      ctx.fillStyle = '#64748b';
      ctx.font = '700 13px system-ui, -apple-system, sans-serif';
      ctx.fillText('PHIẾU THU HỌC PHÍ & CHUYỂN KHOẢN VIETQR', 45, 88);

      // Receipt Code Badge
      ctx.fillStyle = '#fce7f3';
      ctx.beginPath();
      ctx.roundRect(width - 230, 45, 185, 38, 12);
      ctx.fill();

      ctx.fillStyle = '#be185d';
      ctx.font = '900 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${receiptCode}`, width - 137, 69);
      ctx.textAlign = 'left';

      // Divider Line
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(45, 110);
      ctx.lineTo(width - 45, 110);
      ctx.stroke();

      // Table Details List
      const rows = [
        { label: 'Họ và tên học viên:', val: selectedStudent.name, isBold: true, color: '#be185d' },
        { label: 'Số điện thoại liên hệ:', val: selectedStudent.phone || 'Chưa cập nhật', isBold: false, color: '#334155' },
        { label: 'Lớp học đăng ký:', val: `${targetClass?.className || 'Lớp Ms. Vy English'} (${targetClass?.schedule || ''})`, isBold: true, color: '#0f172a' },
        { label: 'Kỳ học / Gói học phí:', val: `${tuitionPeriod} (${packageSessions} Buổi)`, isBold: true, color: '#6b21a8' },
        { label: 'Số tiền học phí:', val: formatVND(packagePrice), isBold: true, color: '#047857' },
        { label: 'Hạn thanh toán:', val: dueDate, isBold: true, color: '#b45309' },
        { label: 'Ngân hàng thụ hưởng:', val: `${activeBankId} (${activeAccountNo}) - ${activeAccountName}`, isBold: true, color: '#334155' },
        { label: 'Cú pháp chuyển khoản:', val: transferInfo, isBold: true, color: '#831843' },
      ];

      let rowY = 150;
      rows.forEach((row) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(row.label, 45, rowY);

        ctx.fillStyle = row.color;
        ctx.font = row.isBold ? '900 15px system-ui, -apple-system, sans-serif' : '600 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(row.val, width - 45, rowY);

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(45, rowY + 12);
        ctx.lineTo(width - 45, rowY + 12);
        ctx.stroke();

        rowY += 45;
      });

      // QR Container Box
      ctx.fillStyle = '#fdf2f8';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(45, rowY + 15, width - 90, 190, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#831843';
      ctx.font = '900 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('📲 MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG', 70, rowY + 45);

      ctx.fillStyle = '#475569';
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, Momo...)', 70, rowY + 75);
      ctx.fillText(`quét mã để thanh toán tự động đúng số tiền ${formatVND(packagePrice)}`, 70, rowY + 95);
      ctx.fillText(`và nội dung: ${transferInfo}`, 70, rowY + 115);

      // Load & Draw QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = qrUrl;

      await new Promise((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, width - 235, rowY + 25, 170, 170);
          resolve(true);
        };
        qrImg.onerror = () => resolve(false);
      });

      // Footer Signatures
      const footerY = height - 100;
      ctx.fillStyle = '#334155';
      ctx.font = '800 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Người Lập Phiếu', 150, footerY);
      ctx.fillText('Đại Diện Trung Tâm Ms. Vy', width - 150, footerY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('(Ký & ghi rõ họ tên)', 150, footerY + 20);
      ctx.fillText('(Ký & ghi rõ họ tên)', width - 150, footerY + 20);

      // Convert to image download link
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      link.download = `PhieuThuHocPhi_MsVy_${selectedStudent.name.replace(/\s+/g, '_')}_${receiptCode}.png`;
      link.href = dataUrl;
      link.click();

      alert(`Đã xuất và tải Ảnh Phiếu Thu Học Phí cho học viên ${selectedStudent.name} thành công!`);
    } catch (e) {
      console.error('Error downloading full receipt image:', e);
      alert('Không thể tạo ảnh phiếu thu. Bạn có thể chọn In Phiếu Thu (PDF) thay thế!');
    }
  };

  // HANDLE DOWNLOAD / SAVE RECEIPT IMAGE (TẢI ẢNH PHIẾU THU KÈM QR)
  const handleSaveReceiptImage = async () => {
    if (!selectedStudent) {
      alert('Vui lòng chọn học viên trước!');
      return;
    }
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Ma_VietQR_Hoc_Phi_${selectedStudent.name.replace(/\s+/g, '_')}_${packageSessions}Buoi.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      alert(`Đã lưu ảnh Mã VietQR cho học viên ${selectedStudent.name}! Bạn có thể gửi ảnh này trực tiếp qua Zalo cho Phụ huynh.`);
    } catch (e) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.target = '_blank';
      link.download = `Ma_VietQR_Hoc_Phi_${selectedStudent?.name || 'HocVien'}.png`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* HEADER - Fixed Top */}
        <div className="p-4 sm:p-6 bg-purple-50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Hệ Thống Thu Học Phí & Mã VietQR Tự Động
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Học viên: <strong>{selectedStudent?.name || 'Chưa chọn'}</strong> • SĐT: {selectedStudent?.phone || 'N/A'} • Lớp: {targetClass?.className || 'N/A'}
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
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 min-h-0 text-xs font-medium">
          
          {/* STUDENT SEARCH & SELECTION UI */}
          <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 text-xs space-y-3 relative dark:bg-slate-800/80 dark:border-purple-900">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 dark:text-purple-200 flex items-center text-xs">
                <UserCheck className="w-4 h-4 mr-1.5 text-purple-600 dark:text-purple-400" /> Tìm Kiếm & Chọn Học Viên (*):
              </label>
              {selectedStudent ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  ✓ Đã chọn: {selectedStudent.name}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                  ⚠️ Chưa chọn học viên
                </span>
              )}
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Nhập tên học viên để tìm kiếm..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Search Autocomplete Dropdown List */}
              {matchingStudents.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-purple-300 dark:border-purple-800 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {matchingStudents.map((st) => {
                    const stClasses = (classes || []).filter((c) => st.classIds?.includes(c.id));
                    const classNamesText = stClasses.map((c) => c.className).join(', ') || 'Chưa xếp lớp';
                    const isSelected = selectedStudent?.id === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedStudent(st);
                          setPackagePrice(st.tuitionPackagePrice || 2000000);
                          setPackageSessions(st.packageSessionCount || 8);
                          setStudentSearchQuery('');
                        }}
                        className={`p-3 hover:bg-purple-50 dark:hover:bg-slate-800/90 cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-purple-50/80 dark:bg-slate-800' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{st.name}</span>
                            <span className="font-mono text-[10px] text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded font-bold">
                              #{st.code || st.id.slice(0, 6)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center gap-3">
                            <span>📞 {st.phone || 'Chưa có SĐT'}</span>
                            <span>🏫 Lớp: <strong>{classNamesText}</strong></span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`px-3 py-1 rounded-xl text-[11px] font-black shrink-0 transition ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {isSelected ? '✓ Đang chọn' : 'Chọn học viên'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {studentSearchQuery.trim() !== '' && matchingStudents.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-purple-200 p-3 text-center text-xs font-medium text-slate-400">
                  Không tìm thấy học viên nào với từ khóa "{studentSearchQuery}"
                </div>
              )}
            </div>

            {/* Display Selected Student Card Badge */}
            {selectedStudent ? (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Học viên được chọn: </span>
                  <strong className="text-purple-900 dark:text-purple-300 font-black text-sm">{selectedStudent.name}</strong>
                  <span className="ml-2 font-mono text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                    #{selectedStudent.code || selectedStudent.id.slice(0, 6)}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    SĐT: {selectedStudent.phone || 'Chưa có SĐT'} • Lớp: {targetClass?.className || 'Chưa xếp lớp'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 text-center">
                ⚠️ Vui lòng gõ tên học viên vào ô tìm kiếm ở trên để chọn học viên cần lập phiếu thu.
              </div>
            )}
          </div>

          {/* Dynamic Package Settings Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs dark:bg-slate-800/40 dark:border-slate-700">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Ngày Thu Tiền (*):</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Số Tiền Thu (VNĐ) (*):</label>
              <input
                type="number"
                value={packagePrice}
                onChange={(e) => setPackagePrice(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Số Buổi Đã Mua (*):</label>
              <input
                type="number"
                value={packageSessions}
                onChange={(e) => setPackageSessions(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Kỳ Học / Diễn Giải:</label>
              <input
                type="text"
                value={tuitionPeriod}
                onChange={(e) => setTuitionPeriod(e.target.value)}
                className="w-full p-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                placeholder="Tháng 8/2026"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Hạn Nộp Tiền (Nếu chờ):</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú Phiếu Thu:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs"
                placeholder="Nhập ghi chú phiếu thu (ví dụ: Chuyển khoản VietQR, đã giảm giá 10%...)"
              />
            </div>
          </div>

          {/* OFFICIAL RECEIPT VOUCHER */}
          {selectedStudent ? (
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
                  <strong className="text-slate-900 font-black text-sm">{selectedStudent.name}</strong>
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
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold text-xs">
              Vui lòng chọn học viên ở trên để xem bản xem trước Phiếu Thu & Mã VietQR.
            </div>
          )}

        </div>

        {/* FOOTER - Fixed Bottom */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-purple-100 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (!selectedStudent) return alert('Vui lòng chọn học viên!');
                copyToClipboard(`Nộp học phí em ${selectedStudent.name} - Số tiền: ${formatVND(packagePrice)} - STK: ${activeBankId} ${activeAccountNo} (${activeAccountName}) - Nội dung: ${transferInfo}`);
                setCopiedContent(true);
                setTimeout(() => setCopiedContent(false), 2000);
              }}
              disabled={!selectedStudent}
              className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs transition flex items-center cursor-pointer disabled:opacity-50"
            >
              {copiedContent ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedContent ? 'Đã Copy Tin Nhắn' : '🔗 Copy Tin Nhắn'}
            </button>

            <button
              onClick={handleSaveReceiptImage}
              disabled={!selectedStudent}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition flex items-center shadow-md cursor-pointer disabled:opacity-50"
              title="Tải duy nhất ảnh Mã QR"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> 📸 Tải Ảnh QR
            </button>

            <button
              onClick={handleDownloadFullReceiptImage}
              disabled={!selectedStudent}
              className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs transition flex items-center shadow-md cursor-pointer disabled:opacity-50"
              title="Tải toàn bộ phiếu thu dạng ảnh sắc nét"
            >
              🖼️ Tải Ảnh Phiếu Thu (PNG)
            </button>

            <button
              onClick={handlePrintReceiptPDF}
              disabled={!selectedStudent}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition flex items-center shadow-md cursor-pointer disabled:opacity-50"
            >
              🖨️ In Phiếu Thu (PDF)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleSavePendingInvoice}
              disabled={!selectedStudent}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
              title="Lưu vào danh sách chờ nộp tiền"
            >
              ⏳ Lưu Phiếu Chờ
            </button>

            <button
              onClick={handleMarkAsPaid}
              disabled={!selectedStudent}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs hover:from-emerald-700 hover:to-teal-700 transition shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 mr-1" /> Tick Đã Thu (+{packageSessions} Buổi)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import { BankConfig } from '../types';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Generates VietQR standard image URL
 * Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<INFO>&accountName=<NAME>
 */
export function getVietQRUrl(
  bankConfig: BankConfig,
  amount: number,
  addInfo: string
): string {
  const bankId = encodeURIComponent(bankConfig.bankId || 'MB');
  const accountNo = encodeURIComponent(bankConfig.accountNo || '0388999888');
  const amountStr = Math.round(amount);
  const infoEncoded = encodeURIComponent(addInfo);
  const nameEncoded = encodeURIComponent(bankConfig.accountName);

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amountStr}&addInfo=${infoEncoded}&accountName=${nameEncoded}`;
}

export function copyToClipboard(text: string, onSuccess?: () => void): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (onSuccess) onSuccess();
    });
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    if (onSuccess) onSuccess();
  }
}

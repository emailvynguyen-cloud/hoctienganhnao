import { BankConfig } from '../types';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function copyToClipboard(text: string, onSuccess?: () => void): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (onSuccess) onSuccess();
    });
  } else {
    // Fallback for non-HTTPS or older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    if (onSuccess) onSuccess();
  }
}

/**
 * Standard VietQR Bank BIN Mapping per NAPAS / VietQR Specification
 */
export const BANK_BIN_MAP: Record<string, string> = {
  MB: '970422',
  MBBANK: '970422',
  VCB: '970436',
  VIETCOMBANK: '970436',
  CTG: '970415',
  ICB: '970415',
  VIETINBANK: '970415',
  BIDV: '970418',
  TCB: '970407',
  TECHCOMBANK: '970407',
  VARB: '970405',
  AGRIBANK: '970405',
  VPB: '970432',
  VPBANK: '970432',
  ACB: '970416',
  STB: '970403',
  SACOMBANK: '970403',
  TPB: '970423',
  TPBANK: '970423',
  VIB: '970441',
  HDB: '970437',
  HDBANK: '970437',
  SEAB: '970440',
  SEABANK: '970440',
  EIB: '970431',
  EXIMBANK: '970431',
  MSB: '970426',
  OCB: '970448',
  LPB: '970449',
  LPBANK: '970449',
  CAKE: '546034',
  TIMO: '963388',
};

/**
 * Computes CRC16-CCITT (FFFF) checksum according to EMVCo / VietQR standard
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    crc ^= c << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEMVField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generates official EMVCo / VietQR payload string (Napas standard)
 */
export function generateVietQREMVPayload(
  bankId: string,
  accountNo: string,
  amount: number,
  addInfo: string,
  accountName?: string
): string {
  const cleanBankId = bankId.trim().toUpperCase();
  const bankBin = BANK_BIN_MAP[cleanBankId] || '970422'; // Default MBBank 970422
  const cleanAccountNo = accountNo.trim().replace(/\s/g, '');

  // 1. Merchant Account Information Subfields (Tag 38)
  // Sub-tag 00: GUID "A000000727" (Napas)
  // Sub-tag 01: Beneficiary Bank (Sub-tag 00: Bank BIN, Sub-tag 01: Account No)
  // Sub-tag 02: Service Code "QRIBFTTA" (Quick Response Instant Payment)
  const beneficiarySub00 = formatEMVField('00', bankBin);
  const beneficiarySub01 = formatEMVField('01', cleanAccountNo);
  const beneficiaryField = formatEMVField('01', beneficiarySub00 + beneficiarySub01);
  const serviceCodeField = formatEMVField('02', 'QRIBFTTA');
  
  const tag38Value = formatEMVField('00', 'A000000727') + beneficiaryField + serviceCodeField;
  const tag38 = formatEMVField('38', tag38Value);

  // 2. Build EMV Payload Fields
  let payload = '';
  payload += formatEMVField('00', '01'); // Payload Format Indicator
  payload += formatEMVField('01', amount > 0 ? '12' : '11'); // 12=Dynamic, 11=Static
  payload += tag38;
  payload += formatEMVField('53', '704'); // Transaction Currency (704 = VND)
  
  if (amount > 0) {
    payload += formatEMVField('54', Math.round(amount).toString()); // Transaction Amount
  }

  payload += formatEMVField('58', 'VN'); // Country Code

  if (accountName && accountName.trim()) {
    const cleanName = accountName.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    if (cleanName) {
      payload += formatEMVField('59', cleanName.slice(0, 25)); // Merchant Name
    }
  }

  if (addInfo && addInfo.trim()) {
    const cleanInfo = addInfo.trim().replace(/[^a-zA-Z0-9 ]/g, '');
    if (cleanInfo) {
      const sub62_08 = formatEMVField('08', cleanInfo.slice(0, 25)); // Additional Data
      payload += formatEMVField('62', sub62_08);
    }
  }

  // 3. CRC16 Checksum (Tag 63)
  payload += '6304';
  const checksum = calculateCRC16(payload);
  return payload + checksum;
}

/**
 * Generates official VietQR standard QR image URL (via Napas official img.vietqr.io API)
 * Supports both signatures:
 *  - getVietQRUrl(bankConfig, amount, addInfo)
 *  - getVietQRUrl(bankId, accountNo, amount, addInfo, accountName)
 */
export function getVietQRUrl(
  bankConfigOrId: BankConfig | string,
  amountOrAccountNo?: number | string,
  addInfoOrAmount?: string | number,
  accountNameOrAddInfo?: string,
  optionalAccountName?: string
): string {
  let bankId = 'MB';
  let accountNo = '0355176317';
  let amount = 0;
  let addInfo = '';
  let accountName = 'MS VY ENGLISH CENTER';

  if (typeof bankConfigOrId === 'object' && bankConfigOrId !== null) {
    // Signature 1: (bankConfig, amount, addInfo)
    bankId = bankConfigOrId.bankId || 'MB';
    accountNo = bankConfigOrId.accountNo || '0355176317';
    accountName = bankConfigOrId.accountName || 'MS VY ENGLISH CENTER';
    amount = typeof amountOrAccountNo === 'number' ? amountOrAccountNo : Number(amountOrAccountNo) || 0;
    addInfo = typeof addInfoOrAmount === 'string' ? addInfoOrAmount : String(addInfoOrAmount || '');
  } else {
    // Signature 2: (bankId, accountNo, amount, addInfo, accountName)
    bankId = String(bankConfigOrId || 'MB');
    accountNo = String(amountOrAccountNo || '0355176317');
    amount = typeof addInfoOrAmount === 'number' ? addInfoOrAmount : Number(addInfoOrAmount) || 0;
    addInfo = typeof accountNameOrAddInfo === 'string' ? accountNameOrAddInfo : String(accountNameOrAddInfo || '');
    accountName = optionalAccountName || 'MS VY ENGLISH CENTER';
  }

  const cleanBankId = encodeURIComponent(bankId.trim().toUpperCase());
  const cleanAccountNo = encodeURIComponent(accountNo.trim().replace(/\s/g, ''));
  const amountVal = Math.max(0, Math.round(Number(amount) || 0));
  const cleanAddInfo = encodeURIComponent(addInfo.trim());
  const cleanAccountName = encodeURIComponent(accountName.trim().toUpperCase());

  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-compact2.png?amount=${amountVal}&addInfo=${cleanAddInfo}&accountName=${cleanAccountName}`;
}

import { nanoid } from 'nanoid';

export function generatePublicHash(studentName: string): string {
  const cleanName = studentName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const prefix = cleanName.slice(0, 6) || 'std';
  return `vlc_${prefix}_${nanoid(6)}`;
}

export function getStudentPublicUrl(publicHash: string): string {
  const origin = window.location.origin;
  return `${origin}?hash=${publicHash}`;
}

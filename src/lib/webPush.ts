import { StorageEngine } from './storage';

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClickUrl?: string;
  type?: 'session_updated' | 'quizlet_added' | 'badge_unlocked' | 'title_unlocked';
  targetData?: any;
}

export function isWebPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getWebPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestWebPushPermission(): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

export function sendWebPushNotification(payload: WebPushPayload) {
  if (!isWebPushSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Books.png',
      tag: payload.tag || payload.type || `push_${Date.now()}`,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();

      if (payload.onClickUrl && payload.onClickUrl.startsWith('http')) {
        window.open(payload.onClickUrl, '_blank');
      } else {
        window.dispatchEvent(
          new CustomEvent('msvy_push_click', {
            detail: {
              type: payload.type,
              targetData: payload.targetData,
              url: payload.onClickUrl,
            },
          })
        );
      }
      notification.close();
    };
  } catch (err) {
    console.warn('Failed to send Web Push notification:', err);
  }
}

export function notifySessionUpdated(dateStr: string) {
  const parts = dateStr.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
  sendWebPushNotification({
    title: '📖 Cập Nhật Buổi Học Mới',
    body: `📖 Giáo viên vừa cập nhật nội dung buổi học ngày ${formattedDate}. Nhấn để xem chi tiết.`,
    type: 'session_updated',
    onClickUrl: '#sessions',
    targetData: { dateStr },
  });
}

export function notifyQuizletAdded(dateStr: string, quizletUrl?: string) {
  const parts = dateStr.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
  sendWebPushNotification({
    title: '📚 Có Quizlet Mới',
    body: `📚 Quizlet của buổi học ngày ${formattedDate} đã sẵn sàng. Nhấn để học ngay.`,
    type: 'quizlet_added',
    onClickUrl: quizletUrl || '#quizlet',
    targetData: { quizletUrl },
  });
}

export function notifyBadgeUnlocked(badgeTitle: string) {
  sendWebPushNotification({
    title: '🏅 Mở Khóa Badge Mới',
    body: `🏅 Chúc mừng! Bạn vừa mở khóa Badge '${badgeTitle}'.`,
    type: 'badge_unlocked',
    onClickUrl: '#badges',
    targetData: { tab: 'badge' },
  });
}

export function notifyTitleUnlocked(titleName: string) {
  sendWebPushNotification({
    title: '👑 Mở Khóa Danh Hiệu Mới',
    body: `👑 Chúc mừng! Bạn vừa mở khóa Danh hiệu '${titleName}'.`,
    type: 'title_unlocked',
    onClickUrl: '#titles',
    targetData: { tab: 'title' },
  });
}

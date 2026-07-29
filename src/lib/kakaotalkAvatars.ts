// Pure Embedded SVG Data URIs for KakaoTalk Friends Avatars
// 100% Cross-Browser Compatible (Chrome, Safari, iOS, Android, Vercel Production)

const svgToDataUrl = (svgString: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

export const KAKAOTALK_SVG_AVATARS = {
  ryan: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="30" fill="#FEF08A"/>
      <circle cx="28" cy="28" r="11" fill="#D97706"/>
      <circle cx="72" cy="28" r="11" fill="#D97706"/>
      <circle cx="50" cy="52" r="34" fill="#F59E0B"/>
      <rect x="28" y="42" width="16" height="4" rx="2" fill="#1E293B"/>
      <rect x="56" y="42" width="16" height="4" rx="2" fill="#1E293B"/>
      <circle cx="36" cy="52" r="4.5" fill="#1E293B"/>
      <circle cx="64" cy="52" r="4.5" fill="#1E293B"/>
      <ellipse cx="44" cy="60" rx="5" ry="4" fill="#FFFFFF"/>
      <ellipse cx="56" cy="60" rx="5" ry="4" fill="#FFFFFF"/>
      <ellipse cx="50" cy="57" rx="4" ry="3" fill="#1E293B"/>
    </svg>
  `),
  apeach: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="30" fill="#FCE7F3"/>
      <path d="M50 16 C 26 16 14 34 14 56 C 14 78 32 86 50 86 C 68 86 86 78 86 56 C 86 34 74 16 50 16 Z" fill="#F472B6"/>
      <circle cx="34" cy="54" r="4" fill="#1E293B"/>
      <circle cx="66" cy="54" r="4" fill="#1E293B"/>
      <ellipse cx="26" cy="62" rx="7" ry="4.5" fill="#FB7185"/>
      <ellipse cx="74" cy="62" rx="7" ry="4.5" fill="#FB7185"/>
      <path d="M 44 64 Q 50 72 56 64 Z" fill="#1E293B"/>
    </svg>
  `),
  muzi: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="30" fill="#FEF08A"/>
      <ellipse cx="50" cy="52" rx="33" ry="30" fill="#FACC15"/>
      <ellipse cx="50" cy="55" rx="25" ry="22" fill="#FFFFFF"/>
      <circle cx="40" cy="52" r="4" fill="#1E293B"/>
      <circle cx="60" cy="52" r="4" fill="#1E293B"/>
      <ellipse cx="50" cy="57" rx="4" ry="3" fill="#1E293B"/>
      <ellipse cx="32" cy="60" rx="4" ry="2.5" fill="#F472B6"/>
      <ellipse cx="68" cy="60" rx="4" ry="2.5" fill="#F472B6"/>
    </svg>
  `),
  frodo: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="30" fill="#FED7AA"/>
      <ellipse cx="22" cy="40" rx="9" ry="17" fill="#9A3412"/>
      <ellipse cx="78" cy="40" rx="9" ry="17" fill="#9A3412"/>
      <ellipse cx="50" cy="52" rx="32" ry="28" fill="#EA580C"/>
      <circle cx="38" cy="48" r="4.5" fill="#FFFFFF"/>
      <circle cx="38" cy="48" r="2.5" fill="#1E293B"/>
      <circle cx="62" cy="48" r="4.5" fill="#FFFFFF"/>
      <circle cx="62" cy="48" r="2.5" fill="#1E293B"/>
      <ellipse cx="50" cy="58" rx="9" ry="7" fill="#FEF08A"/>
      <ellipse cx="50" cy="55" rx="4.5" ry="3" fill="#1E293B"/>
    </svg>
  `),
  neo: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="30" fill="#E0E7FF"/>
      <polygon points="26,22 36,38 22,38" fill="#1E293B"/>
      <polygon points="74,22 64,38 78,38" fill="#1E293B"/>
      <circle cx="50" cy="54" r="32" fill="#3B82F6"/>
      <path d="M 22 46 Q 50 24 78 46 L 76 34 Q 50 18 24 34 Z" fill="#1E293B"/>
      <circle cx="38" cy="52" r="4.5" fill="#1E293B"/>
      <circle cx="62" cy="52" r="4.5" fill="#1E293B"/>
      <ellipse cx="30" cy="58" rx="4" ry="2.5" fill="#F472B6"/>
      <ellipse cx="70" cy="58" rx="4" ry="2.5" fill="#F472B6"/>
      <path d="M 44 62 Q 50 68 56 62" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </svg>
  `),
  tube: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="30" fill="#F1F5F9"/>
      <circle cx="50" cy="50" r="33" fill="#FFFFFF"/>
      <circle cx="38" cy="46" r="4" fill="#1E293B"/>
      <circle cx="62" cy="46" r="4" fill="#1E293B"/>
      <ellipse cx="50" cy="57" rx="14" ry="8" fill="#EA580C"/>
      <ellipse cx="50" cy="54" rx="10" ry="4" fill="#FDBA74"/>
    </svg>
  `),
};

export const KAKAOTALK_AVATARS_LIST = [
  { id: 'ryan', name: 'Sư Tử Ryan 🦁', url: KAKAOTALK_SVG_AVATARS.ryan, svgDataUrl: KAKAOTALK_SVG_AVATARS.ryan },
  { id: 'apeach', name: 'Quả Đào Apeach 🍑', url: KAKAOTALK_SVG_AVATARS.apeach, svgDataUrl: KAKAOTALK_SVG_AVATARS.apeach },
  { id: 'muzi', name: 'Thỏ Vàng Muzi 🐰', url: KAKAOTALK_SVG_AVATARS.muzi, svgDataUrl: KAKAOTALK_SVG_AVATARS.muzi },
  { id: 'frodo', name: 'Chú Chó Frodo 🐶', url: KAKAOTALK_SVG_AVATARS.frodo, svgDataUrl: KAKAOTALK_SVG_AVATARS.frodo },
  { id: 'neo', name: 'Mèo Chảnh Neo 🐱', url: KAKAOTALK_SVG_AVATARS.neo, svgDataUrl: KAKAOTALK_SVG_AVATARS.neo },
  { id: 'tube', name: 'Vịt Cute Tube 🦆', url: KAKAOTALK_SVG_AVATARS.tube, svgDataUrl: KAKAOTALK_SVG_AVATARS.tube },
];

/**
 * Universal Avatar Resolver Function
 * Guaranteed to resolve student avatars (uploaded base64, KakaoTalk SVG, HTTP/HTTPS URLs) everywhere
 */
export const resolveAvatarUrl = (avatarStr?: string): string => {
  if (!avatarStr) return KAKAOTALK_SVG_AVATARS.ryan;

  const lower = avatarStr.toLowerCase();

  // Match KakaoTalk Avatars
  if (lower.includes('ryan')) return KAKAOTALK_SVG_AVATARS.ryan;
  if (lower.includes('apeach')) return KAKAOTALK_SVG_AVATARS.apeach;
  if (lower.includes('muzi')) return KAKAOTALK_SVG_AVATARS.muzi;
  if (lower.includes('frodo')) return KAKAOTALK_SVG_AVATARS.frodo;
  if (lower.includes('neo')) return KAKAOTALK_SVG_AVATARS.neo;
  if (lower.includes('tube')) return KAKAOTALK_SVG_AVATARS.tube;

  // Custom base64 upload, Blob, or external web link
  if (
    avatarStr.startsWith('data:') ||
    avatarStr.startsWith('http://') ||
    avatarStr.startsWith('https://') ||
    avatarStr.startsWith('blob:') ||
    avatarStr.startsWith('/')
  ) {
    return avatarStr;
  }

  return KAKAOTALK_SVG_AVATARS.ryan;
};

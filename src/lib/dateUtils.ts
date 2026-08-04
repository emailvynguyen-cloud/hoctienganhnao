/**
 * Date Utilities for Ms. Vy English App
 */

/**
 * Formats a YYYY-MM-DD or ISO date string into `DD - MM - YYYY` (ngày - tháng - năm)
 * Example: "2026-08-04" -> "04 - 08 - 2026"
 */
export const formatSessionDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const cleanStr = dateStr.trim().split('T')[0];
  const parts = cleanStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD - MM - YYYY
      return `${parts[2]} - ${parts[1]} - ${parts[0]}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY -> DD - MM - YYYY
      return `${parts[0]} - ${parts[1]} - ${parts[2]}`;
    }
  }
  return dateStr;
};

/**
 * Returns current week (Monday 00:00:00 to Sunday 23:59:59) date strings in YYYY-MM-DD format based on real time
 */
export const getCurrentWeekRange = () => {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(d);
  monday.setDate(diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatYMD = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    mondayStr: formatYMD(monday),
    sundayStr: formatYMD(sunday),
  };
};

/**
 * Returns current month string in YYYY-MM format based on real time
 */
export const getCurrentMonthString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

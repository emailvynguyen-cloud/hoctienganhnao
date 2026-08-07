/**
 * DRAFT STORAGE UTILITY
 * Manages debounced local storage persistence for form drafts across the Ms. Vy English portal.
 */

export interface FormDraft<T = any> {
  savedAt: string;
  data: T;
}

export const DraftStorage = {
  /**
   * Save a form draft into localStorage with timestamp
   */
  saveDraft<T = any>(key: string, data: T): void {
    if (!key) return;
    try {
      const payload: FormDraft<T> = {
        savedAt: new Date().toISOString(),
        data,
      };
      localStorage.setItem(`msvy_draft_${key}`, JSON.stringify(payload));
    } catch (e) {
      console.warn(`[DraftStorage] Failed to save draft for key "${key}":`, e);
    }
  },

  /**
   * Get a saved form draft from localStorage
   */
  getDraft<T = any>(key: string): FormDraft<T> | null {
    if (!key) return null;
    try {
      const raw = localStorage.getItem(`msvy_draft_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.data !== undefined) {
        return parsed as FormDraft<T>;
      }
      return null;
    } catch (e) {
      console.warn(`[DraftStorage] Failed to get draft for key "${key}":`, e);
      return null;
    }
  },

  /**
   * Check if a valid draft exists for a key
   */
  hasDraft(key: string): boolean {
    const draft = this.getDraft(key);
    return !!draft && !!draft.data;
  },

  /**
   * Remove a draft from localStorage
   */
  clearDraft(key: string): void {
    if (!key) return;
    try {
      localStorage.removeItem(`msvy_draft_${key}`);
    } catch (e) {
      console.warn(`[DraftStorage] Failed to clear draft for key "${key}":`, e);
    }
  },
};

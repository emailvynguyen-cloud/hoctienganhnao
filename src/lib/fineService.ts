import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabaseEngine';
import { Class, Session } from '../types';
import { calculateTeacherPenaltiesAndRevenue } from './teacherPenaltyEngine';

export interface DbFineRecord {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  class_id?: string;
  class_name?: string;
  type: string; // 'late_record' | 'custom' | 'manual'
  amount: number;
  reason: string;
  status: 'ongoing' | 'completed' | 'waived' | 'pending' | 'confirmed';
  session_id?: string;
  created_at: string;
  updated_at: string;
}

let inMemoryFines: DbFineRecord[] = [];
let realtimeChannel: any = null;
const fineSubscribers: Set<(fines: DbFineRecord[]) => void> = new Set();

export const FineService = {
  // 1. Fetch initial fine records directly from Supabase DB 'fine_records' table
  async fetchFines(teacherId?: string): Promise<DbFineRecord[]> {
    console.log('[FINE][FETCH] Fetching fine_records from Supabase DB...', teacherId || 'ALL');
    try {
      let query = supabase.from('fine_records').select('*');
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        inMemoryFines = data as DbFineRecord[];
        console.log(`[FINE][FETCH] Fetched ${data.length} fine records successfully.`);
        return inMemoryFines;
      }

      // REST Fallback
      let url = `${SUPABASE_URL}/rest/v1/fine_records?select=*&order=created_at.desc`;
      if (teacherId) {
        url += `&teacher_id=eq.${teacherId}`;
      }
      const restRes = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (restRes.ok) {
        const restData = await restRes.json();
        inMemoryFines = (restData || []) as DbFineRecord[];
        console.log(`[FINE][FETCH] REST fallback fetched ${inMemoryFines.length} fines.`);
        return inMemoryFines;
      }
    } catch (e) {
      console.warn('[FINE][FETCH] Notice fetching fine records:', e);
    }
    return inMemoryFines;
  },

  // 2. Realtime Channel Subscription directly on Supabase 'fine_records' table
  subscribeFines(callback: (fines: DbFineRecord[]) => void, teacherId?: string) {
    fineSubscribers.add(callback);

    if (!realtimeChannel) {
      console.log('[REALTIME][FINE] Initializing direct Realtime subscription on fine_records table...');
      realtimeChannel = supabase
        .channel('fine_records_realtime_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'fine_records',
          },
          (payload: any) => {
            console.log(`[REALTIME][FINE] postgres_changes event [${payload.eventType}]`, payload);

            if (payload.eventType === 'INSERT' && payload.new) {
              console.log('[FINE][INSERT] New fine record received via Realtime:', payload.new);
              const newFine = payload.new as DbFineRecord;
              inMemoryFines = [newFine, ...inMemoryFines.filter((f) => f.id !== newFine.id)];
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              console.log('[FINE][UPDATE] Fine record updated via Realtime:', payload.new);
              const updated = payload.new as DbFineRecord;
              inMemoryFines = inMemoryFines.map((f) => (f.id === updated.id ? updated : f));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              console.log('[FINE][DELETE] Fine record deleted via Realtime:', payload.old.id);
              inMemoryFines = inMemoryFines.filter((f) => f.id !== payload.old.id);
            }

            // Notify all active React subscribers
            fineSubscribers.forEach((cb) => cb([...inMemoryFines]));
          }
        )
        .subscribe((status: string) => {
          console.log(`[REALTIME][FINE] Subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            this.fetchFines(teacherId).then((fines) => {
              callback([...fines]);
            });
          }
        });
    } else {
      callback([...inMemoryFines]);
    }

    return () => {
      fineSubscribers.delete(callback);
      if (fineSubscribers.size === 0 && realtimeChannel) {
        console.log('[REALTIME][FINE] Unsubscribing realtimeChannel for fine_records');
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  },

  // 3. Create a new fine record
  async createFine(fine: Omit<DbFineRecord, 'created_at' | 'updated_at'>): Promise<DbFineRecord> {
    const nowIso = new Date().toISOString();
    const fullFine: DbFineRecord = {
      ...fine,
      created_at: nowIso,
      updated_at: nowIso,
    };

    console.log('[FINE][INSERT] Creating fine record:', fullFine.id, fullFine.amount, fullFine.reason);
    inMemoryFines = [fullFine, ...inMemoryFines.filter((f) => f.id !== fullFine.id)];
    fineSubscribers.forEach((cb) => cb([...inMemoryFines]));

    try {
      const { error } = await supabase.from('fine_records').upsert(fullFine, { onConflict: 'id' });
      if (error) {
        console.warn('[FINE][INSERT] SDK error, fallback to REST:', error.message);
        await fetch(`${SUPABASE_URL}/rest/v1/fine_records`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(fullFine),
        });
      }
    } catch (e) {
      console.error('[FINE][INSERT] Exception:', e);
    }
    return fullFine;
  },

  // 4. Update fine record fields
  async updateFine(id: string, updates: Partial<DbFineRecord>): Promise<boolean> {
    const nowIso = new Date().toISOString();
    console.log('[FINE][UPDATE] Updating fine record ID:', id, updates);

    inMemoryFines = inMemoryFines.map((f) => {
      if (f.id === id) {
        return { ...f, ...updates, updated_at: nowIso };
      }
      return f;
    });
    fineSubscribers.forEach((cb) => cb([...inMemoryFines]));

    try {
      const { error } = await supabase
        .from('fine_records')
        .update({ ...updates, updated_at: nowIso })
        .eq('id', id);

      if (error) {
        await fetch(`${SUPABASE_URL}/rest/v1/fine_records?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...updates, updated_at: nowIso }),
        });
      }
      return true;
    } catch (e) {
      console.error('[FINE][UPDATE] Exception:', e);
      return false;
    }
  },

  // 5. Waive a fine
  async waiveFine(id: string): Promise<boolean> {
    return this.updateFine(id, { status: 'waived' });
  },

  // 6. Restore a waived fine
  async restoreFine(id: string): Promise<boolean> {
    return this.updateFine(id, { status: 'completed' });
  },

  // 7. Delete a fine record
  async deleteFine(id: string): Promise<boolean> {
    console.log('[FINE][DELETE] Deleting fine record ID:', id);
    inMemoryFines = inMemoryFines.filter((f) => f.id !== id);
    fineSubscribers.forEach((cb) => cb([...inMemoryFines]));

    try {
      const { error } = await supabase.from('fine_records').delete().eq('id', id);
      if (error) {
        await fetch(`${SUPABASE_URL}/rest/v1/fine_records?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
      }
      return true;
    } catch (e) {
      console.error('[FINE][DELETE] Exception:', e);
      return false;
    }
  },

  // 8. Sync derived penalties from calculation engine
  async syncDerivedPenalties(teacherId: string, classes: Class[], sessions: Session[]): Promise<DbFineRecord[]> {
    const summary = calculateTeacherPenaltiesAndRevenue(teacherId, classes, sessions);
    const nowIso = new Date().toISOString();

    const derivedRecords: DbFineRecord[] = (summary.penalties || []).map((p) => ({
      id: p.id,
      teacher_id: p.teacherId,
      teacher_name: p.teacherName,
      class_id: p.classId,
      class_name: p.className,
      type: p.isRecorded ? 'late_record' : 'ongoing_unrecorded',
      amount: p.penaltyAmount,
      reason: `Trễ nhập buổi học ${p.className} (${p.dateISO}) - Overdue ${p.overdueDays} ngày`,
      status: p.status,
      session_id: p.sessionId,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    derivedRecords.forEach((df) => {
      const existing = inMemoryFines.find((f) => f.id === df.id);
      if (!existing) {
        this.createFine(df);
      }
    });

    return inMemoryFines;
  },
};

import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabaseEngine';
import { Class, Session, Student, User } from '../types';
import { calculateGlobalPendingTasks } from './pendingTasksEngine';

export interface DbPendingTask {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  class_id?: string;
  class_name?: string;
  student_id?: string;
  session_id?: string;
  type: string; // 'unrecorded_session' | 'missing_quizlet' | 'missing_record_link'
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'dismissed';
  date_iso?: string;
  schedule_time_str?: string;
  overdue_days?: number;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

let inMemoryTasks: DbPendingTask[] = [];
let realtimeChannel: any = null;
const taskSubscribers: Set<(tasks: DbPendingTask[]) => void> = new Set();

export const PendingTaskService = {
  // 1. Fetch initial pending tasks directly from Supabase DB 'pending_tasks' table
  async fetchPendingTasks(teacherId?: string): Promise<DbPendingTask[]> {
    console.log('[PENDING_TASK][FETCH] Fetching pending_tasks from Supabase DB...', teacherId || 'ALL');
    try {
      let query = supabase.from('pending_tasks').select('*');
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        inMemoryTasks = data as DbPendingTask[];
        console.log(`[PENDING_TASK][FETCH] Fetched ${data.length} tasks successfully.`);
        return inMemoryTasks;
      }

      // REST Fallback
      let url = `${SUPABASE_URL}/rest/v1/pending_tasks?select=*&order=created_at.desc`;
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
        inMemoryTasks = (restData || []) as DbPendingTask[];
        console.log(`[PENDING_TASK][FETCH] REST fallback fetched ${inMemoryTasks.length} tasks.`);
        return inMemoryTasks;
      }
    } catch (e) {
      console.warn('[PENDING_TASK][FETCH] Notice fetching tasks:', e);
    }
    return inMemoryTasks;
  },

  // 2. Realtime Channel Subscription directly on Supabase 'pending_tasks' table
  subscribePendingTasks(callback: (tasks: DbPendingTask[]) => void, teacherId?: string) {
    taskSubscribers.add(callback);

    if (!realtimeChannel) {
      console.log('[REALTIME][PENDING_TASK] Initializing direct Realtime subscription on pending_tasks table...');
      realtimeChannel = supabase
        .channel('pending_tasks_realtime_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pending_tasks',
          },
          (payload: any) => {
            console.log(`[REALTIME][PENDING_TASK] postgres_changes event [${payload.eventType}]`, payload);
            
            if (payload.eventType === 'INSERT' && payload.new) {
              console.log('[PENDING_TASK][INSERT] New pending task received via Realtime:', payload.new);
              const newTask = payload.new as DbPendingTask;
              inMemoryTasks = [newTask, ...inMemoryTasks.filter((t) => t.id !== newTask.id)];
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              console.log('[PENDING_TASK][UPDATE] Task updated via Realtime:', payload.new);
              const updated = payload.new as DbPendingTask;
              inMemoryTasks = inMemoryTasks.map((t) => (t.id === updated.id ? updated : t));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              console.log('[PENDING_TASK][DELETE] Task deleted via Realtime:', payload.old.id);
              inMemoryTasks = inMemoryTasks.filter((t) => t.id !== payload.old.id);
            }

            // Notify all active React subscribers
            taskSubscribers.forEach((cb) => cb([...inMemoryTasks]));
          }
        )
        .subscribe((status: string) => {
          console.log(`[REALTIME][PENDING_TASK] Subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            this.fetchPendingTasks(teacherId).then((tasks) => {
              callback([...tasks]);
            });
          }
        });
    } else {
      // Immediate callback with current in-memory tasks
      callback([...inMemoryTasks]);
    }

    return () => {
      taskSubscribers.delete(callback);
      if (taskSubscribers.size === 0 && realtimeChannel) {
        console.log('[REALTIME][PENDING_TASK] Unsubscribing realtimeChannel for pending_tasks');
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  },

  // 3. Create a new pending task
  async createPendingTask(task: Omit<DbPendingTask, 'created_at' | 'updated_at'>): Promise<DbPendingTask> {
    const nowIso = new Date().toISOString();
    const fullTask: DbPendingTask = {
      ...task,
      created_at: nowIso,
      updated_at: nowIso,
    };

    console.log('[PENDING_TASK][INSERT] Creating pending task:', fullTask.id, fullTask.title);
    inMemoryTasks = [fullTask, ...inMemoryTasks.filter((t) => t.id !== fullTask.id)];
    taskSubscribers.forEach((cb) => cb([...inMemoryTasks]));

    try {
      const { error } = await supabase.from('pending_tasks').upsert(fullTask, { onConflict: 'id' });
      if (error) {
        console.warn('[PENDING_TASK][INSERT] SDK error, fallback to REST:', error.message);
        await fetch(`${SUPABASE_URL}/rest/v1/pending_tasks`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(fullTask),
        });
      }
    } catch (e) {
      console.error('[PENDING_TASK][INSERT] Exception:', e);
    }
    return fullTask;
  },

  // 4. Update task fields
  async updatePendingTask(id: string, updates: Partial<DbPendingTask>): Promise<boolean> {
    const nowIso = new Date().toISOString();
    console.log('[PENDING_TASK][UPDATE] Updating task ID:', id, updates);

    inMemoryTasks = inMemoryTasks.map((t) => {
      if (t.id === id) {
        return { ...t, ...updates, updated_at: nowIso };
      }
      return t;
    });
    taskSubscribers.forEach((cb) => cb([...inMemoryTasks]));

    try {
      const { error } = await supabase
        .from('pending_tasks')
        .update({ ...updates, updated_at: nowIso })
        .eq('id', id);

      if (error) {
        await fetch(`${SUPABASE_URL}/rest/v1/pending_tasks?id=eq.${id}`, {
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
      console.error('[PENDING_TASK][UPDATE] Exception:', e);
      return false;
    }
  },

  // 5. Complete a task
  async completePendingTask(id: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    return this.updatePendingTask(id, { status: 'completed', completed_at: nowIso });
  },

  // 6. Dismiss a task
  async dismissPendingTask(id: string): Promise<boolean> {
    return this.updatePendingTask(id, { status: 'dismissed' });
  },

  // 7. Delete a task
  async deletePendingTask(id: string): Promise<boolean> {
    console.log('[PENDING_TASK][DELETE] Deleting task ID:', id);
    inMemoryTasks = inMemoryTasks.filter((t) => t.id !== id);
    taskSubscribers.forEach((cb) => cb([...inMemoryTasks]));

    try {
      const { error } = await supabase.from('pending_tasks').delete().eq('id', id);
      if (error) {
        await fetch(`${SUPABASE_URL}/rest/v1/pending_tasks?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
      }
      return true;
    } catch (e) {
      console.error('[PENDING_TASK][DELETE] Exception:', e);
      return false;
    }
  },

  // 8. Sync derived pending tasks from business logic (unrecorded sessions, missing record links)
  async syncDerivedPendingTasks(
    classes: Class[],
    sessions: Session[],
    students: Student[],
    dismissedTaskIds: string[] = []
  ): Promise<DbPendingTask[]> {
    const computedItems = calculateGlobalPendingTasks(classes, sessions, students, dismissedTaskIds);
    const nowIso = new Date().toISOString();

    const dbTasks: DbPendingTask[] = computedItems.map((item) => ({
      id: item.id,
      teacher_id: item.teacherId,
      teacher_name: item.teacherName,
      class_id: item.classId,
      class_name: item.className,
      session_id: item.sessionId,
      type: item.type,
      title: item.type === 'unrecorded_session' ? `Chưa nhập buổi học: ${item.className}` : `Thiếu thông tin: ${item.className}`,
      description: item.scheduleTimeStr,
      status: 'pending',
      date_iso: item.dateISO,
      schedule_time_str: item.scheduleTimeStr,
      overdue_days: item.overdueDays,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    // Merge into local and push to Supabase
    dbTasks.forEach((dt) => {
      if (!inMemoryTasks.some((t) => t.id === dt.id)) {
        this.createPendingTask(dt);
      }
    });

    return inMemoryTasks;
  },
};
